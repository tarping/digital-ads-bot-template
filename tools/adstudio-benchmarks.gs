/**
 * Benchmarks internos de Spotify Ad Studio.
 *
 * Rellena dos columnas de la pestaña que produce el puller:
 *
 *   - CTR Bench               mediana de CTR de su cohorte
 *   - Bench Cost per Streams  mediana de Cost per Streams de su cohorte
 *
 * `Cost per Streams` NO se toca aquí: lo escribe el puller fila a fila, que ya
 * tiene el gasto y los streams delante. Estas dos, en cambio, son medianas
 * sobre TODA la pestaña, así que solo pueden calcularse cuando las filas ya
 * están puestas — de ahí que el puller llame a esto al final.
 *
 * Se recalculan enteras en cada pasada: no edites los valores a mano.
 *
 * Dos formas de ejecutarlo:
 *   - menú «Ad Studio → Recalcular benchmarks», a mano
 *   - adStudioRecalcBenchmarks(sheet), que es lo que hace el puller
 *
 * El trabajo va en adStudioRecalcBenchmarks() y no en la función del menú
 * porque SpreadsheetApp.getUi() revienta cuando lo llama un trigger temporal:
 * un trigger no tiene interfaz a la que hablarle.
 */

var ADS_SHEET_NAME = 'Spotify Campaigns';

// Campañas por debajo de este gasto no ENTRAN en el cálculo de la mediana: con
// €7 de inversión, un CTR o un coste por stream no describen nada. Sí RECIBEN
// benchmark, para poder situarlas. Mismo umbral que usa el prompt en rankings.
var ADS_UMBRAL_VOLUMEN = 200;

// Mínimo de campañas para que una cohorte sostenga una mediana. Con menos, se
// cae al siguiente nivel. Con 1 campaña la mediana ES la campaña: siempre
// daría 🟢 exacto, que es peor que no dar benchmark.
var ADS_MIN_COHORTE = 3;

// Cohortes de más fina a más gruesa. La primera con ADS_MIN_COHORTE campañas
// gana. Sin esta caída, con pocas campañas la mitad de las filas se compararían
// contra sí mismas.
//
// EL FORMATO NO SE SUELTA NUNCA. Hubo un tercer nivel, solo por objetivo, y
// había que quitarlo: dentro de ENGAGEMENT_ON_SPOTIFY el CTR mediano de Vídeo
// puede multiplicar varias veces el de Audio. Con una mediana que mezcle
// formatos, un vídeo en la media sale 🟢 brillante y un audio normal sale 🟠,
// y las dos lecturas son falsas de una forma que nadie va a detectar. Es mejor
// dejar esas campañas sin referencia: el prompt ya sabe decir "sin referencia
// suficiente todavía", y un hueco no engaña a nadie.
// EL MERCADO TAMPOCO. Ad Studio no tiene columna de país: el mercado va como
// sufijo del Release ("Release Ejemplo MX"), y sin él todo se compara contra todo.
// Unas pocas campañas de fuera de España pueden multiplicar la mediana de coste
// por stream de una cohorte, y entonces un vídeo español peor que la mediana
// española sale 🟢 pareciendo mucho mejor que la referencia. Por eso el mercado va el primero en las dos cohortes y no
// se suelta nunca.
var ADS_COHORTES = [
  ['Market', 'Segment', 'Objective', 'Delivery Goal'],
  ['Market', 'Objective', 'Delivery Goal']
];

// Sufijos de mercado que pueden aparecer al final del Release. Es una lista
// cerrada a propósito: con un «dos o tres mayúsculas al final» valdría, pero
// un acrónimo como «VIP» se convertiría en un país y partiría su cohorte sin que
// nadie lo viera. Sin sufijo reconocido, la campaña es de España.
var ADS_MERCADOS = [
  'AR','AT','AU','BE','BO','BR','CA','CH','CL','CO','CR','CZ','DE','DK','DO',
  'EC','ES','FI','FR','GB','GE','GER','GR','GT','HN','HU','IE','IT','JP','MX',
  'NL','NO','NZ','PA','PE','PL','PO','POR','PT','PY','RO','SE','SV','UK','US',
  'UY','VE','ZA'
];
var ADS_MERCADO_POR_DEFECTO = 'ES';

