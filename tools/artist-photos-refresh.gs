// Refresco semanal de la hoja `artists` (Spotify Artist Photos).
//
// Instalación, una sola vez, en Extensiones → Apps Script de la propia hoja:
//   1. Pega este fichero.
//   2. Configuración del proyecto → Propiedades del script:
//      SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
//   3. Ejecuta installWeeklyTrigger() y acepta los permisos.
//
// Escribe spotify_artist, review_flag (vacío → CHECK), spotify_artist_id,
// image_hash, last_checked, spotify_url e image_url. Las URLs van como valores
// construidos desde el ID y el hash: eran fórmulas fila a fila, y una fila nueva
// no las tiene, así que salía con las URLs vacías y el flujo llevaba un
// image_url vacío a SharePoint. photo solo se rellena donde falta (=IMAGE), sin
// tocar las que ya existen. __PowerAppsId__ es de Power Platform y no se toca.
//
// Por ID, no por búsqueda: la búsqueda solo se usa para filas nuevas sin ID.
// GET /v1/artists?ids= da 403 a esta app, así que va uno a uno.

var SHEET_NAME = 'artists';
var PACE_MS = 400;
// Apps Script corta a los 6 min. Lo que no dé tiempo conserva su last_checked
// viejo y sale en rojo a los 45 días, que es justo la señal que queremos.
var BUDGET_MS = 5 * 60 * 1000;

function installWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshArtistPhotos') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('refreshArtistPhotos')
    .timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(5).create();
}

function refreshArtistPhotos() {
  var started = Date.now();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var head = data[0];
  var col = {};
  ['photo', 'artist_name', 'spotify_artist', 'review_flag', 'spotify_artist_id', 'image_hash',
   'spotify_url', 'image_url', 'last_checked']
    .forEach(function (k) {
      col[k] = head.indexOf(k);
      if (col[k] < 0) throw new Error('Falta la columna ' + k + ' en ' + SHEET_NAME);
    });

  var tok = spotifyToken_();
  var today = Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyy-MM-dd');
  var changed = 0, failed = [], done = 0;

  for (var r = 1; r < data.length; r++) {
    if (Date.now() - started > BUDGET_MS) break;
    var row = data[r], name = String(row[col.artist_name]).trim();
    if (!name) continue;
    if (done++) Utilities.sleep(PACE_MS);

    var id = String(row[col.spotify_artist_id]).trim(), art;
    if (id) {
      art = spotifyGet_('/artists/' + id, tok);
    } else {
      var res = spotifyGet_('/search?type=artist&limit=5&market=ES&q=' + encodeURIComponent(name), tok);
      var hit = pickArtist_(name, (res && res.artists && res.artists.items) || []);
      art = hit.artist;
      if (art && !hit.exact && !row[col.review_flag]) row[col.review_flag] = 'CHECK';
    }
    if (!art) { failed.push(name); continue; }

    var hash = imageHash_(art.images);
    if (hash && hash !== row[col.image_hash]) changed++;
    row[col.spotify_artist] = art.name;
    row[col.spotify_artist_id] = art.id;
    if (hash) row[col.image_hash] = hash; // sin foto: se queda la anterior, su URL sigue sirviendo
    row[col.last_checked] = today;
  }

  // URLs de todas las filas, también las que no se han podido refrescar hoy.
  data.slice(1).forEach(function (row) {
    var u = artistUrls_(row[col.spotify_artist_id], row[col.image_hash]);
    row[col.spotify_url] = u.spotify_url;
    row[col.image_url] = u.image_url;
  });

  // Columna a columna: photo no se escribe con setValues, que borraría sus fórmulas.
  ['spotify_artist', 'review_flag', 'spotify_artist_id', 'image_hash', 'spotify_url', 'image_url', 'last_checked']
    .forEach(function (k) {
      var values = data.slice(1).map(function (row) { return [row[col[k]]]; });
      sheet.getRange(2, col[k] + 1, values.length, 1).setValues(values);
    });

  var photos = sheet.getRange(2, col.photo + 1, data.length - 1, 1);
  var imageCol = columnLetter_(col.image_url + 1);
  var formulas = photos.getFormulas().map(function (f, i) {
    if (f[0] || !String(data[i + 1][col.artist_name]).trim()) return f;
    return ['=IMAGE(' + imageCol + (i + 2) + ')'];
  });
  photos.setFormulas(formulas);

  console.log('Revisadas ' + done + ', fotos cambiadas ' + changed +
              (failed.length ? ', fallidas: ' + failed.join(' | ') : ''));
}

