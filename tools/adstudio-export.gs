// ============================================================
//  SPOTIFY AD STUDIO → CSV para SharePoint
// ============================================================
//  Genera SpotifyAdStudio_ads_data.csv desde la pestaña del puller, con las
//  MISMAS 32 columnas y las MISMAS transformaciones que hace el Select de Power
//  Automate (ver tools/adstudio-select-map.json). Sirve para subir la lista a
//  mano la primera vez, o para reponerla sin depender del flujo.
//
//  ⚠️ Las dos rutas tienen que dar lo mismo. Si tocas una transformación aquí,
//  tócala también en el Select, y al revés. Lo que más duele si se descuadra es
//  la escala: la hoja guarda CTR y Completion Rate en PORCENTAJE (0,947) y la
//  lista en DECIMAL (0,00947).
//
//  Antes de exportar, deja los benchmarks al día: menú Ad Studio → Recalcular
//  benchmarks, o spFixFormats() si además hay que arreglar formatos.
//
//  Funciones:
//    adStudioExportCSV     escribe el CSV en Drive y enseña el enlace
//    adStudioExportTest    comprueba las transformaciones sin tocar nada
// ============================================================

var ADSX_SHEET_NAME = 'Spotify Campaigns';
var ADSX_FILE_NAME = 'SpotifyAdStudio_ads_data.csv';

var ADSX_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Columna de la lista -> cómo se saca de una fila de la hoja.
//
// El orden es el de la lista, no el de la hoja. `fila` es un objeto con las
// cabeceras de la hoja como claves.
var ADSX_COLUMNAS = [
  ['Platform',             function ()     { return 'Spotify Ad Studio'; }],
  ['KnowledgeTitle',       function (f)    { return adsxTitulo(f); }],
  ['SearchText',           function (f)    { return adsxSearchText(f); }],
  ['KnowledgeSummary',     function (f)    { return adsxSummary(f); }],
  ['Artist',               function (f)    { return f['Artist']; }],
  ['Release',              function (f)    { return f['Release']; }],
  ['ProjectNumber',        function (f)    { return f['Project Number']; }],
  ['PM',                   function (f)    { return adsxTexto(f['PM']); }],
  ['Segment',              function (f)    { return adsxTexto(f['Segment']); }],
  ['Objective',            function (f)    { return f['Objective']; }],
  ['DeliveryGoal',         function (f)    { return f['Delivery Goal']; }],
  ['Status',               function (f)    { return f['Status']; }],
  ['CampaignName',         function (f)    { return f['Campaign Name (raw)']; }],
  ['CampaignId',           function (f)    { return f['Campaign ID']; }],
  ['Inicio',               function (f)    { return adsxFecha(f['Start Date']); }],
  ['Fin',                  function (f)    { return adsxFecha(f['End Date']); }],
  ['Mes',                  function (f)    { return adsxMes(f['Start Date']); }],
  ['MesKey',               function (f)    { return adsxMesKey(f['Start Date']); }],
  ['Gasto',                function (f)    { return adsxNum(f['Spend']); }],
  ['Impressions',          function (f)    { return adsxNum(f['Impressions']); }],
  ['Alcance',              function (f)    { return adsxNum(f['Reach']); }],
  ['Clics',                function (f)    { return adsxNum(f['Clicks']); }],
  ['CTR',                  function (f)    { return adsxTasa(f['CTR']); }],
  ['CTRBench',             function (f)    { return adsxTasa(f['CTR Bench']); }],
  ['Streams',              function (f)    { return adsxNum(f['Streams']); }],
  ['CostoPerStreams',      function (f)    { return adsxNum(f['Cost per Streams']); }],
  ['BenchCostoPerStreams', function (f)    { return adsxNum(f['Bench Cost per Streams']); }],
  ['Listeners',            function (f)    { return adsxNum(f['Listeners']); }],
  ['NewListeners',         function (f)    { return adsxNum(f['New Listeners']); }],
  ['VideoViews',           function (f)    { return adsxNum(f['Video Views']); }],
  ['CompletionRate',       function (f)    { return adsxTasa(f['Completion Rate']); }],
  ['DatePulled',           function (f)    { return adsxFecha(f['Date Pulled']); }]
];


