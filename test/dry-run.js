// test/dry-run.js
//
// Carga el Codigo.gs REAL en Node con los servicios de Apps Script simulados
// (hoja con las pestanas ANTIMICROBIANOS_RESTRINGIDOS, CIE10 y RANGOS_DOSIS,
// CacheService, Utilities) y verifica el filtro y el mensaje. No hay red,
// credenciales ni envios.
//
// Uso: node test/dry-run.js

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var src = fs.readFileSync(path.join(__dirname, '..', 'Codigo.gs'), 'utf8');

// ---- Hoja simulada --------------------------------------------------------
var CIE10 = { B377: 'CANDIDIASIS, NO ESPECIFICADA', A419: 'SEPSIS, NO ESPECIFICADA', N390: 'INFECCION DE VIAS URINARIAS, SITIO NO ESPECIFICADO',
  G060: 'ABSCESO Y GRANULOMA INTRACRANEAL', J40X: 'BRONQUITIS, NO ESPECIFICADA COMO AGUDA O CRONICA',
  T857: 'INFECCION Y REACCION INFLAMATORIA DEBIDAS A OTROS DISPOSITIVOS PROTESICOS, IMPLANTES E INJERTOS INTERNOS' };
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
        getValue: function () { return sub[0][0]; },
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
var srcIa = fs.readFileSync(path.join(__dirname, '..', 'IA_PROA.gs'), 'utf8');
(0, eval)(srcIa);

var fallos = 0;
function prueba(desc, fn) {
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
  var cv = filtrarAntimicrobianosRestringidos(eventoPruebaVancomicinaSola());
  assert.strictEqual(cv.length, 1); assert.strictEqual(cv[0].dispara, false);
  HOJAS['ANTIMICROBIANOS_RESTRINGIDOS'] = original;
  ['CASPOFUNGINA 50, 70 - UT-1', 'ANFOTERICINA B LIPOSOMAL - UT-1', 'TYGECICLINA - UT-1', 'DORIPENEM - UT-1', 'RIFAMPICINA - UT-1',
    'POLIMIXINA B - UT-1', 'DAPTOMICINA - UT-1'].forEach(function (n) {
    var nv = eventoBase(); nv['Nombre Antimicrobiano 1'] = [n];
    assert.strictEqual(filtrarAntimicrobianosRestringidos({ namedValues: nv }).length, 1, n);
  });
});

prueba('CIE10: punto, 3 caracteres (+X), minusculas, sin codigo y cache', function () {
  assert.strictEqual(formatearDiagnosticoCIE10('G06.0'), 'G060 - ' + CIE10.G060);
  assert.strictEqual(formatearDiagnosticoCIE10('M46.3:'), 'M46.3:'); // no esta en el catalogo simulado
  assert.strictEqual(formatearDiagnosticoCIE10('J40'), 'J40X - ' + CIE10.J40X);
  assert.strictEqual(formatearDiagnosticoCIE10('a419 sepsis'), 'A419 - ' + CIE10.A419);
  assert.strictEqual(formatearDiagnosticoCIE10('SX FEBRIL EN ESTUDIO'), 'SX FEBRIL EN ESTUDIO');
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
  incluye(t, 'Edad: 54 años · ⚖️ Peso: 70 kg');
  incluye(t, 'Servicio: Unidad de Cuidado Crítico UCI C · Cama: C13');
  incluye(t, 'A419 - SEPSIS, NO ESPECIFICADA');
  incluye(t, 'Indicación: Etiológico · Cultivos: HEMOCULTIVO · Origen: IAAS');
  incluye(t, 'Interconsulta Infectología (Dinámica Gerencial): Sí');
  noIncluye(t, 'Sin interconsulta');
  noIncluye(t, 'Cambio de antimicrobiano');
  noIncluye(t, 'Ajuste renal');
  incluye(t, 'Antimicrobiano restringido 1: DAPTOMICINA');
  incluye(t, 'Dosis: 420 mg (6 mg/kg) · Intravenoso · cada 24 horas');
  assert.ok(/Días ordenados: 14 días · hasta \d\d\/\d\d\/\d{4}/.test(t), t);
  noIncluye(t, 'fuera del rango');
  incluye(t, '➕ Acompañante: MEROPENEM · 1000 mg (14,3 mg/kg) · Intravenoso · cada 8 horas · 7 días · hasta');
  noIncluye(t, 'Antimicrobiano restringido 2');
});

