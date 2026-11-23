// test/dry-run.js
//
// Carga el Codigo.gs y el IA_PROA.gs REALES en Node con los servicios de Apps Script simulados
// (hoja con las pestanas ANTIMICROBIANOS_RESTRINGIDOS, CIE10 y RANGOS_DOSIS,
// CacheService, Utilities) y verifica el filtro, los mensajes y el informe semanal
// (con la API de la IA simulada). No hay red, credenciales ni envios.
//
// Uso: node test/dry-run.js

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var src = fs.readFileSync(path.join(__dirname, '..', 'Codigo.gs'), 'utf8');
var srcIa = fs.readFileSync(path.join(__dirname, '..', 'IA_PROA.gs'), 'utf8');

// ---- Hoja simulada --------------------------------------------------------
var CIE10 = { B377: 'CANDIDIASIS, NO ESPECIFICADA', A419: 'SEPSIS, NO ESPECIFICADA', N390: 'INFECCION DE VIAS URINARIAS, SITIO NO ESPECIFICADO',
  G060: 'ABSCESO Y GRANULOMA INTRACRANEAL', J40X: 'BRONQUITIS, NO ESPECIFICADA COMO AGUDA O CRONICA',
  T857: 'INFECCION Y REACCION INFLAMATORIA DEBIDAS A OTROS DISPOSITIVOS PROTESICOS, IMPLANTES E INJERTOS INTERNOS',
  // para el cruce por palabras: las de uso frecuente y algunas "trampa" (pielonefritis cronica, ACV, neutropenia neonatal)
  J189: 'NEUMONIA, NO ESPECIFICADA', J690: 'NEUMONITIS DEBIDA A ASPIRACION DE ALIMENTOS O VOMITO', G039: 'MENINGITIS, NO ESPECIFICADA',
  A399: 'INFECCION MENINGOCOCICA, NO ESPECIFICADA', P393: 'INFECCION NEONATAL DE LAS VIAS URINARIAS',
  O234: 'INFECCION NO ESPECIFICADA DE LAS VIAS URINARIAS EN EL EMBARAZO', N189: 'ENFERMEDAD RENAL CRONICA, NO ESPECIFICADA',
  L039: 'CELULITIS DE SITIO NO ESPECIFICADO', L031: 'CELULITIS DE OTRAS PARTES DE LOS MIEMBROS', R572: 'CHOQUE SEPTICO', R571: 'CHOQUE HIPOVOLEMICO',
  P615: 'NEUTROPENIA NEONATAL TRANSITORIA', T814: 'INFECCION CONSECUTIVA A PROCEDIMIENTO, NO CLASIFICADA EN OTRA PARTE',
  K659: 'PERITONITIS, NO ESPECIFICADA', N110: 'PIELONEFRITIS CRONICA NO OBSTRUCTIVA ASOCIADA CON REFLUJO',
  I64X: 'ACCIDENTE VASCULAR ENCEFALICO AGUDO, NO ESPECIFICADO COMO HEMORRAGICO O ISQUEMICO', K359: 'APENDICITIS AGUDA, NO ESPECIFICADA',
  K350: 'APENDICITIS AGUDA CON PERITONITIS GENERALIZADA', K830: 'COLANGITIS', K819: 'COLECISTITIS, NO ESPECIFICADA',
  // las que salieron mal en la primera prueba con la matriz real (2026-11-22)
  G009: 'MENINGITIS BACTERIANA, NO ESPECIFICADA', G008: 'OTRAS MENINGITIS BACTERIANAS', K658: 'OTRAS PERITONITIS', K818: 'OTRAS COLECISTITIS',
  M868: 'OTRAS OSTEOMIELITIS', M869: 'OSTEOMIELITIS, NO ESPECIFICADA', L982: 'DERMATOSIS NEUTROFILA FEBRIL [SWEET]', C300: 'TUMOR MALIGNO DE LA FOSA NASAL',
  C261: 'TUMOR MALIGNO DEL BAZO', D24X: 'TUMOR BENIGNO DE LA MAMA', C509: 'TUMOR MALIGNO DE LA MAMA, PARTE NO ESPECIFICADA',
  C919: 'LEUCEMIA LINFOIDE, SIN OTRA ESPECIFICACION', C917: 'OTRAS LEUCEMIAS LINFOIDES', R509: 'FIEBRE, NO ESPECIFICADA',
  J691: 'NEUMONITIS DEBIDA A ASPIRACION DE ACEITES Y ESENCIAS', L089: 'INFECCION LOCAL DE LA PIEL Y DEL TEJIDO SUBCUTANEO, NO ESPECIFICADA' };
var codigosCie = Object.keys(CIE10);

var ENCABEZADOS_REALES = ['Marca temporal', 'Dirección de correo electrónico', 'Nombre del médico que prescribe', 'Registro médico',
  'Especialidad que prescribe', 'Servicio actual', 'Número de Historia Clínica', 'Nombres y apellidos del paciente', 'EPS del paciente',
  'Edad del paciente en años', 'Edad del paciente meses', 'Edad del paciente días', 'Sexo', 'Peso en Kg', 'Peso en gr', 'Numero de cama',
  'Diagnóstico CIE10 para la cual se prescribe el antimicrobiano', 'Indicación del antibiótico', 'Infección nosocomial', 'Falla Hepática',
  'Ajuste Renal', 'Si en Ajuste Renal, marcó Sí, indique el valor de BUN en (mg/dl), si marcó "No" coloque 0',
  'Si en Ajuste Renal, marcó Sí, indique el valor de depuración de Creatinina en (mg/dl), si marcó "No" coloque 0',
  'Cultivos tomados:', 'Microorganismo aislado', 'Origen de la infección?', 'Indicación', 'Si fue cambiado, cual fue la razón?',
  '¿Solicitó interconsulta por infectología en Dinámica Gerencial?', 'Cuantos antimicrobianos formuló?',
  'Nombre Antimicrobiano 1', 'Dosis en miligramos o UI AB1', 'Vía de adminsitración de  AM1', 'Frecuencia AM 1 (En Horas)', 'Días ordenados AM1', 'TERMINACION ',
  'Nombre Antimicrobiano 2', 'Dosis en miligramos o UI AM2', 'Vía de adminsitración de  AM2', 'Frecuencia AM 2 (En horas)', 'Días ordenados AM2',
  'Nombre Antimicrobiano 3', 'Dosis en miligramos o UI AM3', 'Vía de adminsitración de  AM3', 'Frecuencia AM 3 (En horas)', 'Días ordenados AM 3',
  'Estado', 'Observacion a la solicitud'];

var RESTRINGIDOS = ['CEFTAZIDIMA / AVIBACTAM', 'ANFOTERICINA', 'AZTREONAM', 'ERTAPENEM', 'CASPOFUNGINA',
  'ANFOTERICINA B LIPOSOMAL', 'TYGECICLINA', 'DORIPENEM', 'RIFAMPICINA', 'POLIMIXINA B', 'DAPTOMICINA'];

var lecturasCie = 0;
function hojaDeFilas(filas, conTextFinder) {
  return {
    getLastRow: function () { return filas.length; },
    appendRow: function (fila) { filas.push(fila); },
    _filas: filas,
    getLastColumn: function () { return filas[0] ? filas[0].length : 0; },
    getRange: function (f, c, nf, nc) {
      nf = nf || 1; nc = nc || 1;
      var sub = filas.slice(f - 1, f - 1 + nf).map(function (r) { return r.slice(c - 1, c - 1 + nc); });
      return {
        getValues: function () { return sub; },
        getDisplayValues: function () { return sub.map(function (r) { return r.map(function (v) { return v === undefined || v === null ? '' : String(v); }); }); },
        setValues: function (vals) {
          vals.forEach(function (fila, i) {
            while (filas.length < f + i) filas.push([]);
            fila.forEach(function (v, j) { filas[f - 1 + i][c - 1 + j] = v; });
          });
          return this;
        },
        getValue: function () { return sub[0][0]; },
        setValue: function (v) { return this.setValues([[v]]); },
        createTextFinder: function (texto) {
          return { matchEntireCell: function () { return this; }, matchCase: function () { return this; },
            findAll: function () {
              var r = [];
              sub.forEach(function (fila, i) { if (String(fila[0]).toUpperCase() === String(texto).toUpperCase()) { (function (n) { r.push({ getRow: function () { return n; } }); })(f + i); } });
              return r;
            },
            findNext: function () {
              lecturasCie++;
              for (var i = 0; i < sub.length; i++) {
                if (String(sub[i][0]).toUpperCase() === String(texto).toUpperCase()) {
                  var fila = f + i;
                  return { getRow: function () { return fila; } };
                }
              }
              return null;
            } };
        }
      };
    }
  };
}
var HOJAS = {
  'Respuestas de formulario 1': hojaDeFilas([ENCABEZADOS_REALES]),
  'ANTIMICROBIANOS_RESTRINGIDOS': hojaDeFilas([['Antimicrobiano', 'dispara_alerta']].concat(RESTRINGIDOS.map(function (a) { return [a, 'SI']; })).concat([['VANCOMICINA', 'NO'], ['LINEZOLID', 'NO']])),
  'CIE10': hojaDeFilas([[' ', 'DESCRIPCION']].concat(codigosCie.map(function (c) { return [c, CIE10[c]]; }))),
  'RANGOS_DOSIS': null // no existe: debe usarse el respaldo del codigo
};
global.SpreadsheetApp = { openById: function () { return { getSheetByName: function (n) { return HOJAS[n] || null; },
  insertSheet: function (n) { HOJAS[n] = hojaDeFilas([]); return HOJAS[n]; } }; } };
var cache = {};
global.CacheService = { getScriptCache: function () { return { get: function (k) { return k in cache ? cache[k] : null; }, put: function (k, v) { cache[k] = v; } }; } };
global.Utilities = { formatDate: function (d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); } };
global.Logger = { log: function () {} };
global.UrlFetchApp = { fetch: function () { throw new Error('UrlFetchApp no debe llamarse en la prueba en seco'); } };
global.PropertiesService = { getScriptProperties: function () { return { getProperty: function () { return null; } }; } };

(0, eval)(src);
(0, eval)(srcIa);

var fallos = 0;
// En produccion el caso PROA va solo con datos (CONFIG.CASO_ANALISIS = false; tiene su propia prueba). Las demas
// pruebas revisan tambien el analisis de pertinencia dentro del mensaje, asi que aqui se activa.
var CASO_ANALISIS_PRODUCCION = CONFIG.CASO_ANALISIS;
CONFIG.CASO_ANALISIS = true;
function prueba(desc, fn) {
  limpiarCacheEjecucion();
  try { fn(); console.log('OK - ' + desc); } catch (e) { fallos++; console.log('FALLO - ' + desc + '\n   ' + e.message); }
}
function incluye(texto, parte) { assert.ok(texto.indexOf(parte) > -1, 'falta "' + parte + '" en:\n' + texto); }
function noIncluye(texto, parte) { assert.ok(texto.indexOf(parte) === -1, 'no deberia aparecer "' + parte + '" en:\n' + texto); }

prueba('verificarEncabezados: los campos del mensaje existen en la fila 1 real', function () {
  assert.deepStrictEqual(verificarEncabezados(), []);
});

prueba('campoDelEvento tolera espacios sobrantes en el titulo de la pregunta', function () {
  assert.strictEqual(campoDelEvento({ '  Servicio actual ': ['Urgencias'] }, 'Servicio actual'), 'Urgencias');
  assert.strictEqual(campoDelEvento({ 'Servicio actual': [''] }, 'Servicio actual'), '');
  assert.strictEqual(campoDelEvento({}, 'Servicio actual'), '');
});

prueba('filtro: restringidos si, no restringidos no', function () {
  assert.strictEqual(filtrarAntimicrobianosRestringidos(eventoPruebaDaptomicina()).length, 1);
  assert.strictEqual(filtrarAntimicrobianosRestringidos(eventoPruebaSinRestringidos()).length, 0);
  ['VANCOMICINA - UT-19993853-1', 'LINEZOLID - UT-19907394-3'].forEach(function (n) { // sin alerta propia desde 2026-11-02
    var nv = eventoBase(); nv['Nombre Antimicrobiano 1'] = [n];
    var c = filtrarAntimicrobianosRestringidos({ namedValues: nv });
    assert.strictEqual(c.length, 1, n + ' sigue siendo restringido');
    assert.strictEqual(c[0].dispara, false, n + ' no dispara');
    assert.strictEqual(debeAlertar(c), false, n + ' solo no debe alertar');
  });
  assert.strictEqual(debeAlertar(filtrarAntimicrobianosRestringidos(eventoPruebaDaptomicina())), true);
  assert.strictEqual(debeAlertar(filtrarAntimicrobianosRestringidos(eventoPruebaVancomicinaSola())), false);
  // hoja sin columna B y sin vancomicina: el CONFIG la agrega como "sin alerta propia"
  var original = HOJAS['ANTIMICROBIANOS_RESTRINGIDOS'];
  HOJAS['ANTIMICROBIANOS_RESTRINGIDOS'] = hojaDeFilas([['Antimicrobiano']].concat(RESTRINGIDOS.map(function (a) { return [a]; })));
  limpiarCacheEjecucion();   // otra ejecucion con la pestana cambiada
  var cv = filtrarAntimicrobianosRestringidos(eventoPruebaVancomicinaSola());
  assert.strictEqual(cv.length, 1); assert.strictEqual(cv[0].dispara, false);
  HOJAS['ANTIMICROBIANOS_RESTRINGIDOS'] = original;
  limpiarCacheEjecucion();
  ['CASPOFUNGINA 50, 70 - UT-1', 'ANFOTERICINA B LIPOSOMAL - UT-1', 'TYGECICLINA - UT-1', 'DORIPENEM - UT-1', 'RIFAMPICINA - UT-1',
    'POLIMIXINA B - UT-1', 'DAPTOMICINA - UT-1'].forEach(function (n) {
    var nv = eventoBase(); nv['Nombre Antimicrobiano 1'] = [n];
    assert.strictEqual(filtrarAntimicrobianosRestringidos({ namedValues: nv }).length, 1, n);
  });
});

