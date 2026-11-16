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
        getDisplayValues: function () { return sub.map(function (r) { return r.map(function (v) { return v === undefined || v === null ? '' : String(v); }); }); },
        setValues: function (vals) {
          vals.forEach(function (fila, i) {
            while (filas.length < f + i) filas.push([]);
            fila.forEach(function (v, j) { filas[f - 1 + i][c - 1 + j] = v; });
          });
          return this;
        },
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
  assert.ok(/· 14 d hasta \d\d\/\d\d\/\d{4}/.test(t), t);
  noIncluye(t, 'fuera del rango');
  incluye(t, '➕ MEROPENEM 1000 mg (14,3 mg/kg) IV c/8 h · 7 d hasta');
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
  incluye(t, '🔁 Antibiótico continuo:');
  incluye(t, 'ERTAPENEM: también solicitado hace 2 h (500 mg cada 24 h, 3 d); posible solicitud repetida');
  incluye(t, 'Antibiótico continuo: ERTAPENEM + VANCOMICINA 01/11/2026-08/11/2026 7 d → ERTAPENEM 08/11/2026-14/11/2026 6 d → esta orden 14/11/2026-21/11/2026 7 d = 20 d');
  incluye(t, 'ERTAPENEM: también solicitado hace 2 h');
  noIncluye(t, 'DAPTOMICINA');
  var msg = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(msg, '🔁 Antibiótico continuo:');
  // 7 d ordenados estarian dentro de 5-7 d, pero el curso completo (20 d) supera el doble
  incluye(msg, '🔴 ERTAPENEM 20 d continuos: supera la referencia; revaluar duración');
  incluye(textoCasoIa_(e, filtrarAntimicrobianosRestringidos(e)), 'HISTORIA DEL PACIENTE: solicitudes previas');
  incluye(textoCasoIa_(e, filtrarAntimicrobianosRestringidos(e)), '- 08/11/2026: ERTAPENEM 1000 mg cada 24 h por 7 d');
  noIncluye(textoCasoIa_(e, filtrarAntimicrobianosRestringidos(e)), '123456');
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
  incluye(t, 'Antibiótico continuo: MEROPENEM 17/10/2026-22/10/2026 5 d → ERTAPENEM 22/10/2026-15/11/2026 24 d → esta orden 15/11/2026-22/11/2026 7 d = 36 d');
  noIncluye(t, 'Otros previos');
  assert.strictEqual(seg.historia.length, 2); incluye(seg.historia[0], '17/10/2026: MEROPENEM 1000 mg cada 8 h por 7 d');
  var msg = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(msg, '🟢 ERTAPENEM: indicado para el aislamiento registrado');   // BLEE escrita en palabras
  incluye(msg, '🔴 ERTAPENEM 36 d continuos: supera la referencia; revaluar duración');
  var caso = textoCasoIa_(e, filtrarAntimicrobianosRestringidos(e));
  incluye(caso, '- 22/10/2026: ERTAPENEM 1000 mg cada 24 h por 21 d'); incluye(caso, 'Cálculo del bot sobre esa historia'); noIncluye(caso, '777001');
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
  incluye(t, '🔁 Antibiótico continuo: ERTAPENEM 17/09/2026-08/10/2026 21 d → MEROPENEM 08/10/2026-22/10/2026 14 d → ERTAPENEM 22/10/2026-15/11/2026 24 d → esta orden 15/11/2026-22/11/2026 7 d = 66 d');
  noIncluye(t, ' 0 d');
  var m = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(m, '🔴 ERTAPENEM 66 d continuos: supera la referencia');
  incluye(m, '💊 ERTAPENEM 1000 mg (14,3 mg/kg) IV c/24 h · 7 d hasta 22/11/2026');   // fin contado desde la solicitud
});

