// test/ia-proa.js
//
// Prueba en seco de IA_PROA.gs (revision por IA como respuesta citada). Carga Codigo.gs + IA_PROA.gs
// con Green-API, la API de Claude y GitHub simulados: no sale ninguna peticion de red.
// Compara contra Codigo.gs sin cambios cuando la IA no esta activa.
//
// Uso: node test/ia-proa.js [ruta del Codigo.gs original para comparar]

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var raiz = path.join(__dirname, '..');
var CODIGO = fs.readFileSync(path.join(raiz, 'Codigo.gs'), 'utf8');
var IA = fs.readFileSync(path.join(raiz, 'IA_PROA.gs'), 'utf8');
var FICHAS = fs.readFileSync(path.join(raiz, 'docs', 'antimicrobianos-restringidos.md'), 'utf8');
var ORIGINAL = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : null;

var CIE10 = { N390: 'INFECCION DE VIAS URINARIAS, SITIO NO ESPECIFICADO', A419: 'SEPSIS, NO ESPECIFICADA', J189: 'NEUMONIA, NO ESPECIFICADA' };
var RESTRINGIDOS = ['CEFTAZIDIMA / AVIBACTAM', 'ANFOTERICINA', 'AZTREONAM', 'ERTAPENEM', 'CASPOFUNGINA',
  'ANFOTERICINA B LIPOSOMAL', 'TYGECICLINA', 'DORIPENEM', 'RIFAMPICINA', 'POLIMIXINA B', 'DAPTOMICINA'];

function hojaDeFilas(filas) {
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
              for (var i = 0; i < sub.length; i++) {
                if (String(sub[i][0]).toUpperCase() === String(texto).toUpperCase()) { var fila = f + i; return { getRow: function () { return fila; } }; }
              }
              return null;
            } };
        }
      };
    }
  };
}

// op: { props, ia(cuerpo, n) -> {codigo, texto} | null, fichas: false, greenFalla: true, original: true }
function entorno(op) {
  op = op || {};
  var llamadas = [];
  var props = Object.assign({ GREENAPI_ID_INSTANCE: '7107', GREENAPI_API_TOKEN: 'tok', GREENAPI_API_URL: 'https://7107.api.greenapi.com',
    GREENAPI_GROUP_CHATID: 'PRODUCCION@g.us' }, op.props || {});
  var hojas = {
    'ANTIMICROBIANOS_RESTRINGIDOS': hojaDeFilas([['Antimicrobiano', 'dispara_alerta']].concat(RESTRINGIDOS.map(function (a) { return [a, 'SI']; })).concat([['VANCOMICINA', 'NO'], ['LINEZOLID', 'NO']])),
    'CIE10': hojaDeFilas([[' ', 'DESCRIPCION']].concat(Object.keys(CIE10).map(function (k) { return [k, CIE10[k]]; })))
  };
  var cache = {};
  var nIa = 0, nWa = 0;
  var ctx = {
    SpreadsheetApp: { openById: function () { return { getSheetByName: function (n) { return hojas[n] || null; } }; } },
    CacheService: { getScriptCache: function () { return { get: function (k) { return k in cache ? cache[k] : null; }, put: function (k, v) { cache[k] = v; } }; } },
    Utilities: { sleep: function () {}, formatDate: function (d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); } },
    Logger: { log: function () { var a = Array.prototype.slice.call(arguments); var i = 1; llamadas.push({ tipo: 'log', texto: String(a[0]).replace(/%s/g, function () { return String(a[i++]); }) }); } },
    PropertiesService: { getScriptProperties: function () { return { getProperty: function (k) { return k in props ? props[k] : null; } }; } },
    UrlFetchApp: { fetch: function (url, o) {
      o = o || {};
      if (/raw\.githubusercontent\.com/.test(url)) {
        llamadas.push({ tipo: 'fichas' });
        if (op.fichas === false) return { getResponseCode: function () { return 404; }, getContentText: function () { return ''; } };
        return { getResponseCode: function () { return 200; }, getContentText: function () { return FICHAS; } };
      }
      if (/api\.anthropic\.com/.test(url)) {
        nIa++;
        var cuerpo = JSON.parse(o.payload);
        llamadas.push({ tipo: 'ia', cuerpo: cuerpo, headers: o.headers });
        var r = op.ia ? op.ia(cuerpo, nIa) : null;
        if (!r) r = { codigo: 200, texto: JSON.stringify({ hallazgos: [], datos_faltantes: [] }) };
        var resp = r.codigo === 200 && !r.crudo
          ? JSON.stringify({ type: 'message', model: cuerpo.model, stop_reason: 'end_turn', content: [{ type: 'text', text: r.texto }], usage: { input_tokens: 9100, output_tokens: 240 } })
          : r.texto;
        return { getResponseCode: function () { return r.codigo; }, getContentText: function () { return resp; } };
      }
      if (/greenapi\.com/.test(url)) {
        nWa++;
        var p = JSON.parse(o.payload);
        llamadas.push({ tipo: 'wa', chatId: p.chatId, mensaje: p.message, cita: p.quotedMessageId || null, id: 'MSG' + nWa });
        if (op.greenFalla) return { getResponseCode: function () { return 500; }, getContentText: function () { return 'error'; } };
        return { getResponseCode: function () { return 200; }, getContentText: function () { return JSON.stringify({ idMessage: 'MSG' + nWa }); } };
      }
      throw new Error('URL inesperada: ' + url);
    } }
  };
  vm.createContext(ctx);
  vm.runInContext(op.original ? ORIGINAL : CODIGO + '\n' + IA, ctx);
  return { ctx: ctx, llamadas: llamadas, wa: function () { return llamadas.filter(function (l) { return l.tipo === 'wa'; }); },
    ia: function () { return llamadas.filter(function (l) { return l.tipo === 'ia'; }); },
    orden: function () { return llamadas.filter(function (l) { return l.tipo !== 'log'; }).map(function (l) { return l.tipo === 'wa' ? 'wa:' + l.chatId.split('@')[0] + (l.cita ? '>' + l.cita : '') : l.tipo; }).join(' '); } };
}

