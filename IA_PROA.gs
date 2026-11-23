// =====================================================================
// IA_PROA.gs - Informe semanal PROA para el comite, con lectura asistida por IA (API de Claude).
// Servicio Farmaceutico - Hospital Departamental de Villavicencio E.S.E.
//
// Enfoque (v1.34.0, decision del referente): la IA ya no opina caso por caso. Una vez por semana (lunes,
// INFORME_HORA, hora de Colombia) el bot envia un informe con las cifras de los ultimos INFORME_DIAS dias:
// solicitudes, dias de tratamiento por antimicrobiano (mediana o promedio, INFORME_MEDIDA), restringidos,
// servicios, tipo de indicacion, cultivos, interconsultas y tratamientos mas largos (tratamiento continuo por paciente).
// Las cifras las calcula este codigo; la IA solo escribe la lectura (hallazgos y sugerencias para el comite) y el
// codigo descarta cualquier frase con una cifra que no este en los datos o con lenguaje de juicio. Sin
// ANTHROPIC_API_KEY, o si la API falla, el informe sale igual, solo con las cifras.
//
// Propiedades del script:
//   ANTHROPIC_API_KEY        opcional: la lectura de la IA. Sin ella, informe solo con cifras.
//   INFORME_PROA_DESTINO     PRUEBA (por defecto): el informe va a PRUEBA BOT. PRODUCCION: al grupo PROA.
//   IA_ESFUERZO              opcional: low | medium | high (por defecto) | xhigh | max.
//   CLAUDE_MODEL             opcional; por defecto IA_MODELO_DEFECTO.
//   GREENAPI_PRUEBA_CHATID   opcional; por defecto IA_CHAT_PRUEBA (PRUEBA BOT).
//
// A la API solo salen cifras agregadas: sin historia clinica, nombres, camas ni medicos.
// Activador: crearTriggerInformeProa() (una vez). Prueba sin enviar nada: probarInformeProa(dias).
// Usa funciones de Codigo.gs (la regla del tratamiento continuo, entre otras). VERSION_INFORME y VERSION_BOT comparten
// mayor.menor (1.36): un cambio en los dos archivos sube la menor y se pegan juntos; uno solo en este archivo sube su
// ultimo numero y basta con pegar este. Si mayor.menor no coincide, la prueba y la pestana INFORMES_PROA lo dicen.
// =====================================================================

var VERSION_INFORME = "1.36.2";

var INFORME_DIAS = 7;
var INFORME_HORA = 7;                             // lunes, hora de Colombia
var INFORME_HOJA = "INFORMES_PROA";
var INFORME_FILAS_MAX = 4000;                     // filas de la matriz que se leen hacia atras (dos periodos + 60 d de historia)
var INFORME_TOP = 5;
// Medida de los dias por antimicrobiano (v1.36.2, decision del referente: una sola): "mediana" (por defecto; con pocos
// pacientes un tratamiento muy largo no la mueve) o "promedio".
var INFORME_MEDIDA = "mediana";
var INFORME_MAX_HALLAZGOS = 4;
var INFORME_MAX_SUGERENCIAS = 2;
var INFORME_MAX_CARACTERES = 170;                 // por frase de la IA

var IA_MODELO_DEFECTO = "claude-opus-5-5";        // elegido por el referente (2026-11-22)
var IA_ESFUERZO_DEFECTO = "high";
var IA_ESFUERZOS = ["low", "medium", "high", "xhigh", "max"];
var IA_URL = "https://api.anthropic.com/v1/messages";
var IA_VERSION_API = "2023-06-01";
var IA_BETA_RESPALDO = "server-side-fallback-2026-07-01";   // si el modelo declina, la API reintenta con otro
var IA_MAX_TOKENS = 16000;                        // incluye el razonamiento del modelo
var IA_CHAT_PRUEBA = "120363412506101174@g.us";   // PRUEBA BOT
// Lenguaje de juicio que el referente quiere evitar en el grupo: la frase se descarta (queda en INFORMES_PROA).
var IA_JUICIO = /\bno pertinente|\binadecuad|\bincorrect|\binjustificad|\bmal (indicad|formulad|prescrit|uso)|\berr[oó]ne|\babuso\b|\bculpa/i;

// USD por millon de tokens (entrada, salida), solo para el costo aproximado del registro.
var IA_PRECIOS_MTOK = { "claude-opus-5-5": [4, 20], "claude-opus-5": [5, 25], "claude-opus-4-8": [5, 25],
  "claude-sonnet-5-5": [2, 10], "claude-sonnet-5": [2, 10], "claude-haiku-5-5": [0.10, 0.50] };