// Métrica -> columna donde va su benchmark.
//
// El benchmark del coste por stream se llama «Bench Cost per Streams» y no
// «Cost per Streams Bench» a propósito: con el ancho de columna por defecto,
// los dos títulos se recortaban igual («Cost per Strea…») y era imposible
// distinguir la métrica de su referencia de un vistazo. Meta ya usa este mismo
// orden en `BenchCostPerResult`.
var ADS_BENCHMARKS = [
  { metrica: 'CTR',              destino: 'CTR Bench' },
  { metrica: 'Cost per Streams', destino: 'Bench Cost per Streams' }
];

// Nombres antiguos de cada columna, para renombrar la cabecera sin tener que
// reconstruir la pestaña entera.
//
// getOrCreateSheet() solo escribe la cabecera cuando CREA la pestaña: si ya
// existe, la deja como está. Así que cambiar un título aquí no cambia nada en
// la hoja, y el script se queda buscando una columna que existe con otro
// nombre. Antes esto obligaba a un spFullPull() —todas las campañas por una API
// limitada— para renombrar una celda.
var ADS_ALIAS = {
  'Bench Cost per Streams': ['Cost per Streams Bench']
};


function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Ad Studio')
    .addItem('Recalcular benchmarks', 'adStudioRecalcBenchmarksMenu')
    .addToUi();
}


// Envoltorio del menú: es el ÚNICO sitio con interfaz de usuario.
function adStudioRecalcBenchmarksMenu() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ADS_SHEET_NAME);
  if (!sheet) {
    ui.alert('No encuentro la pestaña: ' + ADS_SHEET_NAME);
    return;
  }
  ui.alert(adStudioRecalcBenchmarks(sheet).message);
}


/**
 * Recalcula las dos columnas de benchmark. Devuelve { ok, message } en vez de
 * abrir diálogos, para poder llamarse desde el puller y desde un trigger.
 */