prueba('nombre del antimicrobiano sin la presentacion del formulario', function () {
  [['CIPROFLOXACINO AMPOLLA 100, 200 - UT-1', 'CIPROFLOXACINO'], ['CIPROFLOXACINO TABLETA - UT-1', 'CIPROFLOXACINO'],
   ['CASPOFUNGINA 50, 70 - UT-19974012-1', 'CASPOFUNGINA'], ['TRIMETOPRIM SULFAMETOXAZOL 160/800 - UT-1', 'TRIMETOPRIM SULFAMETOXAZOL'],
   ['ANFOTERICINA B - UT-1', 'ANFOTERICINA B'], ['ANFOTERICINA B LIPOSOMAL - UT-1', 'ANFOTERICINA B LIPOSOMAL'], ['POLIMIXINA B - UT-1', 'POLIMIXINA B'],
   ['CEFTAZIDIMA / AVIBACTAM - UT-1', 'CEFTAZIDIMA / AVIBACTAM'], ['PIPERACILINA / TAZOBACTAM - UT-1', 'PIPERACILINA / TAZOBACTAM'], ['', '-']]
    .forEach(function (x) { assert.strictEqual(nombreLimpio(x[0]), x[1], x[0]); });
  // la ampolla y la tableta del mismo medicamento se suman juntas en el seguimiento
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  filas.push(filaMatriz('05/11/2026 08:00:00', '888020', [['CIPROFLOXACINO AMPOLLA 100, 200', '400', '12', '5']]));
  filas.push(filaMatriz('10/11/2026 08:00:00', '888020', [['CIPROFLOXACINO TABLETA', '500', '12', '5']]));
  var t = seguimientoPaciente(eventoSeguimiento('15/11/2026 10:00:00', '888020', 'N390', [['CEFEPIME', '2000', '8', '7']])).lineas.join('\n');
  incluye(t, '🔁 Antes de esta orden: CIPROFLOXACINO 05/11/2026-15/11/2026 · *10 d*'); noIncluye(t, 'Por antimicrobiano'); noIncluye(t, 'AMPOLLA'); noIncluye(t, 'TABLETA');
});

prueba('CIE10: punto, 3 caracteres (+X), minusculas, sin codigo y cache', function () {
  assert.strictEqual(formatearDiagnosticoCIE10('G06.0'), 'G060 - ' + CIE10.G060);
  assert.strictEqual(formatearDiagnosticoCIE10('M46.3:'), 'M46.3:'); // no esta en el catalogo simulado
  assert.strictEqual(formatearDiagnosticoCIE10('J40'), 'J40X - ' + CIE10.J40X);
  assert.strictEqual(formatearDiagnosticoCIE10('a419 sepsis'), 'A419 - ' + CIE10.A419);
  assert.strictEqual(formatearDiagnosticoCIE10('SX FEBRIL EN ESTUDIO'), 'R509 - ' + CIE10.R509 + ' (escrito: SX FEBRIL EN ESTUDIO)');   // equivalencia fija
  assert.strictEqual(formatearDiagnosticoCIE10('419'), '419');
  var antes = lecturasCie;
  formatearDiagnosticoCIE10('G06.0'); formatearDiagnosticoCIE10('G060');
  assert.strictEqual(lecturasCie, antes, 'la segunda consulta del mismo codigo debe salir de cache');
});

prueba('edad, peso, frecuencia y dias', function () {
  assert.strictEqual(edadTexto('2', '3', ''), '2 años 3 meses');
  assert.strictEqual(edadTexto('0', '2', ''), '2 meses');
  assert.strictEqual(edadTexto('', '', '16'), '16 días');
  assert.strictEqual(edadTexto('54', '', ''), '54 años');
  assert.strictEqual(edadTexto('', '', ''), '-');
  assert.strictEqual(pesoKgDesde('0', '4500'), 4.5);
  assert.strictEqual(pesoKgDesde('70', ''), 70);
  assert.strictEqual(pesoKgDesde('', ''), null);
  assert.strictEqual(frecuenciaTexto('12'), 'cada 12 horas');
  assert.strictEqual(frecuenciaTexto('48HORAS'), 'cada 48 horas');
  assert.strictEqual(frecuenciaTexto('72 HORAS'), 'cada 72 horas');
  assert.strictEqual(frecuenciaTexto('Cada 72 h'), 'cada 72 horas');
  assert.strictEqual(frecuenciaTexto('Dosis única'), 'Dosis única');
  assert.strictEqual(frecuenciaTexto(''), '-');
  assert.ok(/^14 días · hasta \d\d\/\d\d\/\d{4}$/.test(diasTexto('14')), diasTexto('14'));
  assert.strictEqual(diasTexto('Dosis Unica'), 'Dosis Unica');
  assert.strictEqual(diasTexto(''), '-');
});

prueba('rangos de dosis: acepta si cumple alguna regla, marca si falla en todas', function () {
  var reglas = obtenerRangosDosis(); // respaldo (la pestana no existe en la simulacion)
  assert.strictEqual(evaluarDosis('VANCOMICINA', '1000', 70, reglas).revisar, false);
  assert.strictEqual(evaluarDosis('VANCOMICINA', '500', 70, reglas).revisar, true);  // 7,1 mg/kg
  assert.strictEqual(evaluarDosis('VANCOMICINA', '10000', 1, reglas).revisar, true);
  assert.strictEqual(evaluarDosis('VANCOMICINA', '1000', null, reglas).revisar, false); // sin peso, sin regla absoluta: no marca
  assert.strictEqual(evaluarDosis('LINEZOLID', '600', 100, reglas).revisar, false); // 6 mg/kg pero 600 mg absolutos OK
  assert.strictEqual(evaluarDosis('LINEZOLID', '300', 70, reglas).revisar, true);
  assert.strictEqual(evaluarDosis('CASPOFUNGINA 50, 70', '50', 70, reglas).revisar, false);
  assert.strictEqual(evaluarDosis('CASPOFUNGINA 50, 70', '27', 7.5, reglas).revisar, false); // lactante: 3,6 mg/kg (50-70 mg/m2)
  assert.strictEqual(evaluarDosis('CASPOFUNGINA 50, 70', '300', 70, reglas).revisar, true); // 300 mg y 4,3 mg/kg: falla en ambas
  assert.strictEqual(evaluarDosis('ANFOTERICINA B LIPOSOMAL', '200', 50, reglas).revisar, false); // 4 mg/kg (regla liposomal, no la convencional)
  assert.strictEqual(evaluarDosis('ANFOTERICINA B', '200', 50, reglas).revisar, true);           // 4 mg/kg de deoxicolato
  assert.strictEqual(evaluarDosis('VANCOMICINA', '2100', 70, reglas).revisar, false);           // 30 mg/kg: carga dentro de 10-35
  assert.strictEqual(evaluarDosis('CEFTAZIDIMA / AVIBACTAM', '940', 70, reglas).revisar, false); // minima dosis renal autorizada
  assert.strictEqual(evaluarDosis('TYGECICLINA', '36', 30, reglas).revisar, false);              // nino 8-11 a: 1,2 mg/kg
  assert.strictEqual(evaluarDosis('TYGECICLINA', '25', 70, reglas).revisar, false);              // Child-Pugh C
  assert.strictEqual(evaluarDosis('ANFOTERICINA B', '17.5', 70, reglas).revisar, false);         // 0,25 mg/kg inicio
  assert.strictEqual(reglaDosisPara('VANCOMICINA', reglas).ajusteRenal, 'SI');
  assert.strictEqual(reglaDosisPara('LINEZOLID', reglas).ajusteRenal, 'NO');
  assert.ok(reglas.every(function (r) { return r.nota.length > 20; }), 'toda fila debe traer su fuente en la nota');
  assert.strictEqual(evaluarDosis('POLIMIXINA B', '500000', 70, reglas).revisar, false);         // sin rango
  assert.strictEqual(evaluarDosis('MEROPENEM', '1000', 70, reglas).revisar, false);              // sin regla
  assert.strictEqual(evaluarDosis('VANCOMICINA', '', 70, reglas).revisar, false);
  var ev = evaluarDosis('VANCOMICINA', '500', 70, reglas);
  assert.strictEqual(ev.referencia, '10-35 mg/kg/dosis');
});

prueba('mensaje: daptomicina con interconsulta, meropenem como acompanante, fecha fin', function () {
  var e = eventoPruebaDaptomicina();
  var t = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(t, '· 54 años · 70 kg');
  incluye(t, 'Unidad de Cuidado Crítico UCI C · Cama C13');
  incluye(t, 'A419 · Sepsis, no especificada');
  incluye(t, '· HEMOCULTIVO · Etiológico · IAAS');
  incluye(t, 'Interconsulta a Infectología: Sí');
  noIncluye(t, 'Sin interconsulta');
  noIncluye(t, 'Cambio de antimicrobiano');
  noIncluye(t, 'Ajuste renal');
  incluye(t, '💊 DAPTOMICINA');
  incluye(t, '420 mg (6 mg/kg) IV c/24 h');
  assert.ok(/· \*14 d\* hasta \d\d\/\d\d(\n| )/.test(t) && !/hasta \d\d\/\d\d\/\d{4}/.test(t), t);
  noIncluye(t, 'fuera del rango');
  incluye(t, '➕ MEROPENEM 1000 mg (14,3 mg/kg) IV c/8 h · *7 d* hasta');
  assert.strictEqual(t.split('💊').length - 1, 1, 'un solo restringido');
});

prueba('mensaje: ceftazidima/avibactam 750 mg, cambio, ajuste renal, sin interconsulta, N39.0', function () {
  var e = eventoPruebaCeftazidimaAvibactam();
  var t = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(t, 'N390 · Infeccion de vias urinarias');
  incluye(t, '· UROCULTIVO · Empírico · IAAS');
  incluye(t, '🔄 Cambio: Por antibiograma');
  incluye(t, '⚠️ Sin interconsulta a Infectología');
  incluye(t, '💧 Ajuste renal: Sí');
  noIncluye(t, 'no requiere ajuste renal');
  incluye(t, '750 mg (10,7 mg/kg) IV c/12 h');
  incluye(t, '⚠️ Dosis fuera del rango de referencia (940-2500 mg/dosis o 30-65 mg/kg/dosis)');
  noIncluye(t, 'Acompañante');
});

prueba('vancomicina en 2.o lugar con ceftazidima/avibactam: se muestra como restringida, no como acompanante', function () {
  var nv = eventoPruebaCeftazidimaAvibactam().namedValues;
  nv['Nombre Antimicrobiano 2'] = ['VANCOMICINA - UT-19993853-1']; nv['Dosis en miligramos o UI AM2'] = ['500'];
  nv['Vía de adminsitración de  AM2'] = ['Intravenoso']; nv['Frecuencia AM 2 (En horas)'] = ['12']; nv['Días ordenados AM2'] = ['14'];
  var c = filtrarAntimicrobianosRestringidos({ namedValues: nv });
  assert.strictEqual(c.length, 2); assert.strictEqual(debeAlertar(c), true);
  var t = construirMensajeDesdeEvento({ namedValues: nv }, c);
  incluye(t, '💊 CEFTAZIDIMA / AVIBACTAM');
  incluye(t, '💊 VANCOMICINA');
  incluye(t, 'VANCOMICINA 500 mg (7,1 mg/kg) IV c/12 h');
  incluye(t, '(10-35 mg/kg/dosis)');
  noIncluye(t, 'Acompañante: VANCOMICINA');
  // vancomicina sola: ni mensaje ni envio
  var sola = eventoPruebaVancomicinaSola();
  assert.strictEqual(debeAlertar(filtrarAntimicrobianosRestringidos(sola)), false);
});

prueba('mensaje: pediatrico con peso en gramos, caspofungina en dosis unica', function () {
  var e = eventoPruebaPediatrico();
  var t = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(t, '· 4 meses · 7,5 kg');
  incluye(t, 'Hospitalización Pediatría · Cama 208');
  incluye(t, 'B377 · Candidiasis, no especificada');
  incluye(t, '27 mg (3,6 mg/kg) IV Dosis única');
  incluye(t, 'Dosis Unica');
  noIncluye(t, 'cada Dosis');
  noIncluye(t, 'fuera del rango');
  noIncluye(t, 'Verificar');
});

prueba('sugerencia PROA: empirico combinado, empirico solo, etiologico sin sugerencia', function () {
  var e = eventoPruebaCeftazidimaAvibactam(); // empirico, sin acompanante: por defecto no hay sugerencia
  noIncluye(construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e)), 'Sugerencia PROA');
  CONFIG.SUGERENCIA_EMPIRICO_SOLO = true;
  incluye(construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e)), '💡 Sugerencia PROA: terapia empírica. Revaluar a las 48-72 h con el resultado de cultivos.');
  CONFIG.SUGERENCIA_EMPIRICO_SOLO = false;
  // caspofungina empirica + meropenem (sepsis): combinacion a revaluar
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['55555555']; nv[CAMPOS.EDAD_ANIOS] = ['48']; nv[CAMPOS.PESO_KG] = ['80'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Empírico (En presencia o sospecha de infección sin germen documentado - sin antibiograma))'];
  nv['Nombre Antimicrobiano 1'] = ['CASPOFUNGINA 50, 70 - UT-19974012-1']; nv['Dosis en miligramos o UI AB1'] = ['70'];
  nv['Nombre Antimicrobiano 2'] = ['MEROPENEM - UT-19973890-3']; nv['Dosis en miligramos o UI AM2'] = ['1000'];
  nv['Vía de adminsitración de  AM2'] = ['Intravenoso']; nv['Frecuencia AM 2 (En horas)'] = ['8']; nv['Días ordenados AM2'] = ['7'];
  incluye(construirMensajeDesdeEvento({ namedValues: nv }), '💡 Sugerencia PROA: terapia empírica combinada (CASPOFUNGINA + MEROPENEM). Revaluar a las 48-72 h con el resultado de cultivos para desescalar.');
  var e3 = eventoPruebaDaptomicina(); // etiologico con meropenem
  noIncluye(construirMensajeDesdeEvento(e3, filtrarAntimicrobianosRestringidos(e3)), 'Sugerencia PROA');
});