function respuestaIa(hallazgos) {
  return function () { return { codigo: 200, texto: JSON.stringify({ hallazgos: hallazgos, datos_faltantes: [] }) }; };
}
var KPC = [
  { codigo: 'DUP', severidad: 'media', antimicrobiano: 'MEROPENEM', detalle: 'Meropenem no aporta frente a KPC con ceftazidima/avibactam en curso: valorar suspenderlo.', ficha: 'Ficha 9' },
  { codigo: 'DUR', severidad: 'media', antimicrobiano: 'CEFTAZIDIMA / AVIBACTAM', detalle: 'Ceftazidima/avibactam 14 dias para ITU: revaluar; con buena respuesta suelen bastar 7.', ficha: 'conocimiento general' },
  { codigo: 'REN', severidad: 'baja', antimicrobiano: 'CEFTAZIDIMA / AVIBACTAM', detalle: '750 mg c/12 h con DepCr 18 coincide con el ajuste si se registro solo ceftazidima.', ficha: 'Ficha 9' },
  { codigo: 'CAM', severidad: 'baja', antimicrobiano: 'CEFTAZIDIMA / AVIBACTAM', detalle: 'Indicacion marcada empirica con aislado y cambio por antibiograma.', ficha: 'conocimiento general' }
];
var VANCO_ALTA = [{ codigo: 'IND', severidad: 'alta', antimicrobiano: 'VANCOMICINA', detalle: 'Vancomicina empírica sin grampositivo sospechado: revaluar la indicación.', ficha: 'Ficha 1' }];

