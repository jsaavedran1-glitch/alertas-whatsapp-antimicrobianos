// =====================================================================
// IA_PROA.gs - Puntos para revisar, asistidos por IA (API de Claude), en los mensajes que el bot ya envia al
// grupo PROA: el caso PROA y la revision de duracion. Servicio Farmaceutico - Hospital Departamental de
// Villavicencio E.S.E.
//
// Por que asi (v1.33.0, a pedido del referente): la version anterior daba un veredicto (pertinente / no
// pertinente) y generaba controversia con Infectologia. Esta version no da veredicto ni colores: devuelve como
// maximo IA_MAX_PUNTOS "puntos para revisar", cada uno con la referencia institucional que lo sustenta (tabla de
// duracion, fichas del PROA, analisis de las tablas o los datos de la solicitud). El codigo descarta un punto
// sin referencia valida o con lenguaje de juicio. Si no hay nada que revisar, no agrega nada.
//
// Solo se analiza lo que el bot ya va a enviar (una llamada como maximo por solicitud). Si la API falla, tarda
// o declina, el mensaje sale igual, sin el bloque de la IA.
//
// Propiedades del script:
//   ANTHROPIC_API_KEY        obligatoria. Sin ella el bot funciona exactamente como antes.
//   IA_PROA_MODO             PRUEBA (por defecto): el grupo recibe el mensaje de siempre, sin IA, y PRUEBA BOT
//                            una copia con los puntos de la IA, para que el QF los valide antes de llevarlos al
//                            grupo. PRODUCCION: los puntos van en el mensaje del grupo. NO: sin IA.
//   IA_ESFUERZO              opcional: low | medium | high (por defecto) | xhigh | max.
//   CLAUDE_MODEL             opcional; por defecto IA_MODELO_DEFECTO.
//   GREENAPI_PRUEBA_CHATID   opcional; por defecto IA_CHAT_PRUEBA (PRUEBA BOT).
//
// A la API salen datos seudonimizados: sin historia clinica, nombre, cama, EPS ni medico.
// Pruebas que no envian nada al grupo: probarRevisionIa(), probarIaUltimaSolicitud(fila), probarIaUltimoProlongado().
// =====================================================================

var IA_MODELO_DEFECTO = "claude-opus-5-5";        // elegido por el referente (2026-11-22)
var IA_ESFUERZO_DEFECTO = "high";
var IA_ESFUERZOS = ["low", "medium", "high", "xhigh", "max"];
var IA_URL = "https://api.anthropic.com/v1/messages";
var IA_VERSION_API = "2023-06-01";
var IA_BETA_RESPALDO = "server-side-fallback-2026-07-01";   // si el modelo declina, la API reintenta con otro
var IA_MAX_TOKENS = 16000;   // incluye el razonamiento del modelo
var IA_CHAT_PRUEBA = "120363412506101174@g.us";   // PRUEBA BOT
var IA_MAX_PUNTOS = 3;
var IA_MAX_CARACTERES = 130;                     // por punto del mensaje
var IA_DOCS_URL = "https://raw.githubusercontent.com/jsaavedran1-glitch/alertas-whatsapp-antimicrobianos/main/docs/";
var IA_DOCS = ["antimicrobianos-restringidos.md", "microorganismos.md"];
var IA_FICHAS_CACHE_SEG = 21600;
var IA_REF_TABLA = "Tabla de duración";
var IA_REF_TABLAS_BOT = "Análisis de las tablas del bot";
var IA_REF_DATOS = "Datos de la solicitud";
// Lenguaje de juicio que el referente quiere evitar en el grupo: el punto se descarta (queda en el registro de ejecucion).
var IA_JUICIO = /\bno pertinente|\binadecuad|\bincorrect|\binjustificad|\bmal (indicad|formulad|prescrit)|\berr[oó]ne/i;

// USD por millon de tokens (entrada, salida), solo para el costo aproximado del registro.
var IA_PRECIOS_MTOK = { "claude-opus-5-5": [4, 20], "claude-opus-5": [5, 25], "claude-opus-4-8": [5, 25],
  "claude-sonnet-5-5": [2, 10], "claude-sonnet-5": [2, 10], "claude-haiku-5-5": [0.10, 0.50] };