prueba('coherencia: peso implausible, peso vs edad, dosis/kg absurda; ajuste renal informado', function () {
  var nv = eventoPruebaCeftazidimaAvibactam().namedValues; nv[CAMPOS.PESO_KG] = ['1']; nv['Dosis en miligramos o UI AB1'] = ['2500'];
  var t = construirMensajeDesdeEvento({ namedValues: nv });
  incluye(t, '⚠️ Verificar peso: 1 kg no es coherente con 63 años');
  incluye(t, '⚠️ Verificar dosis o peso: CEFTAZIDIMA / AVIBACTAM 2500 mg equivalen a 2500 mg/kg');
  nv = eventoPruebaCeftazidimaAvibactam().namedValues; nv[CAMPOS.PESO_KG] = ['700'];
  incluye(construirMensajeDesdeEvento({ namedValues: nv }), '⚠️ Verificar peso: 700 kg no es un valor plausible');
  nv = eventoPruebaPediatrico().namedValues; nv[CAMPOS.PESO_KG] = ['45']; nv[CAMPOS.PESO_G] = [''];
  incluye(construirMensajeDesdeEvento({ namedValues: nv }), '⚠️ Verificar peso: 45 kg no es coherente con 4 meses');
  var ok = eventoPruebaDaptomicina();
  noIncluye(construirMensajeDesdeEvento(ok, filtrarAntimicrobianosRestringidos(ok)), 'Verificar');
  // ajuste renal marcado Si con caspofungina (no requiere ajuste renal)
  nv = eventoPruebaPediatrico().namedValues; nv[CAMPOS.AJUSTE_RENAL] = ['Sí']; nv[CAMPOS.DEP_CREATININA] = ['25'];
  incluye(construirMensajeDesdeEvento({ namedValues: nv }), '💧 Ajuste renal: Sí · CASPOFUNGINA no requiere ajuste renal');
  var v = eventoPruebaCeftazidimaAvibactam(); // requiere ajuste renal: sin coletilla
  noIncluye(construirMensajeDesdeEvento(v, filtrarAntimicrobianosRestringidos(v)), 'no requiere ajuste renal');
});

prueba('pertinencia: sindrome por CIE10 y por texto libre', function () {
  var tabla = obtenerPertinencia(); // respaldo (la pestana no existe en la simulacion)
  function clave(dx) { var s = sindromePara(dx, tabla); return s ? s.clave : null; }
  assert.strictEqual(clave('N390'), 'ITU');
  assert.strictEqual(clave('N39.0'), 'ITU');
  assert.strictEqual(clave('A419 sepsis'), 'BACTERIEMIA');
  assert.strictEqual(clave('J22X'), 'NEUMONIA');
  assert.strictEqual(clave('B377'), 'CANDIDEMIA');
  assert.strictEqual(clave('SEPSIS URINARIA'), 'ITU');                 // gana la palabra mas larga
  assert.strictEqual(clave('SEPSIS DE PIEL Y TEJIDOS BLANDOS'), 'PIEL');
  assert.strictEqual(clave('BACTEREMIA'), 'BACTERIEMIA');
  assert.strictEqual(clave('Infección vías urinarias complicada'), 'ITU');
  assert.strictEqual(clave('INFECCIÓN CEREBRAL POR CRYPTOCOCCUS NEOFORMANS'), 'CRIPTOCOCOSIS');
  assert.strictEqual(clave('RABDOMIOSARCOMA-NEUTROPENIA FEBRIL'), 'NEUTROPENIA');
  assert.strictEqual(clave('C169'), null);
  assert.strictEqual(clave('INSTITUTO'), null);                        // "ITU" solo como palabra completa
  assert.strictEqual(clave(''), null);
});

prueba('pertinencia: veredicto de dias (referencia, exceso, doble, profilaxis)', function () {
  var am = function (n, d) { return { nombre: n, dias: d }; };
  var l = evaluarPertinencia('N390', 'Empírico', 'E. coli BLEE', [am('ERTAPENEM', '14')]).join('\n');
  incluye(l, '🔴 *Se sugiere revaluar*');
  incluye(l, '📏 Infección urinaria complicada / pielonefritis: 5-7 d (IDSA 2025 ITU complicada; ACIN Infectio 2023)');
  incluye(l, '🔴 ERTAPENEM 14 d: supera la referencia; revaluar duración'); noIncluye(l, 'fluoroquinolona');   // el doble: rojo, sin la nota
  l = evaluarPertinencia('N390', 'Empírico', 'E. coli BLEE', [am('ERTAPENEM', '10')]).join('\n');
  incluye(l, '🟡 *Se sugiere verificar*'); incluye(l, '🟡 ERTAPENEM 10 d: supera la referencia; revaluar duración · 7 d si no es fluoroquinolona');   // amarillo: con la nota
  l = evaluarPertinencia('N390', 'Empírico', 'E. coli BLEE', [am('ERTAPENEM', '7')]).join('\n');
  incluye(l, '🟢 *Acorde con la referencia*');
  incluye(l, '🟢 ERTAPENEM: indicado para el aislamiento registrado');
  incluye(l, '🟢 ERTAPENEM 7 d: dentro de la referencia'); noIncluye(l, 'supera');
  l = evaluarPertinencia('M869', 'Etiológico', 'S. aureus', [am('DAPTOMICINA', '14')]).join('\n');
  incluye(l, 'Osteomielitis / espondilodiscitis: 42 d'); noIncluye(l, 'supera');   // por debajo del minimo no se marca
  l = evaluarPertinencia('D70X', 'Empírico', 'Ninguno', [am('CASPOFUNGINA 50, 70', '14')]).join('\n');
  incluye(l, '📏 Neutropenia febril: sin foco'); noIncluye(l, 'supera'); noIncluye(l, 'dentro de la referencia');
  incluye(l, '🟢 CASPOFUNGINA 50, 70: indicado para el foco; sin aislamiento, revaluar con cultivos');
  l = evaluarPertinencia('C169', 'Empírico', 'Ninguno', [am('MEROPENEM', '14')]);
  assert.strictEqual(l.length, 0, 'sin sindrome ni antimicrobiano con ficha: sin lineas');
  l = evaluarPertinencia('S720', 'Profiláctico', 'Ninguno', [am('ERTAPENEM', '5')]).join('\n');
  incluye(l, '🔴 ERTAPENEM 5 d: supera las 24 h de la profilaxis; revaluar');
  incluye(l, 'Profilaxis quirúrgica: máximo 24 h (OMS 2018; CDC 2017)');
  l = evaluarPertinencia('N390', 'Empírico', 'Ninguno', [am('ERTAPENEM', 'Dosis Unica')]).join('\n');
  noIncluye(l, 'dentro de la referencia'); noIncluye(l, 'supera');
});

prueba('pertinencia: veredicto de tratamiento (fichas y reglas de espectro)', function () {
  var am = function (n) { return { nombre: n, dias: '7' }; };
  function ev(dx, tipo, micro, ams) { return evaluarPertinencia(dx, tipo, micro, ams.map(am)).join('\n'); }
  incluye(ev('J189', 'Etiológico', 'SAMR', ['DAPTOMICINA']), '🔴 DAPTOMICINA: DAPTOMICINA no está indicada en neumonía');
  incluye(ev('A419', 'Etiológico', 'SAMR', ['DAPTOMICINA']), '🟢 DAPTOMICINA: indicado');
  incluye(ev('A419', 'Etiológico', 'Klebsiella KPC', ['TYGECICLINA']), '🔴 TYGECICLINA: TIGECICLINA');
  incluye(ev('N390', 'Etiológico', 'Klebsiella KPC', ['TYGECICLINA']), 'TIGECICLINA no se sugiere en bacteriemia ni en infección urinaria (IDSA 2026)');
  incluye(ev('N390', 'Etiológico', 'CANDIDA AURIS', ['CASPOFUNGINA 50, 70']), 'indicado');   // sin dato de cultivos no aplica la regla de orina
  incluye(ev('N390', 'Etiológico', 'Pseudomonas aeruginosa', ['ERTAPENEM']), 'ERTAPENEM no tiene actividad frente a Pseudomonas');
  noIncluye(ev('N390', 'Etiológico', 'E. coli BLEE', ['ERTAPENEM']), 'se sugiere revaluar ·');
  incluye(ev('G060', 'Etiológico', 'Cryptococcus neoformans', ['CASPOFUNGINA 50, 70']), 'CASPOFUNGINA no tiene actividad frente a Cryptococcus');
  incluye(ev('B377', 'Etiológico', 'Candida auris', ['CASPOFUNGINA 50, 70']), '🟢 CASPOFUNGINA 50, 70: indicado');
  incluye(ev('A419', 'Etiológico', 'Klebsiella NDM', ['CEFTAZIDIMA / AVIBACTAM']), 'asociar aztreonam');
  var combo = ev('A419', 'Etiológico', 'Klebsiella NDM', ['CEFTAZIDIMA / AVIBACTAM', 'AZTREONAM']);
  noIncluye(combo, 'asociar aztreonam'); incluye(combo, '🟢 AZTREONAM: combinación indicada');
  incluye(ev('A419', 'Etiológico', 'Klebsiella KPC', ['CEFTAZIDIMA / AVIBACTAM']), '🟢 CEFTAZIDIMA / AVIBACTAM: indicado');
  // empirica de la comunidad, sin aislamiento: reservada para carbapenemasa documentada
  incluye(ev('J189', 'Empírico', 'Ninguno', ['CEFTAZIDIMA / AVIBACTAM']), '🟡 CEFTAZIDIMA / AVIBACTAM: sin aislamiento ni foco que lo sustente; reservado para enterobacterias con carbapenemasa');
  incluye(ev('N390', 'Etiológico', 'E. coli sensible', ['CEFTAZIDIMA / AVIBACTAM']), '🟡 CEFTAZIDIMA / AVIBACTAM: el aislamiento registrado no lo justifica');
  incluye(ev('A419', 'Etiológico', 'Serratia marcescens', ['POLIMIXINA B']), 'intrínsecamente resistentes');
  incluye(ev('N390', 'Etiológico', 'Echerichia coli', ['VANCOMICINA']), 'VANCOMICINA no tiene actividad frente a gramnegativos');
  noIncluye(ev('N390', 'Etiológico', 'Echerichia coli', ['VANCOMICINA', 'MEROPENEM']), 'gramnegativos'); // hay otro que cubre
  incluye(ev('M869', 'Etiológico', 'S. aureus', ['RIFAMPICINA']), 'RIFAMPICINA no debe usarse en monoterapia');
  noIncluye(ev('A150', 'Etiológico', 'M. tuberculosis', ['RIFAMPICINA']), 'monoterapia');
  noIncluye(ev('M869', 'Etiológico', 'S. aureus', ['RIFAMPICINA', 'VANCOMICINA']), 'monoterapia');
  incluye(ev('A419', 'Etiológico', 'NINUGNO', ['ERTAPENEM']), '🟡 Indicación etiológica sin microorganismo registrado');
  incluye(ev('A419', 'Etiológico', '0', ['ERTAPENEM']), 'sin microorganismo registrado');
  noIncluye(ev('A419', 'Empírico', 'Ninguno', ['ERTAPENEM']), 'sin microorganismo');
  incluye(ev('S720', 'Profiláctico', 'Ninguno', ['ERTAPENEM']), '🟡 ERTAPENEM: restringido usado en profilaxis');
  CONFIG.PERTINENCIA_ACTIVA = false;
  assert.strictEqual(evaluarPertinencia('N390', 'Empírico', '', [{ nombre: 'ERTAPENEM', dias: '14' }]).length, 0);
  CONFIG.PERTINENCIA_ACTIVA = true;
});

prueba('pertinencia en el mensaje completo (ceftazidima/avibactam 14 d en ITU por KPC)', function () {
  var e = eventoPruebaCeftazidimaAvibactam();
  var t = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(t, '🔴 *Se sugiere revaluar*');
  incluye(t, '🟢 CEFTAZIDIMA / AVIBACTAM: indicado para el aislamiento registrado');
  incluye(t, '🔴 CEFTAZIDIMA / AVIBACTAM 14 d: supera la referencia; revaluar duración');
  noIncluye(t, 'undefined');
});

prueba('mensaje: campos ausentes salen como "-" y nunca como undefined', function () {
  var nv = eventoBase(); nv['Nombre Antimicrobiano 1'] = ['ERTAPENEM - UT-1'];
  var t = construirMensajeDesdeEvento({ namedValues: nv });
  noIncluye(t, 'undefined'); noIncluye(t, 'NaN');
  incluye(t, 'HC -');
  incluye(t, 'HC - · - · -');
  incluye(t, '💊 ERTAPENEM - - -');
  incluye(t, '· -');
  incluye(t, '⚠️ Sin interconsulta a Infectología');
});

// ---- Seguimiento, registro, huecos de las tablas y calidad de datos ----------
function filaMatriz(fecha, hc, ams) {
  var fila = ENCABEZADOS_REALES.map(function () { return ''; });
  var poner = function (enc, v) { fila[ENCABEZADOS_REALES.indexOf(enc)] = v; };
  poner('Marca temporal', fecha); poner('Número de Historia Clínica', hc);
  ams.forEach(function (am, i) {
    var sl = SLOTS[i];
    poner(sl.nombre, am[0] + ' - UT-1'); poner(sl.dosis, am[1]); poner(sl.frecuencia, am[2]); poner(sl.dias, am[3]);
  });
  return fila;
}
function eventoSeguimiento(fecha, hc, dx, ams) {
  var nv = eventoBase(); nv['Marca temporal'] = [fecha]; nv[CAMPOS.HC] = [hc]; nv[CAMPOS.DIAGNOSTICO] = [dx];
  nv[CAMPOS.EDAD_ANIOS] = ['60']; nv[CAMPOS.PESO_KG] = ['70']; nv[CAMPOS.MICROORGANISMO] = ['Ninguno']; nv[CAMPOS.CULTIVOS] = ['NINGUNO'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Empírico (En presencia o sospecha de infección sin germen documentado - sin antibiograma))'];
  ams.forEach(function (am, i) {
    var sl = SLOTS[i];
    nv[sl.nombre] = [am[0] + ' - UT-1']; nv[sl.dosis] = [am[1]]; nv[sl.via] = ['Intravenoso']; nv[sl.frecuencia] = [am[2]]; nv[sl.dias] = [am[3]];
  });
  return { namedValues: nv };
}