var INFORME_INDICADORES = ["solicitudes", "duracion", "antimicrobianos", "restringidos", "servicios", "indicacion", "interconsulta",
  "profilaxis", "tratamientos_largos", "comparacion"];

var INFORME_REGLAS = [
  "Apoyas al comité del Programa de Optimización de Antimicrobianos (PROA) del Hospital Departamental de Villavicencio, Colombia. Recibes los indicadores de un periodo, calculados por el bot a partir del formulario de solicitud de antimicrobianos (todas las solicitudes, no solo restringidos), junto con los del periodo anterior. Escribes la lectura que acompaña al informe en el grupo de WhatsApp del PROA, donde están la infectóloga, el químico farmacéutico y el equipo del programa.",
  "",
  "Escribe entre 2 y " + INFORME_MAX_HALLAZGOS + " hallazgos y hasta " + INFORME_MAX_SUGERENCIAS + " sugerencias. Un hallazgo dice qué muestran las cifras: un cambio frente al periodo anterior, el promedio de días de tratamiento por antimicrobiano, la concentración en un servicio o una molécula, la proporción de tratamientos empíricos sin cultivos, las interconsultas a Infectología en restringidos, la profilaxis de más de un día o los tratamientos más largos. Una sugerencia es una acción de programa para el comité (educación a un servicio, auditoría de una molécula, revisar un protocolo, mejorar una pregunta del formulario), nunca una conducta sobre un paciente.",
  "",
  "Cifras: usa solo las que vienen en los datos y escríbelas igual, con coma decimal (12,5) y el signo % pegado (45%). No calcules diferencias, sumas, promedios ni porcentajes nuevos: el bot descarta cualquier frase con una cifra que no esté en los datos. Los días de cada antimicrobiano (la medida que indica dias_por_antimicrobiano en los datos) cuentan, por paciente, sus prescripciones seguidas de ese antimicrobiano hasta el fin de su última orden del periodo; nómbrala tal cual (mediana o promedio); los tratamientos más largos suman el tratamiento continuo del paciente aunque cambie de antimicrobiano. Son días ordenados, no administrados. Con números pequeños (menos de 10) un cambio entre dos periodos puede ser azar: no lo llames tendencia.",
  "",
  "Tono: neutro e institucional, en español corriente con tildes, sin markdown. Cada frase de máximo 150 caracteres. Sin culpar a servicios, especialidades ni personas; sin juicios sobre casos clínicos; sin palabras como \"inadecuado\", \"incorrecto\", \"injustificado\", \"no pertinente\", \"abuso\" o \"mal uso\". Si no hay nada notable, dilo en un hallazgo corto y no rellenes.",
  "",
  "indicador es la sección de los datos de la que sale cada hallazgo."
].join("\n");

var INFORME_ESQUEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hallazgos: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      indicador: { type: "string", enum: INFORME_INDICADORES },
      texto: { type: "string", description: "Una frase de máximo 150 caracteres con cifras tomadas de los datos." }
    }, required: ["indicador", "texto"] } },
    sugerencias: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      texto: { type: "string", description: "Una acción de programa para el comité, máximo 150 caracteres." }
    }, required: ["texto"] } }
  },
  required: ["hallazgos", "sugerencias"]
};

// =====================================================================
// Envio (activador semanal) y pruebas
// =====================================================================

// Activador semanal: arma el informe de los ultimos INFORME_DIAS dias, lo envia segun INFORME_PROA_DESTINO y lo
// guarda en la pestana INFORMES_PROA.
function enviarInformeSemanalProa() { enviarInforme_(new Date()); }

function enviarInforme_(hoy) {
  if (avisoVersiones_()) Logger.log(avisoVersiones_());
  var inf = construirInformeProa_(hoy, INFORME_DIAS);
  var destino = destinoInforme_();
  var envio = enviarAlertaWhatsApp(inf.mensaje, { chatId: destino.chatId, sinFirma: true });
  registrarInforme_(inf, destino.nombre, !!(envio && envio.ok));
}

// Escribe en el registro de ejecucion el informe de los ultimos `dias` dias (7 por defecto). No envia nada ni
// escribe en la matriz; con ANTHROPIC_API_KEY llama a la API (unos USD 0,05-0,15).
function probarInformeProa(dias) {
  var inf = construirInformeProa_(new Date(), Number(dias) || INFORME_DIAS);
  Logger.log("PRUEBA (no se envió nada) · " + textoVersiones_() + " · destino configurado: %s%s\n\n%s\n\n▶ Registro: %s", destinoInforme_().nombre,
    avisoVersiones_() ? "\n" + avisoVersiones_() : "", inf.mensaje, textoRegistroIa_(inf.ia));
}