prueba('mensaje: ceftazidima/avibactam 750 mg, cambio, ajuste renal, sin interconsulta, N39.0', function () {
  var e = eventoPruebaCeftazidimaAvibactam();
  var t = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(t, 'N390 - INFECCION DE VIAS URINARIAS');
  incluye(t, 'Indicación: Empírico · Cultivos: UROCULTIVO · Origen: IAAS');
  incluye(t, '🔄 Cambio de antimicrobiano: Por antibiograma');
  incluye(t, '⚠️ Sin interconsulta a Infectología');
  incluye(t, '💧 Ajuste renal: Sí');
  noIncluye(t, 'no requiere ajuste renal');
  incluye(t, 'Dosis: 750 mg (10,7 mg/kg) · Intravenoso · cada 12 horas');
  incluye(t, '⚠️ Dosis fuera del rango de referencia (940-2500 mg/dosis o 30-65 mg/kg/dosis): revisar');
  noIncluye(t, 'Acompañante');
});

prueba('vancomicina en 2.o lugar con ceftazidima/avibactam: se muestra como restringida, no como acompanante', function () {
  var nv = eventoPruebaCeftazidimaAvibactam().namedValues;
  nv['Nombre Antimicrobiano 2'] = ['VANCOMICINA - UT-19993853-1']; nv['Dosis en miligramos o UI AM2'] = ['500'];
  nv['Vía de adminsitración de  AM2'] = ['Intravenoso']; nv['Frecuencia AM 2 (En horas)'] = ['12']; nv['Días ordenados AM2'] = ['14'];
  var c = filtrarAntimicrobianosRestringidos({ namedValues: nv });
  assert.strictEqual(c.length, 2); assert.strictEqual(debeAlertar(c), true);
  var t = construirMensajeDesdeEvento({ namedValues: nv }, c);
  incluye(t, 'Antimicrobiano restringido 1: CEFTAZIDIMA / AVIBACTAM');
  incluye(t, 'Antimicrobiano restringido 2: VANCOMICINA');
  incluye(t, 'Dosis: 500 mg (7,1 mg/kg) · Intravenoso · cada 12 horas');
  incluye(t, '(10-35 mg/kg/dosis): revisar');
  noIncluye(t, 'Acompañante: VANCOMICINA');
  // vancomicina sola: ni mensaje ni envio
  var sola = eventoPruebaVancomicinaSola();
  assert.strictEqual(debeAlertar(filtrarAntimicrobianosRestringidos(sola)), false);
});