prueba('seguimiento: curso acumulado, solicitud repetida, otros previos y dias valorados sobre el curso completo', function () {
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  filas.push(filaMatriz('01/11/2026 08:00:00', '123456', [['ERTAPENEM', '1000', '24', '7'], ['VANCOMICINA', '1000', '12', '5']]));
  filas.push(filaMatriz('08/11/2026 08:00:00', '123456', [['ERTAPENEM', '1000', '24', '7']]));
  filas.push(filaMatriz('14/11/2026 06:00:00', '123456', [['ERTAPENEM', '500', '24', '3']]));
  filas.push(filaMatriz('10/11/2026 08:00:00', '999000', [['ERTAPENEM', '1000', '24', '7']]));   // otro paciente
  filas.push(filaMatriz('01/08/2026 08:00:00', '123456', [['DAPTOMICINA', '500', '24', '7']]));    // fuera de la ventana
  filas.push(filaMatriz('14/11/2026 08:00:00', '123456', [['ERTAPENEM', '1000', '24', '7']]));    // la solicitud actual
  var e = eventoSeguimiento('14/11/2026 08:00:00', '123456', 'N390', [['ERTAPENEM', '1000', '24', '7']]);
  var seg = seguimientoPaciente(e);
  assert.strictEqual(seg.previas, 3);
  var t = seg.lineas.join('\n');
  incluye(t, '⚠️ ERTAPENEM: también solicitado hace 2 h (500 mg cada 24 h, 3 d); posible solicitud repetida');
  incluye(t, '🔁 Antes de esta orden:\n1. ERTAPENEM + VANCOMICINA 01/11/2026-08/11/2026 · *7 d*\n2. ERTAPENEM 08/11/2026-14/11/2026 · *6 d*\n' +
    '⏱️ Con esta orden: *20 d* de antibiótico continuo\nPor antimicrobiano: ERTAPENEM *20 d* · VANCOMICINA *7 d*');
  incluye(t, 'ERTAPENEM: también solicitado hace 2 h');
  noIncluye(t, 'DAPTOMICINA');
  var msg = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(msg, '🔁 Antes de esta orden:'); noIncluye(msg, '(esta orden)');
  // 7 d ordenados estarian dentro de 5-7 d, pero el curso completo (20 d) supera el doble
  incluye(msg, '🔴 ERTAPENEM · *20 d* de antibiótico continuo: supera la referencia; revaluar duración');
  var hist = seguimientoPaciente(e).historia.join('\n');
  incluye(hist, '08/11/2026: ERTAPENEM 1000 mg cada 24 h por 7 d'); noIncluye(hist, '123456');
  // paciente sin historia: sin seguimiento
  var e2 = eventoSeguimiento('14/11/2026 09:00:00', '555', 'N390', [['ERTAPENEM', '1000', '24', '7']]);
  assert.strictEqual(seguimientoPaciente(e2).lineas.length, 0);
  incluye(construirMensajeDesdeEvento(e2), '🟢 ERTAPENEM 7 d: dentro de la referencia');
});

prueba('seguimiento: tratamiento continuo con cambio de antimicrobiano y renovacion tardia (caso real del 2026-11-15)', function () {
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  filas.push(filaMatriz('17/10/2026 10:00:00', '777001', [['MEROPENEM', '1000', '8', '7']]));
  filas.push(filaMatriz('22/10/2026 19:47:19', '777001', [['ERTAPENEM', '1000', '24', '21']]));   // termina el 12/11
  var e = eventoSeguimiento('15/11/2026 17:10:18', '777001', 'L031', [['ERTAPENEM', '1000', '24', '7']]);   // renovacion 3 dias despues
  e.namedValues[CAMPOS.MICROORGANISMO] = ['BETALACTAMASA DE AMPLIO ESPECTRO']; e.namedValues[CAMPOS.CULTIVOS] = ['SECRECIÓN'];
  e.namedValues[CAMPOS.TIPO_INDICACION] = ['Tratamiento Etiológico (En presencia de aislamiento conocido)'];
  var seg = seguimientoPaciente(e), t = seg.lineas.join('\n');
  incluye(t, '🔁 Antes de esta orden:\n1. MEROPENEM 17/10/2026-22/10/2026 · *5 d*\n2. ERTAPENEM 22/10/2026-15/11/2026 · *24 d*\n' +
    '⏱️ Con esta orden: *36 d* de antibiótico continuo\nPor antimicrobiano: ERTAPENEM *31 d* · MEROPENEM *5 d*');
  noIncluye(t, 'Otros previos');
  assert.strictEqual(seg.historia.length, 2); incluye(seg.historia[0], '17/10/2026: MEROPENEM 1000 mg cada 8 h por 7 d');
  var msg = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(msg, '🟢 ERTAPENEM: indicado para el aislamiento registrado');   // BLEE escrita en palabras
  incluye(msg, '🔴 ERTAPENEM · *36 d* de antibiótico continuo: supera la referencia; revaluar duración');
  incluye(seg.historia.join('\n'), '22/10/2026: ERTAPENEM 1000 mg cada 24 h por 21 d');
  // un curso antiguo, ya terminado hace mas de la tolerancia, no se suma
  filas.push(filaMatriz('01/10/2026 08:00:00', '777002', [['ERTAPENEM', '1000', '24', '7']]));
  var e2 = eventoSeguimiento('15/11/2026 09:00:00', '777002', 'N390', [['ERTAPENEM', '1000', '24', '7']]);
  incluye(seguimientoPaciente(e2).lineas.join('\n'), 'ERTAPENEM: curso previo el 01/10/2026 (7 d)');
  incluye(construirMensajeDesdeEvento(e2), '🟢 ERTAPENEM 7 d: dentro de la referencia');
  assert.strictEqual(normalizarAislamiento('E. coli productora de betalactamasas de espectro extendido'), 'E. COLI PRODUCTORA DE BLEE');
});

prueba('seguimiento: dias calendario que cuadran con las fechas y sin tramos de 0 dias (caso real del 2026-11-15)', function () {
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  filas.push(filaMatriz('17/09/2026 09:00:00', '777003', [['MEROPENEM', '1000', '8', '7']]));
  filas.push(filaMatriz('17/09/2026 16:00:00', '777003', [['ERTAPENEM', '1000', '24', '21']]));   // el mismo dia: 0 d de meropenem
  filas.push(filaMatriz('08/10/2026 03:00:00', '777003', [['MEROPENEM', '1000', '8', '14']]));    // de madrugada
  filas.push(filaMatriz('22/10/2026 19:47:19', '777003', [['ERTAPENEM', '1000', '24', '21']]));   // de noche: son 14 d, no 15
  var e = eventoSeguimiento('15/11/2026 17:10:18', '777003', 'L031', [['ERTAPENEM', '1000', '24', '7']]);
  var t = seguimientoPaciente(e).lineas.join('\n');
  incluye(t, '🔁 Antes de esta orden:\n1. ERTAPENEM 17/09/2026-08/10/2026 · *21 d*\n2. MEROPENEM 08/10/2026-22/10/2026 · *14 d*\n' +
    '3. ERTAPENEM 22/10/2026-15/11/2026 · *24 d*\n⏱️ Con esta orden: *66 d* de antibiótico continuo\n' +
    'Por antimicrobiano: ERTAPENEM *52 d* · MEROPENEM *14 d*');   // 21 + 14 + 24 + 7; ertapenem 21 + 24 + 7
  noIncluye(t, ' 0 d');
  var m = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(m, '🔴 ERTAPENEM · *66 d* de antibiótico continuo: supera la referencia');
  incluye(m, '💊 ERTAPENEM 1000 mg (14,3 mg/kg) IV c/24 h · *7 d* hasta 22/11\n');   // fin contado desde la solicitud
});

