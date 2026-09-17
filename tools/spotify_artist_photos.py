#!/usr/bin/env python3
"""Busca en Spotify la foto de cada artista de una lista de nombres.

Uso:
  python3 spotify_artist_photos.py names.txt > artists.csv
  python3 spotify_artist_photos.py names.txt --download ~/Desktop/artist-photos
  cat names.txt | python3 spotify_artist_photos.py -

Nombres: uno por línea (se ignoran las líneas vacías y los #comentarios). Si una
línea tiene comas, se usa el primer campo, así que un CSV exportado sirve tal cual.
Credenciales: SPOTIFY_CLIENT_ID/SECRET del entorno o, si no, de ./.env.
"""
import base64, csv, datetime, json, os, re, socket, sys, time, urllib.parse, urllib.request

socket.setdefaulttimeout(20)  # sin timeout, una conexión colgada con scdn bloquea todo el run

API = "https://api.spotify.com/v1"
ENV_FILE = ".env"
MARKET = os.environ.get("SPOTIFY_MARKET", "ES")
# ponytail: ritmo fijo, no un token bucket. El límite de Spotify es una ventana
# móvil de 30 s y castiga las ráfagas con Retry-After de varios minutos.
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
        sys.exit("No se encuentran SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.")
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
    """GET con espera ante 429. Devuelve el JSON, o None si se rinde.

    Un 429 no gasta intento: Spotify devuelve un Retry-After de varios minutos
    en cuanto salta, y contarlos como fallos marcaría a todos los artistas como
    MISS. El tiempo esperado tiene tope (max_wait) para que un mal día termine.
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
                print(f"  ! {e} en {url}", file=sys.stderr)
                return None
            if e.code == 429:
                nap = int(e.headers.get("Retry-After", 2)) + 1
                if waited + nap > max_wait:
                    print(f"  ! límite de peticiones más allá de {max_wait}s, abandono", file=sys.stderr)
                    return None
                print(f"  . límite de peticiones, espero {nap}s", file=sys.stderr, flush=True)
                time.sleep(nap)
                waited += nap
                continue  # no cuenta como intento
            if e.code >= 500 and attempt < tries - 1:
                time.sleep(2 ** attempt)
                attempt += 1
                continue
            print(f"  ! HTTP {e.code} en {url}", file=sys.stderr)
            return None
    return None


def norm(s):
    """Clave de nombre laxa: minúsculas, sin acentos ni puntuación, espacios colapsados."""
    import unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", s)).strip().casefold()


def pick(name, items):
    """Mejor coincidencia: primero el nombre casi exacto; si no, el primer resultado de Spotify."""
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
    """Sin garantías; los ficheros ya descargados se saltan, así que repetir el run lo reanuda."""
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
        print(f"  ! falló la descarga {url}: {e}", file=sys.stderr)
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
    # Fecha por fila, no una sola arriba: un run que muere a medias deja con fecha
    # las filas a las que llegó y el resto visiblemente más viejas.
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
        # las imágenes llegan de mayor a menor; puede no haber ninguna en artistas poco conocidos
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
    print(f"\nHecho: {len(names) - misses}/{len(names)} encontrados.", file=sys.stderr)


def demo():
    assert norm("ÁRTISTA") == norm("Artista") == "artista"
    assert norm("AC/DC") == "ac dc"
    a, b = {"name": "Artista"}, {"name": "Artista Tribute"}
    assert pick("ÁRTISTA", [b, a]) == (a, True), "la coincidencia exacta gana al primer resultado"
    assert pick("Nobody", [b, a]) == (b, False), "sin exacta -> primer resultado de Spotify"
    assert pick("x", []) == (None, False)
    assert slug("ÁRTISTA") == "artista" and slug("AC/DC") == "ac-dc"
    print("ok")


if __name__ == "__main__":
    demo() if sys.argv[1:2] == ["--selftest"] else main(sys.argv[1:])