var ok = 0;
function prueba(desc, fn) { fn(); ok++; console.log('OK - ' + desc); }
// Encabezado destacado de ceftazidima/avibactam (Codigo.gs, 2026-11-07): se quita para comparar con el original.
var DESTACADO_CAZ = '*' + String.fromCodePoint(0x1F6A8) + 'CEFTAZIDIMA/AVIBACTAM' + String.fromCodePoint(0x1F6A8) + '*';
function sinDestacado(m) { return m.split(DESTACADO_CAZ + '\n\n').join(''); }
// El original mostraba '(DepCr 18)' en la linea de ajuste renal; desde 2026-11-07 ya no.
function sinDepCr(m) { return m.replace(/ \(DepCr [^)]*\)/g, ''); }
function eventos(e) {
  return { kpc: e.ctx.eventoPruebaIaCeftazidimaMeropenem(), dapto: e.ctx.eventoPruebaDaptomicina(), vanco: e.ctx.eventoPruebaVancomicinaSola() };
}

if (ORIGINAL) {
  prueba('sin ANTHROPIC_API_KEY: mismos envios que el codigo original', function () {
    ['eventoPruebaDaptomicina', 'eventoPruebaCeftazidimaAvibactam', 'eventoPruebaVancomicinaSola', 'eventoPruebaPediatrico'].forEach(function (f) {
      var a = entorno({ original: true }), b = entorno({});
      a.ctx.notificarNuevaRespuesta(a.ctx[f]()); b.ctx.notificarNuevaRespuesta(b.ctx[f]());
      assert.deepStrictEqual(b.wa().map(function (l) { return [l.chatId, sinDestacado(l.mensaje), l.cita]; }), a.wa().map(function (l) { return [l.chatId, sinDepCr(l.mensaje), l.cita]; }), f);
      assert.strictEqual(b.ia().length, 0);
    });
  });
  prueba('IA_PROA_MODO = NO: mismos envios que el codigo original', function () {
    var a = entorno({ original: true }), b = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'NO' } });
    a.ctx.notificarNuevaRespuesta(a.ctx.eventoPruebaCeftazidimaAvibactam()); b.ctx.notificarNuevaRespuesta(b.ctx.eventoPruebaCeftazidimaAvibactam());
    assert.deepStrictEqual(b.wa().map(function (l) { return sinDestacado(l.mensaje); }), a.wa().map(function (l) { return sinDepCr(l.mensaje); }));
  });
}

prueba('PRUEBA: produccion igual que hoy; PRUEBA BOT recibe base sin sugerencia + revision citada', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k' }, ia: respuestaIa(KPC) });
  var ev = eventos(e).kpc;
  e.ctx.notificarNuevaRespuesta(ev);
  var w = e.wa();
  assert.strictEqual(e.orden(), 'wa:PRODUCCION fichas ia wa:120363412506101174 wa:120363412506101174>MSG2');
  if (ORIGINAL) {
    var o = entorno({ original: true }); o.ctx.notificarNuevaRespuesta(o.ctx.eventoPruebaIaCeftazidimaMeropenem ? o.ctx.eventoPruebaIaCeftazidimaMeropenem() : (function () {
      var x = e.ctx.eventoPruebaIaCeftazidimaMeropenem(); return x; })());
    assert.strictEqual(sinDestacado(w[0].mensaje), sinDepCr(o.wa()[0].mensaje), 'produccion identico al original salvo el encabezado');
  }
  assert.ok(/Sugerencia PROA/.test(w[0].mensaje), 'produccion conserva la sugerencia');
  assert.ok(!/Sugerencia PROA/.test(w[1].mensaje), 'base de prueba sin sugerencia');
  assert.ok(/NUEVO CASO PROA/.test(w[1].mensaje) && /Bot PROA Antimicrobianos HDV/.test(w[1].mensaje));
  assert.ok(w[0].mensaje.indexOf(DESTACADO_CAZ) > -1 && w[1].mensaje.indexOf(DESTACADO_CAZ) > -1, 'encabezado en produccion y en la copia');
  assert.ok(w[2].mensaje.indexOf('CEFTAZIDIMA/AVIBACTAM' + String.fromCodePoint(0x1F6A8)) === -1, 'la revision citada no repite el encabezado');
  var r = w[2].mensaje;
  assert.ok(r.indexOf('Revisión PROA · Ceftazidima / avibactam*') > -1, r);
  assert.ok(r.indexOf('\u{1F4A1} Terapia empírica combinada (CEFTAZIDIMA / AVIBACTAM + MEROPENEM)') > -1, r);
  assert.ok(r.indexOf('\u{1F7E0} DUP · Meropenem no aporta') > -1 && r.indexOf('\u{1F7E0} DUR ·') > -1, r);
  assert.ok(r.indexOf('REN') === -1 && r.indexOf('CAM') === -1, 'las de severidad baja no salen');
  assert.ok(/\n_Revisión asistida por IA_$/.test(r), r);
  assert.ok(!/Bot PROA Antimicrobianos HDV|Ecosistema/.test(r), 'la revision va sin firma ni pie');
  console.log('\n--- Respuesta citada (caso KPC) ---\n' + r + '\n');
});