prueba('tratamiento prolongado: 3 o mas solicitudes seguidas y mas de 10 d, resumen diario sin verdes ni repetidos', function () {
  CONFIG.PROLONGADO_RESUMEN_DIARIO = true;   // esta prueba revisa el envio diario (en produccion sale al momento)
  try {
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  var conDx = function (fecha, hc, ams, dx) { var f = filaMatriz(fecha, hc, ams); f[ENCABEZADOS_REALES.indexOf(CAMPOS.DIAGNOSTICO)] = dx; return f; };
  // A: piperacilina/tazobactam 7 d -> meropenem 9 d -> se formula cefepime: 3 solicitudes, 16 d ya recibidos
  filas.push(filaMatriz('16/10/2026 08:00:00', '888001', [['PIPERACILINA / TAZOBACTAM', '4500', '6', '7']]));
  filas.push(filaMatriz('23/10/2026 08:00:00', '888001', [['MEROPENEM', '1000', '8', '7']]));
  var e = eventoSeguimiento('01/11/2026 10:00:00', '888001', 'J189', [['CEFEPIME', '2000', '8', '7']]);
  var p = tratamientoProlongado(e);
  assert.strictEqual(p.dias, 16); assert.strictEqual(p.proyectado, 23); assert.strictEqual(p.solicitudes, 3);
  assert.deepStrictEqual(p.nuevos, ['CEFEPIME']);
  var r = revisionProlongado(e, filtrarAntimicrobianosRestringidos(e));
  assert.strictEqual(r.nivel, 2); assert.strictEqual(r.hc, '888001');
  // formato simple (2026-11-22): paciente, diagnostico, dias, motivo del color y la lista sin codigos
  assert.deepStrictEqual(r.bloque.slice(0, 7), ['HC 888001 · 60 años', '📋 J189 · Neumonia, no especificada', '⏱️ Lleva 16 d de antibiótico; con esta orden llegaría a 23 d',
    '🔴 Más del doble de la duración de referencia para neumonía (5-7 d)',
    '1. PIPERACILINA / TAZOBACTAM 16/10/2026-23/10/2026 · 7 d', '2. MEROPENEM 23/10/2026-01/11/2026 · 9 d',
    '3. CEFEPIME 2000 mg IV c/8 h 01/11/2026-08/11/2026 · 7 d (esta orden)']);
  incluye(r.bloque[7], '📏 Neumonía 5-7 d ('); incluye(r.bloque[7], '): 23 d duplica la referencia');
  assert.strictEqual(r.bloque.length, 8);   // ningun antimicrobiano se repite: sin "Por antimicrobiano"
  assert.strictEqual(r.mensaje, '*📆 REVISIÓN DE DURACIÓN DE TTO*\n🔴 *HC 888001 · 60 años*\n📋 J189 · Neumonia, no especificada\n' +
    '⏱️ Lleva *16 d* de antibiótico; con esta orden llegaría a *23 d*\n🔴 Más del doble de la duración de referencia para neumonía (5-7 d)\n' +
    '1. PIPERACILINA / TAZOBACTAM 16/10/2026-23/10/2026 · *7 d*\n2. MEROPENEM 23/10/2026-01/11/2026 · *9 d*\n' +
    '3. CEFEPIME 2000 mg IV c/8 h 01/11/2026-08/11/2026 · *7 d* (esta orden)');
  // un solo antimicrobiano de amplio espectro no es "terapia combinada"
  noIncluye(sugerenciaPROA('Empírico', [], [{ nombre: 'CEFEPIME' }]), 'combinada');

  // La patologia cuenta: cada solicitud muestra la suya y el total se compara con la de mayor duracion
  filas.push(conDx('16/10/2026 08:00:00', '888006', [['PIPERACILINA / TAZOBACTAM', '4500', '6', '7']], 'A419 - SEPSIS'));
  filas.push(conDx('24/10/2026 08:00:00', '888006', [['CEFEPIME', '2000', '8', '7']], 'J189 - NEUMONIA'));
  var e6 = eventoSeguimiento('01/11/2026 10:00:00', '888006', 'J22X', [['CEFEPIME', '2000', '8', '7']]);
  var r6 = revisionProlongado(e6, []);
  assert.strictEqual(r6.nivel, 1);
  incluye(r6.bloque.join('\n'), '1. PIPERACILINA / TAZOBACTAM 16/10/2026-24/10/2026 · 8 d\n2. CEFEPIME 24/10/2026-01/11/2026 · 8 d\n' +
    '3. CEFEPIME 2000 mg IV c/8 h 01/11/2026-08/11/2026 · 7 d (esta orden)\nPor antimicrobiano: CEFEPIME 15 d · PIPERACILINA / TAZOBACTAM 8 d');
  assert.strictEqual(r6.bloque[3], '🟡 Supera la duración de referencia para bacteriemia / sepsis (7-14 d)');   // la mas larga de sus patologias
  var u6 = r6.bloque[r6.bloque.length - 1];
  incluye(u6, '📏 Bacteriemia / sepsis 7-14 d ('); incluye(u6, ', la más larga de sus patologías: 23 d supera la referencia');
  filas.push(conDx('10/10/2026 08:00:00', '888007', [['CEFAZOLINA', '2000', '8', '14']], 'M861 - OSTEOMIELITIS'));
  filas.push(conDx('24/10/2026 08:00:00', '888007', [['CEFAZOLINA', '2000', '8', '7']], 'L039 - CELULITIS'));
  var e7 = eventoSeguimiento('01/11/2026 10:00:00', '888007', 'L031', [['CEFAZOLINA', '2000', '8', '7']]);
  var r7 = revisionProlongado(e7, []);
  assert.strictEqual(r7.nivel, 0); assert.strictEqual(r7.bloque[3], '🟢 Dentro de la duración de referencia para osteomielitis / espondilodiscitis (42 d)');
  incluye(r7.bloque[r7.bloque.length - 1], '📏 Osteomielitis / espondilodiscitis 42 d (');
  incluye(r7.bloque[r7.bloque.length - 1], ', la más larga de sus patologías: 29 d dentro de la referencia');

  // El caso PROA usa la misma referencia: los dos mensajes dicen lo mismo
  var t7 = analisisPertinenciaDesdeEvento(e7, []);
  incluye(t7.encabezadoDias, 'Osteomielitis / espondilodiscitis: 42 d ('); incluye(t7.encabezadoDias, ', la más larga de sus patologías');
  incluye(t7.lineas.join('\n'), '🟢 CEFAZOLINA · *29 d* de antibiótico continuo: dentro de la referencia');
  var t6 = analisisPertinenciaDesdeEvento(e6, []);
  incluye(t6.encabezadoDias, 'Bacteriemia / sepsis: 7-14 d'); incluye(t6.lineas.join('\n'), '🟡 CEFEPIME · *23 d* de antibiótico continuo: supera la referencia');
  assert.strictEqual(t6.nivel, r6.nivel);
  // sin cursos previos, la referencia es la del diagnostico actual
  incluye(analisisPertinenciaDesdeEvento(eventoSeguimiento('01/11/2026 10:00:00', '888099', 'L031', [['CEFAZOLINA', '2000', '8', '7']]), []).encabezadoDias,
    'Infección de piel y tejidos blandos: 5-7 d');
  // Dos ordenes el mismo dia con antimicrobianos distintos: la posterior reemplaza a la anterior (no es combinacion)
  filas.push(filaMatriz('17/10/2026 08:00:00', '888008', [['MEROPENEM', '1000', '8', '7']]));
  filas.push(filaMatriz('17/10/2026 20:00:00', '888008', [['ERTAPENEM', '1000', '24', '7']]));
  filas.push(filaMatriz('24/10/2026 08:00:00', '888008', [['ERTAPENEM', '1000', '24', '7']]));
  var r8 = revisionProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888008', 'L031', [['ERTAPENEM', '1000', '24', '7']]), []);
  assert.strictEqual(r8.bloque[4], '1-2. ERTAPENEM 17/10/2026-01/11/2026 · 15 d'); noIncluye(r8.mensaje, 'MEROPENEM');

  // No alcanza: 2 solicitudes aunque sean 22 d; 3 solicitudes con solo 7 d; dos ordenes el mismo dia son una
  filas.push(filaMatriz('10/10/2026 08:00:00', '888002', [['MEROPENEM', '1000', '8', '21']]));
  assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888002', 'J189', [['MEROPENEM', '1000', '8', '7']])), null);
  filas.push(filaMatriz('25/10/2026 08:00:00', '888004', [['CEFEPIME', '2000', '8', '3']]));
  filas.push(filaMatriz('28/10/2026 08:00:00', '888004', [['CEFEPIME', '2000', '8', '3']]));
  assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888004', 'J189', [['MEROPENEM', '1000', '8', '7']])), null);
  filas.push(filaMatriz('20/10/2026 08:00:00', '888005', [['CEFEPIME', '2000', '8', '7']]));
  filas.push(filaMatriz('20/10/2026 15:00:00', '888005', [['CEFEPIME', '2000', '8', '7']]));
  assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888005', 'J189', [['MEROPENEM', '1000', '8', '7']])), null);
  // una revision por paciente y dia: la segunda orden del mismo dia no la repite
  filas.push(filaMatriz('01/11/2026 07:00:00', '888001', [['CEFEPIME', '2000', '8', '7']]));
  var eDup = eventoSeguimiento('01/11/2026 10:00:00', '888001', 'J189', [['CEFEPIME', '2000', '8', '7']]);
  assert.strictEqual(tratamientoProlongado(eDup).solicitudes, 3); assert.strictEqual(revisionProlongado(eDup, []), null);
  filas.pop();

  // Renovaciones del mismo antimicrobiano: cuentan; con PROLONGADO_SOLO_CAMBIO, solo si se formula uno nuevo
  ['10/10/2026', '17/10/2026', '24/10/2026'].forEach(function (f) { filas.push(filaMatriz(f + ' 08:00:00', '888003', [['MEROPENEM', '1000', '8', '7']])); });
  var p3 = tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888003', 'J189', [['MEROPENEM', '1000', '8', '14']]));
  assert.strictEqual(p3.dias, 22); assert.strictEqual(p3.solicitudes, 4); assert.deepStrictEqual(p3.nuevos, []);
  CONFIG.PROLONGADO_SOLO_CAMBIO = true;
  try { assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888003', 'J189', [['MEROPENEM', '1000', '8', '14']])), null); }
  finally { CONFIG.PROLONGADO_SOLO_CAMBIO = false; }

  // Flujo: queda pendiente; las verdes y las repetidas (7 d) no se envian; el resumen diario sale en un mensaje
  var propsReal = global.PropertiesService;
  var P = { GREENAPI_ID_INSTANCE: '1', GREENAPI_API_TOKEN: 't', GREENAPI_GROUP_CHATID: '111@g.us', GREENAPI_API_URL: 'https://greenapi.test' };
  global.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return P[k] || null; } }; } };
  HOJAS['REGISTRO_REVISIONES'] = hojaDeFilas([ENCABEZADOS_REGISTRO.slice(0, 21)], true);   // pestana de la version anterior
  var reg = HOJAS['REGISTRO_REVISIONES']._filas, col = function (n) { return ENCABEZADOS_REGISTRO.indexOf(n); };
  var ultima = function () { return reg[reg.length - 1]; };
  try {
    conApiSimulada(function (llamadas) {
      notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888001', 'J189', [['CEFEPIME', '2000', '8', '7']]));
      assert.strictEqual(envios.length, 0); assert.strictEqual(llamadas.length, 0);
      assert.deepStrictEqual(reg[0], ENCABEZADOS_REGISTRO);
      assert.strictEqual(ultima()[col('Fuente del análisis')], 'TRATAMIENTO PROLONGADO'); assert.strictEqual(ultima()[col('Enviado al grupo')], 'PENDIENTE');
      assert.strictEqual(ultima()[col('Semáforo final')], 'ROJO'); assert.strictEqual(ultima()[col('Días de tratamiento continuo')], 16);
      incluye(ultima()[col('Detalle')], '2. MEROPENEM 23/10/2026-01/11/2026 · 9 d\n3. CEFEPIME');
      // con restringido: el caso PROA sale de inmediato con la lista de prescripciones; la revision no se repite
      notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888001', 'J189', [['ERTAPENEM', '1000', '24', '7']]));
      assert.strictEqual(envios.length, 1); incluye(envios[0].message, '*🚨 CASO PROA · Ertapenem*'); noIncluye(envios[0].message, '📆');
      incluye(envios[0].message, '⏱️ Con esta orden: *23 d* de antibiótico continuo');
      assert.strictEqual(ultima()[col('Enviado al grupo')], 'NO'); incluye(ultima()[col('Destino')], 'tiene restringido');
      notificarNuevaRespuesta(e6);
      assert.strictEqual(ultima()[col('Enviado al grupo')], 'PENDIENTE'); assert.strictEqual(ultima()[col('Semáforo final')], 'AMARILLO');
      notificarNuevaRespuesta(e7);
      assert.strictEqual(ultima()[col('Enviado al grupo')], 'NO'); incluye(ultima()[col('Destino')], 'dentro de la referencia');
      // sin criterio no se registra revision
      var n = reg.length;
      notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888004', 'J189', [['MEROPENEM', '1000', '8', '7']]));
      assert.strictEqual(reg.length, n);

      envios.length = 0;
      probarResumenProlongados();
      assert.strictEqual(envios.length, 0);
      enviarResumenProlongados();
      // un mensaje por paciente, los rojos primero; la verde no sale
      assert.strictEqual(envios.length, 2);
      incluye(envios[0].message, '*📆 REVISIÓN DE DURACIÓN DE TTO*\n🔴 *HC 888001');
      incluye(envios[1].message, '*📆 REVISIÓN DE DURACIÓN DE TTO*\n🟡 *HC 888006');
      envios.forEach(function (x) { noIncluye(x.message, '888007'); noIncluye(x.message, '💡'); noIncluye(x.message, '📏'); });
      var pend = reg.filter(function (f) { return f[col('Fuente del análisis')] === 'TRATAMIENTO PROLONGADO' && f[col('Enviado al grupo')] === 'SI'; });
      assert.strictEqual(pend.length, 2); incluye(pend[0][col('Destino')], 'RESUMEN DIARIO ');
      envios.length = 0;
      enviarResumenProlongados();
      assert.strictEqual(envios.length, 0, 'nada pendiente');

      // 7 dias: el mismo paciente 3 dias despues no se repite; 8 dias despues, si
      filas.push(filaMatriz('01/11/2026 10:00:00', '888001', [['CEFEPIME', '2000', '8', '7']]));
      notificarNuevaRespuesta(eventoSeguimiento('04/11/2026 10:00:00', '888001', 'J189', [['MEROPENEM', '1000', '8', '7']]));
      incluye(ultima()[col('Destino')], 'ya tuvo revisión');
      notificarNuevaRespuesta(eventoSeguimiento('09/11/2026 10:00:00', '888001', 'J189', [['MEROPENEM', '1000', '8', '7']]));
      assert.strictEqual(ultima()[col('Enviado al grupo')], 'PENDIENTE');

      // sin resumen diario, la revision sale de inmediato con el mismo formato
      CONFIG.PROLONGADO_RESUMEN_DIARIO = false;
      try {   // modo inmediato
        envios.length = 0;
        notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888003', 'J189', [['MEROPENEM', '1000', '8', '14']]));
        assert.strictEqual(envios.length, 1); incluye(envios[0].message, '*📆 REVISIÓN DE DURACIÓN DE TTO*\n🔴 *HC 888003 · 60 años*\n📋 J189 · Neumonia, no especificada\n⏱️ Lleva *22 d* de antibiótico; con esta orden llegaría a *36 d*');
        // renovaciones seguidas del mismo antimicrobiano en una linea
        incluye(envios[0].message, '\n1-3. MEROPENEM 10/10/2026-01/11/2026 · *22 d*\n4. MEROPENEM 1000 mg IV c/8 h 01/11/2026-15/11/2026 · *14 d* (esta orden)\nPor antimicrobiano: MEROPENEM *36 d*');
        assert.strictEqual(ultima()[col('Enviado al grupo')], 'SI'); assert.strictEqual(ultima()[col('Destino')], 'PRODUCCION');
      } finally { CONFIG.PROLONGADO_RESUMEN_DIARIO = true; }
    });
  } finally { global.PropertiesService = propsReal; }
  } finally { CONFIG.PROLONGADO_RESUMEN_DIARIO = false; }
});

prueba('probarUltimoProlongado: muestra la ultima revision por tratamiento prolongado sin enviar nada', function () {
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  HOJAS['REGISTRO_REVISIONES'] = hojaDeFilas([ENCABEZADOS_REGISTRO.slice()], true);   // sin revisiones previas del paciente
  filas.push(filaMatriz('01/11/2026 10:00:00', '888001', [['CEFEPIME', '2000', '8', '7']]));
  var registro = [], logReal = Logger.log;
  Logger.log = function (fmt) {   // como Apps Script: sustituye cada %s por el argumento siguiente
    var args = Array.prototype.slice.call(arguments, 1);
    registro.push(String(fmt).replace(/%s/g, function () { return String(args.shift()); }));
  };
  try {
    conApiSimulada(function (llamadas) {
      probarUltimoProlongado();
      assert.strictEqual(envios.length, 0); assert.strictEqual(llamadas.length, 0);
    });
  } finally { Logger.log = logReal; filas.pop(); }
  var texto = registro.join('\n');
  incluye(texto, 'revisión de duración: sí (3 prescripciones seguidas, 16 d)'); incluye(texto, '▶ REVISIÓN DE DURACIÓN: se enviaría al grupo al llegar la solicitud\n\n*📆'); incluye(texto, 'PRUEBA (no se envió nada al grupo)'); incluye(texto, 'Tiempos: buscar la fila '); incluye(texto, ' · historia '); noIncluye(texto, 'mensaje aparte'); incluye(texto, '*📆 REVISIÓN DE DURACIÓN DE TTO*\n🟡 *HC 888001');
});

prueba('restringido: caso PROA solo si supera 14 d con esta orden; sin listado: solo revision de duracion', function () {
  var propsReal = global.PropertiesService;
  var P = { GREENAPI_ID_INSTANCE: '1', GREENAPI_API_TOKEN: 't', GREENAPI_GROUP_CHATID: '111@g.us', GREENAPI_API_URL: 'https://greenapi.test' };
  global.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return P[k] || null; } }; } };
  HOJAS['REGISTRO_REVISIONES'] = hojaDeFilas([ENCABEZADOS_REGISTRO.slice()], true);
  var reg = HOJAS['REGISTRO_REVISIONES']._filas, col = function (n) { return ENCABEZADOS_REGISTRO.indexOf(n); };
  var ultima = function () { return reg[reg.length - 1]; };
  assert.strictEqual(CONFIG.CASO_DIAS_MINIMOS, 14);
  try {
    var filas = HOJAS['Respuestas de formulario 1']._filas;
    conApiSimulada(function (llamadas) {
      // primera orden de ertapenem por 7 d: no sale
      var e1 = eventoSeguimiento('01/11/2026 10:00:00', '888011', 'L031', [['ERTAPENEM', '1000', '24', '7']]);
      assert.strictEqual(diasCasoProa(e1, filtrarAntimicrobianosRestringidos(e1)), 7);
      notificarNuevaRespuesta(e1);
      assert.strictEqual(envios.length, 0);
      assert.strictEqual(ultima()[col('Enviado al grupo')], 'NO'); incluye(ultima()[col('Destino')], 'no se envía: 7 d (caso PROA desde más de 14 d)');
      // primera orden por 21 d: sale (cuenta la orden)
      notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888013', 'L031', [['ERTAPENEM', '1000', '24', '21']]));
      assert.strictEqual(envios.length, 1); incluye(envios[0].message, '*🚨 CASO PROA · Ertapenem*');
      // lleva 10 d y piden 7 mas: 17 d, sale
      envios.length = 0;
      filas.push(filaMatriz('22/10/2026 10:00:00', '888014', [['ERTAPENEM', '1000', '24', '10']]));
      notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888014', 'L031', [['ERTAPENEM', '1000', '24', '7']]));
      assert.strictEqual(envios.length, 1); incluye(envios[0].message, '⏱️ Con esta orden: *17 d* de antibiótico continuo');
      // el caso de la fila 7638 (66 d): sale el caso PROA y no la revision
      envios.length = 0;
      filas.push(filaMatriz('17/09/2026 08:00:00', '888010', [['ERTAPENEM', '1000', '24', '21']]));
      filas.push(filaMatriz('08/10/2026 08:00:00', '888010', [['MEROPENEM', '1000', '8', '14']]));
      filas.push(filaMatriz('22/10/2026 19:47:19', '888010', [['ERTAPENEM', '1000', '24', '21']]));   // sigue vigente con la tolerancia
      notificarNuevaRespuesta(eventoSeguimiento('15/11/2026 10:00:00', '888010', 'L031', [['ERTAPENEM', '1000', '24', '7']]));
      assert.strictEqual(envios.length, 1); incluye(envios[0].message, '⏱️ Con esta orden: *66 d* de antibiótico continuo');
      incluye(ultima()[col('Destino')], 'tiene restringido');
      // fuera del listado (meropenem) con 3 o mas prescripciones y mas de 10 d: solo la revision, al momento
      envios.length = 0;
      notificarNuevaRespuesta(eventoSeguimiento('15/11/2026 11:00:00', '888010', 'L031', [['MEROPENEM', '1000', '8', '7']]));
      assert.strictEqual(envios.length, 1); assert.strictEqual(ultima()[col('Enviado al grupo')], 'SI');
      assert.strictEqual(ultima()[col('Destino')], 'PRODUCCION'); incluye(envios[0].message, '*📆 REVISIÓN DE DURACIÓN DE TTO*'); incluye(envios[0].message, 'con esta orden llegaría a *66 d*');
      noIncluye(envios[0].message, 'CASO PROA');
      // restringido que no dispara (vancomicina) cuenta como fuera del listado para la revision
      assert.strictEqual(generaCasoProa(eventoPruebaVancomicinaSola(), filtrarAntimicrobianosRestringidos(eventoPruebaVancomicinaSola())), false);
      assert.strictEqual(llamadas.length, 0);
    });
    // CASO_DIAS_MINIMOS = 0: caso PROA en cada solicitud, como antes
    CONFIG.CASO_DIAS_MINIMOS = 0;
    var e0 = eventoSeguimiento('01/11/2026 10:00:00', '888011', 'L031', [['ERTAPENEM', '1000', '24', '7']]);
    assert.strictEqual(generaCasoProa(e0, filtrarAntimicrobianosRestringidos(e0)), true);
  } finally { CONFIG.CASO_DIAS_MINIMOS = 14; global.PropertiesService = propsReal; }
});