function adStudioRecalcBenchmarks(sheet) {
  var datos = sheet.getDataRange().getValues();
  if (datos.length < 2) return { ok: false, message: 'La pestaña no tiene datos.' };

  var col = {};
  var repetidas = [];
  datos[0].forEach(function (h, i) {
    var nombre = String(h).trim();
    if (!nombre) return;
    // Dos columnas con el mismo título: la segunda ganaría al construir `col` y
    // los valores se escribirían en la que no se está mirando.
    if (col[nombre] !== undefined) repetidas.push(nombre);
    col[nombre] = i;
  });
  if (repetidas.length) {
    return { ok: false, message: 'Hay columnas repetidas en la pestaña: ' +
             repetidas.join(', ') + '. Borra la sobrante y vuelve a ejecutar ' +
             'spFullPull() — con el título duplicado no se sabe en cuál escribir.' };
  }

  var renombradas = adsMigrarCabecera(sheet, col);

  var requeridas = ['Campaign ID', 'Release', 'Segment', 'Objective', 'Delivery Goal',
                    'Spend', 'CTR', 'Cost per Streams', 'CTR Bench',
                    'Bench Cost per Streams'];
  var faltan = requeridas.filter(function (h) { return col[h] === undefined; });
  if (faltan.length) {
    return { ok: false, message: 'Faltan columnas en la pestaña: ' + faltan.join(', ') +
                                 '. Ejecuta spFullPull() para reconstruir la cabecera.' };
  }

  // Sin Campaign ID no hay campaña: es una fila en blanco que ha quedado de una
  // reconstrucción a medias. Contarlas hincha el total y mete huecos en las
  // cohortes, y la mayoría de campañas se quedan sin referencia.
  //
  // Se MARCAN, no se quitan de la lista: las dos columnas se escriben por
  // posición, así que si se filtran las filas, cada valor cae en la campaña
  // equivocada. Se quedan dentro, sin benchmark y fuera de las medianas.
  var enBlanco = 0;
  var filas = datos.slice(1).map(function (fila) {
    var valida = String(fila[col['Campaign ID']] == null ? '' : fila[col['Campaign ID']]).trim() !== '';
    if (!valida) enBlanco++;
    return {
      valida: valida,
      mercado: adsMercado(fila[col['Release']]),
      seg  : adsClave(fila[col['Segment']]),
      fmt  : adsClave(fila[col['Objective']]),
      goal : adsClave(fila[col['Delivery Goal']]),
      gasto: adsNum(fila[col['Spend']]),
      // Vacío o 0 = la métrica no aplica a esta campaña. Ni entra en la mediana
      // ni se compara contra ella.
      'CTR'             : adsMetrica(fila[col['CTR']]),
      'Cost per Streams': adsMetrica(fila[col['Cost per Streams']])
    };
  });

  // Solo las campañas con volumen suficiente forman las medianas.
  var poblacion = filas.filter(function (f) {
    return f.valida && f.gasto >= ADS_UMBRAL_VOLUMEN;
  });

  var resumen = [];
  ADS_BENCHMARKS.forEach(function (b) {
    // Un contador por cohorte, más uno para las que se quedan sin referencia.
    // Se deriva de ADS_COHORTES para que el resumen siga siendo verdad si
    // algún día se añade o se quita un nivel.
    var niveles = ADS_COHORTES.map(function () { return 0; }).concat([0]);
    var valores = filas.map(function (f) {
      var r = adsBenchmark(f, poblacion, b.metrica);
      niveles[r.nivel]++;
      return [r.valor];
    });
    sheet.getRange(2, col[b.destino] + 1, valores.length, 1).setValues(valores);
    var detalle = ADS_COHORTES.map(function (dims, i) {
      return niveles[i] + ' por ' + dims.map(adsEtiqueta).join('+');
    }).concat([niveles[ADS_COHORTES.length] + ' sin referencia']);
    resumen.push(b.destino + ': ' + detalle.join(', '));
  });

  return {
    ok: true,
    message: (renombradas.length ? renombradas.join('\n') + '\n\n' : '') +
             (filas.length - enBlanco) + ' campañas · ' + poblacion.length +
             ' con gasto ≥ €' + ADS_UMBRAL_VOLUMEN +
             (enBlanco ? '\n⚠️ ' + enBlanco + ' filas en blanco ignoradas (sin Campaign ID). ' +
                         'Ejecuta spPurgeBlankRows() en el proyecto del puller.' : '') +
             '\n\n' + resumen.join('\n')
  };
}


/**
 * Renombra en la hoja las cabeceras que sigan con un nombre antiguo, y
 * actualiza `col` para que el resto de la función las encuentre. Devuelve una
 * línea por cambio, para dejar rastro en el log.
 *
 * Solo toca la celda del título: los datos de la columna se quedan donde
 * están. Y solo actúa si el nombre nuevo NO existe ya, para no pisar nada
 * cuando conviven los dos por error.
 */
function adsMigrarCabecera(sheet, col) {
  var hechas = [];
  Object.keys(ADS_ALIAS).forEach(function (nuevo) {
    if (col[nuevo] !== undefined) return;          // ya está bien
    ADS_ALIAS[nuevo].forEach(function (viejo) {
      if (col[nuevo] !== undefined || col[viejo] === undefined) return;
      sheet.getRange(1, col[viejo] + 1).setValue(nuevo);
      col[nuevo] = col[viejo];
      delete col[viejo];
      hechas.push('Cabecera renombrada: «' + viejo + '» → «' + nuevo + '».');
    });
  });
  return hechas;
}