prueba('tratamiento prolongado: 3 o mas solicitudes seguidas y mas de 10 d, mensaje aparte con o sin restringido', function () {
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  // A: piperacilina/tazobactam 7 d -> meropenem 9 d -> se formula cefepime: 3 solicitudes, 16 d ya recibidos
  filas.push(filaMatriz('16/10/2026 08:00:00', '888001', [['PIPERACILINA / TAZOBACTAM', '4500', '6', '7']]));
  filas.push(filaMatriz('23/10/2026 08:00:00', '888001', [['MEROPENEM', '1000', '8', '7']]));
  var e = eventoSeguimiento('01/11/2026 10:00:00', '888001', 'J189', [['CEFEPIME', '2000', '8', '7']]);
  var p = tratamientoProlongado(e);
  assert.strictEqual(p.dias, 16); assert.strictEqual(p.proyectado, 23); assert.strictEqual(p.solicitudes, 3);
  assert.deepStrictEqual(p.nuevos, ['CEFEPIME']);
  var r = revisionProlongado(e, filtrarAntimicrobianosRestringidos(e));
  assert.strictEqual(r.nivel, 2);
  incluye(r.mensaje, '*⏳ REVISIÓN PROA · Tratamiento prolongado*\n🔴 *Se sugiere revaluar*\n' +
    '⏳ *3 solicitudes seguidas: lleva 16 d de antibiótico y con esta orden serían 23 d*');
  incluye(r.mensaje, '📄 HC 888001 · 60 años · 70 kg');
  incluye(r.mensaje, '🔁 Tratamiento continuo:\n   1. PIPERACILINA / TAZOBACTAM · 16/10/2026-23/10/2026 · 7 d\n' +
    '   2. MEROPENEM · 23/10/2026-01/11/2026 · 9 d\n   3. CEFEPIME 2000 mg (28,6 mg/kg) IV c/8 h · 01/11/2026-08/11/2026 · 7 d · Neumonía (esta orden)');
  incluye(r.mensaje, '📏 Neumonía: 5-7 d');
  incluye(r.mensaje, '🔴 23 d continuos con esta orden: supera la referencia; revaluar duración');
  incluye(r.mensaje, '💡 Sugerencia PROA: confirmar con el médico tratante el motivo para continuar');
  noIncluye(r.mensaje, 'CASO PROA'); noIncluye(r.mensaje, '48-72 h');
  // un solo antimicrobiano de amplio espectro no es "terapia combinada"
  noIncluye(sugerenciaPROA('Empírico', [], [{ nombre: 'CEFEPIME' }]), 'combinada');

  // No alcanza: 2 solicitudes aunque sean 22 d; 3 solicitudes con solo 7 d
  filas.push(filaMatriz('10/10/2026 08:00:00', '888002', [['MEROPENEM', '1000', '8', '21']]));
  assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888002', 'J189', [['MEROPENEM', '1000', '8', '7']])), null);
  filas.push(filaMatriz('25/10/2026 08:00:00', '888004', [['CEFEPIME', '2000', '8', '3']]));
  filas.push(filaMatriz('28/10/2026 08:00:00', '888004', [['CEFEPIME', '2000', '8', '3']]));
  assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888004', 'J189', [['MEROPENEM', '1000', '8', '7']])), null);
  // La patologia cuenta: cada solicitud muestra la suya y el total se compara con la de mayor duracion
  var conDx = function (fecha, hc, ams, dx) { var f = filaMatriz(fecha, hc, ams); f[ENCABEZADOS_REALES.indexOf(CAMPOS.DIAGNOSTICO)] = dx; return f; };
  filas.push(conDx('16/10/2026 08:00:00', '888006', [['PIPERACILINA / TAZOBACTAM', '4500', '6', '7']], 'A419 - SEPSIS'));
  filas.push(conDx('24/10/2026 08:00:00', '888006', [['CEFEPIME', '2000', '8', '7']], 'J189 - NEUMONIA'));
  var r6 = revisionProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888006', 'J22X', [['CEFEPIME', '2000', '8', '7']]), []);
  incluye(r6.mensaje, '1. PIPERACILINA / TAZOBACTAM · 16/10/2026-24/10/2026 · 8 d · Bacteriemia / sepsis\n   2. CEFEPIME · 24/10/2026-01/11/2026 · 8 d · Neumonía');
  incluye(r6.mensaje, '📏 Bacteriemia / sepsis: 7-14 d'); incluye(r6.mensaje, 'la más larga de sus patologías (también Neumonía 5-7 d)');
  incluye(r6.mensaje, '🟡 23 d continuos con esta orden: supera la referencia; revaluar duración'); assert.strictEqual(r6.nivel, 1);
  filas.push(conDx('10/10/2026 08:00:00', '888007', [['CEFAZOLINA', '2000', '8', '14']], 'M861 - OSTEOMIELITIS'));
  filas.push(conDx('24/10/2026 08:00:00', '888007', [['CEFAZOLINA', '2000', '8', '7']], 'L039 - CELULITIS'));
  var r7 = revisionProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888007', 'L031', [['CEFAZOLINA', '2000', '8', '7']]), []);
  incluye(r7.mensaje, '📏 Osteomielitis / espondilodiscitis: 42 d'); incluye(r7.mensaje, '🟢 29 d continuos con esta orden: dentro de la referencia');
  assert.strictEqual(r7.nivel, 0);

  // Una revision por paciente y dia: la segunda orden del mismo dia no repite el mensaje
  filas.push(filaMatriz('01/11/2026 07:00:00', '888001', [['CEFEPIME', '2000', '8', '7']]));
  var eDup = eventoSeguimiento('01/11/2026 10:00:00', '888001', 'J189', [['CEFEPIME', '2000', '8', '7']]);
  assert.strictEqual(tratamientoProlongado(eDup).solicitudes, 3); assert.strictEqual(revisionProlongado(eDup, []), null);
  filas.pop();
  // Dos ordenes el mismo dia cuentan como una solicitud
  filas.push(filaMatriz('20/10/2026 08:00:00', '888005', [['CEFEPIME', '2000', '8', '7']]));
  filas.push(filaMatriz('20/10/2026 15:00:00', '888005', [['CEFEPIME', '2000', '8', '7']]));
  assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888005', 'J189', [['MEROPENEM', '1000', '8', '7']])), null);

  // Renovaciones del mismo antimicrobiano: cuentan; con PROLONGADO_SOLO_CAMBIO, solo si se formula uno nuevo
  ['10/10/2026', '17/10/2026', '24/10/2026'].forEach(function (f) { filas.push(filaMatriz(f + ' 08:00:00', '888003', [['MEROPENEM', '1000', '8', '7']])); });
  var e3 = eventoSeguimiento('01/11/2026 10:00:00', '888003', 'J189', [['MEROPENEM', '1000', '8', '14']]);
  var p3 = tratamientoProlongado(e3);
  assert.strictEqual(p3.dias, 22); assert.strictEqual(p3.solicitudes, 4); assert.deepStrictEqual(p3.nuevos, []);
  incluye(revisionProlongado(e3, []).mensaje, '⏳ *4 solicitudes seguidas: lleva 22 d de antibiótico y con esta orden serían 36 d*');
  CONFIG.PROLONGADO_SOLO_CAMBIO = true;
  try { assert.strictEqual(tratamientoProlongado(eventoSeguimiento('01/11/2026 10:00:00', '888003', 'J189', [['MEROPENEM', '1000', '8', '14']])), null); }
  finally { CONFIG.PROLONGADO_SOLO_CAMBIO = false; }

  // Envio: sin restringido sale solo la revision; con restringido, el caso PROA y aparte la revision
  var propsReal = global.PropertiesService;
  var P = { GREENAPI_ID_INSTANCE: '1', GREENAPI_API_TOKEN: 't', GREENAPI_GROUP_CHATID: '111@g.us', GREENAPI_API_URL: 'https://greenapi.test' };
  global.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return P[k] || null; } }; } };
  HOJAS['REGISTRO_REVISIONES'] = hojaDeFilas([ENCABEZADOS_REGISTRO.slice(0, 21)]);   // pestana de la version anterior
  try {
    conApiSimulada(respuestaIa({}), function (llamadas) {
      notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888001', 'J189', [['CEFEPIME', '2000', '8', '7']]));
      assert.strictEqual(envios.length, 1); assert.strictEqual(llamadas.length, 0);
      incluye(envios[0].message, '*⏳ REVISIÓN PROA · Tratamiento prolongado*');
      envios.length = 0;
      notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888001', 'J189', [['ERTAPENEM', '1000', '24', '7']]));
      assert.strictEqual(envios.length, 2);
      incluye(envios[0].message, '*🚨 CASO PROA · Ertapenem*'); noIncluye(envios[0].message, '⏳');
      noIncluye(envios[0].message, '48-72 h');
      incluye(envios[1].message, '*⏳ REVISIÓN PROA · Tratamiento prolongado*');
      incluye(envios[1].message, '3. ERTAPENEM 1000 mg (14,3 mg/kg) IV c/24 h · 01/11/2026-08/11/2026 · 7 d · Neumonía (esta orden)');
      // sin criterio no hay mensaje aparte
      envios.length = 0;
      notificarNuevaRespuesta(eventoSeguimiento('01/11/2026 10:00:00', '888004', 'J189', [['MEROPENEM', '1000', '8', '7']]));
      assert.strictEqual(envios.length, 0);
    });
  } finally { global.PropertiesService = propsReal; }
  // registro: encabezado ampliado; una fila por mensaje, la de la revision con su fuente
  var reg = HOJAS['REGISTRO_REVISIONES']._filas, col = function (n) { return ENCABEZADOS_REGISTRO.indexOf(n); };
  assert.deepStrictEqual(reg[0], ENCABEZADOS_REGISTRO);
  assert.deepStrictEqual(reg.slice(1).map(function (f) { return f[col('Fuente del análisis')]; }), ['TRATAMIENTO PROLONGADO', 'TABLAS', 'TRATAMIENTO PROLONGADO']);
  assert.strictEqual(reg[1][col('Días de tratamiento continuo')], 16); assert.strictEqual(reg[1][col('Semáforo final')], 'ROJO');
  incluye(reg[1][col('Detalle')], '2. MEROPENEM · 23/10/2026-01/11/2026 · 9 d');
});