prueba('revision de duracion: vancomicina y linezolid solos no la generan, pero sus dias cuentan', function () {
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  filas.push(filaMatriz('16/10/2026 08:00:00', '888030', [['PIPERACILINA / TAZOBACTAM', '4500', '6', '7']]));
  filas.push(filaMatriz('23/10/2026 08:00:00', '888030', [['MEROPENEM', '1000', '8', '7']]));
  // solo vancomicina: no hay revision
  var ev = eventoSeguimiento('01/11/2026 10:00:00', '888030', 'J189', [['VANCOMICINA', '1000', '12', '7']]);
  assert.strictEqual(tratamientoProlongado(ev), null); assert.strictEqual(revisionProlongado(ev, filtrarAntimicrobianosRestringidos(ev)), null);
  assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888030', 'J189', [['LINEZOLID', '600', '12', '7']])), null);
  // vancomicina con cefepime: sale por el cefepime y la orden muestra los dos
  var ec = eventoSeguimiento('01/11/2026 10:00:00', '888030', 'J189', [['VANCOMICINA', '1000', '12', '7'], ['CEFEPIME', '2000', '8', '7']]);
  var r = revisionProlongado(ec, filtrarAntimicrobianosRestringidos(ec));
  assert.ok(r); incluye(r.mensaje, '3. VANCOMICINA 1000 mg IV c/12 h + CEFEPIME 2000 mg IV c/8 h 01/11/2026-08/11/2026');
  // la vancomicina previa sigue contando en el tratamiento continuo
  filas.push(filaMatriz('01/11/2026 10:00:00', '888030', [['VANCOMICINA', '1000', '12', '7']]));
  var p2 = tratamientoProlongado(eventoSeguimiento('08/11/2026 10:00:00', '888030', 'J189', [['CEFEPIME', '2000', '8', '7']]));
  assert.strictEqual(p2.dias, 23); assert.strictEqual(p2.solicitudes, 4);
  // sin exclusiones, la vancomicina sola vuelve a generar la revision
  var antes = CONFIG.PROLONGADO_EXCLUIDOS; CONFIG.PROLONGADO_EXCLUIDOS = [];
  try { assert.ok(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888030', 'J189', [['VANCOMICINA', '1000', '12', '7']]))); }
  finally { CONFIG.PROLONGADO_EXCLUIDOS = antes; }
});

prueba('caso PROA solo con datos (produccion): ubicacion y diagnostico arriba, sin analisis de las tablas', function () {
  CONFIG.CASO_ANALISIS = CASO_ANALISIS_PRODUCCION;
  assert.strictEqual(CONFIG.CASO_ANALISIS, false);
  var propsReal = global.PropertiesService;
  try {
    var nv = eventoBase();
    nv['Marca temporal'] = ['15/11/2026 17:10:18']; nv[CAMPOS.HC] = ['777009']; nv[CAMPOS.EDAD_ANIOS] = ['62']; nv[CAMPOS.PESO_KG] = ['70'];
    nv[CAMPOS.SERVICIO] = ['Hospitalización General Adulto (Salud Mental)']; nv[CAMPOS.CAMA] = ['7']; nv[CAMPOS.ESPECIALIDAD] = ['Ortopedia'];
    nv[CAMPOS.DIAGNOSTICO] = ['L031']; nv[CAMPOS.MICROORGANISMO] = ['BETALACTAMASA DE AMPLIO ESPECTRO']; nv[CAMPOS.CULTIVOS] = ['SECRECIÓN'];
    nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Etiológico (En presencia de aislamiento conocido)']; nv[CAMPOS.ORIGEN] = ['COMUNIDAD'];
    nv[CAMPOS.INTERCONSULTA] = ['No'];
    nv[SLOTS[0].nombre] = ['ERTAPENEM - UT-1']; nv[SLOTS[0].dosis] = ['1000']; nv[SLOTS[0].via] = ['Intravenoso'];
    nv[SLOTS[0].frecuencia] = ['24']; nv[SLOTS[0].dias] = ['21'];   // mas de 14 d: genera caso PROA
    var e = { namedValues: nv };
    var m = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
    incluye(m, '*🚨 CASO PROA · Ertapenem*\n📍 Hospitalización General Adulto (Salud Mental) · Cama 7\n📋 L031');
    incluye(m, '\n📄 HC 777009 · 62 años · 70 kg · Ortopedia\n🦠 BLEE · SECRECIÓN · Etiológico · COMUNIDAD\n⚠️ Sin interconsulta a Infectología\n\n💊 ERTAPENEM');
    ['Se sugiere', 'Acorde', '📏', '🟢', 'indicado', '🏥'].forEach(function (x) { noIncluye(m, x); });
    // sin IA (sin ANTHROPIC_API_KEY) no se llama a ninguna API; el registro sigue guardando el analisis de las tablas
    var P = { GREENAPI_ID_INSTANCE: '1', GREENAPI_API_TOKEN: 't', GREENAPI_GROUP_CHATID: '111@g.us', GREENAPI_API_URL: 'https://greenapi.test' };
    global.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return P[k] || null; } }; } };
    HOJAS['REGISTRO_REVISIONES'] = hojaDeFilas([ENCABEZADOS_REGISTRO.slice()], true);
    conApiSimulada(function (llamadas) {
      notificarNuevaRespuesta({ namedValues: nv });
      assert.strictEqual(llamadas.length, 0); assert.strictEqual(envios.length, 1);
      noIncluye(envios[0].message, 'Se sugiere');
    });
    var fila = HOJAS['REGISTRO_REVISIONES']._filas[1], col = function (n) { return ENCABEZADOS_REGISTRO.indexOf(n); };
    assert.strictEqual(fila[col('Fuente del análisis')], 'TABLAS'); assert.strictEqual(fila[col('Semáforo tablas')], 'ROJO');   // 21 d en piel (5-7 d): el registro lo guarda, el mensaje no
    incluye(fila[col('Detalle')], 'ERTAPENEM: indicado para el aislamiento registrado');
  } finally { CONFIG.CASO_ANALISIS = true; global.PropertiesService = propsReal; }
});

prueba('registro: una fila por revision en REGISTRO_REVISIONES', function () {
  delete HOJAS['REGISTRO_REVISIONES'];
  var e = eventoSeguimiento('14/11/2026 08:00:00', '123456', 'N390', [['ERTAPENEM', '1000', '24', '7']]);
  var co = filtrarAntimicrobianosRestringidos(e);
  registrarRevision(e, co, { enviado: true, destino: 'PRODUCCION' });
  var filas = HOJAS['REGISTRO_REVISIONES']._filas;
  assert.strictEqual(filas.length, 2); assert.deepStrictEqual(filas[0], ENCABEZADOS_REGISTRO); assert.strictEqual(filas[1].length, ENCABEZADOS_REGISTRO.length);
  var r = {}; ENCABEZADOS_REGISTRO.forEach(function (h, i) { r[h] = filas[1][i]; });
  assert.strictEqual(r['Semáforo tablas'], 'ROJO'); assert.strictEqual(r['Fuente del análisis'], 'TABLAS'); assert.strictEqual(r['Enviado al grupo'], 'SI');
  assert.strictEqual(r['Antimicrobianos restringidos'], 'ERTAPENEM 7 d'); assert.strictEqual(r['Solicitudes previas'], 3); assert.strictEqual(r['Días de tratamiento continuo'], 13);
  incluye(r['Diagnóstico'], 'N390 · Infeccion de vias urinarias');
});

prueba('tablas: Candida solo en orina, antifungico en foco bacteriano y caspofungina 70 mg de mantenimiento', function () {
  var ams = [{ nombre: 'CASPOFUNGINA 50, 70', dias: '7', dosis: '70' }];
  var l = analisisPertinencia('N390', 'Etiológico', 'CANDIDA AURIS', ams, { cultivos: 'UROCULTIVO' });
  assert.strictEqual(l.nivel, 1);
  incluye(l.lineas.join('\n'), '🟡 CASPOFUNGINA 50, 70: Candida solo en urocultivo suele ser colonización');
  incluye(l.lineas.join('\n'), '⚪ CASPOFUNGINA 50, 70 7 d: sin duración de referencia para un antifúngico en este foco');
  noIncluye(l.lineas.join('\n'), 'Infección urinaria complicada'); assert.strictEqual(l.encabezadoDias, '');
  noIncluye(l.lineas.join('\n'), 'dentro de la referencia');
  l = analisisPertinencia('N390', 'Etiológico', 'CANDIDA AURIS', ams, { cultivos: 'HEMOCULTIVO, UROCULTIVO' }).lineas.join('\n');
  incluye(l, '🟢 CASPOFUNGINA 50, 70: indicado');
  l = analisisPertinencia('B377', 'Etiológico', 'Candida auris', [{ nombre: 'CASPOFUNGINA 50, 70', dias: '14' }], { cultivos: 'HEMOCULTIVO' }).lineas.join('\n');
  incluye(l, '🟢 CASPOFUNGINA 50, 70 14 d: dentro de la referencia');
  assert.ok(/dosis de carga del día 1/.test(avisoDosisEspecifico(ams[0], 70, ams)));
  assert.strictEqual(avisoDosisEspecifico(ams[0], 95, ams), '');                                      // > 80 kg
  assert.strictEqual(avisoDosisEspecifico({ nombre: 'CASPOFUNGINA 50, 70', dias: '1', dosis: '70' }, 70, ams), '');   // solo la carga
  assert.strictEqual(avisoDosisEspecifico({ nombre: 'CASPOFUNGINA 50, 70', dias: '7', dosis: '50' }, 70, ams), '');
});

prueba('calidad de datos: CIE10 en cualquier parte del texto o por descripcion, y edad con meses imposibles', function () {
  assert.strictEqual(codigoCIE10Resuelto('ORQUITIS SIN ABSCESO N390'), 'N390');
  assert.strictEqual(codigoCIE10Resuelto('n390 infeccion urinaria'), 'N390');
  assert.strictEqual(codigoCIE10Resuelto('Infección de vías urinarias, sitio no especificado'), 'N390');   // descripcion exacta de la pestana
  assert.strictEqual(codigoCIE10Resuelto('CA PAPILAR DE OVARIO + FISTULA'), '');
  assert.strictEqual(codigoCIE10Resuelto('PACIENTE CON Z999 INEXISTENTE'), '');                            // token que no esta en la pestana
  incluye(diagnosticoCorto('SEPSIS DE ORIGEN URINARIO A419'), 'A419 · Sepsis, no especificada');
  assert.strictEqual(edadTexto('58', '695', '21170'), '58 años');
  assert.strictEqual(edadTexto('0', '4', '0'), '4 meses');
  assert.strictEqual(edadTexto('2', '6', ''), '2 años 6 meses');
});