// "Código v1.36.0 · IA_PROA v1.36.0" y, si no coinciden, el aviso para pegar los dos archivos de la misma version.
function textoVersiones_() {
  return "Código v" + (typeof VERSION_BOT !== "undefined" ? VERSION_BOT : "?") + " · IA_PROA v" + VERSION_INFORME;
}
function avisoVersiones_() {
  var bot = typeof VERSION_BOT !== "undefined" ? VERSION_BOT : "?";
  var menor = function(v) { return String(v).split(".").slice(0, 2).join("."); };
  return menor(bot) === menor(VERSION_INFORME) ? "" : "⚠️ Las versiones de Código (" + bot + ") e IA_PROA (" + VERSION_INFORME + ") no coinciden: pegue los dos archivos de la misma versión.";
}

// Envia SOLO a PRUEBA BOT (IA_CHAT_PRUEBA fijo) el informe de los ultimos `dias` dias, para verlo en WhatsApp.
function enviarInformeAPruebaBot(dias) {
  var inf = construirInformeProa_(new Date(), Number(dias) || INFORME_DIAS);
  var envio = enviarAlertaWhatsApp(inf.mensaje, { chatId: IA_CHAT_PRUEBA, sinFirma: true });
  Logger.log("PRUEBA BOT: " + JSON.stringify(envio) + "\n" + textoRegistroIa_(inf.ia));
}

// Crea (o recrea) el activador del informe: lunes a las INFORME_HORA, hora de Colombia. Solo toca los activadores
// de este proyecto que llaman a enviarInformeSemanalProa.
function crearTriggerInformeProa() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "enviarInformeSemanalProa") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("enviarInformeSemanalProa").timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(INFORME_HORA)
    .inTimezone("America/Bogota").create();
}

function destinoInforme_() {
  var props = PropertiesService.getScriptProperties();
  if (String(props.getProperty("INFORME_PROA_DESTINO") || "").trim().toUpperCase() === "PRODUCCION") return { nombre: "PRODUCCION", chatId: null };
  return { nombre: "PRUEBA BOT", chatId: props.getProperty("GREENAPI_PRUEBA_CHATID") || IA_CHAT_PRUEBA };
}

// =====================================================================
// Informe: cifras (codigo) + lectura (IA)
// =====================================================================

// { mensaje, actual, anterior, ia } del periodo de `dias` dias que termina hoy a las 00:00.
function construirInformeProa_(hoy, dias) {
  var hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  var desde = new Date(hasta.getTime() - dias * 864e5), desdeAnterior = new Date(desde.getTime() - dias * 864e5);
  // la historia de cada paciente (CONFIG.SEGUIMIENTO_DIAS antes de cada orden) cuenta para sus dias de tratamiento
  var eventos = eventosDesde_(new Date(desdeAnterior.getTime() - CONFIG.SEGUIMIENTO_DIAS * 864e5));
  var actual = datosInforme_(eventos, desde, hasta);
  var anterior = datosInforme_(eventos, desdeAnterior, desde);
  var cfg = iaConfigProa_();
  var ia = cfg.clave ? lecturaIa_(actual, anterior, cfg) : null;
  return { mensaje: mensajeInforme_(actual, anterior, ia), actual: actual, anterior: anterior, ia: ia };
}

// Solicitudes de la matriz desde una fecha, como eventos { namedValues } (se leen las ultimas INFORME_FILAS_MAX filas).
function eventosDesde_(desde) {
  var hoja = libroProa().getSheetByName(CONFIG.HOJA_RESPUESTAS);
  var ultima = hoja.getLastRow(), columnas = hoja.getLastColumn();
  if (ultima < 2) return [];
  var encabezados = hoja.getRange(1, 1, 1, columnas).getValues()[0];
  var colFecha = encabezados.indexOf("Marca temporal");
  var inicio = Math.max(2, ultima - INFORME_FILAS_MAX + 1);
  var eventos = [];
  hoja.getRange(inicio, 1, ultima - inicio + 1, columnas).getDisplayValues().forEach(function(fila) {
    var f = fechaDe(fila[colFecha]);
    if (!f || f < desde) return;
    var nv = {};
    encabezados.forEach(function(h, i) { if (h) nv[h] = [fila[i]]; });
    eventos.push({ fecha: f, namedValues: nv });
  });
  return eventos;
}

function porcentaje(a, b) { return b ? Math.round(100 * a / b) : 0; }