/**
 * Mediana de `metrica` en la cohorte más fina que reúna ADS_MIN_COHORTE
 * campañas con valor. Devuelve { valor, nivel }, donde valor es '' si ningún
 * nivel llega — mejor hueco que una referencia inventada: el prompt ya sabe
 * decir "(sin referencia suficiente todavía)".
 */
function adsBenchmark(objetivo, poblacion, metrica) {
  // Ni una fila en blanco, ni una campaña sin la métrica, necesitan benchmark.
  if (!objetivo.valida || objetivo[metrica] === null) {
    return { valor: '', nivel: ADS_COHORTES.length };
  }

  for (var i = 0; i < ADS_COHORTES.length; i++) {
    var dims = ADS_COHORTES[i];
    var valores = poblacion
      .filter(function (p) { return adsMismaCohorte(p, objetivo, dims); })
      .map(function (p) { return p[metrica]; })
      .filter(function (v) { return v !== null; });

    if (valores.length >= ADS_MIN_COHORTE) {
      return { valor: adsMediana(valores), nivel: i };
    }
  }
  return { valor: '', nivel: ADS_COHORTES.length };
}


// Nombre corto de cada dimensión, para el resumen del log.
function adsEtiqueta(dim) {
  return { Market: 'mercado', Segment: 'segmento',
           Objective: 'formato', 'Delivery Goal': 'objetivo' }[dim] || dim;
}


// Nombre de columna -> clave en la fila ya preparada.
var ADS_DIM = { Market: 'mercado', Segment: 'seg',
                Objective: 'fmt', 'Delivery Goal': 'goal' };


/**
 * Mercado de una campaña, a partir del sufijo del Release: «Release Ejemplo MX»
 * es MX. Sin sufijo reconocido, España.
 *
 * Es el único sitio donde vive el país: Ad Studio no tiene columna de mercado,
 * a diferencia de Marquee/Showcase, que trae Location. Consecuencia a tener
 * presente: una campaña de otro mercado SIN sufijo en el nombre se cuenta como
 * española y se compara contra las españolas.
 */
function adsMercado(release) {
  var partes = String(release == null ? '' : release).trim().split(/\s+/);
  var ultima = partes[partes.length - 1] || '';
  // Mayúsculas de verdad: así «Algo tu» no se lee como una campaña turca.
  if (!/^[A-Z]{2,3}$/.test(ultima)) return ADS_MERCADO_POR_DEFECTO;
  return ADS_MERCADOS.indexOf(ultima) === -1 ? ADS_MERCADO_POR_DEFECTO : ultima;
}


function adsMismaCohorte(a, b, dims) {
  for (var i = 0; i < dims.length; i++) {
    var k = ADS_DIM[dims[i]];
    if (a[k] !== b[k]) return false;
  }
  return true;
}


// Mediana, no media: un solo flight de €5.000 arrastra la media de su cohorte.
function adsMediana(valores) {
  var v = valores.slice().sort(function (a, b) { return a - b; });
  var m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}


function adsEsFecha(valor) {
  return Object.prototype.toString.call(valor) === '[object Date]';
}


// El número que hay debajo de una celda con formato de fecha. Sheets guarda
// los días transcurridos desde el 30/12/1899, así que un gasto de 465,35 se
// dibuja como el 09/04/1901. Solo se usa para ENSEÑAR el dato en el
// diagnóstico, nunca para calcular: ver el comentario de adsNum.
function adsSerieDeFecha(fecha) {
  var epoca = Date.UTC(1899, 11, 30);
  var dias = (fecha.getTime() - epoca) / 86400000;
  return Math.round(dias * 1e6) / 1e6;
}


// Normaliza para agrupar: "Latino " con cola es Latino.
function adsClave(valor) {
  return String(valor == null ? '' : valor).trim().toLowerCase();
}


// null = la métrica no aplica a esta campaña (celda vacía, 0, o basura).
function adsMetrica(valor) {
  var n = adsNum(valor);
  return n > 0 ? n : null;
}


