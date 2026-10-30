var CONFIG = {
  SPREADSHEET_ID: '1ZsjuygpRz1wPhCRxmL8LPLTNOo8kujGXplX8JRs6SZY',
  HOJA_RESPUESTAS: 'Respuestas de formulario 1',
  HOJA_ANTIMICROBIANOS_RESTRINGIDOS: 'ANTIMICROBIANOS_RESTRINGIDOS',
  ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO: ['LINEZOLID', 'CEFTAZIDIMA / AVIBACTAM', 'ANFOTERICINA', 'AZTREONAM', 'ERTAPENEM', 'VANCOMICINA', 'CASPOFUNGINA', 'ANFOTERICINA B LIPOSOMAL', 'TYGECICLINA', 'DORIPENEM', 'RIFAMPICINA', 'POLIMIXINA B', 'DAPTOMICINA'],
  HOJA_CIE10: 'CIE10',
  CACHE_CIE10_SEG: 21600,
  HOJA_RANGOS_DOSIS: 'RANGOS_DOSIS',
  // Rangos de referencia POR DOSIS para marcar "revisar dosis". Una dosis se acepta si cumple
  // cualquiera de las dos reglas definidas (mg/kg o mg absolutos); se marca solo si falla en todas.
  // La lista vigente es la pestana RANGOS_DOSIS, que valida y ajusta el QF; esta tabla es el
  // respaldo y la propuesta inicial (fuentes en docs/antimicrobianos-restringidos.md).
  // Columnas: antimicrobiano, min mg/kg/dosis, max mg/kg/dosis, min mg/dosis, max mg/dosis,
  //           ajuste renal (SI/NO), nota con la fuente.
  RANGOS_DOSIS_RESPALDO: [
    ['VANCOMICINA', 10, 35, null, null, 'SI', 'Consenso ASHP/IDSA/PIDS/SIDP 2020: carga 20-35 mg/kg (max 3 g), mantenimiento 15-20 mg/kg c/8-12 h, AUC 400-600'],
    ['LINEZOLID', 8, 12, 600, 600, 'NO', 'Ficha FDA Zyvox 2024: 600 mg c/12 h (>=12 a); 10 mg/kg c/8 h (<12 a). Sin ajuste renal'],
    ['DAPTOMICINA', 4, 12, null, null, 'SI', 'Ficha FDA/EMA Cubicin: 4 mg/kg (piel) y 6 mg/kg (bacteriemia) c/24 h; pediatria 5-12 mg/kg; guias 8-12 mg/kg; c/48 h si DepCr <30'],
    ['CASPOFUNGINA', 1, 4, 35, 70, 'NO', 'Ficha FDA/EMA Cancidas: 70 mg carga, 50 mg/dia (70 si >80 kg o con rifampicina); pediatria 70/50 mg/m2 max 70 mg; Child-Pugh B 35 mg'],
    ['ANFOTERICINA B LIPOSOMAL', 3, 10, null, null, 'NO', 'Ficha FDA AmBisome 2024: 3-5 mg/kg/dia (6 criptococo; hasta 10 mucormicosis); ACIN candidiasis 3-5 mg/kg/dia'],
    ['ANFOTERICINA B', 0.25, 1.5, null, null, 'NO', 'Ficha FDA deoxicolato: inicio 0,25 mg/kg/dia, habitual 0,5-1, nunca >1,5 mg/kg/dia. Nefrotoxica (vigilar K y creatinina)'],
    ['ERTAPENEM', 10, 20, 500, 1000, 'SI', 'Ficha FDA Invanz 2020: 1 g c/24 h (>=13 a); 15 mg/kg c/12 h (3 m-12 a, max 1 g/dia); 500 mg/dia si DepCr <=30'],
    ['AZTREONAM', 20, 50, 500, 2000, 'SI', 'Ficha FDA Azactam 2021: 0,5-2 g c/6-12 h (max 8 g/dia); pediatria 30 mg/kg c/6-8 h; mitad de dosis si DepCr 10-30'],
    ['CEFTAZIDIMA / AVIBACTAM', 30, 65, 940, 2500, 'SI', 'Ficha FDA Avycaz 2024: 2,5 g c/8 h; 1,25 g (DepCr 31-50); 0,94 g c/12-48 h (<=30); pediatria 62,5 mg/kg max 2,5 g. IDSA 2024: infusion 3 h'],
    ['TYGECICLINA', 1, 2.5, 25, 100, 'NO', 'Ficha FDA Tygacil 2025: 100 mg carga, 50 mg c/12 h; 8-11 a 1,2 mg/kg (max 50); Child-Pugh C 25 mg. Dosis alta 200/100 fuera de ficha'],
    ['DORIPENEM', null, null, 250, 1000, 'SI', 'Ficha FDA 2009 (producto original descontinuado): 500 mg c/8 h; 250 mg c/8 h (DepCr 30-50) o c/12 h (10-30). Verificar con ficha vigente'],
    ['RIFAMPICINA', 10, 20, 300, 900, 'NO', 'Ficha FDA Rifadin 2024: 600 mg/dia (10 mg/kg); pediatria 10-20 mg/kg max 600; infeccion protesica 600-900 mg/dia (IDSA). Sin ajuste renal; inductor CYP450'],
    ['POLIMIXINA B', null, null, null, null, 'NO', 'Sin regla: el formulario no distingue mg de UI (1 mg = 10.000 UI). Consenso polimixinas 2019: carga 2-2,5 mg/kg, 1,25-1,5 mg/kg c/12 h, sin ajuste renal']
  ],
  // Sugerencia PROA en el mensaje (revaluacion a las 48-72 h de la terapia empirica; guia OPS/OMS 2024).
  SUGERENCIAS_ACTIVAS: true,
  // false: la sugerencia solo sale cuando el restringido va con un acompanante de amplio espectro
  // (combinacion empirica). true: tambien en toda terapia empirica (en octubre 2026 seria el 82% de alertas).
  SUGERENCIA_EMPIRICO_SOLO: false,
  // Acompanantes de amplio espectro que, junto a un restringido en terapia empirica, se senalan como
  // combinacion a revaluar con cultivos.
  AMPLIO_ESPECTRO: ['MEROPENEM', 'IMIPENEM', 'CEFEPIME', 'PIPERACILINA / TAZOBACTAM', 'CEFTAZIDIMA', 'CEFTRIAXONA'],
  // Coherencia de datos: avisos cuando peso, edad o dosis no cuadran entre si (errores de digitacion).
  PESO_MIN_KG: 0.4,
  PESO_MAX_KG: 250,
  MG_KG_IMPLAUSIBLE: 100
};