// "Unidad de Cuidado Critico UCI A" -> "UCI A"; "Unidad de Cuidado Critico PEDIATRIA" -> "UCI PEDIATRÍA";
// "Hospitalizacion Medicina interna" -> "Hosp. Medicina interna"
function servicioCorto(s) {
  return String(s || "").replace(/\s+/g, " ").trim().replace(/^Unidad de Cuidado Cr[ií]tico\s*/i, "UCI ").replace(/^UCI UCI\b/, "UCI")
    .replace(/^Unidad de Cuidados Intermedios\s*/i, "Intermedios ").replace(/^Hospitalizaci[oó]n\s+/i, "Hosp. ").trim() || "Sin servicio";
}

// Sin cultivos: el campo vacio o solo con "NINGUNO", "pendiente", puntos o comas ("NINGUNO, ", ".."). "UROCULTIVO, NINGUNO" si tiene.
function sinCultivos(valor) {
  return !normalizarTexto(valor).replace(/\b(NINGUNO|NINGUNA|NO|NA|PENDIENTES?|SIN|CULTIVOS?)\b/g, " ").replace(/[^A-Z0-9]/g, "");
}

function fechaDiaMes_(d) { return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2); }

function diasOrden_(v) { var d = numeroONulo(v); return (d !== null && d > 0 && d < 365) ? d : 0; }
function promedio_(lista) { return lista.length ? Math.round(10 * lista.reduce(function(a, b) { return a + b; }, 0) / lista.length) / 10 : 0; }
// Mediana: con pocos pacientes, un tratamiento muy largo mueve el promedio y no la mediana.
// La medida elegida en INFORME_MEDIDA y el nombre de su campo en los datos.
function medidaDias_(lista) { return INFORME_MEDIDA === "promedio" ? promedio_(lista) : mediana_(lista); }
function campoMedida_() { return INFORME_MEDIDA === "promedio" ? "promedio_dias" : "mediana_dias"; }
function mediana_(lista) {
  if (!lista.length) return 0;
  var o = lista.slice().sort(function(a, b) { return a - b; }), m = Math.floor(o.length / 2);
  return Math.round(10 * (o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2)) / 10;
}

// Dias de tratamiento de los pacientes con alguna orden en [desde, hasta), con su ultima orden del periodo, con la regla
// del tratamiento continuo de Codigo.gs (diasTratamientoPrevio, la misma de los mensajes):
// { porAm: { nombre: [dias por paciente, solo de ese antimicrobiano] }, largos: [{ hc, servicio, dias }] }. largos: el
// tratamiento continuo del paciente (antibacteriano o antifungico, el mayor), sumando cambios de antimicrobiano, como
// el "Con esta orden: N d" del caso PROA.
function tratamientosDelPeriodo_(eventos, desde, hasta) {
  var porHc = {};
  eventos.forEach(function(e) {
    var hc = String(campoDelEvento(e.namedValues, CAMPOS.HC) || '').replace(/\s+/g, '');
    if (!hc || hc === '-' || /^0+$/.test(hc)) return;
    (porHc[hc] = porHc[hc] || []).push({ t: e.fecha.getTime(), ams: leerSlots(e), servicio: campoDelEvento(e.namedValues, CAMPOS.SERVICIO) });
  });
  var res = { porAm: {}, largos: [] };
  Object.keys(porHc).forEach(function(hc) {
    var ordenes = porHc[hc].sort(function(a, b) { return a.t - b.t; });
    var delPeriodo = ordenes.filter(function(o) { return o.t >= desde.getTime() && o.t < hasta.getTime() && o.ams.length; });
    if (!delPeriodo.length) return;
    var mayor = null;
    [false, true].forEach(function(antifungico) {
      var delTipo = function(o) { return o.ams.filter(function(am) { return esAntifungico(am.nombre) === antifungico; }); };
      var ultima = delPeriodo.filter(function(o) { return delTipo(o).length; }).pop();
      if (!ultima) return;
      var previas = [];
      ordenes.forEach(function(o) { delTipo(o).forEach(function(am) { previas.push({ t: o.t, dias: diasOrden_(am.dias) }); }); });
      var dias = diasTratamientoPrevio(previas, ultima.t) + Math.max.apply(null, delTipo(ultima).map(function(am) { return diasOrden_(am.dias); }));
      if (!mayor || dias > mayor.dias) mayor = { hc: hc, servicio: servicioCorto(ultima.servicio), dias: dias };
    });
    var nombres = {};
    delPeriodo.forEach(function(o) { o.ams.forEach(function(am) { nombres[am.nombre] = true; }); });
    Object.keys(nombres).forEach(function(nombre) {
      var ultima = delPeriodo.filter(function(o) { return o.ams.some(function(am) { return am.nombre === nombre; }); }).pop();
      var previas = [];
      ordenes.forEach(function(o) { o.ams.forEach(function(am) { if (am.nombre === nombre) previas.push({ t: o.t, dias: diasOrden_(am.dias) }); }); });
      var dias = diasTratamientoPrevio(previas, ultima.t) + Math.max.apply(null, ultima.ams.filter(function(am) { return am.nombre === nombre; }).map(function(am) { return diasOrden_(am.dias); }));
      (res.porAm[nombre] = res.porAm[nombre] || []).push(dias);
    });
    if (mayor) res.largos.push(mayor);
  });
  res.largos.sort(function(a, b) { return b.dias - a.dias; });
  return res;
}