var IA_REGLAS = [
  "Apoyas al químico farmacéutico del Programa de Optimización de Antimicrobianos (PROA) del Hospital Departamental de Villavicencio, Colombia. El bot del PROA va a enviar al grupo de WhatsApp del programa un mensaje sobre una solicitud de antimicrobiano: un CASO PROA (antimicrobiano restringido que, con esta orden, supera 14 días de tratamiento continuo) o una REVISIÓN DE DURACIÓN (tratamiento que ya lleva más de 10 días con 3 o más prescripciones seguidas). En el grupo están la infectóloga y el equipo PROA, que son quienes deciden.",
  "",
  "Tu tarea es señalar, como máximo, " + IA_MAX_PUNTOS + " puntos que valga la pena revisar en esta solicitud. No das un veredicto ni calificas el tratamiento: señalas datos para verificar. Cero puntos es una respuesta válida y frecuente: si todo cuadra con las referencias, devuelve la lista vacía. No rellenes.",
  "",
  "De dónde puede salir un punto (campo referencia): solo del material que viene en esta petición, y debes escribir la etiqueta exacta de la lista REFERENCIAS PERMITIDAS que va con el caso. \"" + IA_REF_TABLA + "\" para días frente a la duración de referencia del foco; una \"Ficha …\" para cobertura, espectro o uso reservado; \"" + IA_REF_TABLAS_BOT + "\" cuando retomas un hallazgo que ya calcularon las tablas; \"" + IA_REF_DATOS + "\" para una incoherencia entre los datos del formulario (p. ej. indicación etiológica sin germen, cambio por antibiograma sin cultivo, profilaxis de más de 24 h, cultivo de orina con levaduras tratado como candidemia). Lo que no esté sustentado en ese material no es un punto: si te parece importante, menciónalo solo en analisis. No inventes cifras, citas ni guías.",
  "",
  "Antes de decidir, repasa en analisis todos los datos del caso y qué implica cada uno (queda en el registro, no va al grupo): la historia de prescripciones y los días de tratamiento continuo que calcula el bot (úsalos tal cual, no sumes por tu cuenta); edad, peso, servicio y especialidad; diagnóstico y foco, también los diagnósticos de las prescripciones anteriores; microorganismo, mecanismo de resistencia escrito y cultivos; tipo de indicación, inicio o cambio y su razón; origen de la infección; interconsulta a Infectología; cada antimicrobiano con su vía, frecuencia y días; y el análisis de las tablas del bot. Un factor aislado no basta si otro lo explica (p. ej. una duración larga con osteomielitis, endocarditis o un absceso sin drenar).",
  "",
  "No señales: dosis ni ajuste renal (el formulario no trae creatinina y el bot ya marca los rangos), frecuencias (el bot ya las marca), revaluar a las 48-72 h (el bot ya lo sugiere) ni días por debajo del mínimo (las órdenes se renuevan). El formulario no trae antibiograma ni evolución clínica: si un punto depende de eso, nómbralo en datos_faltantes y no lo supongas.",
  "",
  "Cómo escribir cada punto (observacion): una frase de máximo 110 caracteres, en español corriente con tildes, sin markdown, sin el nombre del antimicrobiano (el bot lo pone antes) y sin la fuente (el bot la pone después). Di qué se observa y qué conviene confirmar, en tono de pregunta o de dato a verificar: \"lleva 33 d con foco de piel (referencia 5-7 d); ¿hay osteomielitis o absceso sin drenar?\", \"Klebsiella BLEE sin KPC; ¿se valoró ertapenem en lugar de ceftazidima/avibactam?\". Nunca una orden ni un juicio sobre quien prescribe: no uses \"no pertinente\", \"inadecuado\", \"incorrecto\", \"injustificado\", \"debe\" ni \"suspender\" como imperativo. Si hay interconsulta a Infectología, asume que el esquema puede seguir su recomendación: el punto se plantea como algo a confirmar con Infectología, nunca como una contradicción.",
  "",
  "antimicrobiano es el nombre tal como viene en la solicitud, o vacío si el punto es general. tema es el aspecto del punto. prioridad alta solo si el punto puede cambiar la conducta hoy (no cubre el aislado, días al doble de la referencia o más, profilaxis prolongada); si no, media. Ordena los puntos de mayor a menor prioridad."
].join("\n");

var IA_PUNTO = {
  type: "object",
  additionalProperties: false,
  properties: {
    antimicrobiano: { type: "string", description: "Nombre tal como viene en la solicitud, o vacío si el punto es general." },
    tema: { type: "string", enum: ["duración", "cobertura", "espectro", "combinación", "indicación", "datos"] },
    prioridad: { type: "string", enum: ["alta", "media"] },
    observacion: { type: "string", description: "Una frase de máximo 110 caracteres, en tono de dato a verificar." },
    referencia: { type: "string", description: "Etiqueta exacta de REFERENCIAS PERMITIDAS que sustenta el punto." }
  },
  required: ["antimicrobiano", "tema", "prioridad", "observacion", "referencia"]
};

var IA_ESQUEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    analisis: { type: "string", description: "Repaso de todos los datos del caso antes de decidir. Máximo 1200 caracteres. No va al grupo." },
    puntos: { type: "array", items: IA_PUNTO, description: "Máximo " + IA_MAX_PUNTOS + "; vacía si no hay nada que revisar." },
    datos_faltantes: { type: "array", items: { type: "string" } }
  },
  required: ["analisis", "puntos", "datos_faltantes"]
};

// =====================================================================
// Flujo (llamado desde enviarAlGrupo_ en Codigo.gs)
// =====================================================================

function iaConfigProa_() {
  var props = PropertiesService.getScriptProperties();
  var clave = props.getProperty("ANTHROPIC_API_KEY");
  var modo = String(props.getProperty("IA_PROA_MODO") || "PRUEBA").trim().toUpperCase();
  if (modo !== "PRODUCCION" && modo !== "NO") modo = "PRUEBA";
  var esfuerzo = String(props.getProperty("IA_ESFUERZO") || "").trim().toLowerCase();
  return {
    activa: !!clave && modo !== "NO",
    clave: clave,
    modo: modo,
    modelo: props.getProperty("CLAUDE_MODEL") || IA_MODELO_DEFECTO,
    esfuerzo: IA_ESFUERZOS.indexOf(esfuerzo) > -1 ? esfuerzo : IA_ESFUERZO_DEFECTO,
    chatPrueba: props.getProperty("GREENAPI_PRUEBA_CHATID") || IA_CHAT_PRUEBA
  };
}