/* =====================================================================
   Lectura tolerante de e.namedValues. Las claves son el texto exacto de
   cada pregunta del formulario, que puede traer espacios sobrantes
   (fue la causa de los "-" en el bot de Tecnovigilancia). Se compara
   con los espacios colapsados y sin espacios al inicio/final.
   ===================================================================== */
function normalizarClave(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function campoDelEvento(valores, nombre) {
  var objetivo = normalizarClave(nombre);
  for (var k in valores) {
    if (normalizarClave(k) === objetivo) {
      var v = valores[k];
      var texto = (v && v.length) ? String(v[0]) : '';
      return texto.trim() ? texto.trim() : '';
    }
  }
  return '';
}

// Preguntas del formulario que usa el mensaje (nombres tal como estan en la fila 1 de la hoja).
var CAMPOS = {
  HC: 'Número de Historia Clínica',
  EDAD_ANIOS: 'Edad del paciente en años',
  EDAD_MESES: 'Edad del paciente meses',
  EDAD_DIAS: 'Edad del paciente días',
  PESO_KG: 'Peso en Kg',
  PESO_G: 'Peso en gr',
  CAMA: 'Numero de cama',
  DIAGNOSTICO: 'Diagnóstico CIE10 para la cual se prescribe el antimicrobiano',
  TIPO_INDICACION: 'Indicación del antibiótico',
  FALLA_HEPATICA: 'Falla Hepática',
  AJUSTE_RENAL: 'Ajuste Renal',
  DEP_CREATININA: 'Si en Ajuste Renal, marcó Sí, indique el valor de depuración de Creatinina en (mg/dl), si marcó "No" coloque 0',
  CULTIVOS: 'Cultivos tomados:',
  MICROORGANISMO: 'Microorganismo aislado',
  ORIGEN: 'Origen de la infección?',
  INDICACION: 'Indicación',
  RAZON_CAMBIO: 'Si fue cambiado, cual fue la razón?',
  INTERCONSULTA: '¿Solicitó interconsulta por infectología en Dinámica Gerencial?',
  ESPECIALIDAD: 'Especialidad que prescribe',
  SERVICIO: 'Servicio actual'
};

var SLOTS = [
  { nombre: 'Nombre Antimicrobiano 1', dosis: 'Dosis en miligramos o UI AB1', via: 'Vía de adminsitración de  AM1', frecuencia: 'Frecuencia AM 1 (En Horas)', dias: 'Días ordenados AM1' },
  { nombre: 'Nombre Antimicrobiano 2', dosis: 'Dosis en miligramos o UI AM2', via: 'Vía de adminsitración de  AM2', frecuencia: 'Frecuencia AM 2 (En horas)', dias: 'Días ordenados AM2' },
  { nombre: 'Nombre Antimicrobiano 3', dosis: 'Dosis en miligramos o UI AM3', via: 'Vía de adminsitración de  AM3', frecuencia: 'Frecuencia AM 3 (En horas)', dias: 'Días ordenados AM 3' }
];

/* =====================================================================
   Lista de antimicrobianos restringidos: se lee de la hoja
   'ANTIMICROBIANOS_RESTRINGIDOS' en la matriz (columna A, desde fila 2).
   Si la hoja no existe o falla la lectura, se usa CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO
   para que las alertas nunca dejen de funcionar por este motivo.
   ===================================================================== */
function obtenerAntimicrobianosRestringidos() {
  try {
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_ANTIMICROBIANOS_RESTRINGIDOS);
    if (!hoja) {
      Logger.log('No se encontro la hoja "' + CONFIG.HOJA_ANTIMICROBIANOS_RESTRINGIDOS + '", se usa la lista de respaldo.');
      return CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO;
    }
    var ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) {
      Logger.log('La hoja de antimicrobianos restringidos esta vacia, se usa la lista de respaldo.');
      return CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO;
    }
    var valores = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
    var lista = valores
      .map(function(fila) { return String(fila[0] || '').trim().toUpperCase(); })
      .filter(function(v) { return v; });
    return lista.length ? lista : CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO;
  } catch (err) {
    Logger.log('Error leyendo la hoja de antimicrobianos restringidos, se usa la lista de respaldo: ' + err);
    return CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO;
  }
}

/* =====================================================================
   Rangos de dosis: pestana RANGOS_DOSIS (misma estructura que el respaldo).
   ===================================================================== */