// Indicadores de las solicitudes con marca temporal en [desde, hasta).
function datosInforme_(eventos, desde, hasta) {
  var lista = obtenerAntimicrobianosRestringidos();
  var porServicio = {}, hcs = {}, tipos = { "Empírico": 0, "Etiológico": 0, "Profiláctico": 0 };
  var n = 0, conRestringido = 0, conInterconsulta = 0, empiricoSinCultivo = 0, profilaxisLarga = 0;
  eventos.forEach(function(e) {
    if (e.fecha < desde || e.fecha >= hasta) return;
    var slots = leerSlots(e);
    if (!slots.length) return;
    var c = function(nombre) { return campoDelEvento(e.namedValues, nombre) || ""; };
    n++;
    var hc = c(CAMPOS.HC).replace(/\s+/g, "");
    if (hc) hcs[hc] = true;
    var servicio = servicioCorto(c(CAMPOS.SERVICIO));
    porServicio[servicio] = (porServicio[servicio] || 0) + 1;
    var tipo = tipoIndicacionTexto(c(CAMPOS.TIPO_INDICACION));
    if (tipo in tipos) tipos[tipo]++;
    if (tipo === "Empírico" && sinCultivos(c(CAMPOS.CULTIVOS))) empiricoSinCultivo++;
    var restringido = false, profLarga = false;
    slots.forEach(function(am) {
      var entrada = entradaRestringida(am.nombre, lista);
      if (entrada && entrada.dispara !== false) restringido = true;
      if (tipo === "Profiláctico" && diasOrden_(am.dias) > 1) profLarga = true;
    });
    if (restringido) { conRestringido++; if (esSi(c(CAMPOS.INTERCONSULTA))) conInterconsulta++; }
    if (profLarga) profilaxisLarga++;
  });

  var tr = tratamientosDelPeriodo_(eventos, desde, hasta);
  var ams = Object.keys(tr.porAm).map(function(k) {
    var x = { nombre: k, pacientes: tr.porAm[k].length, restringido: !!entradaRestringida(k, lista) };
    x[campoMedida_()] = medidaDias_(tr.porAm[k]);
    return x;
  }).sort(function(a, b) { return b.pacientes - a.pacientes || b[campoMedida_()] - a[campoMedida_()]; });

  return {
    periodo: fechaDiaMes_(desde) + "–" + fechaDiaMes_(new Date(hasta.getTime() - 864e5)),
    dias_por_antimicrobiano: INFORME_MEDIDA === "promedio" ? "promedio por paciente" : "mediana por paciente",
    solicitudes: n,
    pacientes: Object.keys(hcs).length,
    solicitudes_con_restringido: conRestringido,
    antimicrobianos: ams.slice(0, 8),
    restringidos: ams.filter(function(a) { return a.restringido; }),
    servicios: Object.keys(porServicio).map(function(k) { return { nombre: k, solicitudes: porServicio[k], porcentaje: porcentaje(porServicio[k], n) }; })
      .sort(function(a, b) { return b.solicitudes - a.solicitudes; }).slice(0, 6),
    indicacion: { empirico_pct: porcentaje(tipos["Empírico"], n), etiologico_pct: porcentaje(tipos["Etiológico"], n),
      profilactico_pct: porcentaje(tipos["Profiláctico"], n), empiricos_sin_cultivo_pct: porcentaje(empiricoSinCultivo, tipos["Empírico"]) },
    restringidos_con_interconsulta_pct: porcentaje(conInterconsulta, conRestringido),
    profilaxis_mas_de_1_dia: profilaxisLarga,
    tratamientos_largos: tr.largos.slice(0, INFORME_TOP)
  };
}