prueba('PRODUCCION: base sin sugerencia ANTES de llamar a la IA, luego revision citada en el mismo grupo', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: respuestaIa(KPC) });
  e.ctx.notificarNuevaRespuesta(eventos(e).kpc);
  assert.strictEqual(e.orden(), 'wa:PRODUCCION fichas ia wa:PRODUCCION>MSG1');
  assert.ok(!/Sugerencia PROA/.test(e.wa()[0].mensaje));
});

prueba('datos enviados a la API: seudonimizados, con fichas, esquema JSON y modelo', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'sk-ant-prueba' }, ia: respuestaIa(KPC) });
  e.ctx.notificarNuevaRespuesta(eventos(e).kpc);
  var l = e.ia()[0], caso = l.cuerpo.messages[0].content;
  assert.strictEqual(l.headers['x-api-key'], 'sk-ant-prueba');
  assert.strictEqual(l.headers['anthropic-version'], '2023-06-01');
  assert.strictEqual(l.cuerpo.model, 'claude-sonnet-5-5');
  assert.strictEqual(l.cuerpo.output_config.format.type, 'json_schema');
  assert.ok(l.cuerpo.system.indexOf('### 9. Ceftazidima/avibactam') > -1, 'fichas en el sistema');
  assert.ok(caso.indexOf('88888888') === -1, 'sin historia clinica');
  assert.ok(/Klebsiella pneumoniae KPC/.test(caso) && /Ajuste renal marcado por el medico: S/.test(caso), caso);
  assert.ok(!/Depuraci|DepCr|: 18/.test(caso), 'el valor de depuracion no se envia');
  assert.deepStrictEqual(Array.from(l.cuerpo.output_config.format.schema.properties.hallazgos.items.properties.codigo.enum), ['ESP', 'DUP', 'DUR', 'IND', 'CAM', 'DES']);
  assert.ok(!/- REN/.test(l.cuerpo.system) && /- IND indicacion frente a la ficha/.test(l.cuerpo.system));
  assert.ok(/1\. CEFTAZIDIMA \/ AVIBACTAM \(restringido\)/.test(caso) && /2\. MEROPENEM \(acompanante\)/.test(caso), caso);
  assert.ok(/el bot ya marco la dosis fuera de rango/.test(caso), 'informa la marca de dosis del bot');
  assert.ok(!e.llamadas.some(function (x) { return x.tipo === 'log' && /sk-ant-prueba/.test(x.texto); }), 'la clave no aparece en el registro');
});