prueba('mensaje: pediatrico con peso en gramos, caspofungina en dosis unica', function () {
  var e = eventoPruebaPediatrico();
  var t = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(t, 'Edad: 4 meses · ⚖️ Peso: 7,5 kg');
  incluye(t, 'Servicio: Hospitalización Pediatría · Cama: 208');
  incluye(t, 'B377 - CANDIDIASIS, NO ESPECIFICADA');
  incluye(t, 'Dosis: 27 mg (3,6 mg/kg) · Intravenoso · Dosis única');
  incluye(t, 'Días ordenados: Dosis Unica');
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
  incluye(construirMensajeDesdeEvento({ namedValues: nv }), '💡 Sugerencia PROA: terapia empírica combinada (CASPOFUNGINA 50, 70 + MEROPENEM). Revaluar a las 48-72 h con el resultado de cultivos para desescalar.');
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
  incluye(construirMensajeDesdeEvento({ namedValues: nv }), '💧 Ajuste renal: Sí · CASPOFUNGINA 50, 70 no requiere ajuste renal');
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
  incluye(l, '🔴 *Pertinencia PROA: se sugiere revaluar*');
  incluye(l, '📏 Días · Infección urinaria complicada / pielonefritis: referencia 5-7 d (IDSA 2025 ITU complicada; ACIN Infectio 2023)');
  incluye(l, '🔴 ERTAPENEM 14 d: supera la referencia; se sugiere revaluar la duración · hasta 10-14 d si hay absceso');   // el doble: rojo
  l = evaluarPertinencia('N390', 'Empírico', 'E. coli BLEE', [am('ERTAPENEM', '10')]).join('\n');
  incluye(l, '🟡 *Pertinencia PROA: se sugiere verificar*'); incluye(l, '🟡 ERTAPENEM 10 d: supera la referencia; se sugiere revaluar la duración');
  l = evaluarPertinencia('N390', 'Empírico', 'E. coli BLEE', [am('ERTAPENEM', '7')]).join('\n');
  incluye(l, '🟢 *Pertinencia PROA: acorde con la referencia*');
  incluye(l, '🟢 ERTAPENEM: acorde con la referencia · el aislamiento registrado está dentro de su indicación');
  incluye(l, '🟢 ERTAPENEM 7 d: dentro de la referencia'); noIncluye(l, 'supera');
  l = evaluarPertinencia('M869', 'Etiológico', 'S. aureus', [am('DAPTOMICINA', '14')]).join('\n');
  incluye(l, 'Osteomielitis / espondilodiscitis: referencia 28-42 d'); noIncluye(l, 'supera');   // por debajo del minimo no se marca
  l = evaluarPertinencia('D70X', 'Empírico', 'Ninguno', [am('CASPOFUNGINA 50, 70', '14')]).join('\n');
  incluye(l, '📏 Días · Neutropenia febril: sin foco'); noIncluye(l, 'supera'); noIncluye(l, 'dentro de la referencia');
  incluye(l, '🟢 CASPOFUNGINA 50, 70: acorde con la referencia para el foco · sin aislamiento, se sugiere revaluar con cultivos');
  l = evaluarPertinencia('C169', 'Empírico', 'Ninguno', [am('MEROPENEM', '14')]);
  assert.strictEqual(l.length, 0, 'sin sindrome ni antimicrobiano con ficha: sin lineas');
  l = evaluarPertinencia('S720', 'Profiláctico', 'Ninguno', [am('ERTAPENEM', '5')]).join('\n');
  incluye(l, '🔴 ERTAPENEM 5 d: supera las 24 h de la profilaxis; se sugiere revaluar');
  incluye(l, 'Días · profilaxis quirúrgica: máximo 24 h (OMS 2018; CDC 2017)');
  l = evaluarPertinencia('N390', 'Empírico', 'Ninguno', [am('ERTAPENEM', 'Dosis Unica')]).join('\n');
  noIncluye(l, 'dentro de la referencia'); noIncluye(l, 'supera');
});

