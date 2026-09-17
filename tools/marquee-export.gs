function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Copilot Export')
    .addItem('Generate Marquee/Showcase CSV', 'generateMarqueeShowcaseCSV')
    .addToUi();
}

// ⚠️ Debe coincidir EXACTAMENTE con el formato de la columna Mes de google_ads_data,
// meta_ads_data y tiktok_ads_data. Si allí pone "Agosto" sin año, pon false.
var MES_CON_ANIO = true;

var MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

var MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

function generateMarqueeShowcaseCSV() {
  const FILE_NAME = 'MarqueeShowcase_ads_data.csv';
  const SHEET_NAME = 'Marquee/Showcase Total';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert('Sheet not found: ' + SHEET_NAME);
    return;
  }

  const range = sheet.getDataRange();
  const rawData = range.getValues();
  const displayData = range.getDisplayValues();
  const timeZone = ss.getSpreadsheetTimeZone();

  if (rawData.length < 2) {
    SpreadsheetApp.getUi().alert('No data found in sheet: ' + SHEET_NAME);
    return;
  }

  const headers = displayData[0].map(function (h) {
    return String(h).trim();
  });

  const fieldMap = {
    'Label': 'Label',
    'PM': 'PM',
    'Artist': 'Artist',
    'Product': 'Product',
    'Ad Type': 'AdType',
    'Type': 'Type',
    'Audience Group': 'AudienceGroup',
    'Type Audience Group': 'TypeAudienceGroup',
    'Gasto': 'Gasto',
    'Inicio': 'Inicio',
    'Fin': 'Fin',
    'Location': 'Location',
    'Streams': 'Streams',
    'Costo Per Streams': 'CostoPerStreams',
    'Alcance': 'Alcance',
    'Clics': 'Clics',
    'Deepen fan connections': 'DeepenFanConnections',
    'Reactivación de oyentes': 'ReactivacionOyentes',
    'Aumento de la audiencia': 'AumentoAudiencia',
    'Light Listeners (after converting)': 'LightListenersAfterConverting',
    'Moderate Listeners (after converting)': 'ModerateListenersAfterConverting',
    'Super Listeners (after converting)': 'SuperListenersAfterConverting',
    'Oyentes Convertidos': 'OyentesConvertidos',
    'Tasa de conversión': 'TasaConversion',
    'Streams Per Listener': 'StreamsPerListener',
    'Tasa de intención': 'TasaIntencion',
    'Playlist Add Rate': 'PlaylistAddRate',
    'Playlist Adds': 'PlaylistAdds',
    'Save Rate': 'SaveRate',
    'Saves': 'Saves',
    "Listeners of Artist's Other Releases": 'ListenersOtherReleases',
    "Streams Per Listener for Artist's Other Releases": 'StreamsPerListenerOtherReleases',
    "Saves of Artist's Other Releases": 'SavesOtherReleases',
    "Playlist Adds of Artist's Other Releases": 'PlaylistAddsOtherReleases',
    'Total Programed': 'TotalProgramed',
    'Total Potential': 'TotalPotential',
    'Total Amplified': 'TotalAmplified',
    'Total Reactivated': 'TotalReactivated',
    'CPC': 'CPC',
    'CPM Reach': 'CPMReach',
    'CTR': 'CTR',
    'Amplified Listeners Rate': 'AmplifiedListenersRate',
    'Reactivated Listeners Rate': 'ReactivatedListenersRate',
    'New Active Listeners Rate': 'NewActiveListenersRate',
    'median_Cost Per Streams': 'MedianCostPerStreams',
    'median_Intent Rate': 'MedianIntentRate',
    'median_Conversion Rate': 'MedianConversionRate',
    'median_Save Rate': 'MedianSaveRate',
    'median_Playlist Add Rate': 'MedianPlaylistAddRate',
    'Performance Classification': 'PerformanceClassification',
    'Ad Result Summary': 'AdResultSummary',
    'Audience': 'Audience'
  };

  const outputFields = [
    'Platform',
    'KnowledgeTitle',
    'SearchText',
    'KnowledgeSummary',
    'Label',
    'PM',
    'Artist',
    'Product',
    'AdType',
    'Type',
    'AudienceGroup',
    'TypeAudienceGroup',
    'Gasto',
    'Inicio',
    'Fin',
    'Mes',
    'MesKey',
    'Location',
    'Streams',
    'CostoPerStreams',
    'Alcance',
    'Clics',
    'DeepenFanConnections',
    'ReactivacionOyentes',
    'AumentoAudiencia',
    'LightListenersAfterConverting',
    'ModerateListenersAfterConverting',
    'SuperListenersAfterConverting',
    'OyentesConvertidos',
    'TasaConversion',
    'StreamsPerListener',
    'TasaIntencion',
    'PlaylistAddRate',
    'PlaylistAdds',
    'SaveRate',
    'Saves',
    'ListenersOtherReleases',
    'StreamsPerListenerOtherReleases',
    'SavesOtherReleases',
    'PlaylistAddsOtherReleases',
    'TotalProgramed',
    'TotalPotential',
    'TotalAmplified',
    'TotalReactivated',
    'CPC',
    'CPMReach',
    'CTR',
    'AmplifiedListenersRate',
    'ReactivatedListenersRate',
    'NewActiveListenersRate',
    'MedianCostPerStreams',
    'MedianIntentRate',
    'MedianConversionRate',
    'MedianSaveRate',
    'MedianPlaylistAddRate',
    'PerformanceClassification',
    'AdResultSummary',
    'Audience'
  ];

  const colIndexes = {};

  headers.forEach(function (header, index) {
    if (fieldMap[header]) {
      colIndexes[fieldMap[header]] = index;
    }
  });

  const rows = [];
  let sinMes = 0;

  for (let r = 1; r < rawData.length; r++) {
    const obj = {};

    for (const sourceHeader in fieldMap) {
      const finalField = fieldMap[sourceHeader];
      const colIndex = colIndexes[finalField];

      if (colIndex === undefined) {
        obj[finalField] = '';
        continue;
      }

      const rawVal = rawData[r][colIndex];
      const displayVal = displayData[r][colIndex];

      if (rawVal instanceof Date) {
        // ISO 8601 a proposito: 'dd/MM/yyyy' lo reinterpreta SharePoint segun
        // el idioma del sitio, y 05/02/2026 se importa como 2 de mayo. ISO no
        // es ambiguo en ningun idioma.
        // Una celda de fecha vacia llega como el serial cero de Sheets, que es
        // 1899-12-30. Exportarla como fecha real produce campanas que "acaban"
        // en 1900; se exporta vacia, que es lo que de verdad es.
        obj[finalField] = fechaISO(rawVal, timeZone);
      } else {
        obj[finalField] = displayVal === null || displayVal === undefined
          ? ''
          : String(displayVal).trim();
      }
    }

    if (!obj.Artist && !obj.Product) {
      continue;
    }

    if (!obj.TypeAudienceGroup) {
      obj.TypeAudienceGroup = [obj.Type, obj.AudienceGroup].filter(Boolean).join(' ');
    }

    obj.Platform = 'Spotify Marquee/Showcase';

    // El mes de una campaña de Marquee/Showcase es el mes de su fecha de Inicio,
    // aunque el flight termine en el mes siguiente.
    const rawInicio = colIndexes['Inicio'] === undefined
      ? null
      : rawData[r][colIndexes['Inicio']];
    const mes = mesDesdeInicio(rawInicio, obj.Inicio, timeZone);

    let mesEs = '';
    let mesEn = '';
    let anio = '';

    if (mes) {
      mesEs = MESES_ES[mes.num - 1];
      mesEn = MESES_EN[mes.num - 1];
      anio = mes.year;
      obj.Mes = MES_CON_ANIO ? mesEs + ' ' + anio : mesEs;
      obj.MesKey = anio + '-' + pad2(mes.num);
    } else {
      obj.Mes = '';
      obj.MesKey = '';
      sinMes++;
    }

    obj.KnowledgeTitle = [
      'Spotify',
      obj.Artist,
      obj.Product,
      obj.Location
    ].filter(Boolean).join(' - ');

    // El mes va en SearchText en español e inglés: es la columna por la que el
    // agente recupera filas, y sin él las consultas por período no encuentran Spotify.
    obj.SearchText = [
      obj.Label,
      obj.PM,
      obj.Artist,
      obj.Product,
      obj.AdType,
      obj.Type,
      obj.AudienceGroup,
      obj.TypeAudienceGroup,
      obj.Location,
      obj.Audience,
      obj.PerformanceClassification,
      mesEs,
      mesEn,
      anio,
      obj.MesKey,
      'spotify',
      'marquee',
      'showcase'
    ].filter(Boolean).join(' ').toLowerCase();

    obj.KnowledgeSummary =
      'Campaña de Spotify Marquee/Showcase para ' +
      safeText(obj.Artist) +
      ' / ' +
      safeText(obj.Product) +
      '. Label: ' +
      safeText(obj.Label) +
      '. PM: ' +
      safeText(obj.PM) +
      '. Ad Type: ' +
      safeText(obj.AdType) +
      '. Type Audience Group: ' +
      safeText(obj.TypeAudienceGroup) +
      '. Gasto: ' +
      safeText(obj.Gasto) +
      '. Mes: ' +
      safeText(obj.Mes) +
      '. Inicio: ' +
      safeText(obj.Inicio) +
      '. Fin: ' +
      safeText(obj.Fin) +
      '. Location: ' +
      safeText(obj.Location) +
      '. Streams: ' +
      safeText(obj.Streams) +
      '. Costo Per Streams: ' +
      safeText(obj.CostoPerStreams) +
      '. Alcance: ' +
      safeText(obj.Alcance) +
      '. Clics: ' +
      safeText(obj.Clics) +
      '. Oyentes Convertidos: ' +
      safeText(obj.OyentesConvertidos) +
      '. Tasa de conversión: ' +
      safeText(obj.TasaConversion) +
      '. Streams Per Listener: ' +
      safeText(obj.StreamsPerListener) +
      '. Tasa de intención: ' +
      safeText(obj.TasaIntencion) +
      '. Playlist Add Rate: ' +
      safeText(obj.PlaylistAddRate) +
      '. Playlist Adds: ' +
      safeText(obj.PlaylistAdds) +
      '. Save Rate: ' +
      safeText(obj.SaveRate) +
      '. Saves: ' +
      safeText(obj.Saves) +
      '. CPC: ' +
      safeText(obj.CPC) +
      '. CPM Reach: ' +
      safeText(obj.CPMReach) +
      '. CTR: ' +
      safeText(obj.CTR) +
      '. Performance Classification: ' +
      safeText(obj.PerformanceClassification) +
      '. Ad Result Summary: ' +
      safeText(obj.AdResultSummary) +
      '. Audience: ' +
      safeText(obj.Audience) +
      '.';

    rows.push(obj);
  }

  // 1. Build the CSV String
  const csv = buildCSV(rows, outputFields);

  // 2. Encode the string to Base64 (safely handling accents and special characters)
  const base64Csv = Utilities.base64Encode(csv, Utilities.Charset.UTF_8);

  const avisoSinMes = sinMes > 0
    ? '<p style="color:#b45309;"><strong>' + sinMes + ' fila(s) sin mes:</strong> revisa la columna Inicio.</p>'
    : '';

  // 3. Create an HTML dialog that triggers the local download automatically
  const htmlOutput = HtmlService.createHtmlOutput(`
    <div style="font-family:Arial,sans-serif;padding:16px;text-align:center;">
      <h2>Generating Download...</h2>
      <p>Your CSV file is downloading directly to your computer.</p>
      <p><strong>Rows exported:</strong> ${rows.length}</p>
      <p><strong>File name:</strong> ${FILE_NAME}</p>
      ${avisoSinMes}
      <br>
      <button onclick="google.script.host.close()" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">Close Window</button>
    </div>

    <script>
      // Trigger the download automatically when the modal loads
      window.onload = function() {
        const base64Data = "${base64Csv}";
        const fileName = "${FILE_NAME}";

        // Use the Fetch API to convert base64 to a downloadable blob object
        fetch('data:text/csv;base64,' + base64Data)
          .then(res => res.blob())
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click(); // Programmatically click the hidden link
            window.URL.revokeObjectURL(url); // Clean up memory
          });
      };
    </script>
  `).setWidth(450).setHeight(280);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Local CSV Export Complete');
}