function numeroONulo(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  var n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

function filaARegla(fila) {
  var nombre = String(fila[0] || '').trim().toUpperCase();
  if (!nombre) return null;
  return {
    nombre: nombre,
    minMgKg: numeroONulo(fila[1]), maxMgKg: numeroONulo(fila[2]),
    minMg: numeroONulo(fila[3]), maxMg: numeroONulo(fila[4]),
    ajusteRenal: String(fila[5] || '').trim().toUpperCase(),
    nota: String(fila[6] || '').trim()
  };
}

function obtenerRangosDosis() {
  var respaldo = CONFIG.RANGOS_DOSIS_RESPALDO.map(filaARegla).filter(Boolean);
  try {
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_RANGOS_DOSIS);
    if (!hoja || hoja.getLastRow() < 2) {
      Logger.log('Sin hoja "' + CONFIG.HOJA_RANGOS_DOSIS + '" (o vacia); se usan los rangos de respaldo. Ejecute crearHojaRangosDosis() para crearla.');
      return respaldo;
    }
    var reglas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 7).getValues().map(filaARegla).filter(Boolean);
    return reglas.length ? reglas : respaldo;
  } catch (err) {
    Logger.log('Error leyendo la hoja de rangos de dosis, se usan los de respaldo: ' + err);
    return respaldo;
  }
}

// Crea la pestana RANGOS_DOSIS con la propuesta inicial. No toca la pestana si ya existe.
function crearHojaRangosDosis() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  if (ss.getSheetByName(CONFIG.HOJA_RANGOS_DOSIS)) {
    Logger.log('La pestana ' + CONFIG.HOJA_RANGOS_DOSIS + ' ya existe; no se modifica.');
    return;
  }
  escribirRangosDosis(ss.insertSheet(CONFIG.HOJA_RANGOS_DOSIS));
  Logger.log('Pestana ' + CONFIG.HOJA_RANGOS_DOSIS + ' creada con ' + CONFIG.RANGOS_DOSIS_RESPALDO.length + ' antimicrobianos. Revisar y ajustar los rangos.');
}

// Reemplaza el contenido de la pestana RANGOS_DOSIS por la tabla del codigo (por ejemplo, tras
// actualizar los rangos o las fuentes). Borra lo que el QF haya editado en la pestana: usar a conciencia.
function reescribirHojaRangosDosis() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var hoja = ss.getSheetByName(CONFIG.HOJA_RANGOS_DOSIS) || ss.insertSheet(CONFIG.HOJA_RANGOS_DOSIS);
  hoja.clearContents();
  escribirRangosDosis(hoja);
  Logger.log('Pestana ' + CONFIG.HOJA_RANGOS_DOSIS + ' reescrita con ' + CONFIG.RANGOS_DOSIS_RESPALDO.length + ' antimicrobianos.');
}

function escribirRangosDosis(hoja) {
  var enc = ['antimicrobiano', 'min_mg_kg_dosis', 'max_mg_kg_dosis', 'min_mg_dosis', 'max_mg_dosis', 'ajuste_renal', 'nota'];
  hoja.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold');
  hoja.setFrozenRows(1);
  var filas = CONFIG.RANGOS_DOSIS_RESPALDO.map(function(f) {
    return f.map(function(v) { return v === null ? '' : v; });
  });
  hoja.getRange(2, 1, filas.length, enc.length).setValues(filas);
  hoja.autoResizeColumns(1, enc.length - 1);
}

// Regla cuyo nombre esta contenido en el del antimicrobiano; si varias aplican, la mas larga
// (ANFOTERICINA B LIPOSOMAL antes que ANFOTERICINA B).
function reglaDosisPara(nombreLimpioAm, reglas) {
  var n = String(nombreLimpioAm || '').toUpperCase();
  var mejor = null;
  reglas.forEach(function(r) {
    if (n.indexOf(r.nombre) > -1 && (!mejor || r.nombre.length > mejor.nombre.length)) mejor = r;
  });
  return mejor;
}

function dentroDe(valor, min, max) {
  if (min !== null && valor < min) return false;
  if (max !== null && valor > max) return false;
  return true;
}

// Numero con coma decimal y sin ceros sobrantes (1000 -> "1000", 14.29 -> "14,3", 4.5 -> "4,5").
function formatoNumero(n, decimales) {
  var d = (decimales === undefined) ? 1 : decimales;
  var s = (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toString();
  return s.replace('.', ',');
}

// Devuelve { mgKg, revisar, referencia }. Solo marca "revisar" si hay regla y la dosis falla
// en todas las reglas definidas para ese antimicrobiano.
function evaluarDosis(nombreLimpioAm, dosis, pesoKg, reglas) {
  var d = numeroONulo(dosis);
  var r = { mgKg: null, revisar: false, referencia: '' };
  if (d === null || d <= 0) return r;
  if (pesoKg !== null && pesoKg > 0) r.mgKg = d / pesoKg;
  var regla = reglaDosisPara(nombreLimpioAm, reglas);
  if (!regla) return r;
  var verificaciones = [];
  var partes = [];
  if (regla.minMg !== null || regla.maxMg !== null) {
    verificaciones.push(dentroDe(d, regla.minMg, regla.maxMg));
    partes.push(rangoTexto(regla.minMg, regla.maxMg) + ' mg/dosis');
  }
  if (r.mgKg !== null && (regla.minMgKg !== null || regla.maxMgKg !== null)) {
    verificaciones.push(dentroDe(r.mgKg, regla.minMgKg, regla.maxMgKg));
    partes.push(rangoTexto(regla.minMgKg, regla.maxMgKg) + ' mg/kg/dosis');
  }
  if (verificaciones.length && !verificaciones.some(function(ok) { return ok; })) {
    r.revisar = true;
    r.referencia = partes.join(' o ');
  }
  return r;
}

function rangoTexto(min, max) {
  if (min !== null && max !== null) return (min === max) ? formatoNumero(min) : formatoNumero(min) + '-' + formatoNumero(max);
  if (min !== null) return '≥ ' + formatoNumero(min);
  return '≤ ' + formatoNumero(max);
}

/* =====================================================================
   Flujo principal
   ===================================================================== */
function notificarNuevaRespuesta(e) {
  var coincidencias = filtrarAntimicrobianosRestringidos(e);
  if (coincidencias.length === 0) {
    return;
  }
  var mensaje = construirMensajeDesdeEvento(e, coincidencias);
  enviarAlertaWhatsApp(mensaje);
}

function nombreLimpio(valor) {
  if (!valor) return '-';
  return String(valor).split(' - UT-')[0].trim();
}

// Primer token del diagnostico, solo letras y numeros, 4 caracteres (A41.9 -> A419, G06.0 -> G060).
function extraerCodigoCIE10(diagnosticoCrudo) {
  if (!diagnosticoCrudo) return '';
  var primerToken = String(diagnosticoCrudo).trim().split(/\s+/)[0];
  var codigo = primerToken.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!/^[A-Z]\d{2}/.test(codigo)) return '';
  return codigo.slice(0, 4);
}