prueba('pertinencia: veredicto de tratamiento (fichas y reglas de espectro)', function () {
  var am = function (n) { return { nombre: n, dias: '7' }; };
  function ev(dx, tipo, micro, ams) { return evaluarPertinencia(dx, tipo, micro, ams.map(am)).join('\n'); }
  incluye(ev('J189', 'Etiológico', 'SAMR', ['DAPTOMICINA']), '🔴 DAPTOMICINA: se sugiere revaluar · DAPTOMICINA no está indicada en neumonía');
  incluye(ev('A419', 'Etiológico', 'SAMR', ['DAPTOMICINA']), '🟢 DAPTOMICINA: acorde con la referencia');
  incluye(ev('A419', 'Etiológico', 'Klebsiella KPC', ['TYGECICLINA']), '🔴 TYGECICLINA: se sugiere revaluar · TIGECICLINA');
  incluye(ev('N390', 'Etiológico', 'Pseudomonas aeruginosa', ['ERTAPENEM']), 'ERTAPENEM no tiene actividad frente a Pseudomonas');
  noIncluye(ev('N390', 'Etiológico', 'E. coli BLEE', ['ERTAPENEM']), 'se sugiere revaluar ·');
  incluye(ev('G060', 'Etiológico', 'Cryptococcus neoformans', ['CASPOFUNGINA 50, 70']), 'CASPOFUNGINA no tiene actividad frente a Cryptococcus');
  incluye(ev('B377', 'Etiológico', 'Candida auris', ['CASPOFUNGINA 50, 70']), '🟢 CASPOFUNGINA 50, 70: acorde con la referencia');
  incluye(ev('A419', 'Etiológico', 'Klebsiella NDM', ['CEFTAZIDIMA / AVIBACTAM']), 'asociar aztreonam');
  var combo = ev('A419', 'Etiológico', 'Klebsiella NDM', ['CEFTAZIDIMA / AVIBACTAM', 'AZTREONAM']);
  noIncluye(combo, 'asociar aztreonam'); incluye(combo, '🟢 AZTREONAM: acorde con la referencia · combinación dentro de su indicación');
  incluye(ev('A419', 'Etiológico', 'Klebsiella KPC', ['CEFTAZIDIMA / AVIBACTAM']), '🟢 CEFTAZIDIMA / AVIBACTAM: acorde con la referencia');
  // empirica de la comunidad, sin aislamiento: reservada para carbapenemasa documentada
  incluye(ev('J189', 'Empírico', 'Ninguno', ['CEFTAZIDIMA / AVIBACTAM']), '🟡 CEFTAZIDIMA / AVIBACTAM: se sugiere verificar · sin aislamiento ni foco que lo sustente; reservado para enterobacterias con carbapenemasa');
  incluye(ev('N390', 'Etiológico', 'E. coli sensible', ['CEFTAZIDIMA / AVIBACTAM']), '🟡 CEFTAZIDIMA / AVIBACTAM: se sugiere verificar · el aislamiento registrado no está entre los que justifican su uso');
  incluye(ev('A419', 'Etiológico', 'Serratia marcescens', ['POLIMIXINA B']), 'intrínsecamente resistentes');
  incluye(ev('N390', 'Etiológico', 'Echerichia coli', ['VANCOMICINA']), 'VANCOMICINA no tiene actividad frente a gramnegativos');
  noIncluye(ev('N390', 'Etiológico', 'Echerichia coli', ['VANCOMICINA', 'MEROPENEM']), 'gramnegativos'); // hay otro que cubre
  incluye(ev('M869', 'Etiológico', 'S. aureus', ['RIFAMPICINA']), 'RIFAMPICINA no debe usarse en monoterapia');
  noIncluye(ev('A150', 'Etiológico', 'M. tuberculosis', ['RIFAMPICINA']), 'monoterapia');
  noIncluye(ev('M869', 'Etiológico', 'S. aureus', ['RIFAMPICINA', 'VANCOMICINA']), 'monoterapia');
  incluye(ev('A419', 'Etiológico', 'NINUGNO', ['ERTAPENEM']), '🟡 Indicación etiológica sin microorganismo registrado');
  incluye(ev('A419', 'Etiológico', '0', ['ERTAPENEM']), 'sin microorganismo registrado');
  noIncluye(ev('A419', 'Empírico', 'Ninguno', ['ERTAPENEM']), 'sin microorganismo');
  incluye(ev('S720', 'Profiláctico', 'Ninguno', ['ERTAPENEM']), '🟡 ERTAPENEM: se sugiere verificar · antimicrobiano restringido usado en profilaxis');
  CONFIG.PERTINENCIA_ACTIVA = false;
  assert.strictEqual(evaluarPertinencia('N390', 'Empírico', '', [{ nombre: 'ERTAPENEM', dias: '14' }]).length, 0);
  CONFIG.PERTINENCIA_ACTIVA = true;
});

prueba('pertinencia en el mensaje completo (ceftazidima/avibactam 14 d en ITU por KPC)', function () {
  var e = eventoPruebaCeftazidimaAvibactam();
  var t = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(t, '🔴 *Pertinencia PROA: se sugiere revaluar*');
  incluye(t, '🟢 CEFTAZIDIMA / AVIBACTAM: acorde con la referencia · el aislamiento registrado está dentro de su indicación');
  incluye(t, '🔴 CEFTAZIDIMA / AVIBACTAM 14 d: supera la referencia; se sugiere revaluar la duración');
  noIncluye(t, 'undefined');
});