// Mensaje del informe: las cifras (siempre) y, si la IA respondio, su lectura.
function mensajeInforme_(a, ant, ia) {
  var E = function(cp) { return String.fromCodePoint(cp); };
  var sem = function(x) { return " (sem. ant. " + x + ")"; };
  var lineas = ["*" + E(0x1F4CA) + " INFORME SEMANAL PROA · " + a.periodo + "*"];
  if (!a.solicitudes) {
    lineas.push("Sin solicitudes en el formulario en este periodo" + sem(ant.solicitudes) + ".");
    return lineas.join("\n");
  }
  lineas.push(E(0x1F4DD) + " " + a.solicitudes + " solicitudes" + sem(ant.solicitudes) + " · " + a.pacientes + " pacientes · " +
    a.solicitudes_con_restringido + " con restringido" + sem(ant.solicitudes_con_restringido));
  var f = function(x) { return formatoNumero(x, 1) + " d"; };
  // "CEFEPIME 9 d (49)": la medida de INFORME_MEDIDA (pacientes)
  var conPacientes = function(x) { return x.nombre + " " + f(x[campoMedida_()]) + " (" + x.pacientes + ")"; };
  lineas.push(E(0x1F48A) + " " + (INFORME_MEDIDA === "promedio" ? "Promedio" : "Mediana") + " de días de tratamiento por antimicrobiano (pacientes): " +
    a.antimicrobianos.slice(0, 4).map(conPacientes).join(" · "));
  if (a.restringidos.length) lineas.push(E(0x1F512) + " Restringidos: " + a.restringidos.slice(0, 4).map(conPacientes).join(" · "));
  lineas.push(E(0x1F3E5) + " Servicios: " + a.servicios.slice(0, 3).map(function(x) { return x.nombre + " " + x.porcentaje + "%"; }).join(" · "));
  lineas.push(E(0x1F9EB) + " Empírico " + a.indicacion.empirico_pct + "% (" + a.indicacion.empiricos_sin_cultivo_pct + "% sin cultivos) · Etiológico " +
    a.indicacion.etiologico_pct + "% · Profiláctico " + a.indicacion.profilactico_pct + "%" +
    (a.profilaxis_mas_de_1_dia ? " · " + a.profilaxis_mas_de_1_dia + " con profilaxis de más de 1 día" : ""));
  if (a.solicitudes_con_restringido) lineas.push(E(0x1F9EA) + " Restringidos con interconsulta a Infectología: " + a.restringidos_con_interconsulta_pct + "%");
  if (a.tratamientos_largos.length) {
    lineas.push(E(0x23F3) + " Más largos: " + a.tratamientos_largos.slice(0, 3).map(function(x) { return "HC " + x.hc + " " + x.servicio + " *" + x.dias + " d*"; }).join(" · "));
  }

  if (ia && ia.lectura && (ia.lectura.hallazgos.length || ia.lectura.sugerencias.length)) {
    lineas.push("", "*" + E(0x1F916) + " Lectura de la semana (IA)*");
    ia.lectura.hallazgos.forEach(function(h) { lineas.push("• " + h); });
    if (ia.lectura.sugerencias.length) {
      lineas.push("*Para el comité*");
      ia.lectura.sugerencias.forEach(function(s) { lineas.push("• " + s); });
    }
    lineas.push("_Cifras del formulario; lectura automática para el comité PROA_");
  }
  return lineas.join("\n");
}

// Lo que va a la API: los indicadores sin historia clinica (los tratamientos largos sin HC).
function datosParaIa_(d) {
  var copia = JSON.parse(JSON.stringify(d));
  copia.tratamientos_largos.forEach(function(x) { delete x.hc; });
  return copia;
}

function iaConfigProa_() {
  var props = PropertiesService.getScriptProperties();
  var esfuerzo = String(props.getProperty("IA_ESFUERZO") || "").trim().toLowerCase();
  return {
    clave: props.getProperty("ANTHROPIC_API_KEY"),
    modelo: props.getProperty("CLAUDE_MODEL") || IA_MODELO_DEFECTO,
    esfuerzo: IA_ESFUERZOS.indexOf(esfuerzo) > -1 ? esfuerzo : IA_ESFUERZO_DEFECTO
  };
}

