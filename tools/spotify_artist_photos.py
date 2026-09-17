#!/usr/bin/env python3
"""Fetch Spotify artist photos for a list of artist names.

Usage:
  python3 spotify_artist_photos.py names.txt > artists.csv
  python3 spotify_artist_photos.py names.txt --download ~/Desktop/artist-photos
  cat names.txt | python3 spotify_artist_photos.py -

Names: one per line (blank lines and #comments ignored). If a line has commas,
the first field is used, so a CSV export works as-is.
Credentials: SPOTIFY_CLIENT_ID/SECRET from the env, else ./.env.
"""
import base64, csv, datetime, json, os, re, socket, sys, time, urllib.parse, urllib.request

socket.setdefaulttimeout(20)  # no timeout = a stalled scdn connection hangs the whole run

API = "https://api.spotify.com/v1"
ENV_FILE = ".env"
MARKET = os.environ.get("SPOTIFY_MARKET", "ES")
# ponytail: fixed pacing, not a token bucket. Spotify's limit is a rolling
# 30s window and it punishes bursts with multi-minute Retry-Afters.
PACE = float(os.environ.get("SPOTIFY_PACE", "0.4"))


def creds():
    cid, sec = os.environ.get("SPOTIFY_CLIENT_ID"), os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not (cid and sec) and os.path.exists(ENV_FILE):
        for line in open(ENV_FILE, encoding="utf-8"):
            m = re.match(r'\s*(?:export\s+)?(SPOTIFY_CLIENT_(?:ID|SECRET))\s*=\s*"?([^"\s#]+)', line)
            if m:
                cid = m.group(2) if m.group(1).endswith("ID") else cid
                sec = m.group(2) if m.group(1).endswith("SECRET") else sec
    if not (cid and sec):
        sys.exit("No SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET found.")
    return cid, sec


def token():
    cid, sec = creds()
    basic = base64.b64encode(f"{cid}:{sec}".encode()).decode()
    req = urllib.request.Request(
        "https://accounts.spotify.com/api/token",
        data=b"grant_type=client_credentials",
        headers={"Authorization": f"Basic {basic}",
                 "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)["access_token"]


def get(url, tok, tries=4, max_wait=900):
    """GET with 429 backoff. Returns parsed JSON, or None on give-up.

    A 429 does not consume a try: Spotify hands back a Retry-After of several
    minutes once tripped, and counting those as failures records every artist
    as a MISS. Waited time is capped by max_wait so a bad day still terminates.
    """
    attempt, waited = 0, 0
    while attempt < tries:
        try:
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {tok}"})
            with urllib.request.urlopen(req) as r:
                return json.load(r)
        except (urllib.error.URLError, socket.timeout) as e:
            if not isinstance(e, urllib.error.HTTPError):
                if attempt < tries - 1:
                    time.sleep(2 ** attempt)
                    attempt += 1
                    continue
                print(f"  ! {e} for {url}", file=sys.stderr)
                return None
            if e.code == 429:
                nap = int(e.headers.get("Retry-After", 2)) + 1
                if waited + nap > max_wait:
                    print(f"  ! rate limited past {max_wait}s budget, giving up", file=sys.stderr)
                    return None
                print(f"  . rate limited, waiting {nap}s", file=sys.stderr, flush=True)
                time.sleep(nap)
                waited += nap
                continue  # not an attempt
            if e.code >= 500 and attempt < tries - 1:
                time.sleep(2 ** attempt)
                attempt += 1
                continue
            print(f"  ! HTTP {e.code} for {url}", file=sys.stderr)
            return None
    return None


def norm(s):
    """Loose name key: casefold, strip accents/punctuation, collapse spaces."""
    import unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", s)).strip().casefold()


def pick(name, items):
    """Best match: exact-ish name first, else Spotify's own top hit."""
    for it in items:
        if norm(it.get("name", "")) == norm(name):
            return it, True
    return (items[0], False) if items else (None, False)


def search(name, tok):
    q = urllib.parse.urlencode({"q": name, "type": "artist", "limit": 5, "market": MARKET})
    data = get(f"{API}/search?{q}", tok)
    items = ((data or {}).get("artists") or {}).get("items") or []
    return pick(name, items)


def slug(s):
    return re.sub(r"-+", "-", re.sub(r"[^\w]+", "-", norm(s))).strip("-") or "artist"


def download(url, path):
    """Best-effort; already-downloaded files are skipped so a rerun resumes."""
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return True
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read()
        with open(path, "wb") as f:
            f.write(body)
        return True
    except Exception as e:
        print(f"  ! download failed {url}: {e}", file=sys.stderr)
        return False


def read_names(src):
    fh = sys.stdin if src == "-" else open(src, encoding="utf-8-sig")
    seen, out = set(), []
    for line in fh:
        n = line.split(",")[0].strip().strip('"')
        if not n or n.startswith("#") or norm(n) in seen:
            continue
        seen.add(norm(n))
        out.append(n)
    return out


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        sys.exit(__doc__)
    src, outdir = argv[0], None
    if "--download" in argv:
        outdir = os.path.expanduser(argv[argv.index("--download") + 1])
        os.makedirs(outdir, exist_ok=True)

    names, tok = read_names(src), token()
    # Stamped per row, not once at the top: a run that dies halfway leaves the
    # rows it did reach dated and the rest visibly older.
    today = datetime.date.today().isoformat()
    w = csv.writer(sys.stdout)
    w.writerow(["query", "matched_name", "artist_id", "exact_match",
                "image_640", "image_320", "image_160", "file", "last_checked"])
    misses = 0
    for i, name in enumerate(names, 1):
        if i > 1:
            time.sleep(PACE)
        art, exact = search(name, tok)
        if not art:
            misses += 1
            print(f"[{i}/{len(names)}] MISS {name}", file=sys.stderr)
            w.writerow([name, "", "", "", "", "", "", "", today])
            continue
        # images come back largest-first; may be empty for obscure artists
        urls = [im["url"] for im in art.get("images", [])] + ["", "", ""]
        path = ""
        if outdir and urls[0]:
            path = os.path.join(outdir, f"{slug(art['name'])}-{art['id']}.jpg")
            if not download(urls[0], path):
                path = ""
        flag = "" if exact else "  (fuzzy)"
        print(f"[{i}/{len(names)}] {name} -> {art['name']}{flag}", file=sys.stderr)
        w.writerow([name, art["name"], art["id"], "yes" if exact else "no",
                    urls[0], urls[1], urls[2], path, today])
    print(f"\nDone: {len(names) - misses}/{len(names)} matched.", file=sys.stderr)


def demo():
    assert norm("ÁRTISTA") == norm("Artista") == "artista"
    assert norm("AC/DC") == "ac dc"
    a, b = {"name": "Artista"}, {"name": "Artista Tribute"}
    assert pick("ÁRTISTA", [b, a]) == (a, True), "exact match must beat top hit"
    assert pick("Nobody", [b, a]) == (b, False), "no exact -> Spotify's top hit"
    assert pick("x", []) == (None, False)
    assert slug("ÁRTISTA") == "artista" and slug("AC/DC") == "ac-dc"
    print("ok")


if __name__ == "__main__":
    demo() if sys.argv[1:2] == ["--selftest"] else main(sys.argv[1:])