prueba('cruce del diagnostico escrito con la pestana CIE10 (textos reales de la matriz)', function () {
  var cod = function (dx) { return codigoCIE10Resuelto(dx); };
  // abreviaturas, errores de digitacion y complementos que se quitan del final
  assert.strictEqual(cod('ITU'), 'N390'); assert.strictEqual(cod('IVU COMPLICADA'), 'N390');
  assert.strictEqual(cod('INFECCION DE VIAS URINARIAS COMPLICADA'), 'N390');
  assert.strictEqual(cod('SHOCK SEPTICO'), 'R572'); assert.strictEqual(cod('Shock hipovolémico '), 'R571');
  assert.strictEqual(cod('MENIGITIS '), 'G039'); assert.strictEqual(cod('meningitis bacteriana'), 'G009');   // no G008 "OTRAS ..." 
  assert.strictEqual(cod('ENFEREMDAD RENAL CRONICA NO ESPECIFICADA\n \n'), 'N189');
  assert.strictEqual(cod('PERITONISTIS ASOCIADO AL CATETER '), 'K659');
  assert.strictEqual(cod('NEUMONIA ADQUIRIDA EN LA COMUNIDAD'), 'J189'); assert.strictEqual(cod('NEUMONÍA POSTERO BASAL IZQUIERDA EN TRATAMIENTO'), 'J189');
  assert.strictEqual(cod('NEUMONIA ASPIRATIVA'), 'J690'); assert.strictEqual(cod('NEUMONIA BRONCOASPIRATIVA'), 'J690');   // equivalencias
  assert.strictEqual(cod('NEUMONIA POR BRONCOASPIRACION'), 'J690'); assert.strictEqual(cod('SINDROME FBRIL '), 'R509');
  assert.strictEqual(cod('OSTEOMIELITIS MIEMBRO INFERIOR '), 'M869'); assert.strictEqual(cod('LEUCEMIA LINFOIDE'), 'C919');   // no "OTRAS ..."
  assert.strictEqual(cod('INFECCION DE PIEL Y TEJIDOS BLANDOS'), 'L089');
  assert.strictEqual(cod('CELULITIS DE PIERNA DERECHA '), 'L039'); assert.strictEqual(cod('ISO'), 'T814');
  assert.strictEqual(cod('COLECISTITIS MAS COLELITIASIS'), 'K819'); assert.strictEqual(cod('COLANGITIS'), 'K830');
  // una sola palabra: solo la descripcion generica; nada de diagnosticos parecidos
  assert.strictEqual(cod('NEUTROPRENIA FEBRIL '), '');           // no es la neutropenia neonatal
  assert.strictEqual(cod('PIELONEFRITIS '), '');                  // no es la pielonefritis cronica con reflujo
  assert.strictEqual(cod('ACCIDENTE OFIDICO'), '');               // no es el accidente cerebrovascular
  assert.strictEqual(cod('INFECCION DE SITIO OPERATORIO '), '');  // no es la infeccion urinaria "sitio no especificado"
  assert.strictEqual(cod('CÓDIGO BLANCO  MAYOR  72   HORAS'), '');
  // lo que salio mal con la matriz real: prefijo comun (NEUTRO-), quitar varias palabras y empates
  assert.strictEqual(cod('TUMOR FOSA POSTERIOR - NEUROINFECCION'), '');   // no la fosa nasal
  assert.strictEqual(cod('CA PAPILAR DE OVARIO + FISTULA'), '');           // no el bazo
  assert.strictEqual(cod('Tumor de Mama '), '');                            // benigno o maligno: empate
  // codigos escritos y descripciones exactas no cambian
  assert.strictEqual(resolverCIE10('A-419').via, 'escrito'); assert.strictEqual(resolverCIE10(': L031').codigo, 'L031');
  assert.strictEqual(resolverCIE10('INFECCION DE VIAS URINARIAS, SITIO NO ESPECIFICADO').via, 'descripcion');
  // en el mensaje sale lo escrito junto al codigo cruzado; categoria sin subcodigo con la descripcion de la no especificada
  assert.strictEqual(diagnosticoCorto('MENIGITIS '), 'G039 · Meningitis, no especificada (escrito: menigitis)');
  assert.strictEqual(diagnosticoCorto('K35'), 'K35 · Apendicitis aguda, no especificada');
  assert.strictEqual(diagnosticoCorto('SINDROME FEBRIL'), 'R509 · Fiebre, no especificada (escrito: sindrome febril)');
  assert.strictEqual(diagnosticoCorto('SINDROME MENINGEO EN ESTUDIO'), 'SINDROME MENINGEO EN ESTUDIO');
  // duracion: el cruce y las palabras corregidas encuentran el sindrome; una palabra clave le gana al codigo cruzado
  var tabla = obtenerPertinencia(), sin = function (dx) { var x = sindromePara(dx, tabla); return x ? x.clave : null; };
  assert.strictEqual(sin('MENIGITIS '), 'MENINGITIS'); assert.strictEqual(sin('PERITONISTIS ASOCIADO AL CATETER'), 'INTRAABDOMINAL');
  assert.strictEqual(sin('SHOCK SEPTICO'), 'BACTERIEMIA'); assert.strictEqual(sin('NEUTROPRENIA FEBRIL'), 'NEUTROPENIA');
  assert.strictEqual(sin('SEPSIS URINARIA'), 'ITU'); assert.strictEqual(sin('COLECISTITIS MAS COLELITIASIS'), 'INTRAABDOMINAL');
  // la pestana se lee una vez por ejecucion
  var lecturas = 0, real = HOJAS['CIE10'], getRange = real.getRange;
  real.getRange = function (f, c, nf, nc) { if (nc === 2) lecturas++; return getRange.apply(real, arguments); };
  try { limpiarCacheEjecucion(); cache = {}; cod('NEUMONIA'); cod('CELULITIS'); cod('ITU'); assert.strictEqual(lecturas, 1); }
  finally { real.getRange = getRange; }
});

var envios = [];
// UrlFetchApp simulado: Green-API responde bien y cualquier otra URL queda en llamadas (el bot no debe
// llamar a ninguna otra API).
function conApiSimulada(fn) {
  var real = global.UrlFetchApp, llamadas = []; envios = [];
  global.UrlFetchApp = { fetch: function (url, op) {
    if (url.indexOf('greenapi.test') > -1) {
      envios.push(JSON.parse(op.payload));
      return { getResponseCode: function () { return 200; }, getContentText: function () { return JSON.stringify({ idMessage: 'MSG' + envios.length }); } };
    }
    llamadas.push(url);
    return { getResponseCode: function () { return 404; }, getContentText: function () { return ''; } };
  } };
  try { fn(llamadas); } finally { global.UrlFetchApp = real; }
}

prueba('cache de la ejecucion: cada pestana de configuracion se lee una sola vez', function () {
  var lecturas = {}, realOpen = SpreadsheetApp.openById;
  SpreadsheetApp.openById = function (id) {
    var ss = realOpen(id);
    return { getSheetByName: function (n) { lecturas[n] = (lecturas[n] || 0) + 1; return ss.getSheetByName(n); }, insertSheet: ss.insertSheet };
  };
  try {
    for (var i = 0; i < 5; i++) { obtenerPertinencia(); obtenerAntimicrobianosRestringidos(); obtenerRangosDosis(); }
    assert.strictEqual(lecturas['PERTINENCIA_DURACION'] || 0, 1, 'pertinencia'); assert.strictEqual(lecturas['ANTIMICROBIANOS_RESTRINGIDOS'], 1);
    assert.strictEqual(lecturas['RANGOS_DOSIS'], 1);
    limpiarCacheEjecucion(); obtenerPertinencia();
    assert.strictEqual(lecturas['PERTINENCIA_DURACION'] || 0, 2, 'nueva ejecucion: se vuelve a leer');
  } finally { SpreadsheetApp.openById = realOpen; }
});

prueba('aviso de frecuencia imposible (c/3 h) en el caso PROA y en la revision', function () {
  assert.strictEqual(avisoFrecuencia({ nombre: 'VANCOMICINA', frecuencia: '3' }), 'Verificar frecuencia de VANCOMICINA: c/3 h');
  ['4', '6', '8', '12', '24', '0', '', 'Dosis Unica'].forEach(function (f) { assert.strictEqual(avisoFrecuencia({ nombre: 'X', frecuencia: f }), '', f); });
  var nv = eventoBase(); nv[SLOTS[0].nombre] = ['DAPTOMICINA - UT-1']; nv[SLOTS[0].dosis] = ['500']; nv[SLOTS[0].frecuencia] = ['2']; nv[SLOTS[0].dias] = ['21'];
  incluye(construirMensajeDesdeEvento({ namedValues: nv }), '\n   ⚠️ Verificar frecuencia de DAPTOMICINA: c/2 h');
});

prueba('crearTriggerFormSubmit deja un solo activador del formulario', function () {
  var activadores = [
    { f: 'notificarNuevaRespuesta' }, { f: 'notificarNuevaRespuesta' }, { f: 'otraFuncion' }
  ].map(function (x) { return { getHandlerFunction: function () { return x.f; } }; });
  var creados = [], real = global.ScriptApp;
  global.ScriptApp = {
    getProjectTriggers: function () { return activadores.slice(); },
    deleteTrigger: function (t) { activadores.splice(activadores.indexOf(t), 1); },
    newTrigger: function (f) {
      var b = { forSpreadsheet: function () { return b; }, onFormSubmit: function () { return b; },
        create: function () { var t = { getHandlerFunction: function () { return f; } }; activadores.push(t); creados.push(f); return t; } };
      return b;
    }
  };
  try {
    crearTriggerFormSubmit();
    assert.deepStrictEqual(activadores.map(function (t) { return t.getHandlerFunction(); }).sort(), ['notificarNuevaRespuesta', 'otraFuncion']);
    assert.deepStrictEqual(creados, ['notificarNuevaRespuesta']);
  } finally { global.ScriptApp = real; }
});

prueba('ninguna credencial hardcodeada y solo grupos @g.us', function () {
  assert.ok(src.indexOf("getProperty('GREENAPI_API_TOKEN')") > -1);
  assert.ok(!/https:\/\/\d+\.api\.greenapi\.com/.test(src));
  assert.ok(!/@c\.us/.test(src));
  assert.ok(/@g\.us/.test(src));
  // la API de la IA solo se llama desde IA_PROA.gs y la clave sale de Propiedades del script
  assert.ok(src.indexOf('api.anthropic.com') === -1 && src.indexOf('x-api-key') === -1);
  assert.ok(srcIa.indexOf('getProperty("ANTHROPIC_API_KEY")') > -1);
  assert.ok(!/sk-ant/.test(src + srcIa)); assert.ok(!/@c\.us/.test(srcIa)); assert.ok(/@g\.us$/.test(IA_CHAT_PRUEBA));
});

// ---- Informe semanal PROA (IA_PROA.gs) con la API simulada ---------------------------------------------
// Green-API responde bien y la API de la IA devuelve respuesta(n); cualquier otra URL es un error.
function conApiInforme(respuesta, fn) {
  var real = global.UrlFetchApp, peticiones = []; envios = [];
  var r = function (codigo, texto) { return { getResponseCode: function () { return codigo; }, getContentText: function () { return texto; } }; };
  global.UrlFetchApp = { fetch: function (url, op) {
    if (url.indexOf('greenapi.test') > -1) { envios.push(JSON.parse(op.payload)); return r(200, JSON.stringify({ idMessage: 'MSG' + envios.length })); }
    if (url === IA_URL) {
      peticiones.push({ headers: op.headers, payload: op.payload, cuerpo: JSON.parse(op.payload) });
      var x = typeof respuesta === 'function' ? respuesta(peticiones.length) : respuesta;
      if (x instanceof Error) throw x;
      return r(x.codigo || 200, typeof x.cuerpo === 'string' ? x.cuerpo : JSON.stringify(x.cuerpo));
    }
    throw new Error('URL inesperada: ' + url);
  } };
  try { fn(peticiones); } finally { global.UrlFetchApp = real; }
}
function respuestaInforme(hallazgos, sugerencias) {
  return { cuerpo: { model: 'claude-opus-5-5', stop_reason: 'end_turn', usage: { input_tokens: 12000, output_tokens: 3000 },
    content: [{ type: 'thinking', thinking: 'Resumen del razonamiento.' }, { type: 'text', text: JSON.stringify({ hallazgos: hallazgos, sugerencias: sugerencias || [] }) }] } };
}
function propsInforme(extra) {
  var P = Object.assign({ GREENAPI_ID_INSTANCE: '1', GREENAPI_API_TOKEN: 't', GREENAPI_GROUP_CHATID: '111@g.us', GREENAPI_API_URL: 'https://greenapi.test',
    ANTHROPIC_API_KEY: 'clave-de-prueba' }, extra || {});
  global.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return P[k] || null; } }; } };
}
function filaInforme(fecha, hc, extra, ams) {
  var fila = filaMatriz(fecha, hc, ams);
  var datos = Object.assign({ 'Peso en Kg': '70' }, extra);
  Object.keys(datos).forEach(function (k) { fila[ENCABEZADOS_REALES.indexOf(k)] = datos[k]; });
  return fila;
}
var LUNES_23_11 = new Date(2026, 10, 23, 7, 0, 0);
var CHAT_PRUEBA_BOT = '120363412506101174@g.us';
// Una semana ficticia (16/11-22/11) y la anterior (09/11-15/11); corre fn con esa matriz y ese registro.
function conSemanaFicticia(fn) {
  var matrizReal = HOJAS['Respuestas de formulario 1'], informesReal = HOJAS['INFORMES_PROA'];
  var UCI = 'Unidad de Cuidado Crítico UCI A', MI = 'Hospitalización Medicina Interna';
  var EMP = 'Tratamiento Empírico (En presencia o sospecha de infección sin germen documentado - sin antibiograma))';
  var ETI = 'Tratamiento Etiológico (En presencia de aislamiento conocido)', PRO = 'Profiláctico';
  var S = 'Servicio actual', T = 'Indicación del antibiótico', C = 'Cultivos tomados:', I = '¿Solicitó interconsulta por infectología en Dinámica Gerencial?';
  var D = 'Diagnóstico CIE10 para la cual se prescribe el antimicrobiano';
  var x = function (s, t, c, i, d) { var o = {}; o[S] = s; o[T] = t; o[C] = c; o[I] = i; o[D] = d; return o; };
  HOJAS['Respuestas de formulario 1'] = hojaDeFilas([ENCABEZADOS_REALES,
    // historia (antes de los dos periodos): cuenta para la continuidad de 1001 y 1002
    filaInforme('07/11/2026 08:00:00', '1001', x(UCI, EMP, 'NINGUNO', 'No', 'L031'), [['ERTAPENEM', '1000', '24', '7']]),
    filaInforme('08/11/2026 08:00:00', '1002', x(MI, EMP, 'HEMOCULTIVO', 'No', 'A419'), [['PIPERACILINA / TAZOBACTAM', '4500', '6', '7']]),
    // semana anterior (09/11-15/11)
    filaInforme('10/11/2026 08:00:00', '2001', x(MI, EMP, 'HEMOCULTIVO', 'No', 'A419'), [['MEROPENEM', '1000', '8', '7']]),
    filaInforme('12/11/2026 08:00:00', '2002', x(UCI, EMP, 'NINGUNO', 'No', 'L031'), [['ERTAPENEM', '1000', '24', '7']]),
    filaInforme('15/11/2026 23:00:00', '2003', x(MI, EMP, 'HEMOCULTIVO', 'No', 'J189'), [['CEFEPIME', '2000', '8', '7']]),
    // semana del informe (16/11-22/11)
    filaInforme('16/11/2026 08:00:00', '1001', x(UCI, EMP, 'NINGUNO, ', 'Sí', 'L031'), [['ERTAPENEM', '1000', '24', '7']]),
    filaInforme('17/11/2026 09:00:00', '1002', x(MI, EMP, 'HEMOCULTIVO', 'No', 'A419'), [['MEROPENEM', '1000', '8', '7'], ['VANCOMICINA', '1000', '12', '7']]),
    filaInforme('18/11/2026 10:00:00', '1001', x(UCI, ETI, 'HEMOCULTIVO', 'No', 'neumonia'), [['ERTAPENEM', '1000', '24', '7']]),
    filaInforme('19/11/2026 11:00:00', '1003', x('Cirugía', PRO, '', 'No', 'T814'), [['CEFAZOLINA', '2000', '8', '3']]),
    filaInforme('20/11/2026 14:00:00', '1005', x(UCI, EMP, '..', 'No', 'L031'), [['ERTAPENEM', '1000', '24', '5']]),
    filaInforme('21/11/2026 12:00:00', '1004', x(UCI, ETI, 'HEMOCULTIVO', 'Sí', 'B377'), [['CASPOFUNGINA', '70', '24', '14']]),
    filaInforme('23/11/2026 06:00:00', '1009', x(UCI, EMP, 'NINGUNO', 'No', 'L031'), [['ERTAPENEM', '1000', '24', '7']])   // hoy: no entra
  ]);
  delete HOJAS['INFORMES_PROA'];
  try { fn(); } finally {
    HOJAS['Respuestas de formulario 1'] = matrizReal;
    if (informesReal) HOJAS['INFORMES_PROA'] = informesReal; else delete HOJAS['INFORMES_PROA'];
  }
}
// 1001: ertapenem desde el 07/11 (renovaciones dentro de la tolerancia) hasta el fin de su orden del 18/11 = 18 d;
// 1002: piperacilina/tazobactam desde el 08/11 y meropenem + vancomicina el 17/11 = 16 d de antibiotico (7 d de cada uno);
// 1003: 3 d; 1005: 5 d; 1004: caspofungina 14 d. Ertapenem: (18 + 5) / 2 = 11,5 d. Mas largos: 18, 16 y 14 d.
var CIFRAS_SEMANA = '*📊 INFORME SEMANAL PROA · 16/11–22/11*\n' +
  '📝 6 solicitudes (sem. ant. 3) · 5 pacientes · 4 con restringido (sem. ant. 1)\n' +
  '💊 Promedio de días por antimicrobiano (pacientes): ERTAPENEM 11,5 d (2) · CASPOFUNGINA 14 d (1) · MEROPENEM 7 d (1) · VANCOMICINA 7 d (1)\n' +
  '🔒 Restringidos: ERTAPENEM 11,5 d (2) · CASPOFUNGINA 14 d (1) · VANCOMICINA 7 d (1)\n' +
  '🏥 Servicios: UCI A 67% · Hosp. Medicina Interna 17% · Cirugía 17%\n' +
  '🧫 Empírico 50% (67% sin cultivos) · Etiológico 33% · Profiláctico 17% · 1 con profilaxis de más de 1 día\n' +
  '🧪 Restringidos con interconsulta a Infectología: 50%\n' +
  '⏳ Más largos: HC 1001 UCI A *18 d* · HC 1002 Hosp. Medicina Interna *16 d* · HC 1004 UCI A *14 d*';