/**
 * Número desde una celda, venga como venga.
 *
 * El puller escribe números de verdad, así que lo normal es el primer return.
 * Lo demás es por si alguien toca la hoja a mano o la pega desde otro sitio: un
 * importe que llegue como texto «1.234,56» no puede acabar valiendo 0, porque
 * un 0 aquí no se distingue de una campaña sin gasto y tira abajo el cálculo
 * entero sin que salte nada.
 */
function adsNum(valor) {
  if (valor === '' || valor == null) return 0;
  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;
  // Una fecha en una columna numérica vale 0 A PROPÓSITO, aunque el número
  // original se pueda recuperar (ver adsSerieDeFecha). Recuperarlo sin más
  // taparía el otro caso que produce fechas aquí —una columna de fechas de
  // verdad leída como si fuese el gasto—, y ahí el número recuperado sería
  // enorme y creíble. Vale más quedarse a 0 y que el diagnóstico lo cuente.
  if (adsEsFecha(valor)) return 0;

  var s = String(valor).replace(/[^\d.,\-]/g, '');   // fuera el € y los espacios
  if (!s) return 0;

  var coma = s.lastIndexOf(','), punto = s.lastIndexOf('.');
  if (coma !== -1 && punto !== -1) {
    // Con los dos separadores, el decimal es el que va más a la derecha.
    s = coma > punto ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (coma !== -1) {
    // Con una sola coma hay que adivinar. Es separador de miles solo si el
    // número entero encaja del todo en el patrón (1.234, 12.345.678) Y no
    // empieza por cero: «0,012» son doce milésimas, nunca cero mil doce, y un
    // coste por stream cae justo ahí.
    var miles = /^-?[1-9]\d{0,2}(,\d{3})+$/.test(s);
    s = miles ? s.replace(/,/g, '') : s.replace(',', '.');
  }

  var n = Number(s);
  return isFinite(n) ? n : 0;
}


// ============================================================
//  DIAGNÓSTICO — ejecuta adStudioDiagnose() desde el editor.
// ============================================================
//  Para cuando las columnas de benchmark salen en blanco. Dice CUÁL de las
//  cuatro cosas que pueden fallar está fallando, en vez de dejarte mirando una
//  columna vacía sin saber si el problema es el fichero, la cabecera, el
//  umbral o los datos.
function adStudioDiagnose() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ADS_SHEET_NAME);

  Logger.log('--- 1. ¿Está la pestaña? ---');
  if (!sheet) {
    Logger.log('NO. Busco «' + ADS_SHEET_NAME + '» y las pestañas de este ' +
               'documento son: ' + ss.getSheets().map(function (s) {
                 return '«' + s.getName() + '»';
               }).join(', ') + '.');
    Logger.log('Corrige ADS_SHEET_NAME arriba del todo y vuelve a ejecutar.');
    return;
  }
  Logger.log('Sí: «' + ADS_SHEET_NAME + '», ' + (sheet.getLastRow() - 1) + ' filas.');

  Logger.log('--- 2. ¿Ve el puller este fichero? ---');
  Logger.log(typeof adStudioRecalcBenchmarks === 'function'
    ? 'Sí: adStudioRecalcBenchmarks está definida, así que _spRun puede llamarla.'
    : 'NO. Algo pasa con este fichero — el puller la busca por nombre.');

  Logger.log('--- 3. ¿Están las columnas, y con el nombre exacto? ---');
  var cabecera = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
                      .map(function (h) { return String(h).trim(); });
  Logger.log(cabecera.length + ' columnas: ' + cabecera.join(' | '));
  ['Segment', 'Objective', 'Delivery Goal', 'Spend', 'CTR', 'Cost per Streams',
   'CTR Bench', 'Bench Cost per Streams'].forEach(function (h) {
    var veces = cabecera.filter(function (c) { return c === h; }).length;
    if (veces === 1) return;
    if (veces > 1) {
      Logger.log('REPETIDA «' + h + '» (' + veces + ' veces). Borra la sobrante.');
      return;
    }
    // Puede que solo esté con un nombre antiguo: eso lo arregla el paso 4.
    var viejo = (ADS_ALIAS[h] || []).filter(function (v) {
      return cabecera.indexOf(v) !== -1;
    })[0];
    Logger.log(viejo
      ? 'Con el nombre antiguo: «' + viejo + '» en vez de «' + h + '». ' +
        'El paso 4 la renombra sola, sin tocar los datos.'
      : 'FALTA «' + h + '». ¿Está escrita de otra forma en la cabecera de arriba?');
  });

  Logger.log('--- 4. ¿Qué hay REALMENTE en las columnas clave? ---');
  // Cuando el recuento de campañas con volumen sale a 0 y no debería, el
  // problema está en cómo se lee la celda, no en el cálculo. Aquí se ve el
  // valor crudo, su tipo y en qué se convierte.
  var datos = sheet.getDataRange().getValues();
  var idx = {};
  datos[0].forEach(function (h, i) { idx[String(h).trim()] = i; });

  var conFormatoFecha = [];
  ['Spend', 'CTR', 'Cost per Streams'].forEach(function (h) {
    if (idx[h] === undefined) { Logger.log(h + ': la columna no está.'); return; }
    var muestra = datos.slice(1, 4).map(function (fila) {
      var v = fila[idx[h]];
      if (adsEsFecha(v)) {
        if (conFormatoFecha.indexOf(h) === -1) conFormatoFecha.push(h);
        // El número sigue ahí debajo: Sheets cuenta días desde el 30/12/1899.
        return JSON.stringify(v) + ' (Date) → debajo hay ' + adsSerieDeFecha(v);
      }
      var parseado = (h === 'Spend') ? adsNum(v) : adsMetrica(v);
      return JSON.stringify(v) + ' (' + typeof v + ') → ' + parseado;
    });
    var conValor = datos.slice(1).filter(function (fila) {
      return (h === 'Spend' ? adsNum(fila[idx[h]]) : adsMetrica(fila[idx[h]])) > 0;
    }).length;
    Logger.log(h + ' [columna ' + (idx[h] + 1) + ']: ' + conValor + ' de ' +
               (datos.length - 1) + ' filas con valor. Primeras: ' + muestra.join(' · '));
  });

  var conVolumen = datos.slice(1).filter(function (fila) {
    return adsNum(fila[idx['Spend']]) >= ADS_UMBRAL_VOLUMEN;
  }).length;
  if (conFormatoFecha.length) {
    // Le pasa a una columna numérica que aterriza donde antes había una fecha:
    // al mover columnas, el formato se queda pegado a la columna, no al dato.
    Logger.log('EL PROBLEMA ES EL FORMATO, no los datos. Estas columnas tienen ' +
               'formato de FECHA: ' + conFormatoFecha.join(', ') + '. Los números ' +
               'están intactos debajo (un gasto de 465,35 se dibuja como 09/04/1901 ' +
               'porque Sheets cuenta días desde el 30/12/1899), pero el script los ' +
               'recibe como fechas y no como importes.');
    Logger.log('Arreglo, según cómo esté la pestaña:');
    Logger.log('  · Si es una TABLA de Sheets (cabecera de color con desplegable en ' +
               'cada columna), manda el TIPO de la columna y el formato de celda se ' +
               'ignora: abre el desplegable de esa columna y cambia su tipo a Número. ' +
               'spFixFormats() no puede hacerlo — Sheets lo rechaza con "You can\'t ' +
               'set the number format of cells in a typed column".');
    Logger.log('  · Si es una pestaña normal: spFixFormats() en el proyecto del ' +
               'puller, o a mano Formato → Número → Automático.');
  } else if (!conVolumen) {
    Logger.log('NINGUNA fila llega a €' + ADS_UMBRAL_VOLUMEN + ' de gasto. Si arriba ' +
               'ves importes de verdad, es que la celda no se está leyendo como ' +
               'número; si ves texto raro, la columna Spend no es la que el script ' +
               'cree y la cabecera está descuadrada de los datos.');
  }

  Logger.log('--- 5. ¿Hay campañas suficientes para una mediana? ---');
  var r = adStudioRecalcBenchmarks(sheet);
  Logger.log(r.ok ? r.message : 'Se ha parado: ' + r.message);
  if (r.ok && conVolumen) {
    Logger.log('Las columnas acaban de recalcularse. Si siguen en blanco después ' +
               'de esto, es que no hay cohortes que lleguen a ' + ADS_MIN_COHORTE +
               ' campañas con gasto ≥ €' + ADS_UMBRAL_VOLUMEN + '.');
  }
}