prueba('vancomicina sola: sin hallazgo alto no se envia nada; con hallazgo alto, base + revision', function () {
  var e1 = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: respuestaIa([{ codigo: 'DES', severidad: 'media', antimicrobiano: 'VANCOMICINA', detalle: 'Considerar suspender si cultivos negativos.', ficha: 'Ficha 1' }]) });
  e1.ctx.notificarNuevaRespuesta(eventos(e1).vanco);
  assert.strictEqual(e1.wa().length, 0);
  assert.strictEqual(e1.ia().length, 1);
  var e2 = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: respuestaIa(VANCO_ALTA) });
  e2.ctx.notificarNuevaRespuesta(eventos(e2).vanco);
  assert.strictEqual(e2.orden(), 'fichas ia wa:PRODUCCION wa:PRODUCCION>MSG1');
  assert.ok(/\u{1F534} IND · Vancomicina/u.test(e2.wa()[1].mensaje));
  var e3 = entorno({ props: { ANTHROPIC_API_KEY: 'k' }, ia: respuestaIa(VANCO_ALTA) });
  e3.ctx.notificarNuevaRespuesta(eventos(e3).vanco);
  assert.strictEqual(e3.orden(), 'fichas ia wa:120363412506101174 wa:120363412506101174>MSG1', 'en PRUEBA solo PRUEBA BOT');
});

prueba('API con error: la base ya salio y la revision lleva solo la sugerencia PROA', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: function () { return { codigo: 400, crudo: true, texto: '{"error":{"message":"Your credit balance is too low"}}' }; } });
  e.ctx.notificarNuevaRespuesta(eventos(e).kpc);
  assert.strictEqual(e.orden(), 'wa:PRODUCCION fichas ia wa:PRODUCCION>MSG1');
  var r = e.wa()[1].mensaje;
  assert.ok(/Terapia emp/.test(r) && !/asistida por IA/.test(r), r);
});

prueba('sin fichas: no se llama a la API; sin sugerencia ni hallazgos no hay respuesta', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, fichas: false });
  e.ctx.notificarNuevaRespuesta(eventos(e).dapto);
  assert.strictEqual(e.orden(), 'wa:PRODUCCION fichas');
});

prueba('respuesta de la IA que no es JSON o refusal: se trata como sin revision', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: function () { return { codigo: 200, texto: 'no es json' }; } });
  e.ctx.notificarNuevaRespuesta(eventos(e).kpc);
  assert.ok(!/asistida/.test(e.wa()[1].mensaje));
  var e2 = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: function () { return { codigo: 200, crudo: true, texto: '{"stop_reason":"refusal","content":[]}' }; } });
  e2.ctx.notificarNuevaRespuesta(eventos(e2).kpc);
  assert.ok(!/asistida/.test(e2.wa()[1].mensaje));
});

prueba('maximo 3 hallazgos, alta primero; detalle sin signos de formato de WhatsApp', function () {
  var muchos = [
    { codigo: 'DUR', severidad: 'media', antimicrobiano: 'A', detalle: 'uno *dos*', ficha: '' },
    { codigo: 'ESP', severidad: 'alta', antimicrobiano: 'A', detalle: 'alta', ficha: '' },
    { codigo: 'DUP', severidad: 'media', antimicrobiano: 'A', detalle: 'tres', ficha: '' },
    { codigo: 'DES', severidad: 'media', antimicrobiano: 'A', detalle: 'cuatro', ficha: '' }];
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: respuestaIa(muchos) });
  e.ctx.notificarNuevaRespuesta(eventos(e).dapto);
  var lineas = e.wa()[1].mensaje.split('\n');
  assert.ok(/^\u{1F534} ESP/u.test(lineas[1]), lineas.join(' | '));
  assert.strictEqual(lineas.filter(function (x) { return /^(\u{1F534}|\u{1F7E0}) /u.test(x); }).length, 3);
  assert.ok(lineas.indexOf('\u{1F7E0} DUR · Uno dos') > -1, lineas.join(' | '));
});

prueba('codigos fuera de la lista (p. ej. REN) se descartan', function () {
  var h = [{ codigo: 'REN', severidad: 'alta', antimicrobiano: 'X', detalle: 'Con DepCr 18 mL/min la ficha indica 0,94 g c/12 h.', ficha: '' },
    { codigo: 'IND', severidad: 'media', antimicrobiano: 'Y', detalle: 'Ceftazidima/avibactam empírica en neumonía de la comunidad sin carbapenemasa: revaluar la indicación.', ficha: 'Ficha 9' }];
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: respuestaIa(h) });
  e.ctx.notificarNuevaRespuesta(eventos(e).dapto);
  var r = e.wa()[1].mensaje;
  assert.ok(r.indexOf(' REN ') === -1, r);
  assert.ok(r.indexOf('IND · Ceftazidima/avibactam empírica') > -1, r);
  console.log('\n--- Revision con IND (REN descartado) ---\n' + r + '\n');
});