/**
 * Devuelve {num, year} del mes de inicio, o null si la fecha no es legible.
 * Acepta la celda como Date real o como texto dd/mm/aaaa (o dd-mm-aaaa).
 */
function mesDesdeInicio(rawInicio, textoInicio, timeZone) {
  let num;
  let year;

  if (rawInicio instanceof Date) {
    const iso = fechaISO(rawInicio, timeZone);
    if (!iso) {
      return null;
    }
    num = Number(iso.slice(5, 7));
    year = iso.slice(0, 4);
  } else {
    const texto = String(textoInicio || '').trim();

    // ISO aaaa-mm-dd, que es lo que exporta este script
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      num = Number(iso[2]);
      year = iso[1];
    } else {
      // Legado: texto dd/mm/aaaa escrito a mano en la hoja
      const partes = texto.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (!partes) {
        return null;
      }
      num = Number(partes[2]);
      year = partes[3];
    }
  }

  if (!num || num < 1 || num > 12) {
    return null;
  }

  return { num: num, year: year };
}

/**
 * Fecha ISO aaaa-mm-dd, o '' si la celda esta vacia.
 * Sheets guarda una fecha vacia como el serial 0 = 1899-12-30, asi que
 * cualquier anio anterior a 2000 en estos datos es una celda sin rellenar,
 * no una campana de hace un siglo.
 */