function buscarEnColumnaA(hoja, codigo) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return '';
  var celda = hoja.getRange(2, 1, ultima - 1, 1).createTextFinder(codigo).matchEntireCell(true).matchCase(false).findNext();
  return celda ? String(hoja.getRange(celda.getRow(), 2).getValue()).trim() : '';
}

// Descripcion de un codigo CIE10. Busca solo la celda (TextFinder) en vez de cargar las 12.600
// filas, y guarda el resultado en cache 6 h. Un codigo de 3 caracteres se busca tambien con X
// (J40 -> J40X, como esta en el catalogo).
function buscarDescripcionCIE10(codigo) {
  if (!codigo) return '';
  var cache = null;
  var clave = 'CIE10:' + codigo;
  try {
    cache = CacheService.getScriptCache();
    var enCache = cache.get(clave);
    if (enCache !== null) return enCache;
  } catch (err) {
    cache = null;
  }
  var descripcion = '';
  try {
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_CIE10);
    if (hoja) {
      descripcion = buscarEnColumnaA(hoja, codigo);
      if (!descripcion && codigo.length === 3) descripcion = buscarEnColumnaA(hoja, codigo + 'X');
    }
  } catch (err) {
    Logger.log('Error consultando CIE10 ' + codigo + ': ' + err);
    return '';
  }
  if (cache) {
    try { cache.put(clave, descripcion, CONFIG.CACHE_CIE10_SEG); } catch (err2) {}
  }
  return descripcion;
}

function formatearDiagnosticoCIE10(diagnosticoCrudo) {
  if (!diagnosticoCrudo || diagnosticoCrudo === '-') return diagnosticoCrudo || '-';
  var codigo = extraerCodigoCIE10(diagnosticoCrudo);
  if (!codigo) return diagnosticoCrudo;
  var descripcion = buscarDescripcionCIE10(codigo);
  if (!descripcion) return diagnosticoCrudo;
  var mostrado = (codigo.length === 3) ? codigo + 'X' : codigo;
  return mostrado + ' - ' + descripcion;
}

/* =====================================================================
   Lectura de los 3 antimicrobianos de la solicitud
   ===================================================================== */
function leerSlots(e) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var lista = [];
  SLOTS.forEach(function(slot) {
    var nombreCrudo = campoDelEvento(valores, slot.nombre);
    if (!nombreCrudo) return;
    lista.push({
      nombre: nombreLimpio(nombreCrudo),
      dosis: campoDelEvento(valores, slot.dosis) || '-',
      via: campoDelEvento(valores, slot.via) || '-',
      frecuencia: campoDelEvento(valores, slot.frecuencia) || '-',
      dias: campoDelEvento(valores, slot.dias) || '-'
    });
  });
  return lista;
}

function esRestringido(nombreLimpioAm, listaRestringidos) {
  var nombre = String(nombreLimpioAm || '').toUpperCase();
  return listaRestringidos.some(function(restringido) { return nombre.indexOf(restringido) > -1; });
}

function filtrarAntimicrobianosRestringidos(e) {
  var lista = obtenerAntimicrobianosRestringidos();
  return leerSlots(e).filter(function(am) { return esRestringido(am.nombre, lista); });
}

function acompanantesNoRestringidos(e) {
  var lista = obtenerAntimicrobianosRestringidos();
  return leerSlots(e).filter(function(am) { return !esRestringido(am.nombre, lista); });
}

/* =====================================================================
   Formato de los datos del mensaje
   ===================================================================== */
function edadTexto(anios, meses, dias) {
  var a = numeroONulo(anios), m = numeroONulo(meses), d = numeroONulo(dias);
  var partes = [];
  if (a !== null && a > 0) partes.push(formatoNumero(a, 0) + (a === 1 ? ' año' : ' años'));
  if (m !== null && m > 0) partes.push(formatoNumero(m, 0) + (m === 1 ? ' mes' : ' meses'));
  if (partes.length === 0 && d !== null && d > 0) partes.push(formatoNumero(d, 0) + (d === 1 ? ' día' : ' días'));
  return partes.length ? partes.join(' ') : '-';
}