prueba('informe semanal: cifras de la semana calculadas por el codigo, sin IA si no hay clave', function () {
  var propsReal = global.PropertiesService;
  propsInforme({ ANTHROPIC_API_KEY: '' });
  try {
    conSemanaFicticia(function () {
      conApiInforme(function () { throw new Error('no debia llamarse a la API'); }, function (peticiones) {
        var inf = construirInformeProa_(LUNES_23_11, 7);
        assert.strictEqual(inf.mensaje, CIFRAS_SEMANA);
        assert.strictEqual(inf.anterior.periodo, '09/11–15/11'); assert.strictEqual(inf.anterior.solicitudes, 3);
        noIncluye(inf.mensaje, 'Caso PROA'); noIncluye(inf.mensaje, 'Datos por corregir');
        assert.strictEqual(peticiones.length, 0);
        // el activador envia a PRUEBA BOT por defecto y deja la fila en INFORMES_PROA
        enviarInforme_(LUNES_23_11);
        assert.strictEqual(envios.length, 1); assert.strictEqual(envios[0].chatId, CHAT_PRUEBA_BOT);
        assert.strictEqual(envios[0].message, CIFRAS_SEMANA + '\n\n_Ecosistema de Vigilancia Digital Servicio Farmacéutico · QF JPSN_');
        var fila = HOJAS['INFORMES_PROA']._filas[1];
        assert.deepStrictEqual(HOJAS['INFORMES_PROA']._filas[0], ENCABEZADOS_INFORMES);
        assert.strictEqual(fila[1], '16/11–22/11'); assert.strictEqual(fila[2], 'PRUEBA BOT'); assert.strictEqual(fila[3], 'SI');
        assert.strictEqual(fila[4], CIFRAS_SEMANA); incluye(fila[5], 'sin IA'); assert.strictEqual(fila[6], '');
      });
    });
    // nombres de servicio y cultivos tal como vienen en la matriz real
    assert.strictEqual(servicioCorto('Unidad de Cuidado Crítico UCI B'), 'UCI B'); assert.strictEqual(servicioCorto('Unidad de Cuidado Crítico PEDIATRÍA'), 'UCI PEDIATRÍA');
    assert.strictEqual(servicioCorto('Unidad de Cuidados Intermedios UCI NEO 1/2'), 'Intermedios UCI NEO 1/2'); assert.strictEqual(servicioCorto(''), 'Sin servicio');
    ['NINGUNO', 'NINGUNO, ', '..', '', 'pendiente'].forEach(function (v) { assert.strictEqual(sinCultivos(v), true, v); });
    ['UROCULTIVO, NINGUNO', 'CULTIVO DE LCR ', 'SECRECIÓN'].forEach(function (v) { assert.strictEqual(sinCultivos(v), false, v); });
    // semana sin solicitudes
    var vacia = datosInforme_([], new Date(2026, 10, 16), new Date(2026, 10, 23));
    assert.strictEqual(mensajeInforme_(vacia, vacia, null), '*📊 INFORME SEMANAL PROA · 16/11–22/11*\nSin solicitudes en el formulario en este periodo (sem. ant. 0).');
  } finally { global.PropertiesService = propsReal; }
});

prueba('informe semanal con IA: lectura con cifras de los datos; se descartan cifras inventadas y lenguaje de juicio', function () {
  var propsReal = global.PropertiesService;
  propsInforme();
  try {
    conSemanaFicticia(function () {
      conApiInforme(respuestaInforme([
        { indicador: 'servicios', texto: 'UCI A concentró el 67 % de las solicitudes de la semana.' },
        { indicador: 'comparacion', texto: 'Las solicitudes subieron un 66% frente a la semana anterior' },
        { indicador: 'antimicrobianos', texto: 'Ertapenem promedió 11.5 días en 2 pacientes' },
        { indicador: 'duracion', texto: 'El tratamiento antibiótico continuo promedió 10,5 días por paciente' },
        { indicador: 'servicios', texto: 'Hay abuso de carbapenémicos en UCI A' }
      ], [{ texto: 'Revisar con UCI A la toma de cultivos antes del tratamiento empírico' }]), function (peticiones) {
        enviarInforme_(LUNES_23_11);
        assert.strictEqual(envios.length, 1); assert.strictEqual(envios[0].chatId, CHAT_PRUEBA_BOT);
        assert.strictEqual(envios[0].message.indexOf(CIFRAS_SEMANA), 0);
        incluye(envios[0].message, CIFRAS_SEMANA + '\n\n*🤖 Lectura de la semana (IA)*\n• UCI A concentró el 67% de las solicitudes de la semana\n' +
          '• Ertapenem promedió 11,5 días en 2 pacientes\n*Para el comité*\n' +
          '• Revisar con UCI A la toma de cultivos antes del tratamiento empírico\n_Cifras del formulario; lectura automática para el comité PROA_');
        noIncluye(envios[0].message, '66%'); noIncluye(envios[0].message, 'abuso');
        // la peticion: modelo, esfuerzo, salida estructurada, respaldo; solo cifras agregadas, sin historias clinicas
        assert.strictEqual(peticiones.length, 1);
        var c = peticiones[0].cuerpo;
        assert.strictEqual(c.model, 'claude-opus-5-5'); assert.strictEqual(c.output_config.effort, 'high');
        assert.strictEqual(c.output_config.format.type, 'json_schema'); assert.strictEqual(c.fallbacks, 'default');
        assert.strictEqual(peticiones[0].headers['anthropic-beta'], 'server-side-fallback-2026-07-01'); assert.strictEqual(peticiones[0].headers['x-api-key'], 'clave-de-prueba');
        // el razonamiento no se pide en la respuesta (se declina como reasoning_extraction): se lee del resumen de thinking
        assert.deepStrictEqual(c.thinking, { type: 'adaptive', display: 'summarized' }); assert.ok(!('temperature' in c));
        assert.ok(!('analisis' in c.output_config.format.schema.properties)); noIncluye(c.system, 'analisis');
        incluye(c.messages[0].content, '"solicitudes": 6'); incluye(c.messages[0].content, '"promedio_dias": 11.5');
        noIncluye(c.messages[0].content, 'tratamiento_continuo'); incluye(c.messages[0].content, '"periodo": "09/11–15/11"');
        ['1001', '1002', '1004', '2002', '"hc"'].forEach(function (x) { noIncluye(peticiones[0].payload, x); });
      });
      var fila = HOJAS['INFORMES_PROA']._filas[1];
      assert.strictEqual(fila[6], 'claude-opus-5-5'); assert.strictEqual(fila[7], 12000); assert.strictEqual(fila[8], 3000); assert.strictEqual(fila[9], 0.108);
      incluye(fila[5], 'cifra que no está en los datos: 66'); incluye(fila[5], 'cifra que no está en los datos: 10,5'); incluye(fila[5], 'lenguaje de juicio'); incluye(fila[5], 'Razonamiento (resumen): Resumen del razonamiento.');
    });
  } finally { global.PropertiesService = propsReal; }
});

prueba('informe semanal: destino PRODUCCION, reintento con esfuerzo medio si tarda y sin lectura si la API falla', function () {
  var propsReal = global.PropertiesService;
  try {
    conSemanaFicticia(function () {
      propsInforme({ INFORME_PROA_DESTINO: 'produccion' });
      conApiInforme(function (n) { return n === 1 ? new Error('Timeout: ' + IA_URL) : respuestaInforme([{ indicador: 'servicios', texto: 'UCI A concentró el 67% de las solicitudes' }]); },
        function (peticiones) {
          enviarInforme_(LUNES_23_11);
          assert.strictEqual(envios[0].chatId, '111@g.us'); incluye(envios[0].message, '• UCI A concentró el 67% de las solicitudes');
          assert.strictEqual(peticiones.length, 2); assert.strictEqual(peticiones[1].cuerpo.output_config.effort, 'medium');
          assert.strictEqual(HOJAS['INFORMES_PROA']._filas[1][2], 'PRODUCCION');
        });
      [[{ codigo: 500, cuerpo: 'error' }, 'IA sin respuesta: HTTP 500'],
       [{ cuerpo: { stop_reason: 'refusal', stop_details: { category: 'reasoning_extraction' }, content: [] } }, 'IA sin respuesta: el modelo declinó, categoría reasoning_extraction']].forEach(function (caso) {
        conApiInforme(caso[0], function () {
          enviarInforme_(LUNES_23_11);
          assert.strictEqual(envios.length, 1); assert.strictEqual(envios[0].message.split('\n\n_Ecosistema')[0], CIFRAS_SEMANA);
          var filas = HOJAS['INFORMES_PROA']._filas; incluye(filas[filas.length - 1][5], caso[1]);
        });
      });
    });
  } finally { global.PropertiesService = propsReal; }
});

prueba('crearTriggerInformeProa deja un solo activador semanal (lunes 7:00, hora de Colombia)', function () {
  var activadores = [{ f: 'enviarInformeSemanalProa' }, { f: 'notificarNuevaRespuesta' }].map(function (x) { return { getHandlerFunction: function () { return x.f; } }; });
  var creado = null, real = global.ScriptApp;
  global.ScriptApp = {
    WeekDay: { MONDAY: 'MONDAY' },
    getProjectTriggers: function () { return activadores.slice(); },
    deleteTrigger: function (t) { activadores.splice(activadores.indexOf(t), 1); },
    newTrigger: function (f) {
      var cfg = { f: f };
      var b = { timeBased: function () { return b; }, onWeekDay: function (d) { cfg.dia = d; return b; }, atHour: function (h) { cfg.hora = h; return b; },
        inTimezone: function (z) { cfg.zona = z; return b; },
        create: function () { creado = cfg; var t = { getHandlerFunction: function () { return f; } }; activadores.push(t); return t; } };
      return b;
    }
  };
  try {
    crearTriggerInformeProa();
    assert.deepStrictEqual(activadores.map(function (t) { return t.getHandlerFunction(); }).sort(), ['enviarInformeSemanalProa', 'notificarNuevaRespuesta']);
    assert.deepStrictEqual(creado, { f: 'enviarInformeSemanalProa', dia: 'MONDAY', hora: 7, zona: 'America/Bogota' });
  } finally { global.ScriptApp = real; }
});

console.log();
if (fallos) { console.log(fallos + ' prueba(s) fallaron.'); process.exit(1); }
console.log('OK: filtro y construccion de mensaje verificados sin llamar ninguna API externa.');
console.log('\n--- Ejemplo (caso ceftazidima/avibactam) ---\n' + construirMensajeDesdeEvento(eventoPruebaCeftazidimaAvibactam()));