prueba('encabezado destacado: solo con ceftazidima/avibactam, primera linea despues de la firma', function () {
  var e = entorno({});
  e.ctx.notificarNuevaRespuesta(e.ctx.eventoPruebaCeftazidimaAvibactam());
  e.ctx.notificarNuevaRespuesta(e.ctx.eventoPruebaDaptomicina());
  var w = e.wa();
  assert.strictEqual(w.length, 2);
  assert.ok(w[0].mensaje.indexOf('*Bot PROA Antimicrobianos HDV*\n\n' + DESTACADO_CAZ + '\n\n' + String.fromCodePoint(0x1F6A8) + ' NUEVO CASO PROA') === 0, w[0].mensaje.slice(0, 120));
  assert.strictEqual(w[0].mensaje.split(DESTACADO_CAZ).length, 2, 'una sola vez');
  assert.ok(w[1].mensaje.indexOf('CEFTAZIDIMA/AVIBACTAM') === -1, 'daptomicina sin encabezado');
  var ev = e.ctx.eventoPruebaDaptomicina();
  ev.namedValues['Nombre Antimicrobiano 2'] = ['CEFTAZIDIMA / AVIBACTAM - UT-19998801-1'];
  e.ctx.notificarNuevaRespuesta(ev);
  assert.ok(e.wa()[2].mensaje.indexOf(DESTACADO_CAZ) > -1, 'tambien cuando va en el segundo antimicrobiano');
  console.log('\n--- Inicio del mensaje base con encabezado ---\n' + w[0].mensaje.split('\n').slice(0, 6).join('\n') + '\n');
});

prueba('enviarPruebaIaAPruebaBot: dos casos (base + revision citada) solo a PRUEBA BOT, sin DepCr', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: respuestaIa(KPC) });
  e.ctx.enviarPruebaIaAPruebaBot();
  var w = e.wa();
  assert.strictEqual(w.length, 4);
  assert.ok(w.every(function (l) { return l.chatId === '120363412506101174@g.us'; }), 'nada a produccion');
  assert.strictEqual(w[1].cita, 'MSG1'); assert.strictEqual(w[3].cita, 'MSG3');
  assert.ok(w[0].mensaje.indexOf(DESTACADO_CAZ) > -1 && w[2].mensaje.indexOf(DESTACADO_CAZ) > -1);
  assert.ok(/asistida por IA/.test(w[1].mensaje) && /asistida por IA/.test(w[3].mensaje));
  assert.ok(w[2].mensaje.indexOf('Ajuste renal: S\u00ed\n') > -1 && w[2].mensaje.indexOf('DepCr') === -1, w[2].mensaje);
  var sinClave = entorno({}); sinClave.ctx.enviarPruebaIaAPruebaBot();
  assert.strictEqual(sinClave.wa().length, 0, 'sin clave no envia nada');
});

prueba('si el mensaje base no sale, no se envia la revision', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', IA_PROA_MODO: 'PRODUCCION' }, ia: respuestaIa(KPC), greenFalla: true });
  e.ctx.notificarNuevaRespuesta(eventos(e).kpc);
  assert.strictEqual(e.wa().length, 1);
});

prueba('destino que no es grupo: bloqueado', function () {
  var e = entorno({ props: { ANTHROPIC_API_KEY: 'k', GREENAPI_PRUEBA_CHATID: '573001234567@c.us' }, ia: respuestaIa(KPC) });
  e.ctx.notificarNuevaRespuesta(eventos(e).kpc);
  assert.strictEqual(e.wa().length, 1, 'solo produccion; la copia a un chat individual no sale');
});

console.log('\nOK: ' + ok + ' pruebas de IA_PROA sin llamadas reales.');