function adStudioExportCSV() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ADSX_SHEET_NAME);
  if (!sheet) { ui.alert('No encuentro la pestaña: ' + ADSX_SHEET_NAME); return; }

  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) { ui.alert('La pestaña no tiene datos.'); return; }

  var cabecera = datos[0].map(function (h) { return String(h).trim(); });
  var filas = datos.slice(1).map(function (fila) {
    var o = {};
    cabecera.forEach(function (h, i) { o[h] = fila[i]; });
    return o;
  });

  // Sin benchmarks calculados, el CSV subiría dos columnas vacías y la lista
  // se quedaría sin referencias hasta el siguiente recálculo. Mejor avisar.
  var sinBench = filas.filter(function (f) {
    return f['CTR Bench'] === '' || f['CTR Bench'] === null || f['CTR Bench'] === undefined;
  }).length;

  var csv = adsxBuildCSV(filas);
  // La BOM hace que Excel y SharePoint lean los acentos bien al importar.
  var blob = Utilities.newBlob('﻿' + csv, 'text/csv', ADSX_FILE_NAME);
  var previos = DriveApp.getFilesByName(ADSX_FILE_NAME);
  while (previos.hasNext()) { previos.next().setTrashed(true); }
  var fichero = DriveApp.createFile(blob);

  ui.alert('CSV generado: ' + ADSX_FILE_NAME + '\n\n' +
           filas.length + ' campañas · ' + ADSX_COLUMNAS.length + ' columnas\n' +
           sinBench + ' filas sin CTR Bench' +
           (sinBench === filas.length
             ? '\n\n⚠️ NINGUNA fila trae benchmark. Recalcula antes de subir: ' +
               'menú Ad Studio → Recalcular benchmarks.'
             : '') +
           '\n\n' + fichero.getUrl());
}


function adsxBuildCSV(filas) {
  var lineas = [ADSX_COLUMNAS.map(function (c) { return adsxEscape(c[0]); }).join(',')];
  filas.forEach(function (f) {
    lineas.push(ADSX_COLUMNAS.map(function (c) { return adsxEscape(c[1](f)); }).join(','));
  });
  return lineas.join('\n');
}