// Pide la lectura a la API. Devuelve { lectura: { hallazgos, sugerencias, descartados, analisis }, modelo, entrada,
// salida, costo, segundos } o { lectura: null, motivo }. Si tarda demasiado con esfuerzo alto, reintenta una vez
// con "medium" (nadie espera el informe, pero la llamada tiene un tiempo maximo).
function lecturaIa_(actual, anterior, cfg) {
  var inicio = Date.now();
  var datosIa = { periodo_actual: datosParaIa_(actual), periodo_anterior: datosParaIa_(anterior) };
  var texto = JSON.stringify(datosIa, null, 1);
  var cuerpo = {
    model: cfg.modelo,
    max_tokens: IA_MAX_TOKENS,
    system: INFORME_REGLAS,
    // el repaso del modelo se lee del resumen de su razonamiento: pedirlo en la respuesta se declina (reasoning_extraction)
    thinking: { type: "adaptive", display: "summarized" },
    output_config: { effort: cfg.esfuerzo, format: { type: "json_schema", schema: INFORME_ESQUEMA } },
    fallbacks: "default",
    messages: [{ role: "user", content: "Indicadores del PROA (periodo actual y anterior, " + actual.periodo + " frente a " + anterior.periodo + "):\n" + texto }]
  };
  try {
    var resp;
    try {
      resp = llamarApiIa_(cuerpo, cfg, true);
    } catch (errTiempo) {
      if (!/timeout|tiempo/i.test(String(errTiempo)) || ["high", "xhigh", "max"].indexOf(cfg.esfuerzo) === -1) throw errTiempo;
      Logger.log("IA: tardó demasiado con esfuerzo %s; se reintenta con medium.", cfg.esfuerzo);
      cuerpo.output_config.effort = "medium";
      resp = llamarApiIa_(cuerpo, cfg, true);
    }
    // Si la API no acepta el respaldo ante declinaciones, se repite la peticion sin el.
    if (resp.getResponseCode() === 400 && /fallback/i.test(resp.getContentText())) {
      delete cuerpo.fallbacks;
      resp = llamarApiIa_(cuerpo, cfg, false);
    }
    var segundos = Math.round((Date.now() - inicio) / 1000);
    if (resp.getResponseCode() !== 200) {
      Logger.log("IA: API HTTP %s en %s s: %s", resp.getResponseCode(), segundos, ocultarClaveIa_(resp.getContentText().substring(0, 300), cfg.clave));
      return { lectura: null, motivo: "HTTP " + resp.getResponseCode() };
    }
    var datos = JSON.parse(resp.getContentText());
    if (datos.stop_reason === "refusal" || datos.stop_reason === "max_tokens") {
      var cat = datos.stop_details && datos.stop_details.category ? ", categoría " + datos.stop_details.category : "";
      Logger.log("IA sin resultado (%s%s; modelo %s; %s s).", datos.stop_reason, cat, datos.model || cfg.modelo, segundos);
      return { lectura: null, motivo: (datos.stop_reason === "refusal" ? "el modelo declinó" : "respuesta incompleta") + cat };
    }
    // Con respaldo puede haber texto del modelo que declino antes del bloque fallback: vale el ultimo bloque de texto.
    var bloques = (datos.content || []).filter(function(b) { return b.type === "text" && b.text; });
    if (!bloques.length) return { lectura: null, motivo: "respuesta sin texto" };
    var salida = JSON.parse(bloques[bloques.length - 1].text);
    var lectura = filtrarLecturaIa_(salida, texto);
    lectura.analisis = (datos.content || []).filter(function(b) { return b.type === "thinking" && b.thinking; })
      .map(function(b) { return b.thinking; }).join(" ").replace(/\s+/g, " ").substring(0, 1500);
    var modelo = datos.model || cfg.modelo;
    var entrada = (datos.usage && datos.usage.input_tokens) || 0, salidaTok = (datos.usage && datos.usage.output_tokens) || 0;
    var p = IA_PRECIOS_MTOK[modelo] || IA_PRECIOS_MTOK[cfg.modelo];
    var costo = p ? Number(((entrada * p[0] + salidaTok * p[1]) / 1e6).toFixed(4)) : "";
    // concatenado: con %s, Logger escribe los numeros como 13.0
    Logger.log("IA (" + modelo + ", " + segundos + " s): " + lectura.hallazgos.length + " hallazgo(s), " + lectura.sugerencias.length +
      " sugerencia(s), " + lectura.descartados.length + " descartada(s); tokens " + entrada + "/" + salidaTok + "; aprox. USD " + costo + ".");
    return { lectura: lectura, modelo: modelo, entrada: entrada, salida: salidaTok, costo: costo, segundos: segundos };
  } catch (err) {
    var s = Math.round((Date.now() - inicio) / 1000);
    Logger.log("IA sin resultado en %s s: %s", s, ocultarClaveIa_(String(err), cfg.clave));
    return { lectura: null, motivo: /timeout|tiempo/i.test(String(err)) ? "tardó demasiado (" + s + " s)" : "error al leer la respuesta" };
  }
}