prueba('mensaje: campos ausentes salen como "-" y nunca como undefined', function () {
  var nv = eventoBase(); nv['Nombre Antimicrobiano 1'] = ['ERTAPENEM - UT-1'];
  var t = construirMensajeDesdeEvento({ namedValues: nv });
  noIncluye(t, 'undefined'); noIncluye(t, 'NaN');
  incluye(t, 'Historia Clínica: -');
  incluye(t, 'Edad: - · ⚖️ Peso: -');
  incluye(t, 'Dosis: - · - · -');
  incluye(t, 'Días ordenados: -');
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
  incluye(t, '🔁 Seguimiento: 3 solicitudes previas en 30 días (última 14/11/2026)');
  incluye(t, 'ERTAPENEM: también solicitado hace 2 h (500 mg cada 24 h, 3 d); posible solicitud repetida');
  incluye(t, 'ERTAPENEM: en curso desde 01/11/2026 (13 d); con esta orden completaría 20 d');
  incluye(t, 'Otros antimicrobianos previos: VANCOMICINA (01/11/2026, 5 d)');
  noIncluye(t, 'DAPTOMICINA');
  var msg = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(msg, '🔁 Seguimiento: 3 solicitudes previas');
  // 7 d ordenados estarian dentro de 5-7 d, pero el curso completo (20 d) supera el doble
  incluye(msg, '🔴 ERTAPENEM 7 d (20 d acumulados desde 01/11/2026): supera la referencia; se sugiere revaluar la duración');
  incluye(textoCasoIa_(e, filtrarAntimicrobianosRestringidos(e)), 'Solicitudes previas del mismo paciente');
  noIncluye(textoCasoIa_(e, filtrarAntimicrobianosRestringidos(e)), '123456');
  // paciente sin historia: sin seguimiento
  var e2 = eventoSeguimiento('14/11/2026 09:00:00', '555', 'N390', [['ERTAPENEM', '1000', '24', '7']]);
  assert.strictEqual(seguimientoPaciente(e2).lineas.length, 0);
  incluye(construirMensajeDesdeEvento(e2), '🟢 ERTAPENEM 7 d: dentro de la referencia');
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
  assert.strictEqual(r['Antimicrobianos restringidos'], 'ERTAPENEM 7 d'); assert.strictEqual(r['Solicitudes previas (30 d)'], 3);
  incluye(r['Diagnóstico'], 'N390 - INFECCION DE VIAS URINARIAS');
});

prueba('tablas: Candida solo en orina, antifungico en foco bacteriano y caspofungina 70 mg de mantenimiento', function () {
  var ams = [{ nombre: 'CASPOFUNGINA 50, 70', dias: '7', dosis: '70' }];
  var l = analisisPertinencia('N390', 'Etiológico', 'CANDIDA AURIS', ams, { cultivos: 'UROCULTIVO' });
  assert.strictEqual(l.nivel, 1);
  incluye(l.lineas.join('\n'), '🟡 CASPOFUNGINA 50, 70: se sugiere verificar · Candida solo en urocultivo suele ser colonización');
  incluye(l.lineas.join('\n'), '⚪ CASPOFUNGINA 50, 70 7 d: sin duración de referencia para un antifúngico en este foco');
  noIncluye(l.lineas.join('\n'), 'Infección urinaria complicada'); assert.strictEqual(l.encabezadoDias, '');
  noIncluye(l.lineas.join('\n'), 'dentro de la referencia');
  l = analisisPertinencia('N390', 'Etiológico', 'CANDIDA AURIS', ams, { cultivos: 'HEMOCULTIVO, UROCULTIVO' }).lineas.join('\n');
  incluye(l, '🟢 CASPOFUNGINA 50, 70: acorde con la referencia');
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
  incluye(formatearDiagnosticoCIE10('SEPSIS DE ORIGEN URINARIO A419'), 'A419 - SEPSIS, NO ESPECIFICADA');
  assert.strictEqual(edadTexto('58', '695', '21170'), '58 años');
  assert.strictEqual(edadTexto('0', '4', '0'), '4 meses');
  assert.strictEqual(edadTexto('2', '6', ''), '2 años 6 meses');
});