function pesoKgDesde(pesoKg, pesoG) {
  var kg = numeroONulo(pesoKg), g = numeroONulo(pesoG);
  if (kg !== null && kg > 0) return kg;
  if (g !== null && g > 0) return g / 1000;
  return null;
}

function frecuenciaTexto(valor) {
  var s = String(valor || '').trim();
  if (!s || s === '-') return '-';
  var m = s.match(/^(?:cada\s+)?(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)?\.?$/i);
  if (m) return 'cada ' + m[1].replace('.', ',') + ' horas';
  return s;
}

function fechaFin(dias) {
  var n = numeroONulo(dias);
  if (n === null || n <= 0) return '';
  var fin = new Date(Date.now() + Math.round(n) * 24 * 3600 * 1000);
  return Utilities.formatDate(fin, 'America/Bogota', 'dd/MM/yyyy');
}

function diasTexto(valor) {
  var s = String(valor || '').trim();
  if (!s || s === '-') return '-';
  var n = numeroONulo(s);
  if (n === null) return s;
  var fin = fechaFin(n);
  return formatoNumero(n, 0) + (n === 1 ? ' día' : ' días') + (fin ? ' · hasta ' + fin : '');
}

function tipoIndicacionTexto(valor) {
  var s = String(valor || '');
  if (/emp[ií]rico/i.test(s)) return 'Empírico';
  if (/etiol/i.test(s)) return 'Etiológico';
  if (/profil/i.test(s)) return 'Profiláctico';
  return s.trim() || '-';
}

function esSi(valor) {
  return /^s[ií]$/i.test(String(valor || '').trim());
}