// ============================================================
//  SELF-CHECK — ejecuta adStudioSelfCheck() desde el editor.
// ============================================================
function adStudioSelfCheck() {
  function ok(cond, msg) { if (!cond) throw new Error('adStudioSelfCheck: ' + msg); }

  // Una columna y su benchmark no pueden recortarse igual en la cabecera: con
  // el ancho por defecto solo se ven los primeros ~14 caracteres, y «Cost per
  // Streams» junto a «Cost per Streams Bench» se leían como la misma columna.
  ADS_BENCHMARKS.forEach(function (b) {
    ok(b.destino.slice(0, 14) !== b.metrica.slice(0, 14),
       '«' + b.destino + '» y «' + b.metrica + '» se recortan igual en la cabecera');
  });

  // Un alias que apunte a una columna que ya no existe no renombraría nada y
  // no se notaría hasta que alguien mirase una columna vacía.
  var destinos = ADS_BENCHMARKS.map(function (b) { return b.destino; });
  Object.keys(ADS_ALIAS).forEach(function (nuevo) {
    ok(destinos.indexOf(nuevo) !== -1,
       'el alias apunta a «' + nuevo + '», que no es ninguna columna de benchmark');
    ADS_ALIAS[nuevo].forEach(function (viejo) {
      ok(viejo !== nuevo, '«' + nuevo + '» se tiene a sí misma como nombre antiguo');
      ok(destinos.indexOf(viejo) === -1,
         '«' + viejo + '» es a la vez nombre antiguo y columna en uso');
    });
  });

  ok(adsMediana([1, 2, 3]) === 2, 'mediana impar');
  ok(adsMediana([1, 2, 3, 4]) === 2.5, 'mediana par');
  ok(adsMediana([1, 1, 1, 100]) === 1, 'un valor extremo no arrastra la mediana');

  // El mercado sale del sufijo del Release, que es el único sitio donde está.
  ok(adsMercado('Release Ejemplo MX') === 'MX', 'el sufijo de mercado se reconoce');
  ok(adsMercado('Release Ejemplo GER') === 'GER', 'también los de tres letras');
  ok(adsMercado('Single Ejemplo') === 'ES', 'sin sufijo, la campaña es de España');
  ok(adsMercado('') === 'ES' && adsMercado(null) === 'ES', 'un Release vacío es España');
  // Los dos que romperían la lista abierta: un acrónimo que no es país, y una
  // palabra corta en minúscula.
  ok(adsMercado('VIP') === 'ES', 'VIP es un acrónimo, no un país');
  ok(adsMercado('Algo tu') === 'ES', 'una palabra en minúscula no es un mercado');
  ok(adsMercado('T10') === 'ES', 'con un dígito dentro no es un código de país');
  // Y el mercado no se suelta en ninguna cohorte: es lo que impedía que una
  // campaña española se midiese contra las de fuera.
  ADS_COHORTES.forEach(function (dims, i) {
    ok(dims.indexOf('Market') !== -1, 'la cohorte ' + i + ' no separa por mercado');
    ok(dims.indexOf('Objective') !== -1, 'la cohorte ' + i + ' no separa por formato');
  });

  ok(adsClave('  Latino ') === 'latino', 'los espacios sobrantes no parten la cohorte');
  ok(adsMetrica(0) === null && adsMetrica('') === null,
     'un 0 o un hueco es "no aplica", no un valor a promediar');

  // El caso normal: el puller escribe números.
  ok(adsNum(465.351242) === 465.351242, 'un número pasa tal cual');
  ok(adsNum(1000) === 1000, 'un entero pasa tal cual');
  // Y los que llegan como texto, que es donde un 0 silencioso haría daño.
  ok(adsNum('465.351242') === 465.351242, 'texto anglosajón con decimales');
  ok(adsNum('1,234.56') === 1234.56, 'texto anglosajón con separador de miles');
  ok(adsNum('1.234,56') === 1234.56, 'texto europeo: el decimal es la coma');
  ok(adsNum('465,35') === 465.35, 'una coma con dos dígitos detrás es decimal');
  ok(adsNum('1,234') === 1234, 'una coma con tres dígitos detrás es de miles');
  ok(adsNum('12,345,678') === 12345678, 'varios separadores de miles');
  // El caso que rompía la regla anterior: un coste por stream tiene tres
  // decimales detrás de un cero, y se leía como si fuesen miles.
  ok(adsNum('0,012') === 0.012, '«0,012» son doce milésimas, no doce');
  ok(adsNum('0,95') === 0.95, 'un cero delante nunca lleva separador de miles');
  ok(adsNum('€2.500,00') === 2500, 'el símbolo de moneda no estorba');
  ok(adsNum('2 500') === 2500, 'los espacios tampoco');
  ok(adsNum(new Date()) === 0, 'una fecha en una columna numérica vale 0, no NaN');
  ok(adsNum('sin dato') === 0 && adsNum(null) === 0, 'el texto suelto y el hueco valen 0');

  // Cohorte fina con 3 campañas: manda ella.
  function c(seg, fmt, ctr, mkt) {
    return { valida: true, mercado: mkt || 'ES', seg: seg, fmt: fmt,
             goal: 'engagement', CTR: ctr };
  }
  var pob = [c('latino','audio',0.01), c('latino','audio',0.02),
             c('latino','audio',0.03), c('anglo','audio',0.90)];
  var fino = adsBenchmark(pob[0], pob, 'CTR');
  ok(fino.nivel === 0 && fino.valor === 0.02, 'la cohorte fina gana cuando llega al mínimo');

  // Cohorte fina con 1 campaña: cae a formato+objetivo y NO se compara consigo misma.
  var caida = adsBenchmark(pob[3], pob, 'CTR');
  ok(caida.nivel === 1, 'una cohorte fina de 1 campaña cae al nivel siguiente');
  ok(caida.valor !== 0.90, 'una campaña sola nunca es su propio benchmark');

  // Nada que hacer si ni el nivel más grueso llega al mínimo.
  var solo = [c('s','f',0.5)]; solo[0].goal = 'raro';
  ok(adsBenchmark(solo[0], solo, 'CTR').valor === '',
     'sin cohorte suficiente se devuelve hueco, no una referencia inventada');

  // Una campaña sin la métrica no recibe benchmark de esa métrica.
  var sinMetrica = c('latino','audio',null);
  ok(adsBenchmark(sinMetrica, pob, 'CTR').valor === '',
     'sin métrica no hay benchmark que aplicar');

  // Una fila en blanco tampoco, aunque su cohorte esté llena: es una fila que
  // quedó de una reconstrucción a medias, no una campaña.
  var blanca = c('latino','audio',0.02); blanca.valida = false;
  ok(adsBenchmark(blanca, pob, 'CTR').valor === '',
     'una fila en blanco no recibe benchmark');

  // Y un mercado distinto no se compara con España ni aunque coincida el resto.
  var fuera = c('latino','audio',0.02,'MX');
  ok(adsBenchmark(fuera, pob, 'CTR').valor === '',
     'una campaña de otro mercado no hereda la referencia española');

  Logger.log('adStudioSelfCheck: todas las comprobaciones pasan.');
}