var envios = [];
// UrlFetchApp simulado para IA_PROA.gs: sirve las fichas reales de docs/ y una respuesta fija de la API.
function conApiSimulada(respuestaApi, fn) {
  var real = global.UrlFetchApp, llamadas = []; envios = [];
  global.UrlFetchApp = { fetch: function (url, op) {
    if (url.indexOf('raw.githubusercontent.com') > -1) {
      var doc = fs.readFileSync(path.join(__dirname, '..', 'docs', url.split('/').pop()), 'utf8');
      return { getResponseCode: function () { return 200; }, getContentText: function () { return doc; } };
    }
    if (url.indexOf('greenapi.test') > -1) {
      envios.push(JSON.parse(op.payload));
      return { getResponseCode: function () { return 200; }, getContentText: function () { return JSON.stringify({ idMessage: 'MSG' + envios.length }); } };
    }
    assert.ok(/^https:\/\/api\.anthropic\.com\/v1\/messages$/.test(url), 'solo la API de mensajes: ' + url);
    llamadas.push({ cuerpo: JSON.parse(op.payload), encabezados: op.headers });
    var r = typeof respuestaApi === 'function' ? respuestaApi(llamadas.length) : respuestaApi;
    return { getResponseCode: function () { return r.codigo || 200; }, getContentText: function () { return JSON.stringify(r.cuerpo); } };
  } };
  try { fn(llamadas); } finally { global.UrlFetchApp = real; }
}
function respuestaIa(salida) {
  return { cuerpo: { model: 'claude-sonnet-5-5', stop_reason: 'end_turn', usage: { input_tokens: 9000, output_tokens: 300 },
    content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(salida) }] } };
}

prueba('revision (IA_PROA.gs): analisis del modelo, conciso, con las fichas y las tablas como referencia', function () {
  var e = eventoPruebaCeftazidimaAvibactam();
  var co = filtrarAntimicrobianosRestringidos(e);
  var cfg = { clave: 'CLAVE-DE-PRUEBA', modelo: IA_MODELO_DEFECTO };
  assert.strictEqual(IA_MODELO_DEFECTO, 'claude-sonnet-5-5');
  var salida = { analisis: 'repaso de factores',
    tratamiento: [{ antimicrobiano: 'Ceftazidima/avibactam', nivel: 'pertinente', motivo: 'El aislamiento registrado (*KPC*) está dentro de su indicación' },
      { antimicrobiano: 'COLISTINA', nivel: 'no_pertinente', motivo: 'no es de esta solicitud' }],
    dias: [{ antimicrobiano: 'CEFTAZIDIMA / AVIBACTAM', nivel: 'no_pertinente', motivo: 'supera la referencia · hasta 10-14 d si hay absceso u obstrucción' }],
    datos_faltantes: ['antibiograma'] };
  conApiSimulada(respuestaIa(salida), function (llamadas) {
    var rev = revisarCasoConIa_(e, co, cfg);
    assert.strictEqual(llamadas.length, 1);
    var c = llamadas[0].cuerpo;
    assert.strictEqual(c.model, 'claude-sonnet-5-5');
    assert.strictEqual(c.output_config.format.type, 'json_schema');
    assert.strictEqual(c.fallbacks, 'default');
    assert.ok(!('thinking' in c) && !('temperature' in c));
    incluye(c.system, 'antimicrobianos-restringidos.md'); incluye(c.system, 'Candida auris'); incluye(c.system, 'TABLA DE DURACIÓN POR SÍNDROME');
    incluye(c.system, 'Infección urinaria complicada / pielonefritis (CIE10 N39, N10, N12, N30): 5-7 días');
    var caso = c.messages[0].content;
    incluye(caso, 'Análisis de las tablas del bot'); incluye(caso, 'CEFTAZIDIMA / AVIBACTAM 14 d: supera la referencia; se sugiere revaluar la duración');
    noIncluye(caso, '88888888'); noIncluye(caso, 'Historia');   // seudonimizado
    assert.strictEqual(rev.veredicto, 'intervenir');
    var r = mensajeRevision_(e, co, rev);
    assert.strictEqual(r, ['🔎 *Revisión PROA · Ceftazidima / avibactam*',
      '🔴 *Se sugiere revaluar*',
      '🔴 Ceftazidima / avibactam 14 d: supera la referencia · hasta 10-14 d si hay absceso u obstrucción',
      '🟢 Lo demás, sin observaciones',
      '📏 Infección urinaria complicada / pielonefritis: 5-7 d (IDSA 2025 ITU complicada; ACIN Infectio 2023)',
      '_Análisis asistido por IA_'].join('\n'));   // directo: solo observaciones; lo verde resumido; lo ajeno a la solicitud se descarta
    var verde = mensajeRevision_(e, co, { veredicto: 'pertinente', tratamiento: [{ nombre: 'CEFTAZIDIMA / AVIBACTAM', nivel: 0, motivo: '' }], dias: [], encabezadoDias: '' });
    assert.strictEqual(verde.split('\n').slice(1).join('|'), '🟢 *Acorde con la referencia*|🟢 Tratamiento y días sin observaciones|_Análisis asistido por IA_');
    incluye(c.system, 'médico infectólogo'); incluye(c.system, 'químico farmacéutico clínico'); assert.strictEqual(c.output_config.effort, 'high');
    assert.deepStrictEqual(c.output_config.format.schema.required, ['analisis', 'tratamiento', 'dias', 'datos_faltantes']);
    assert.ok(r.split('\n').length <= 7, 'respuesta concisa');
  });
  // frases largas se recortan
  assert.ok(fraseIa_(new Array(60).join('palabra ')).length <= IA_MAX_CARACTERES);
  var base = construirMensajeDesdeEvento(e, co, true);
  noIncluye(base, 'Pertinencia PROA'); noIncluye(base, 'Sugerencia PROA');
  assert.ok(srcIa.indexOf('sk-ant') === -1);
});