// Envia el mensaje con los puntos de la IA segun IA_PROA_MODO. tipo: 'CASO' o 'REVISION'. Devuelve null si la IA
// no esta activa (Codigo.gs envia como siempre) o { ok, destino, ia } con ia = datos para REGISTRO_REVISIONES.
// En PRUEBA el grupo recibe primero su mensaje de siempre: la espera de la API no lo retrasa.
function enviarConRevisionIa_(e, coincidencias, mensaje, tipo) {
  var cfg = iaConfigProa_();
  if (!cfg.activa) return null;
  var envio, r, destino;
  if (cfg.modo === "PRODUCCION") {
    r = revisarConIa_(e, coincidencias, cfg, tipo);
    var lineas = lineasIa_(r, false);
    envio = enviarAlertaWhatsApp(lineas.length ? mensaje + "\n\n" + lineas.join("\n") : mensaje, { sinFirma: true });
    destino = "PRODUCCION" + (lineas.length ? " (con puntos de IA)" : "");
  } else {
    envio = enviarAlertaWhatsApp(mensaje, { sinFirma: true });
    r = revisarConIa_(e, coincidencias, cfg, tipo);
    var copia = enviarAlertaWhatsApp(mensaje + "\n\n" + lineasIa_(r, true).join("\n"), { chatId: cfg.chatPrueba, sinFirma: true });
    destino = "PRODUCCION + PRUEBA BOT (IA" + (copia && copia.ok ? "" : ", copia no enviada") + ")";
  }
  return { ok: !!(envio && envio.ok), destino: destino, ia: datosRegistroIa_(r) };
}

// Bloque de la IA para el mensaje. paraPrueba: en PRUEBA BOT tambien se dice cuando no hay puntos o la API fallo;
// en el grupo, sin puntos no se agrega nada.
function lineasIa_(r, paraPrueba) {
  var E = function(cp) { return String.fromCodePoint(cp); };
  var robot = E(0x1F916), lupa = E(0x1F50E);
  if (!r.revision) return paraPrueba ? ["_" + robot + " IA sin respuesta: " + r.motivo + "_"] : [];
  if (!r.revision.puntos.length) return paraPrueba ? ["_" + robot + " IA: sin puntos para revisar_"] : [];
  var lineas = ["*" + robot + " Para revisar (IA)*"];
  r.revision.puntos.forEach(function(p) {
    lineas.push(lupa + " " + (p.nombre ? p.nombre + " · " : "") + p.observacion + " (" + p.referencia.replace(/^Ficha /, "ficha ").replace(/^Tabla /, "tabla ")
      .replace(/^Análisis /, "análisis ").replace(/^Datos /, "datos ") + ")");
  });
  lineas.push("_Apoyo automático; la decisión es del equipo PROA_");
  return lineas;
}

// Lo que se guarda en REGISTRO_REVISIONES: el texto (puntos, descartados, datos faltantes y el repaso del caso),
// modelo, tokens y costo aproximado.
function datosRegistroIa_(r) {
  if (!r.revision) return { registro: "IA sin respuesta: " + r.motivo, modelo: "", entrada: "", salida: "", costo: "" };
  var rev = r.revision;
  var partes = ["IA (" + rev.segundos + " s): " + (rev.puntos.length ? rev.puntos.map(function(p) {
    return "[" + p.prioridad + "] " + (p.nombre ? p.nombre + " · " : "") + p.tema + ": " + p.observacion + " (" + p.referencia + ")";
  }).join(" | ") : "sin puntos para revisar")];
  if (rev.descartados.length) partes.push("Descartados: " + rev.descartados.join(" | "));
  if (rev.datosFaltantes.length) partes.push("Faltan: " + rev.datosFaltantes.join(", "));
  partes.push("Repaso: " + rev.analisis);
  return { registro: partes.join("\n"), modelo: rev.modelo, entrada: rev.entrada, salida: rev.salida, costo: rev.costo };
}