function spotifyToken_() {
  var p = PropertiesService.getScriptProperties();
  var basic = Utilities.base64Encode(p.getProperty('SPOTIFY_CLIENT_ID') + ':' + p.getProperty('SPOTIFY_CLIENT_SECRET'));
  var res = UrlFetchApp.fetch('https://accounts.spotify.com/api/token', {
    method: 'post', payload: { grant_type: 'client_credentials' },
    headers: { Authorization: 'Basic ' + basic },
  });
  return JSON.parse(res.getContentText()).access_token;
}

function spotifyGet_(path, tok) {
  for (var attempt = 0; attempt < 4; attempt++) {
    var res = UrlFetchApp.fetch('https://api.spotify.com/v1' + path, {
      headers: { Authorization: 'Bearer ' + tok }, muteHttpExceptions: true,
    });
    var code = res.getResponseCode();
    if (code === 200) return JSON.parse(res.getContentText());
    if (code !== 429 && code < 500) return null;
    // ponytail: Retry-After largo (minutos) agota el presupuesto de 6 min; esas filas esperan a la semana siguiente.
    var wait = code === 429 ? (Number(res.getHeaders()['Retry-After']) || 2) + 1 : Math.pow(2, attempt);
    if (wait > 60) return null;
    Utilities.sleep(wait * 1000);
  }
  return null;
}

function artistUrls_(id, hash) {
  id = String(id || '').trim();
  hash = String(hash || '').trim();
  return {
    spotify_url: id ? 'https://open.spotify.com/artist/' + id : '',
    image_url: hash ? 'https://i.scdn.co/image/' + hash : '',
  };
}

function columnLetter_(n) {
  var s = '';
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
  return s;
}

function imageHash_(images) {
  var url = images && images[0] && images[0].url; // vienen de mayor a menor
  var m = url && /\/image\/([0-9a-f]+)$/.exec(url);
  return m ? m[1] : '';
}

function norm_(s) {
  return String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

// Igual que pick() en tools/spotify_artist_photos.py.
function pickArtist_(name, items) {
  for (var i = 0; i < items.length; i++) {
    if (norm_(items[i].name) === norm_(name)) return { artist: items[i], exact: true };
  }
  return { artist: items[0] || null, exact: false };
}

function selftest() {
  var ok = function (c, m) { if (!c) throw new Error(m); };
  ok(norm_('ÁRTISTA') === 'artista' && norm_('AC/DC') === 'ac dc', 'norm');
  var a = { name: 'Artista' }, b = { name: 'Artista Tribute' };
  ok(pickArtist_('ÁRTISTA', [b, a]).artist === a, 'exact beats top hit');
  ok(pickArtist_('Nobody', [b, a]).exact === false, 'fuzzy flagged');
  ok(pickArtist_('x', []).artist === null, 'empty');
  ok(imageHash_([{ url: 'https://i.scdn.co/image/ab67616100000000000000000000000000000001' }]) ===
     'ab67616100000000000000000000000000000001', 'hash');
  ok(imageHash_([]) === '', 'no image');
  var u = artistUrls_('0000000000000000000001 ', 'ab67616100000000000002');
  ok(u.spotify_url === 'https://open.spotify.com/artist/0000000000000000000001', 'spotify_url');
  ok(u.image_url === 'https://i.scdn.co/image/ab67616100000000000002', 'image_url');
  ok(artistUrls_('', '').image_url === '' && artistUrls_('', '').spotify_url === '', 'empty urls');
  ok(columnLetter_(8) === 'H' && columnLetter_(26) === 'Z' && columnLetter_(27) === 'AA', 'column letter');
  console.log('ok');
}