prueba('probarUltimoProlongado: muestra la ultima revision por tratamiento prolongado sin enviar nada', function () {
  var filas = HOJAS['Respuestas de formulario 1']._filas;
  filas.push(filaMatriz('01/11/2026 10:00:00', '888001', [['CEFEPIME', '2000', '8', '7']]));
  var registro = [], logReal = Logger.log;
  Logger.log = function (fmt) {   // como Apps Script: sustituye cada %s por el argumento siguiente
    var args = Array.prototype.slice.call(arguments, 1);
    registro.push(String(fmt).replace(/%s/g, function () { return String(args.shift()); }));
  };
  try {
    conApiSimulada(respuestaIa({}), function (llamadas) {
      probarUltimoProlongado();
      assert.strictEqual(envios.length, 0); assert.strictEqual(llamadas.length, 0);
    });
  } finally { Logger.log = logReal; filas.pop(); }
  var texto = registro.join('\n');
  incluye(texto, 'tratamiento prolongado: sí (3 solicitudes seguidas, 16 d)'); incluye(texto, '*⏳ REVISIÓN PROA · Tratamiento prolongado*');
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

prueba('revision (IA_PROA.gs): el analisis del modelo va dentro del mensaje unico', function () {
  var e = eventoPruebaCeftazidimaAvibactam();
  var co = filtrarAntimicrobianosRestringidos(e);
  var cfg = { clave: 'CLAVE-DE-PRUEBA', modelo: IA_MODELO_DEFECTO };
  assert.strictEqual(IA_MODELO_DEFECTO, 'claude-sonnet-5-5');
  var salida = { analisis: 'repaso de factores', historia: '',
    tratamiento: [{ antimicrobiano: 'Ceftazidima/avibactam', nivel: 'pertinente', motivo: 'El aislamiento registrado (*KPC*) está dentro de su indicación' },
      { antimicrobiano: 'COLISTINA', nivel: 'no_pertinente', motivo: 'no es de esta solicitud' }],
    dias: [{ antimicrobiano: 'CEFTAZIDIMA / AVIBACTAM', nivel: 'no_pertinente', motivo: 'supera la referencia; valorar suspender al día 7' }],
    datos_faltantes: ['antibiograma'] };
  conApiSimulada(respuestaIa(salida), function (llamadas) {
    var rev = revisarCasoConIa_(e, co, cfg);
    assert.strictEqual(llamadas.length, 1);
    var c = llamadas[0].cuerpo;
    assert.strictEqual(c.model, 'claude-sonnet-5-5');
    assert.strictEqual(c.output_config.format.type, 'json_schema');
    assert.strictEqual(c.fallbacks, 'default');
    assert.ok(!('thinking' in c) && !('temperature' in c));
    incluye(c.system, 'antimicrobianos-restringidos.md'); incluye(c.system, 'TABLA DE DURACIÓN POR SÍNDROME');
    incluye(c.system, 'Infección urinaria complicada / pielonefritis (CIE10 N39, N10, N12, N30): 5-7 días');
    incluye(c.system, 'médico infectólogo'); incluye(c.system, 'químico farmacéutico clínico');
    assert.strictEqual(c.output_config.effort, 'high');
    assert.deepStrictEqual(c.output_config.format.schema.required, ['analisis', 'historia', 'tratamiento', 'dias', 'datos_faltantes']);
    var caso = c.messages[0].content;
    incluye(caso, 'Análisis de las tablas del bot'); incluye(caso, 'CEFTAZIDIMA / AVIBACTAM 14 d: supera la referencia');
    incluye(caso, 'HISTORIA DEL PACIENTE: sin solicitudes previas');
    noIncluye(caso, '88888888'); noIncluye(caso, 'Historia');   // seudonimizado
    assert.strictEqual(rev.veredicto, 'intervenir');
    var m = construirMensajeDesdeEvento(e, co, { analisis: analisisDeRevision_(rev) });
    incluye(m, '*🚨 CASO PROA · Ceftazidima / avibactam*');
    incluye(m, '🔴 *Se sugiere revaluar*');
    incluye(m, '💊 CEFTAZIDIMA / AVIBACTAM 750 mg (10,7 mg/kg) IV c/12 h · 14 d hasta');
    incluye(m, '🔴 Ceftazidima / avibactam 14 d: supera la referencia; valorar suspender al día 7');
    incluye(m, '🟢 Lo demás, sin observaciones');
    incluye(m, '📏 Infección urinaria complicada / pielonefritis: 5-7 d (IDSA 2025 ITU complicada; ACIN Infectio 2023)');
    incluye(m, '_Análisis asistido por IA_');
    noIncluye(m, 'COLISTINA'); noIncluye(m, 'Pertinencia PROA');   // lo ajeno a la solicitud se descarta
    var verde = construirMensajeDesdeEvento(e, co, { analisis: analisisDeRevision_({ veredicto: 'pertinente', historia: '',
      tratamiento: [{ nombre: 'CEFTAZIDIMA / AVIBACTAM', nivel: 0, motivo: '' }], dias: [], encabezadoDias: '' }) });
    incluye(verde, '🟢 *Acorde con la referencia*'); incluye(verde, '🟢 Tratamiento y días sin observaciones');
  });
  assert.ok(fraseIa_(new Array(60).join('palabra ')).length <= IA_MAX_CARACTERES);
  assert.ok(srcIa.indexOf('sk-ant') === -1);
});

prueba('revision (IA_PROA.gs): piso de las tablas, respaldo sin fallbacks y caida de la API', function () {
  var cfg = { clave: 'CLAVE-DE-PRUEBA', modelo: IA_MODELO_DEFECTO };
  // ertapenem con Pseudomonas: regla de espectro en rojo; el modelo no puede rebajarla
  var e = eventoPruebaIaErtapenemPseudomonas(), co = filtrarAntimicrobianosRestringidos(e);
  conApiSimulada(respuestaIa({ analisis: 'a', historia: '', tratamiento: [{ antimicrobiano: 'ERTAPENEM', nivel: 'pertinente', motivo: 'x' }], dias: [], datos_faltantes: [] }), function () {
    assert.strictEqual(revisarCasoConIa_(e, co, cfg).veredicto, 'intervenir');
  });
  // la API rechaza el parametro fallbacks: se repite sin el
  conApiSimulada(function (n) {
    return n === 1 ? { codigo: 400, cuerpo: { error: { message: 'fallbacks: Extra inputs are not permitted' } } }
      : respuestaIa({ analisis: 'a', historia: '', tratamiento: [{ antimicrobiano: 'ERTAPENEM', nivel: 'no_pertinente', motivo: 'no cubre Pseudomonas' }],
          dias: [{ antimicrobiano: 'ERTAPENEM', nivel: 'pertinente', motivo: 'dentro de la referencia' }], datos_faltantes: [] });
  }, function (llamadas) {
    var rev = revisarCasoConIa_(e, co, cfg);
    assert.strictEqual(rev.veredicto, 'intervenir');
    assert.strictEqual(llamadas.length, 2); assert.ok(!('fallbacks' in llamadas[1].cuerpo)); assert.ok(!llamadas[1].encabezados['anthropic-beta']);
    var m = construirMensajeDesdeEvento(e, co, { analisis: analisisDeRevision_(rev) });
    incluye(m, '🔴 Ertapenem: no cubre Pseudomonas'); noIncluye(m, '7 d:'); noIncluye(m, '📏');   // dias de un tratamiento en rojo: no se mencionan
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
  assert.strictEqual(analisisDeRevision_(null), null);
  var m = construirMensajeDesdeEvento(e, co);
  incluye(m, '🔴 *Se sugiere revaluar*'); incluye(m, 'ERTAPENEM no tiene actividad frente a Pseudomonas'); noIncluye(m, 'asistido por IA');
});

prueba('IA: la historia del paciente va al modelo y su interpretacion abre el analisis', function () {
  var e = eventoSeguimiento('15/11/2026 17:10:18', '777001', 'L031', [['ERTAPENEM', '1000', '24', '7']]);
  e.namedValues[CAMPOS.MICROORGANISMO] = ['BETALACTAMASA DE AMPLIO ESPECTRO'];
  var co = filtrarAntimicrobianosRestringidos(e);
  conApiSimulada(respuestaIa({ analisis: 'a', historia: 'Carbapenémico continuo: meropenem del 17/10 al 22/10 (5 d) y ertapenem desde el 22/10 (24 d); esta orden lo lleva a 36 d',
    tratamiento: [{ antimicrobiano: 'ERTAPENEM', nivel: 'pertinente', motivo: '' }],
    dias: [{ antimicrobiano: 'ERTAPENEM', nivel: 'no_pertinente', motivo: 'muy por encima de la referencia; confirmar foco no controlado antes de prolongar' }], datos_faltantes: [] }), function (llamadas) {
    var rev = revisarCasoConIa_(e, co, { clave: 'CLAVE-DE-PRUEBA', modelo: IA_MODELO_DEFECTO });
    incluye(llamadas[0].cuerpo.messages[0].content, 'Antibiótico continuo: MEROPENEM 17/10/2026-22/10/2026 5 d → ERTAPENEM 22/10/2026-15/11/2026 24 d');
    var m = construirMensajeDesdeEvento(e, co, { analisis: analisisDeRevision_(rev) });
    incluye(m, '🧭 Carbapenémico continuo: meropenem del 17/10 al 22/10 (5 d) y ertapenem desde el 22/10 (24 d); esta orden lo lleva a 36 d');
    incluye(m, '🔴 Ertapenem 36 d continuos: muy por encima de la referencia; confirmar foco no controlado antes de prolongar');
    incluye(m, '📏 Infección de piel y tejidos blandos: 5-7 d (IDSA 2014)');
    incluye(m, '🟢 Lo demás, sin observaciones');
  });
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