// Pide los puntos a la API. Devuelve { revision: { puntos, descartados, analisis, datosFaltantes, modelo, entrada,
// salida, costo, segundos } } o { revision: null, motivo } si algo falla (el mensaje sale sin el bloque de la IA).
function revisarConIa_(e, coincidencias, cfg, tipo) {
  var inicio = Date.now();
  try {
    var referencia = referenciaProa_(e);
    if (!referencia) return { revision: null, motivo: "no se pudieron leer las fichas del PROA" };
    var tablas = analisisPertinenciaDesdeEvento(e, coincidencias);
    var permitidas = [IA_REF_TABLA, IA_REF_TABLAS_BOT, IA_REF_DATOS].concat(referencia.etiquetas);
    var cuerpo = {
      model: cfg.modelo,
      max_tokens: IA_MAX_TOKENS,
      // lo estable primero (reglas y tabla), las fichas del caso despues
      system: IA_REGLAS + "\n\n" + tablaDuracionIa_() + "\n\n" + referencia.texto,
      output_config: { effort: cfg.esfuerzo, format: { type: "json_schema", schema: IA_ESQUEMA } },
      fallbacks: "default",
      messages: [{ role: "user", content: textoCasoIa_(e, coincidencias, tipo) +
        "\n\nAnálisis de las tablas del bot para este caso:\n" +
        (tablas.lineas.length ? tablas.lineas.join("\n").replace(/[*_]/g, "") : "Sin criterio en las tablas.") +
        "\n\nREFERENCIAS PERMITIDAS (escribe una de estas etiquetas en referencia):\n" + permitidas.map(function(x) { return "- " + x; }).join("\n") }]
    };
    var resp = llamarApiIa_(cuerpo, cfg, true);
    // Si la API no acepta el respaldo ante declinaciones, se repite la peticion sin el.
    if (resp.getResponseCode() === 400 && /fallback/i.test(resp.getContentText())) {
      delete cuerpo.fallbacks;
      resp = llamarApiIa_(cuerpo, cfg, false);
    }
    var segundos = Math.round((Date.now() - inicio) / 1000);
    var texto = resp.getContentText();
    if (resp.getResponseCode() !== 200) {
      Logger.log("IA: API HTTP %s en %s s: %s", resp.getResponseCode(), segundos, ocultarClaveIa_(texto.substring(0, 300), cfg.clave));
      return { revision: null, motivo: "HTTP " + resp.getResponseCode() };
    }
    var datos = JSON.parse(texto);
    if (datos.stop_reason === "refusal" || datos.stop_reason === "max_tokens") {
      // stop_details.category dice que filtro declino (p. ej. bio): sirve para ajustar el texto del caso.
      var cat = datos.stop_details && datos.stop_details.category ? ", categoría " + datos.stop_details.category : "";
      Logger.log("IA sin resultado (%s%s; modelo %s; %s s).", datos.stop_reason, cat, datos.model || cfg.modelo, segundos);
      return { revision: null, motivo: (datos.stop_reason === "refusal" ? "el modelo declinó" : "respuesta incompleta") + cat };
    }
    // Con respaldo puede haber texto del modelo que declino antes del bloque fallback: vale el ultimo bloque de texto.
    var bloques = (datos.content || []).filter(function(b) { return b.type === "text" && b.text; });
    if (!bloques.length) return { revision: null, motivo: "respuesta sin texto" };
    var salida = JSON.parse(bloques[bloques.length - 1].text);
    var filtrado = puntosIa_(salida.puntos, leerSlots(e), permitidas);
    var modelo = datos.model || cfg.modelo;
    var entrada = (datos.usage && datos.usage.input_tokens) || 0, salidaTok = (datos.usage && datos.usage.output_tokens) || 0;
    var p = IA_PRECIOS_MTOK[modelo] || IA_PRECIOS_MTOK[cfg.modelo];
    var revision = {
      puntos: filtrado.puntos,
      descartados: filtrado.descartados,
      analisis: String(salida.analisis || "").replace(/\s+/g, " ").substring(0, 1500),
      datosFaltantes: salida.datos_faltantes || [],
      modelo: modelo,
      entrada: entrada,
      salida: salidaTok,
      costo: p ? Number(((entrada * p[0] + salidaTok * p[1]) / 1e6).toFixed(4)) : "",
      segundos: segundos
    };
    Logger.log("IA (%s, esfuerzo %s, %s s): %s punto(s)%s; tokens %s/%s; aprox. USD %s.", modelo, cfg.esfuerzo, segundos, revision.puntos.length,
      revision.descartados.length ? ", " + revision.descartados.length + " descartado(s)" : "", entrada, salidaTok, revision.costo);
    return { revision: revision };
  } catch (err) {
    var s = Math.round((Date.now() - inicio) / 1000);
    Logger.log("IA sin resultado en %s s: %s", s, ocultarClaveIa_(String(err), cfg.clave));
    return { revision: null, motivo: (/timeout|tiempo/i.test(String(err)) ? "tardó demasiado (" + s + " s)" : "error al leer la respuesta") };
  }
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

// =====================================================================
// Auxiliares
// =====================================================================

// Puntos validos: de un antimicrobiano de la solicitud (o generales), con una referencia de la lista permitida y
// sin lenguaje de juicio; como maximo IA_MAX_PUNTOS, los de prioridad alta primero.
function puntosIa_(lista, esquemas, permitidas) {
  var clave = function(t) { return normalizarTexto(t).replace(/[^A-Z0-9]/g, ""); };
  var puntos = [], descartados = [];
  (lista || []).forEach(function(x) {
    var observacion = fraseIa_(x.observacion);
    if (!observacion) return;
    var nombre = "";
    if (clave(x.antimicrobiano)) {
      var c = clave(x.antimicrobiano), am = null;
      esquemas.forEach(function(q) { var k = clave(q.nombre); if (!am && k && (k === c || k.indexOf(c) > -1 || c.indexOf(k) > -1)) am = q; });
      if (!am) { descartados.push(observacion + " (antimicrobiano que no está en la solicitud)"); return; }
      nombre = am.nombre;
    }
    var ref = referenciaValida_(x.referencia, permitidas);
    if (!ref) { descartados.push(observacion + " (sin referencia permitida: " + (x.referencia || "vacía") + ")"); return; }
    if (IA_JUICIO.test(observacion)) { descartados.push(observacion + " (lenguaje de juicio)"); return; }
    puntos.push({ nombre: nombre, tema: String(x.tema || ""), prioridad: x.prioridad === "alta" ? "alta" : "media",
      observacion: observacion.replace(/^[A-ZÁÉÍÓÚÑ](?=[a-záéíóúñ ])/, function(l) { return l.toLowerCase(); }), referencia: ref });
  });
  puntos.sort(function(a, b) { return (b.prioridad === "alta") - (a.prioridad === "alta"); });
  puntos.slice(IA_MAX_PUNTOS).forEach(function(p) { descartados.push(p.observacion + " (más de " + IA_MAX_PUNTOS + " puntos)"); });
  return { puntos: puntos.slice(0, IA_MAX_PUNTOS), descartados: descartados };
}

// La etiqueta permitida que corresponde a lo que escribio el modelo, o '' si ninguna.
function referenciaValida_(texto, permitidas) {
  var limpia = function(t) { return normalizarTexto(t).replace(/^FICHA( DE)?\s+/, "").replace(/[^A-Z0-9]/g, ""); };
  var r = limpia(texto);
  if (r.length < 4) return "";
  for (var i = 0; i < permitidas.length; i++) {
    var p = limpia(permitidas[i]);
    if (p === r || p.indexOf(r) > -1 || r.indexOf(p) > -1) return permitidas[i];
  }
  return "";
}

// Caso seudonimizado: sin historia clinica, nombre, cama, EPS ni medico. tipo: 'CASO' o 'REVISION'.
function textoCasoIa_(e, coincidencias, tipo) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var c = function(nombre) { return campoDelEvento(valores, nombre) || "-"; };
  var pesoKg = pesoKgDesde(c(CAMPOS.PESO_KG), c(CAMPOS.PESO_G));
  var reglas = obtenerRangosDosis();
  var lista = obtenerAntimicrobianosRestringidos();
  var lineas = [
    "Mensaje que el bot va a enviar: " + (tipo === "REVISION"
      ? "REVISIÓN DE DURACIÓN (tratamiento que ya lleva más de " + CONFIG.PROLONGADO_DIAS + " días con " + CONFIG.PROLONGADO_MIN_SOLICITUDES + " o más prescripciones seguidas)"
      : "CASO PROA (antimicrobiano restringido que, con esta orden, supera " + CONFIG.CASO_DIAS_MINIMOS + " días de tratamiento continuo)"),
    "",
    "Edad: " + edadTexto(c(CAMPOS.EDAD_ANIOS), c(CAMPOS.EDAD_MESES), c(CAMPOS.EDAD_DIAS)),
    "Sexo: " + c("Sexo"),
    "Peso: " + (pesoKg !== null ? formatoNumero(pesoKg, 2) + " kg" : "-"),
    "Servicio: " + c(CAMPOS.SERVICIO),
    "Especialidad que prescribe: " + c(CAMPOS.ESPECIALIDAD),
    "Diagnóstico CIE10: " + formatearDiagnosticoCIE10(c(CAMPOS.DIAGNOSTICO)),
    "Microorganismo aislado: " + c(CAMPOS.MICROORGANISMO),
    "Cultivos tomados: " + c(CAMPOS.CULTIVOS),
    "Tipo de indicación: " + tipoIndicacionTexto(c(CAMPOS.TIPO_INDICACION)),
    "Indicación (inicio o cambio): " + c(CAMPOS.INDICACION),
    "Razón del cambio: " + c(CAMPOS.RAZON_CAMBIO),
    "Origen de la infección: " + c(CAMPOS.ORIGEN),
    "Infección nosocomial: " + c("Infección nosocomial"),
    "Interconsulta a Infectología: " + c(CAMPOS.INTERCONSULTA),
    "Ajuste renal marcado por el médico: " + c(CAMPOS.AJUSTE_RENAL),
    "Falla hepática: " + c(CAMPOS.FALLA_HEPATICA),
    "",
    "Antimicrobianos de la solicitud:"
  ];
  leerSlots(e).forEach(function(am, i) {
    var ev = evaluarDosis(am.nombre, am.dosis, pesoKg, reglas);
    lineas.push((i + 1) + ". " + am.nombre + (esRestringido(am.nombre, lista) ? " (restringido)" : " (no restringido)") +
      " · dosis " + am.dosis + " mg · vía " + am.via + " · cada " + am.frecuencia + " h · " + am.dias + " días" +
      (ev.revisar ? " · el bot ya marcó la dosis fuera de rango" : ""));
  });
  var seg = seguimientoPaciente(e), prolongado = tratamientoProlongado(e);
  if (prolongado) {
    lineas.push("", "TRATAMIENTO PROLONGADO: es la prescripción " + prolongado.solicitudes + " del mismo tratamiento continuo y el paciente ya lleva " +
      prolongado.dias + " d" + (prolongado.proyectado > prolongado.dias ? " (con esta orden, " + prolongado.proyectado + " d)" : "") +
      (prolongado.nuevos.length ? "; se formula " + prolongado.nuevos.join(" + ") + ", que no venía recibiendo" : "") + ".");
  }
  if (seg.historia.length) {
    lineas.push("", "HISTORIA DEL PACIENTE: solicitudes previas de antimicrobianos, de la más antigua a la más reciente (fecha de la orden: esquema · diagnóstico · aislamiento · tipo de indicación · inicio o cambio · servicio):");
    seg.historia.forEach(function(l) { lineas.push("- " + l); });
    lineas.push("", "Cálculo del bot sobre esa historia (días de tratamiento continuo; úsalo tal cual, no sumes por tu cuenta):");
    seg.lineas.forEach(function(l) { lineas.push("- " + l.replace(/^[\s\u{1F501}]+/u, "").replace(/\*/g, "")); });
  } else {
    lineas.push("", "HISTORIA DEL PACIENTE: sin solicitudes previas en la matriz en los últimos " + CONFIG.SEGUIMIENTO_DIAS + " días.");
  }
  return lineas.join("\n");
}