function fechaISO(fecha, timeZone) {
  if (!(fecha instanceof Date)) {
    return '';
  }

  const anio = Number(Utilities.formatDate(fecha, timeZone, 'yyyy'));

  if (!anio || anio < 2000) {
    return '';
  }

  return Utilities.formatDate(fecha, timeZone, 'yyyy-MM-dd');
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function buildCSV(rows, fields) {
  const lines = [];

  lines.push(fields.map(csvEscape).join(','));

  rows.forEach(function (row) {
    const line = fields.map(function (field) {
      const value = row[field] === null || row[field] === undefined ? '' : row[field];
      return csvEscape(value);
    }).join(',');

    lines.push(line);
  });

  return lines.join('\n');
}

function csvEscape(value) {
  const text = String(value === null || value === undefined ? '' : value);
  const needsQuotes = /[",\n\r]/.test(text);

  if (needsQuotes) {
    return '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}

function safeText(value) {
  return value === null || value === undefined || value === '' ? 'sin dato' : String(value);
}

/**
 * Comprobación rápida: ejecútala desde el editor y mira el log.
 * Falla si la derivación del mes se rompe.
 */
function testMesDesdeInicio() {
  const tz = 'Europe/Madrid';

  const iso = mesDesdeInicio(null, '2026-02-05', tz);
  if (!iso || iso.num !== 2 || iso.year !== '2026') throw new Error('texto ISO aaaa-mm-dd');

  const isoNov = mesDesdeInicio(null, '2026-11-02', tz);
  if (!isoNov || isoNov.num !== 11) throw new Error('ISO de noviembre');

  const texto = mesDesdeInicio(null, '30/08/2024', tz);
  if (!texto || texto.num !== 8 || texto.year !== '2024') throw new Error('texto dd/mm/aaaa');

  // el caso que rompio en produccion: 11/2/2026 es 11 de febrero, no 2 de noviembre
  const ambiguo = mesDesdeInicio(null, '11/2/2026', tz);
  if (!ambiguo || ambiguo.num !== 2) throw new Error('11/2/2026 debe ser febrero');

  const guion = mesDesdeInicio(null, '3-9-2024', tz);
  if (!guion || guion.num !== 9) throw new Error('texto dd-mm-aaaa');

  const fecha = mesDesdeInicio(new Date(2026, 0, 15), '', tz);
  if (!fecha || fecha.num !== 1 || fecha.year !== '2026') throw new Error('celda Date');

  // celda vacia: Sheets la entrega como 1899-12-30, no como campana de 1900
  if (fechaISO(new Date(1899, 11, 30), tz) !== '') throw new Error('celda vacia debe dar cadena vacia');
  if (fechaISO('', tz) !== '') throw new Error('no-Date debe dar cadena vacia');
  if (fechaISO(new Date(2026, 1, 5), tz) !== '2026-02-05') throw new Error('fecha normal a ISO');
  if (mesDesdeInicio(new Date(1899, 11, 30), '', tz) !== null) throw new Error('Inicio vacio no tiene mes');

  if (mesDesdeInicio(null, '', tz) !== null) throw new Error('vacío debe dar null');
  if (mesDesdeInicio(null, 'agosto', tz) !== null) throw new Error('basura debe dar null');
  if (mesDesdeInicio(null, '30/13/2024', tz) !== null) throw new Error('mes 13 debe dar null');

  Logger.log('OK · mesDesdeInicio pasa las 13 comprobaciones');
}