function capitalizar(s) {
  s = String(s || '').trim();
  if (!s) return '-';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function lineaEsquema(am) {
  var dosisNum = numeroONulo(am.dosis);
  var dosis = (dosisNum !== null) ? formatoNumero(dosisNum, 2) + ' mg' : am.dosis;
  if (am.mgKg !== null && am.mgKg !== undefined) dosis += ' (' + formatoNumero(am.mgKg, 1) + ' mg/kg)';
  return dosis + ' · ' + am.via + ' · ' + frecuenciaTexto(am.frecuencia);
}

/* =====================================================================
   Coherencia de datos y sugerencia PROA
   ===================================================================== */
// Avisos cuando peso, edad o dosis no cuadran (errores de digitacion del formulario).
function advertenciasCoherencia(pesoKg, edadAnios, edadMeses, esquemas) {
  var avisos = [];
  var a = numeroONulo(edadAnios), m = numeroONulo(edadMeses);
  if (pesoKg !== null) {
    if (pesoKg < CONFIG.PESO_MIN_KG || pesoKg > CONFIG.PESO_MAX_KG) {
      avisos.push('Verificar peso: ' + formatoNumero(pesoKg, 2) + ' kg no es un valor plausible');
    } else if (a !== null && ((a >= 12 && pesoKg < 20) || (a >= 18 && pesoKg < 30))) {
      avisos.push('Verificar peso: ' + formatoNumero(pesoKg, 2) + ' kg no es coherente con ' + formatoNumero(a, 0) + ' años');
    } else if ((a === null || a === 0) && m !== null && m > 0 && m < 12 && pesoKg > 20) {
      avisos.push('Verificar peso: ' + formatoNumero(pesoKg, 2) + ' kg no es coherente con ' + formatoNumero(m, 0) + ' meses');
    }
  }
  esquemas.forEach(function(am) {
    if (am.mgKg !== null && am.mgKg !== undefined && am.mgKg > CONFIG.MG_KG_IMPLAUSIBLE && !/POLIMIXINA/.test(String(am.nombre).toUpperCase())) {
      avisos.push('Verificar dosis o peso: ' + am.nombre + ' ' + am.dosis + ' mg equivalen a ' + formatoNumero(am.mgKg, 0) + ' mg/kg');
    }
  });
  return avisos;
}

// Sugerencia de revaluacion a las 48-72 h para la terapia empirica (time-out antibiotico; guia OPS/OMS
// 2024 de intervenciones PROA). Si hay un acompanante de amplio espectro, se nombra la combinacion.
function sugerenciaPROA(tipoIndicacion, coincidencias, acompanantes) {
  if (!CONFIG.SUGERENCIAS_ACTIVAS) return '';
  if (tipoIndicacion !== 'Empírico') return '';
  var amplios = acompanantes.filter(function(am) { return esRestringido(am.nombre, CONFIG.AMPLIO_ESPECTRO); });
  var restringidos = coincidencias.map(function(am) { return am.nombre; });
  if (amplios.length) {
    var combinacion = restringidos.concat(amplios.map(function(am) { return am.nombre; })).join(' + ');
    return 'Sugerencia PROA: terapia empírica combinada (' + combinacion + '). Revaluar a las 48-72 h con el resultado de cultivos para desescalar.';
  }
  if (!CONFIG.SUGERENCIA_EMPIRICO_SOLO) return '';
  return 'Sugerencia PROA: terapia empírica. Revaluar a las 48-72 h con el resultado de cultivos.';
}

/* =====================================================================
   Mensaje
   ===================================================================== */
function construirMensajeDesdeEvento(e, coincidenciasOpt) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  function campo(clave) {
    var v = campoDelEvento(valores, CAMPOS[clave]);
    return v ? v : '-';
  }
  var coincidencias = coincidenciasOpt || filtrarAntimicrobianosRestringidos(e);
  var acompanantes = acompanantesNoRestringidos(e);
  var reglas = obtenerRangosDosis();
  var pesoKg = pesoKgDesde(campo('PESO_KG'), campo('PESO_G'));

  var E = function(cp) { return String.fromCodePoint(cp); };
  var emojiAlerta = E(0x1F6A8), emojiHistoria = E(0x1F4C4), emojiEdad = E(0x1F382), emojiPeso = E(0x2696) + E(0xFE0F),
      emojiServicio = E(0x1F3E5), emojiEspecialidad = E(0x1FA7A), emojiDiagnostico = E(0x1F4CB),
      emojiMicro = E(0x1F9A0), emojiIndicacion = E(0x1F9EB), emojiInterconsulta = E(0x1F9EA),
      emojiRenal = E(0x1F4A7), emojiMedicamento = E(0x1F48A), emojiMas = E(0x2795),
      emojiAdvertencia = E(0x26A0) + E(0xFE0F), emojiCambio = E(0x1F504), emojiIdea = E(0x1F4A1);

  var edad = edadTexto(campo('EDAD_ANIOS'), campo('EDAD_MESES'), campo('EDAD_DIAS'));
  var pesoTexto = (pesoKg !== null) ? formatoNumero(pesoKg, 2) + ' kg' : '-';
  var cama = campo('CAMA');
  var interconsulta = campo('INTERCONSULTA');
  var indicacion = String(campo('INDICACION')).toUpperCase();
  var tipoIndicacion = tipoIndicacionTexto(campo('TIPO_INDICACION'));

  var lineas = [
    emojiAlerta + ' NUEVO CASO PROA - ANTIMICROBIANO RESTRINGIDO ' + emojiAlerta,
    '',
    emojiHistoria + ' Historia Clínica: ' + campo('HC'),
    emojiEdad + ' Edad: ' + edad + ' · ' + emojiPeso + ' Peso: ' + pesoTexto,
    emojiServicio + ' Servicio: ' + campo('SERVICIO') + (cama !== '-' ? ' · Cama: ' + cama : ''),
    emojiEspecialidad + ' Especialidad que prescribe: ' + campo('ESPECIALIDAD'),
    emojiDiagnostico + ' Diagnóstico CIE10: ' + formatearDiagnosticoCIE10(campo('DIAGNOSTICO')),
    emojiMicro + ' Microorganismo aislado: ' + campo('MICROORGANISMO'),
    emojiIndicacion + ' Indicación: ' + tipoIndicacion +
      ' · Cultivos: ' + campo('CULTIVOS') + ' · Origen: ' + campo('ORIGEN')
  ];
  if (indicacion === 'CAMBIO') {
    lineas.push(emojiCambio + ' Cambio de antimicrobiano: ' + capitalizar(campo('RAZON_CAMBIO')));
  }
  if (esSi(interconsulta)) {
    lineas.push(emojiInterconsulta + ' Interconsulta Infectología (Dinámica Gerencial): Sí');
  } else {
    lineas.push(emojiAdvertencia + ' Sin interconsulta a Infectología');
  }
  if (esSi(campo('AJUSTE_RENAL')) || esSi(campo('FALLA_HEPATICA'))) {
    var extras = [];
    if (esSi(campo('AJUSTE_RENAL'))) {
      var dep = numeroONulo(campo('DEP_CREATININA'));
      var texto = 'Ajuste renal: Sí' + ((dep !== null && dep > 0) ? ' (DepCr ' + formatoNumero(dep, 2) + ')' : ' (DepCr no registrada)');
      var sinAjuste = coincidencias.filter(function(am) {
        var regla = reglaDosisPara(am.nombre, reglas);
        return regla && regla.ajusteRenal === 'NO';
      }).map(function(am) { return am.nombre; });
      if (sinAjuste.length) texto += ' · ' + sinAjuste.join(', ') + ' no requiere ajuste renal';
      extras.push(texto);
    }
    if (esSi(campo('FALLA_HEPATICA'))) extras.push('Falla hepática: Sí');
    lineas.push(emojiRenal + ' ' + extras.join(' · '));
  }

  coincidencias.forEach(function(am, idx) {
    var ev = evaluarDosis(am.nombre, am.dosis, pesoKg, reglas);
    am.mgKg = ev.mgKg;
    lineas.push('', emojiMedicamento + ' Antimicrobiano restringido ' + (idx + 1) + ': ' + am.nombre,
      '   Dosis: ' + lineaEsquema(am),
      '   Días ordenados: ' + diasTexto(am.dias));
    if (ev.revisar) {
      lineas.push('   ' + emojiAdvertencia + ' Dosis fuera del rango de referencia (' + ev.referencia + '): revisar');
    }
  });

  acompanantes.forEach(function(am) {
    am.mgKg = (pesoKg !== null && numeroONulo(am.dosis) !== null) ? numeroONulo(am.dosis) / pesoKg : null;
    lineas.push('', emojiMas + ' Acompañante: ' + am.nombre + ' · ' + lineaEsquema(am) + ' · ' + diasTexto(am.dias));
  });

  var avisos = advertenciasCoherencia(pesoKg, campo('EDAD_ANIOS'), campo('EDAD_MESES'), coincidencias.concat(acompanantes));
  var sugerencia = sugerenciaPROA(tipoIndicacion, coincidencias, acompanantes);
  if (avisos.length || sugerencia) lineas.push('');
  avisos.forEach(function(av) { lineas.push(emojiAdvertencia + ' ' + av); });
  if (sugerencia) lineas.push(emojiIdea + ' ' + sugerencia);

  return lineas.join('\n');
}

/* =====================================================================
   Envio (solo al grupo configurado)
   ===================================================================== */