function adsxEscape(valor) {
  var texto = String(valor === null || valor === undefined ? '' : valor);
  return /[",\n\r]/.test(texto) ? '"' + texto.replace(/"/g, '""') + '"' : texto;
}


// ---- transformaciones, espejo del Select ----

// Los números van tal cual: la lista los quiere en punto decimal, que es como
// los devuelve getValues(). Vacío se queda vacío, NUNCA se convierte en 0 — un
// hueco es "no aplica" y un 0 es un cero de verdad.
function adsxNum(v) {
  if (v === '' || v === null || v === undefined) return '';
  var n = Number(v);
  return isFinite(n) ? n : '';
}

// La hoja guarda las tasas en porcentaje y la lista en decimal.
function adsxTasa(v) {
  var n = adsxNum(v);
  return n === '' ? '' : n * 0.01;
}

function adsxTexto(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

// Las fechas de la hoja son texto ISO; si alguna llega como Date, se formatea.
function adsxFecha(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, SpreadsheetApp.getActiveSpreadsheet()
      .getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).slice(0, 10);
}

function adsxMesKey(inicio) {
  var f = adsxFecha(inicio);
  return f ? f.slice(0, 7) : '';
}

// "2026-04-20" -> "Abril 2026". Igual que el Select: el Mes de la lista se
// deriva de Inicio y siempre sale en español, así que nunca puede contradecirlo.
function adsxMes(inicio) {
  var f = adsxFecha(inicio);
  if (!f) return '';
  var mes = parseInt(f.slice(5, 7), 10);
  if (!(mes >= 1 && mes <= 12)) return '';
  return ADSX_MESES[mes - 1] + ' ' + f.slice(0, 4);
}

function adsxTitulo(f) {
  return 'Spotify Ad Studio - ' + adsxTexto(f['Artist']) + ' - ' +
         adsxTexto(f['Release']) + ' - ' + adsxTexto(f['Objective']);
}

function adsxSearchText(f) {
  return [adsxTexto(f['Artist']), adsxTexto(f['Release']), adsxTexto(f['Project Number']),
          adsxTexto(f['PM']), adsxTexto(f['Segment']), adsxTexto(f['Objective']),
          adsxTexto(f['Delivery Goal']), adsxTexto(f['Status']),
          adsxTexto(f['Campaign Name (raw)']), adsxMes(f['Start Date']),
          adsxMesKey(f['Start Date']), 'spotify ad studio adstudio'
         ].join(' ').toLowerCase();
}

function adsxSummary(f) {
  var cps = adsxTexto(f['Cost per Streams']) || 'no aplica';
  return 'Campana de Spotify Ad Studio para ' + adsxTexto(f['Artist']) + ' / ' +
    adsxTexto(f['Release']) + '. PM: ' + adsxTexto(f['PM']) +
    '. Segmento: ' + adsxTexto(f['Segment']) +
    '. Formato: ' + adsxTexto(f['Objective']) +
    '. Delivery Goal: ' + adsxTexto(f['Delivery Goal']) +
    '. Estado: ' + adsxTexto(f['Status']) +
    '. Mes: ' + adsxMes(f['Start Date']) +
    '. Periodo: ' + adsxFecha(f['Start Date']) + ' a ' + adsxFecha(f['End Date']) +
    '. Gasto: ' + adsxTexto(f['Spend']) + ' EUR' +
    '. Impresiones: ' + adsxTexto(f['Impressions']) +
    '. Alcance: ' + adsxTexto(f['Reach']) +
    '. Clics: ' + adsxTexto(f['Clicks']) +
    '. CTR: ' + adsxTexto(f['CTR']) + '%' +
    '. Streams: ' + adsxTexto(f['Streams']) +
    '. Coste por stream: ' + cps +
    '. Oyentes: ' + adsxTexto(f['Listeners']) +
    '. Oyentes nuevos: ' + adsxTexto(f['New Listeners']) +
    '. Video views: ' + adsxTexto(f['Video Views']) +
    '. Completion rate: ' + adsxTexto(f['Completion Rate']) + '%' +
    '. Campana: ' + adsxTexto(f['Campaign Name (raw)']) + '.';
}


// ============================================================
//  COMPROBACIÓN — adStudioExportTest() desde el editor, no toca nada.
// ============================================================
function adStudioExportTest() {
  function ok(c, m) { if (!c) throw new Error('adStudioExportTest: ' + m); }

  ok(ADSX_COLUMNAS.length === 32, 'la lista tiene 32 columnas, no ' + ADSX_COLUMNAS.length);

  // La escala es lo que más duele si se descuadra: ×100 de error pasa por buena.
  ok(adsxTasa(0.947) === 0.00947, 'CTR de porcentaje a decimal');
  ok(adsxTasa(72.8979) === 0.728979, 'completion rate de porcentaje a decimal');
  ok(adsxTasa('') === '', 'una tasa vacía se queda vacía');
  ok(adsxTasa(0) === 0, 'un 0 es un 0, no un hueco');

  // Un hueco no puede convertirse en 0: el prompt los lee distinto.
  ok(adsxNum('') === '' && adsxNum(null) === '', 'el hueco se mantiene');
  ok(adsxNum(465.351242) === 465.351242, 'el importe pasa tal cual');

  ok(adsxMes('2026-04-20') === 'Abril 2026', 'el mes sale en español desde Inicio');
  ok(adsxMes('2025-12-31') === 'Diciembre 2025', 'diciembre, el que se sale del array');
  ok(adsxMes('') === '', 'sin Inicio no hay mes');
  ok(adsxMesKey('2026-04-20') === '2026-04', 'MesKey es aaaa-mm');

  ok(adsxEscape('Release Ejemplo, MX') === '"Release Ejemplo, MX"', 'la coma obliga a comillas');
  ok(adsxEscape('Dice "hola"') === '"Dice ""hola"""', 'las comillas se duplican');
  ok(adsxEscape('') === '', 'el vacío no lleva comillas');

  var f = {
    'Artist': 'Artista Ejemplo', 'Release': 'Single Ejemplo', 'Objective': 'In feed Display',
    'Project Number': '1000001', 'PM': 'Ana ', 'Segment': 'Latino',
    'Delivery Goal': 'ENGAGEMENT_ON_SPOTIFY', 'Status': 'ENDED',
    'Campaign Name (raw)': '1000001_ArtistaEjemplo_x', 'Start Date': '2026-04-20'
  };
  ok(adsxSearchText(f).indexOf('2026-04') !== -1, 'SearchText lleva el MesKey');
  ok(adsxSearchText(f).indexOf('abril 2026') !== -1, 'SearchText lleva el mes en español');
  ok(adsxSearchText(f) === adsxSearchText(f).toLowerCase(), 'SearchText va en minúsculas');
  ok(adsxTitulo(f) === 'Spotify Ad Studio - Artista Ejemplo - Single Ejemplo - In feed Display',
     'el título sigue el formato de la lista');
  ok(adsxSummary(f).indexOf('Coste por stream: no aplica') !== -1,
     'sin coste por stream, el resumen dice "no aplica"');

  Logger.log('adStudioExportTest: las ' + ADSX_COLUMNAS.length +
             ' columnas y las transformaciones pasan.');
}
