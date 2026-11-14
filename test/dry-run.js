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
    getLastColumn: function () { return filas[0] ? filas[0].length : 0; },
    getRange: function (f, c, nf, nc) {
      nf = nf || 1; nc = nc || 1;
      var sub = filas.slice(f - 1, f - 1 + nf).map(function (r) { return r.slice(c - 1, c - 1 + nc); });
      return {
        getValues: function () { return sub; },
        getValue: function () { return sub[0][0]; },
        createTextFinder: function (texto) {
          return { matchEntireCell: function () { return this; }, matchCase: function () { return this; },
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
global.SpreadsheetApp = { openById: function () { return { getSheetByName: function (n) { return HOJAS[n] || null; } }; } };
var cache = {};
global.CacheService = { getScriptCache: function () { return { get: function (k) { return k in cache ? cache[k] : null; }, put: function (k, v) { cache[k] = v; } }; } };
global.Utilities = { formatDate: function (d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); } };
global.Logger = { log: function () {} };
global.UrlFetchApp = { fetch: function () { throw new Error('UrlFetchApp no debe llamarse en la prueba en seco'); } };
global.PropertiesService = { getScriptProperties: function () { return { getProperty: function () { return null; } }; } };

(0, eval)(src);

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
  incluye(t, '💧 Ajuste renal: Sí (DepCr 18)');
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
  incluye(construirMensajeDesdeEvento({ namedValues: nv }), '💧 Ajuste renal: Sí (DepCr 25) · CASPOFUNGINA 50, 70 no requiere ajuste renal');
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

prueba('pertinencia: duracion de referencia, exceso, dentro de rango, profilaxis', function () {
  var am = function (n, d) { return { nombre: n, dias: d }; };
  var l = evaluarPertinencia('N390', 'Empírico', 'E. coli BLEE', [am('ERTAPENEM', '14')]);
  incluye(l.join('\n'), '📏 Duración de referencia · Infección urinaria complicada / pielonefritis: 5-7 días (IDSA 2025 ITU complicada; ACIN Infectio 2023)');
  incluye(l.join('\n'), '⚠️ Superan la referencia: ERTAPENEM 14 d · hasta 10-14 d si hay absceso');
  l = evaluarPertinencia('N390', 'Empírico', 'E. coli BLEE', [am('ERTAPENEM', '7')]).join('\n');
  incluye(l, '✅ Días ordenados dentro de la referencia'); noIncluye(l, 'Superan');
  l = evaluarPertinencia('M869', 'Etiológico', 'S. aureus', [am('DAPTOMICINA', '14')]).join('\n');
  incluye(l, 'Osteomielitis / espondilodiscitis: 28-42 días'); noIncluye(l, 'Superan');   // por debajo del minimo no se marca
  l = evaluarPertinencia('D70X', 'Empírico', 'Ninguno', [am('CASPOFUNGINA 50, 70', '14')]).join('\n');
  incluye(l, '📏 Duración · Neutropenia febril: sin foco'); noIncluye(l, 'Superan'); noIncluye(l, 'dentro de la referencia');
  l = evaluarPertinencia('C169', 'Empírico', 'Ninguno', [am('ERTAPENEM', '14')]);
  assert.strictEqual(l.length, 0, 'diagnostico sin sindrome: sin lineas');
  l = evaluarPertinencia('S720', 'Profiláctico', 'Ninguno', [am('ERTAPENEM', '5')]).join('\n');
  incluye(l, '⚠️ Profilaxis: ERTAPENEM con 5 días ordenados; la profilaxis quirúrgica no debe pasar de 24 h');
  l = evaluarPertinencia('S720', 'Profiláctico', 'Ninguno', [am('ERTAPENEM', 'Dosis Unica')]);
  assert.strictEqual(l.length, 0);
  l = evaluarPertinencia('N390', 'Empírico', 'Ninguno', [am('ERTAPENEM', 'Dosis Unica')]).join('\n');
  noIncluye(l, 'dentro de la referencia'); noIncluye(l, 'Superan');
});

prueba('pertinencia: reglas de espectro', function () {
  var am = function (n) { return { nombre: n, dias: '7' }; };
  function ev(dx, tipo, micro, ams) { return evaluarPertinencia(dx, tipo, micro, ams.map(am)).join('\n'); }
  incluye(ev('J189', 'Etiológico', 'SAMR', ['DAPTOMICINA']), 'Espectro: DAPTOMICINA no está indicada en neumonía');
  noIncluye(ev('A419', 'Etiológico', 'SAMR', ['DAPTOMICINA']), 'Espectro');
  incluye(ev('A419', 'Etiológico', 'Klebsiella KPC', ['TYGECICLINA']), 'Espectro: TIGECICLINA');
  incluye(ev('N390', 'Etiológico', 'Pseudomonas aeruginosa', ['ERTAPENEM']), 'ERTAPENEM no tiene actividad frente a Pseudomonas');
  noIncluye(ev('N390', 'Etiológico', 'E. coli BLEE', ['ERTAPENEM']), 'Espectro');
  incluye(ev('G060', 'Etiológico', 'Cryptococcus neoformans', ['CASPOFUNGINA 50, 70']), 'CASPOFUNGINA no tiene actividad frente a Cryptococcus');
  noIncluye(ev('B377', 'Etiológico', 'Candida auris', ['CASPOFUNGINA 50, 70']), 'Espectro');
  incluye(ev('A419', 'Etiológico', 'Klebsiella NDM', ['CEFTAZIDIMA / AVIBACTAM']), 'asociar aztreonam');
  noIncluye(ev('A419', 'Etiológico', 'Klebsiella NDM', ['CEFTAZIDIMA / AVIBACTAM', 'AZTREONAM']), 'asociar aztreonam');
  noIncluye(ev('A419', 'Etiológico', 'Klebsiella KPC', ['CEFTAZIDIMA / AVIBACTAM']), 'Espectro');
  incluye(ev('A419', 'Etiológico', 'Serratia marcescens', ['POLIMIXINA B']), 'intrínsecamente resistentes');
  incluye(ev('N390', 'Etiológico', 'Echerichia coli', ['VANCOMICINA']), 'VANCOMICINA no tiene actividad frente a gramnegativos');
  noIncluye(ev('N390', 'Etiológico', 'Echerichia coli', ['VANCOMICINA', 'MEROPENEM']), 'gramnegativos'); // hay otro que cubre
  incluye(ev('M869', 'Etiológico', 'S. aureus', ['RIFAMPICINA']), 'RIFAMPICINA no debe usarse en monoterapia');
  noIncluye(ev('A150', 'Etiológico', 'M. tuberculosis', ['RIFAMPICINA']), 'monoterapia');
  noIncluye(ev('M869', 'Etiológico', 'S. aureus', ['RIFAMPICINA', 'VANCOMICINA']), 'monoterapia');
  incluye(ev('A419', 'Etiológico', 'NINUGNO', ['ERTAPENEM']), 'Indicación etiológica sin microorganismo registrado');
  incluye(ev('A419', 'Etiológico', '0', ['ERTAPENEM']), 'sin microorganismo registrado');
  noIncluye(ev('A419', 'Empírico', 'Ninguno', ['ERTAPENEM']), 'sin microorganismo');
  CONFIG.PERTINENCIA_ACTIVA = false;
  assert.strictEqual(evaluarPertinencia('N390', 'Empírico', '', [{ nombre: 'ERTAPENEM', dias: '14' }]).length, 0);
  CONFIG.PERTINENCIA_ACTIVA = true;
});

prueba('pertinencia en el mensaje completo (ceftazidima/avibactam 14 d en ITU)', function () {
  var e = eventoPruebaCeftazidimaAvibactam();
  var t = construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e));
  incluye(t, '📏 Duración de referencia · Infección urinaria complicada / pielonefritis: 5-7 días');
  incluye(t, '⚠️ Superan la referencia: CEFTAZIDIMA / AVIBACTAM 14 d');
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