// Frases validas: cada cifra debe estar en los datos que se enviaron (se aceptan del 0 al 10 como conteo) y sin
// lenguaje de juicio; como maximo INFORME_MAX_HALLAZGOS hallazgos e INFORME_MAX_SUGERENCIAS sugerencias.
function filtrarLecturaIa_(salida, textoDatos) {
  var cifras = {};
  (textoDatos.match(/\d+(?:[.,]\d+)?/g) || []).forEach(function(x) { cifras[x.replace(",", ".")] = true; });
  var descartados = [];
  var valida = function(frase) {
    var t = fraseIa_(frase);
    if (!t) return "";
    var inventadas = (t.match(/\d+(?:[.,]\d+)?/g) || []).filter(function(x) {
      var v = x.replace(",", ".");
      return !cifras[v] && !(Number(v) <= 10 && /^\d+$/.test(v));
    });
    if (inventadas.length) { descartados.push(t + " (cifra que no está en los datos: " + inventadas.join(", ") + ")"); return ""; }
    if (IA_JUICIO.test(t)) { descartados.push(t + " (lenguaje de juicio)"); return ""; }
    return t;
  };
  var hallazgos = [], sugerencias = [];
  (salida.hallazgos || []).forEach(function(h) { var t = valida(h.texto); if (t) hallazgos.push(t); });
  (salida.sugerencias || []).forEach(function(s) { var t = valida(s.texto); if (t) sugerencias.push(t); });
  hallazgos.slice(INFORME_MAX_HALLAZGOS).concat(sugerencias.slice(INFORME_MAX_SUGERENCIAS)).forEach(function(t) { descartados.push(t + " (sobra)"); });
  return { hallazgos: hallazgos.slice(0, INFORME_MAX_HALLAZGOS), sugerencias: sugerencias.slice(0, INFORME_MAX_SUGERENCIAS),
    descartados: descartados, analisis: "" };
}

function llamarApiIa_(cuerpo, cfg, conRespaldo) {
  var encabezados = { "x-api-key": cfg.clave, "anthropic-version": IA_VERSION_API };
  if (conRespaldo) encabezados["anthropic-beta"] = IA_BETA_RESPALDO;
  return UrlFetchApp.fetch(IA_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(cuerpo),
    muteHttpExceptions: true,
    headers: encabezados
  });
}

// Una frase limpia para WhatsApp: sin marcas de formato, decimales con coma y "%" pegado al numero, como las cifras
// del informe ("12.5 dias" -> "12,5 dias", "86 %" -> "86%"), y con tope de longitud.
function fraseIa_(s) {
  var t = String(s === undefined || s === null ? "" : s).replace(/[*~\x60]/g, "").replace(/_/g, " ").replace(/\s+/g, " ").trim().replace(/\.$/, "")
    .replace(/(\d)\.(\d)/g, "$1,$2").replace(/(\d) %/g, "$1%");
  if (t.length > INFORME_MAX_CARACTERES) t = t.substring(0, INFORME_MAX_CARACTERES - 1).replace(/\s+\S*$/, "") + "…";
  return t;
}

function ocultarClaveIa_(texto, clave) {
  return clave ? String(texto).split(clave).join("***") : String(texto);
}

function textoRegistroIa_(ia) {
  if (!ia) return "sin IA (falta ANTHROPIC_API_KEY)";
  if (!ia.lectura) return "IA sin respuesta: " + ia.motivo;
  var l = ia.lectura;
  return "IA (" + ia.segundos + " s)" + (l.descartados.length ? " · Descartados: " + l.descartados.join(" | ") : " · sin descartes") +
    (l.analisis ? " · Razonamiento (resumen): " + l.analisis : "");
}

// Una fila por informe en la pestana INFORMES_PROA (la crea si no existe). Nunca interrumpe el envio.
var ENCABEZADOS_INFORMES = ["Fecha", "Periodo", "Destino", "Enviado", "Mensaje", "IA: descartados y repaso", "Modelo", "Tokens de entrada",
  "Tokens de salida", "Costo aproximado USD", "Versión"];

function registrarInforme_(inf, destino, enviado) {
  try {
    var libro = libroProa();
    var hoja = libro.getSheetByName(INFORME_HOJA);
    if (!hoja) { hoja = libro.insertSheet(INFORME_HOJA); hoja.appendRow(ENCABEZADOS_INFORMES); }
    else if (hoja.getLastColumn() < ENCABEZADOS_INFORMES.length) hoja.getRange(1, 1, 1, ENCABEZADOS_INFORMES.length).setValues([ENCABEZADOS_INFORMES]);
    var ia = inf.ia && inf.ia.lectura ? inf.ia : null;
    hoja.appendRow([new Date(), inf.actual.periodo, destino, enviado ? "SI" : "NO", inf.mensaje, textoRegistroIa_(inf.ia).slice(0, 5000),
      ia ? ia.modelo : "", ia ? ia.entrada : "", ia ? ia.salida : "", ia ? ia.costo : "", textoVersiones_()]);
  } catch (err) {
    Logger.log("No se pudo registrar el informe: " + err);
  }
}