prueba('revision (IA_PROA.gs): piso de las tablas, respaldo sin fallbacks y caida de la API', function () {
  var cfg = { clave: 'CLAVE-DE-PRUEBA', modelo: IA_MODELO_DEFECTO };
  // ertapenem con Pseudomonas: regla de espectro en rojo; el modelo no puede rebajarla
  var e = eventoPruebaIaErtapenemPseudomonas(), co = filtrarAntimicrobianosRestringidos(e);
  conApiSimulada(respuestaIa({ analisis: 'a', tratamiento: [{ antimicrobiano: 'ERTAPENEM', nivel: 'pertinente', motivo: 'x' }], dias: [], datos_faltantes: [] }), function () {
    assert.strictEqual(revisarCasoConIa_(e, co, cfg).veredicto, 'intervenir');
  });
  // la API rechaza el parametro fallbacks: se repite sin el
  conApiSimulada(function (n) {
    return n === 1 ? { codigo: 400, cuerpo: { error: { message: 'fallbacks: Extra inputs are not permitted' } } }
      : respuestaIa({ analisis: 'a', tratamiento: [{ antimicrobiano: 'ERTAPENEM', nivel: 'no_pertinente', motivo: 'x' }], dias: [{ antimicrobiano: 'ERTAPENEM', nivel: 'pertinente', motivo: 'dentro de la referencia' }], datos_faltantes: [] });
  }, function (llamadas) {
    assert.strictEqual(revisarCasoConIa_(e, co, cfg).veredicto, 'intervenir');
    var corto = mensajeRevision_(e, co, revisarCasoConIa_(e, co, cfg));
    incluye(corto, '🔴 Ertapenem: X'); noIncluye(corto, '7 d'); noIncluye(corto, '📏');   // dias de un tratamiento en rojo: no se mencionan
    assert.ok(!('fallbacks' in llamadas[1].cuerpo)); assert.ok(!llamadas[1].encabezados['anthropic-beta']);
  });
  // API caida o declinacion: sale el analisis de las tablas, y la clave no queda en el registro
  var registro = []; var logReal = Logger.log; Logger.log = function () { registro.push(Array.prototype.join.call(arguments, ' ')); };
  try {
    conApiSimulada({ codigo: 401, cuerpo: { error: { message: 'invalid x-api-key CLAVE-DE-PRUEBA' } } }, function () {
      assert.strictEqual(revisarCasoConIa_(e, co, cfg), null);
    });
    conApiSimulada({ cuerpo: { stop_reason: 'refusal', content: [] } }, function () { assert.strictEqual(revisarCasoConIa_(e, co, cfg), null); });
  } finally { Logger.log = logReal; }
  noIncluye(registro.join('\n'), 'CLAVE-DE-PRUEBA');
  var r = mensajeRevision_(e, co, null);
  incluye(r, '⚪ ERTAPENEM 7 d: la duración no se valora mientras se revalúa el tratamiento'); noIncluye(r, 'dentro de la referencia');
  incluye(r, '🔴 *Pertinencia PROA: se sugiere revaluar*'); incluye(r, 'ERTAPENEM no tiene actividad frente a Pseudomonas'); noIncluye(r, 'asistido por IA');
});