function enviarAlertaWhatsApp(mensaje) {
  var props = PropertiesService.getScriptProperties();
  var idInstance = props.getProperty('GREENAPI_ID_INSTANCE');
  var apiToken = props.getProperty('GREENAPI_API_TOKEN');
  var chatId = props.getProperty('GREENAPI_GROUP_CHATID');
  if (!idInstance || !apiToken || !chatId) {
    Logger.log('Faltan credenciales de Green-API en Propiedades del script.');
    return;
  }
  var firmaBot = props.getProperty('GREENAPI_BOT_LABEL') || 'Bot PROA Antimicrobianos HDV';
  var pieBot = '_Ecosistema de Vigilancia Digital del Servicio Farmacéutico HDV · Desarrollado por el QF Juan Pablo Saavedra_';
  var mensajeFirmado = '*' + firmaBot + '*' + '\n\n' + mensaje + '\n\n' + pieBot;
  var url = props.getProperty('GREENAPI_API_URL') + '/waInstance' + idInstance + '/sendMessage/' + apiToken;
  var payload = { chatId: chatId, message: mensajeFirmado };
  var options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true };
  try {
    var response = UrlFetchApp.fetch(url, options);
    var codigoRespuesta = response.getResponseCode();
    if (codigoRespuesta < 200 || codigoRespuesta >= 300) {
      Logger.log('Green-API respondio con error HTTP ' + codigoRespuesta + ': ' + response.getContentText());
    } else {
      Logger.log(response.getContentText());
    }
  } catch (err) {
    Logger.log('Error al enviar alerta por WhatsApp (Green-API): ' + err);
  }
}

function listarChatsGreenAPI() {
  var props = PropertiesService.getScriptProperties();
  var idInstance = props.getProperty('GREENAPI_ID_INSTANCE');
  var apiToken = props.getProperty('GREENAPI_API_TOKEN');
  var url = props.getProperty('GREENAPI_API_URL') + '/waInstance' + idInstance + '/getChats/' + apiToken;
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var chats = JSON.parse(response.getContentText());
  chats.forEach(function(c) {
    if (String(c.id).indexOf('@g.us') > -1) Logger.log((c.name || '(sin nombre)') + ' -> ' + c.id);
  });
}

function crearTriggerFormSubmit() {
  var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  ScriptApp.newTrigger('notificarNuevaRespuesta')
    .forSpreadsheet(hoja)
    .onFormSubmit()
    .create();
}

/* =====================================================================
   Verificacion de encabezados (solo lectura, no envia nada).
   Lee la fila 1 de la hoja de respuestas y comprueba que cada pregunta
   usada por el mensaje se encuentre con campoDelEvento().
   ===================================================================== */
function verificarEncabezados() {
  var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_RESPUESTAS);
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var simulado = {};
  encabezados.forEach(function(h) { if (String(h).trim()) simulado[String(h)] = ['x']; });
  var nombres = [];
  for (var k in CAMPOS) nombres.push(CAMPOS[k]);
  SLOTS.forEach(function(s) { nombres.push(s.nombre, s.dosis, s.via, s.frecuencia, s.dias); });
  var faltantes = [];
  nombres.forEach(function(n) {
    var ok = campoDelEvento(simulado, n) === 'x';
    Logger.log((ok ? '✅ ' : '❌ ') + n);
    if (!ok) faltantes.push(n);
  });
  Logger.log(faltantes.length ? 'FALTAN ' + faltantes.length + ' campo(s): revisar el formulario.' : 'Todos los campos del mensaje existen en la hoja (' + nombres.length + ').');
  return faltantes;
}

/* =====================================================================
   Datos de prueba (ficticios) y pruebas manuales
   ===================================================================== */
function eventoBase() {
  var nv = {};
  SLOTS.forEach(function(s) { nv[s.nombre] = ['']; nv[s.dosis] = ['']; nv[s.via] = ['']; nv[s.frecuencia] = ['']; nv[s.dias] = ['']; });
  for (var k in CAMPOS) nv[CAMPOS[k]] = [''];
  return nv;
}