// Tabla de duracion por sindrome (la misma que usa Codigo.gs), como texto para el modelo.
function tablaDuracionIa_() {
  var filas = obtenerPertinencia().map(function(f) {
    var rango = f.max === null ? "sin rango" : ((f.min !== null && f.min !== f.max) ? f.min + "-" + f.max : f.max) + " días";
    return "- " + f.sindrome + " (CIE10 " + (f.prefijos.join(", ") || "-") + "): " + rango + (f.nota ? " · " + f.nota : "") + " · fuente: " + f.fuente;
  });
  return "=== " + IA_REF_TABLA.toUpperCase() + " POR SÍNDROME (referencia) ===\n" + filas.join("\n") +
    "\n- Profilaxis quirúrgica: máximo 24 h (48 h en cirugía cardiaca) · fuente: OMS 2018; CDC 2017";
}

// Que fichas de microorganismos (numero de seccion de docs/microorganismos.md) aplican a cada aislamiento.
var IA_FICHAS_MICRO = [["KLEBS|KLEPS|KLES", 1], ["COLI", 2], ["PSEUDOMON", 3], ["ENTEROBACTER|CITROBACTER", 4], ["SERRATIA", 5],
  ["ACINETO", 6], ["AUREUS|SAMR|SARM|MRSA", 7], ["EPIDERMIDIS|HOMINIS|HAEMOLYTICUS|COAGULASA", 8], ["ENTEROCOC", 9], ["AURIS", 10],
  ["LEVADURA|CANDIDA", 11], ["HISTOPLASM", 12], ["TUBERC|MYCOBACT|MICOBACT", 13], ["SALMONELLA", 14], ["PANTOEA", 15], ["GRAM", 16]];