prueba('IA: solo las fichas del caso, sin llamada al modelo en vancomicina sola, y registro del flujo', function () {
  var e = eventoPruebaIaErtapenemPseudomonas();
  conApiSimulada(respuestaIa({}), function () {
    var ref = referenciaProa_(e);
    incluye(ref, '### 7. Ertapenem'); incluye(ref, '### 3. *Pseudomonas aeruginosa*');
    noIncluye(ref, '### 1. Vancomicina'); noIncluye(ref, '### 10. *Candida auris*'); noIncluye(ref, '## Hallazgos para el comité');
    var sinGermen = referenciaProa_(eventoPruebaIaCeftazidimaComunidad());
    incluye(sinGermen, '### 9. Ceftazidima/avibactam'); noIncluye(sinGermen, '### 1. *Klebsiella');
    assert.ok(ref.length < 0.5 * referenciaProa_(null).length, 'la referencia del caso es menos de la mitad');
  });
  var propsReal = global.PropertiesService, utilReal = global.Utilities.sleep;
  var P = { ANTHROPIC_API_KEY: 'CLAVE-DE-PRUEBA', GREENAPI_ID_INSTANCE: '1', GREENAPI_API_TOKEN: 't', GREENAPI_GROUP_CHATID: '111@g.us', GREENAPI_API_URL: 'https://greenapi.test' };
  global.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return P[k] || null; } }; } };
  global.Utilities.sleep = function () {};
  delete HOJAS['REGISTRO_REVISIONES'];
  try {
    // vancomicina sola, tablas en amarillo: ni modelo ni mensajes, pero queda registrada
    conApiSimulada(respuestaIa({}), function (llamadas) {
      var v = eventoPruebaVancomicinaSola();
      assert.strictEqual(notificarConRevisionIa_(v, filtrarAntimicrobianosRestringidos(v)), true);
      assert.strictEqual(llamadas.length, 0); assert.strictEqual(envios.length, 0);
    });
    // caso con alerta en modo PRUEBA: produccion recibe el mensaje de tablas; PRUEBA BOT, base + revision citada
    conApiSimulada(respuestaIa({ analisis: 'a', tratamiento: [{ antimicrobiano: 'ERTAPENEM', nivel: 'no_pertinente', motivo: 'no cubre Pseudomonas' }], dias: [], datos_faltantes: [] }), function (llamadas) {
      notificarNuevaRespuesta(e);
      assert.strictEqual(llamadas.length, 1); assert.strictEqual(envios.length, 3);
      assert.strictEqual(envios[0].chatId, '111@g.us'); assert.strictEqual(envios[1].chatId, IA_CHAT_PRUEBA);
      assert.strictEqual(envios[2].chatId, IA_CHAT_PRUEBA); assert.strictEqual(envios[2].quotedMessageId, 'MSG2');
    });
    var filas = HOJAS['REGISTRO_REVISIONES']._filas, col = function (h) { return ENCABEZADOS_REGISTRO.indexOf(h); };
    assert.strictEqual(filas.length, 3);
    assert.strictEqual(filas[1][col('Enviado al grupo')], 'NO'); assert.strictEqual(filas[1][col('Fuente del análisis')], 'TABLAS');
    assert.strictEqual(filas[2][col('Fuente del análisis')], 'IA'); assert.strictEqual(filas[2][col('Semáforo final')], 'ROJO');
    assert.strictEqual(filas[2][col('Modelo')], 'claude-sonnet-5-5'); assert.ok(filas[2][col('Costo aproximado USD')] > 0);
  } finally { global.PropertiesService = propsReal; global.Utilities.sleep = utilReal; }
});

prueba('ninguna credencial hardcodeada y solo grupos @g.us', function () {
  assert.ok(src.indexOf("getProperty('GREENAPI_API_TOKEN')") > -1);
  assert.ok(!/https:\/\/\d+\.api\.greenapi\.com/.test(src));
  assert.ok(!/@c\.us/.test(src));
  assert.ok(/@g\.us/.test(src));
});

console.log();
if (fallos) { console.log(fallos + ' prueba(s) fallaron.'); process.exit(1); }
console.log('OK: filtro y construccion de mensaje verificados sin llamar ninguna API externa.');
console.log('\n--- Ejemplo (caso ceftazidima/avibactam) ---\n' + construirMensajeDesdeEvento(eventoPruebaCeftazidimaAvibactam()));