function eventoPruebaLinezolid() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['99999999']; nv[CAMPOS.EDAD_ANIOS] = ['54']; nv[CAMPOS.PESO_KG] = ['70'];
  nv[CAMPOS.CAMA] = ['C13']; nv[CAMPOS.SERVICIO] = ['Unidad de Cuidado Crítico UCI C'];
  nv[CAMPOS.ESPECIALIDAD] = ['Medicina Interna'];
  nv[CAMPOS.DIAGNOSTICO] = ['A419 - Sepsis, no especificada'];
  nv[CAMPOS.MICROORGANISMO] = ['Staphylococcus aureus resistente a meticilina'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Etiológico (En presencia de aislamiento conocido)'];
  nv[CAMPOS.CULTIVOS] = ['HEMOCULTIVO']; nv[CAMPOS.ORIGEN] = ['IAAS']; nv[CAMPOS.INDICACION] = ['TERAPEUTICO'];
  nv[CAMPOS.INTERCONSULTA] = ['Sí']; nv[CAMPOS.AJUSTE_RENAL] = ['No']; nv[CAMPOS.FALLA_HEPATICA] = ['No'];
  nv['Nombre Antimicrobiano 1'] = ['LINEZOLID - UT-19907394-3']; nv['Dosis en miligramos o UI AB1'] = ['600'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['12']; nv['Días ordenados AM1'] = ['14'];
  nv['Nombre Antimicrobiano 2'] = ['MEROPENEM - UT-19973890-3']; nv['Dosis en miligramos o UI AM2'] = ['1000'];
  nv['Vía de adminsitración de  AM2'] = ['Intravenoso']; nv['Frecuencia AM 2 (En horas)'] = ['8']; nv['Días ordenados AM2'] = ['7'];
  return { namedValues: nv };
}

function eventoPruebaVancomicina() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['88888888']; nv[CAMPOS.EDAD_ANIOS] = ['63']; nv[CAMPOS.PESO_KG] = ['70'];
  nv[CAMPOS.SERVICIO] = ['Unidad de Cuidado Crítico UCI B']; nv[CAMPOS.ESPECIALIDAD] = ['Medicina Interna'];
  nv[CAMPOS.DIAGNOSTICO] = ['N39.0']; nv[CAMPOS.MICROORGANISMO] = ['Ninguno'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Empírico (En presencia o sospecha de infección sin germen documentado - sin antibiograma))'];
  nv[CAMPOS.CULTIVOS] = ['UROCULTIVO']; nv[CAMPOS.ORIGEN] = ['COMUNIDAD']; nv[CAMPOS.INDICACION] = ['CAMBIO'];
  nv[CAMPOS.RAZON_CAMBIO] = ['POR ANTIBIOGRAMA']; nv[CAMPOS.INTERCONSULTA] = ['No'];
  nv[CAMPOS.AJUSTE_RENAL] = ['Sí']; nv[CAMPOS.DEP_CREATININA] = ['18'];
  nv['Nombre Antimicrobiano 1'] = ['VANCOMICINA - UT-19993853-1']; nv['Dosis en miligramos o UI AB1'] = ['500'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['12']; nv['Días ordenados AM1'] = ['14'];
  return { namedValues: nv };
}

// Lactante con dosis unica y peso en gramos; prueba edad en meses, "Dosis unica" y mg/kg.
function eventoPruebaPediatrico() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['77777777']; nv[CAMPOS.EDAD_ANIOS] = ['0']; nv[CAMPOS.EDAD_MESES] = ['2']; nv[CAMPOS.PESO_KG] = ['0']; nv[CAMPOS.PESO_G] = ['4500'];
  nv[CAMPOS.CAMA] = ['208']; nv[CAMPOS.SERVICIO] = ['Hospitalización Pediatría']; nv[CAMPOS.ESPECIALIDAD] = ['Pediatria'];
  nv[CAMPOS.DIAGNOSTICO] = ['T857']; nv[CAMPOS.MICROORGANISMO] = ['Ninguno'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Empírico (En presencia o sospecha de infección sin germen documentado - sin antibiograma))'];
  nv[CAMPOS.CULTIVOS] = ['HEMOCULTIVO']; nv[CAMPOS.ORIGEN] = ['IAAS']; nv[CAMPOS.INDICACION] = ['TERAPEUTICO']; nv[CAMPOS.INTERCONSULTA] = ['Si'];
  nv['Nombre Antimicrobiano 1'] = ['VANCOMICINA - UT-19993853-1']; nv['Dosis en miligramos o UI AB1'] = ['60'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['Dosis única']; nv['Días ordenados AM1'] = ['Dosis Unica'];
  return { namedValues: nv };
}

function eventoPruebaSinRestringidos() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['11111111']; nv[CAMPOS.EDAD_MESES] = ['8']; nv[CAMPOS.PESO_KG] = ['8'];
  nv[CAMPOS.DIAGNOSTICO] = ['J189 - Neumonía']; nv[CAMPOS.MICROORGANISMO] = ['Ninguno'];
  nv[CAMPOS.ESPECIALIDAD] = ['Pediatría']; nv[CAMPOS.SERVICIO] = ['Hospitalización Pediatría']; nv[CAMPOS.INTERCONSULTA] = ['No'];
  nv['Nombre Antimicrobiano 1'] = ['CEFTRIAXONA - UT-19932457-2']; nv['Dosis en miligramos o UI AB1'] = ['1000'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['24']; nv['Días ordenados AM1'] = ['7'];
  return { namedValues: nv };
}

function testCruceCIE10() {
  ['A419', 'N390', 'J189', 'K528', 'G06.0', 'J40', 'CODIGO_INEXISTENTE_XYZ'].forEach(function(dx) {
    Logger.log(dx + ' -> ' + formatearDiagnosticoCIE10(dx));
  });
}

function testConstruccionMensaje() {
  [['Linezolid + meropenem (con interconsulta)', eventoPruebaLinezolid()],
   ['Vancomicina 500 mg, cambio, ajuste renal, sin interconsulta', eventoPruebaVancomicina()],
   ['Pediatrico, dosis unica, peso en gramos', eventoPruebaPediatrico()]].forEach(function(caso) {
    Logger.log('--- ' + caso[0] + ' ---');
    var coincidencias = filtrarAntimicrobianosRestringidos(caso[1]);
    Logger.log('Coincidencias: ' + JSON.stringify(coincidencias));
    Logger.log(construirMensajeDesdeEvento(caso[1], coincidencias));
  });
  Logger.log('--- Caso SIN antimicrobiano restringido (Ceftriaxona) ---');
  Logger.log('Coincidencias: ' + JSON.stringify(filtrarAntimicrobianosRestringidos(eventoPruebaSinRestringidos())) + ' (debe ser vacio, no se enviaria alerta)');
}

// SI envia un mensaje real al grupo configurado. Confirmar antes GREENAPI_GROUP_CHATID (PRUEBA BOT).
function enviarEjemploAlGrupo() {
  notificarNuevaRespuesta(eventoPruebaLinezolid());
}