// Nombre de la matriz -> palabra del titulo de la ficha en docs/antimicrobianos-restringidos.md.
var IA_FICHAS_AM = [["VANCOMICINA", "Vancomicina"], ["LINEZOLID", "Linezolid"], ["DAPTOMICINA", "Daptomicina"], ["CASPOFUNGINA", "Caspofungina"],
  ["LIPOSOMAL", "liposomal"], ["ANFOTERICINA", "Anfotericina"], ["ERTAPENEM", "Ertapenem"], ["AZTREONAM", "Aztreonam"], ["AVIBACTAM", "avibactam"],
  ["TYGECICLINA", "Tigeciclina"], ["TIGECICLINA", "Tigeciclina"], ["DORIPENEM", "Doripenem"], ["RIFAMPICINA", "Rifampicina"], ["POLIMIXINA", "Polimixina"]];

// Secciones "### N. Titulo" de un documento que cumplen el filtro; el texto anterior a la primera ficha
// (resumen y como leerlas) va siempre. Devuelve { texto, titulos }. Si ninguna cumple, va el documento
// completo o solo ese texto inicial.
function fichasDelCaso_(texto, incluir, soloCabezaSiNinguna) {
  var partes = texto.split(/\n(?=### )/);
  var cabeza = partes.shift();
  var elegidas = partes.filter(function(seccion) {
    var titulo = seccion.split("\n")[0];
    return incluir(titulo, Number((titulo.match(/^### (\d+)\./) || [])[1]));
  }).map(function(seccion) { return seccion.split(/\n(?=## )/)[0]; });
  cabeza = cabeza.split(/\n(?=## Fichas)/)[0];
  if (elegidas.length === 0) return { texto: soloCabezaSiNinguna ? cabeza : texto, titulos: [] };
  return {
    texto: cabeza + "\n\n## Fichas del caso\n\n" + elegidas.join("\n\n"),
    titulos: elegidas.map(function(s) {
      return "Ficha " + s.split("\n")[0].replace(/^###\s*\d+\.\s*/, "").replace(/\*/g, "").replace(/\s*\(.*$/, "").replace(/"/g, "").trim();
    })
  };
}

// Fichas del repositorio que aplican al caso (antimicrobianos de la solicitud y microorganismo aislado), leidas
// de GitHub con cache de 6 h: { texto, etiquetas } (etiquetas: "Ficha ..." que el modelo puede citar). null si
// falta algun documento.
function referenciaProa_(e) {
  var nombres = leerSlots(e).map(function(am) { return String(am.nombre).toUpperCase(); });
  var micro = normalizarAislamiento(campoDelEvento((e && e.namedValues) || {}, CAMPOS.MICROORGANISMO));
  var filtros = {
    "antimicrobianos-restringidos.md": function(titulo) {
      return IA_FICHAS_AM.some(function(par) { return titulo.indexOf(par[1]) > -1 && nombres.some(function(n) { return n.indexOf(par[0]) > -1; }); });
    },
    "microorganismos.md": function(titulo, numero) {
      return IA_FICHAS_MICRO.some(function(par) { return par[1] === numero && (new RegExp(par[0])).test(micro); });
    }
  };
  var partes = [], etiquetas = [];
  for (var i = 0; i < IA_DOCS.length; i++) {
    var texto = documentoProa_(IA_DOCS[i]);
    if (!texto) return null;
    // sin restringidos en la solicitud (revision de duracion) no va ninguna ficha de antimicrobiano, solo el resumen
    var r = fichasDelCaso_(texto, filtros[IA_DOCS[i]], true);
    r.titulos.forEach(function(t) { if (etiquetas.indexOf(t) === -1) etiquetas.push(t); });
    partes.push("=== " + IA_DOCS[i] + " (referencia) ===\n\n" + r.texto);
  }
  return { texto: partes.join("\n\n"), etiquetas: etiquetas };
}

function documentoProa_(nombre) {
  var cache = null, clave = "IA_PROA_DOC_" + nombre;
  try {
    cache = CacheService.getScriptCache();
    var enCache = cache.get(clave);
    if (enCache) return enCache;
  } catch (e) {}
  try {
    var resp = UrlFetchApp.fetch(IA_DOCS_URL + nombre, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) return null;
    var texto = resp.getContentText("UTF-8");
    if (texto.length < 1000) return null;
    try { if (cache) cache.put(clave, texto, IA_FICHAS_CACHE_SEG); } catch (e2) {}
    return texto;
  } catch (e3) {
    return null;
  }
}

// Una frase limpia para WhatsApp: sin marcas de formato y con tope de longitud.
function fraseIa_(s) {
  var t = String(s === undefined || s === null ? "" : s).replace(/[*~\x60]/g, "").replace(/_/g, " ").replace(/\s+/g, " ").trim()
    .replace(/\b(?:DepCr|ClCr|CrCl)\b/g, "depuración de creatinina").replace(/\.$/, "");
  if (t.length > IA_MAX_CARACTERES) t = t.substring(0, IA_MAX_CARACTERES - 1).replace(/\s+\S*$/, "") + "…";
  return t;
}

function ocultarClaveIa_(texto, clave) {
  return clave ? String(texto).split(clave).join("***") : String(texto);
}

// =====================================================================
// Pruebas (no envian nada al grupo; las que llaman a la API cuestan unos USD 0,05-0,15 por caso)
// =====================================================================

// Puntos de la IA para una fila real de la matriz (o la ultima que genera mensaje). Solo escribe en el registro
// de ejecucion. Requiere ANTHROPIC_API_KEY.
function probarIaUltimaSolicitud(filaOpcional) { probarSolicitud_(filaOpcional, false, true); }
function probarIaUltimoProlongado() { probarSolicitud_(null, true, true); }

// Para probarSolicitud_ en Codigo.gs: el bloque que veria PRUEBA BOT.
function bloqueIaParaPrueba_(e, coincidencias, tipo) {
  var cfg = iaConfigProa_();
  if (!cfg.clave) return "_IA: falta ANTHROPIC_API_KEY en Propiedades del script_";
  var r = revisarConIa_(e, coincidencias, cfg, tipo);
  return lineasIa_(r, true).join("\n") + "\n▶ Registro: " + datosRegistroIa_(r).registro;
}

// Casos ficticios: escribe en el registro de ejecucion el bloque de la IA de cada uno. No envia nada.
function probarRevisionIa() {
  var cfg = iaConfigProa_();
  if (!cfg.clave) { Logger.log("Falta ANTHROPIC_API_KEY en Propiedades del script."); return; }
  [["Ceftazidima/avibactam empírica, neumonía de la comunidad sin cultivos", eventoPruebaIaCeftazidimaComunidad()],
   ["Ertapenem con Pseudomonas", eventoPruebaIaErtapenemPseudomonas()],
   ["Daptomicina en neumonía por SARM + piperacilina/tazobactam", eventoPruebaIaDaptomicinaNeumonia()]].forEach(function(caso) {
    var coincidencias = filtrarAntimicrobianosRestringidos(caso[1]);
    var r = revisarConIa_(caso[1], coincidencias, cfg, "CASO");
    Logger.log("=== %s ===\n%s\n\n%s", caso[0], lineasIa_(r, true).join("\n"), datosRegistroIa_(r).registro);
  });
}

// Envia SOLO a PRUEBA BOT (IA_CHAT_PRUEBA fijo; no usa GREENAPI_GROUP_CHATID ni toca produccion) el mensaje de un
// caso ficticio con los puntos de la IA, para verlo tal como llega a WhatsApp.
function enviarPruebaIaAPruebaBot() {
  var cfg = iaConfigProa_();
  if (!cfg.clave) { Logger.log("Falta ANTHROPIC_API_KEY en Propiedades del script."); return; }
  var e = eventoPruebaIaCeftazidimaComunidad(), coincidencias = filtrarAntimicrobianosRestringidos(e);
  var r = revisarConIa_(e, coincidencias, cfg, "CASO");
  var envio = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias) + "\n\n" + lineasIa_(r, true).join("\n"),
    { chatId: IA_CHAT_PRUEBA, sinFirma: true });
  Logger.log("PRUEBA BOT: " + JSON.stringify(envio) + "\n" + datosRegistroIa_(r).registro);
}

function eventoPruebaIaDaptomicinaNeumonia() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ["55555555"]; nv[CAMPOS.EDAD_ANIOS] = ["58"]; nv[CAMPOS.PESO_KG] = ["80"];
  nv[CAMPOS.SERVICIO] = ["Unidad de Cuidado Crítico UCI A"]; nv[CAMPOS.ESPECIALIDAD] = ["Medicina Interna"];
  nv[CAMPOS.DIAGNOSTICO] = ["J189"]; nv[CAMPOS.MICROORGANISMO] = ["Staphylococcus aureus resistente a meticilina"];
  nv[CAMPOS.TIPO_INDICACION] = ["Tratamiento Etiológico (En presencia de aislamiento conocido)"];
  nv[CAMPOS.CULTIVOS] = ["ASPIRADO TRAQUEAL"]; nv[CAMPOS.ORIGEN] = ["IAAS"]; nv[CAMPOS.INDICACION] = ["TERAPEUTICO"];
  nv[CAMPOS.INTERCONSULTA] = ["Sí"]; nv[CAMPOS.AJUSTE_RENAL] = ["No"]; nv[CAMPOS.FALLA_HEPATICA] = ["No"];
  nv["Nombre Antimicrobiano 1"] = ["DAPTOMICINA - UT-19981181-1"]; nv["Dosis en miligramos o UI AB1"] = ["500"];
  nv["Vía de adminsitración de  AM1"] = ["Intravenoso"]; nv["Frecuencia AM 1 (En Horas)"] = ["24"]; nv["Días ordenados AM1"] = ["21"];
  nv["Nombre Antimicrobiano 2"] = ["PIPERACILINA / TAZOBACTAM - UT-19970001-1"]; nv["Dosis en miligramos o UI AM2"] = ["4500"];
  nv["Vía de adminsitración de  AM2"] = ["Intravenoso"]; nv["Frecuencia AM 2 (En horas)"] = ["6"]; nv["Días ordenados AM2"] = ["7"];
  return { namedValues: nv };
}

function eventoPruebaIaErtapenemPseudomonas() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ["44444444"]; nv[CAMPOS.EDAD_ANIOS] = ["71"]; nv[CAMPOS.PESO_KG] = ["62"];
  nv[CAMPOS.SERVICIO] = ["Hospitalización Medicina Interna"]; nv[CAMPOS.ESPECIALIDAD] = ["Medicina Interna"];
  nv[CAMPOS.DIAGNOSTICO] = ["N390"]; nv[CAMPOS.MICROORGANISMO] = ["Pseudomonas aeruginosa"];
  nv[CAMPOS.TIPO_INDICACION] = ["Tratamiento Etiológico (En presencia de aislamiento conocido)"];
  nv[CAMPOS.CULTIVOS] = ["UROCULTIVO"]; nv[CAMPOS.ORIGEN] = ["IAAS"]; nv[CAMPOS.INDICACION] = ["CAMBIO"];
  nv[CAMPOS.RAZON_CAMBIO] = ["POR ANTIBIOGRAMA"]; nv[CAMPOS.INTERCONSULTA] = ["No"];
  nv[CAMPOS.AJUSTE_RENAL] = ["Sí"]; nv[CAMPOS.DEP_CREATININA] = ["24"];
  nv["Nombre Antimicrobiano 1"] = ["ERTAPENEM - UT-19973898-1"]; nv["Dosis en miligramos o UI AB1"] = ["1000"];
  nv["Vía de adminsitración de  AM1"] = ["Intravenoso"]; nv["Frecuencia AM 1 (En Horas)"] = ["24"]; nv["Días ordenados AM1"] = ["21"];
  return { namedValues: nv };
}

function eventoPruebaIaCeftazidimaComunidad() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ["33333333"]; nv[CAMPOS.EDAD_ANIOS] = ["47"]; nv[CAMPOS.PESO_KG] = ["72"];
  nv[CAMPOS.SERVICIO] = ["Urgencias"]; nv[CAMPOS.ESPECIALIDAD] = ["Medicina Interna"];
  nv[CAMPOS.DIAGNOSTICO] = ["J189"]; nv[CAMPOS.MICROORGANISMO] = ["Ninguno"];
  nv[CAMPOS.TIPO_INDICACION] = ["Tratamiento Empírico (En presencia o sospecha de infección sin germen documentado - sin antibiograma))"];
  nv[CAMPOS.CULTIVOS] = ["NINGUNO"]; nv[CAMPOS.ORIGEN] = ["COMUNIDAD"]; nv[CAMPOS.INDICACION] = ["TERAPEUTICO"];
  nv[CAMPOS.INTERCONSULTA] = ["No"]; nv[CAMPOS.AJUSTE_RENAL] = ["No"]; nv[CAMPOS.FALLA_HEPATICA] = ["No"];
  nv["Nombre Antimicrobiano 1"] = ["CEFTAZIDIMA / AVIBACTAM - UT-19998801-1"]; nv["Dosis en miligramos o UI AB1"] = ["2500"];
  nv["Vía de adminsitración de  AM1"] = ["Intravenoso"]; nv["Frecuencia AM 1 (En Horas)"] = ["8"]; nv["Días ordenados AM1"] = ["21"];
  return { namedValues: nv };
}
