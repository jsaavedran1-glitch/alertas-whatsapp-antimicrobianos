// =====================================================================
// IA_PROA.gs - Revision clinica asistida por IA (API de Claude) de cada solicitud con antimicrobiano
// restringido. Servicio Farmaceutico - Hospital Departamental de Villavicencio E.S.E.
//
// Cada caso sale en dos mensajes al mismo grupo:
//   1. el mensaje base de siempre, sin la linea de sugerencia PROA;
//   2. segundos despues, la revision como RESPUESTA CITADA al mensaje 1 (quotedMessageId de Green-API):
//      la sugerencia PROA (48-72 h) y hasta IA_MAX_HALLAZGOS_MENSAJE hallazgos de severidad alta o media.
// Seis revisiones: ESP espectro frente a microorganismo y foco, DUP duplicidad de espectro, DUR duracion
// frente a foco e indicacion, IND indicacion frente a la ficha, CAM coherencia del cambio, DES desescalar o VO.
// La dosis y el ajuste renal no se revisan aqui: el formulario no trae creatinina (decision del referente,
// 2026-11-07); los rangos de dosis los sigue marcando Codigo.gs.
// La referencia del modelo son las fichas de docs/antimicrobianos-restringidos.md del repositorio. La IA
// no decide: propone, y el QF valida.
//
// Propiedades del script:
//   ANTHROPIC_API_KEY        obligatoria. Sin ella el bot funciona exactamente como antes.
//   IA_PROA_MODO             PRUEBA (por defecto): produccion recibe el mensaje de siempre y PRUEBA BOT la
//                            copia base + revision citada. PRODUCCION: base + revision en el grupo de
//                            produccion. NO: sin IA.
//   GREENAPI_PRUEBA_CHATID   opcional; por defecto IA_CHAT_PRUEBA (PRUEBA BOT).
//   CLAUDE_MODEL             opcional; por defecto IA_MODELO_DEFECTO.
//
// A la API salen datos seudonimizados: sin historia clinica, nombre, cama, EPS ni medico.
// Si la API falla, el mensaje base ya salio; la revision lleva solo la sugerencia PROA, si la hay.
// Prueba sin enviar nada: probarRevisionIa().
// =====================================================================

var IA_MODELO_DEFECTO = "claude-sonnet-5-5";
var IA_URL = "https://api.anthropic.com/v1/messages";
var IA_VERSION_API = "2023-06-01";
var IA_MAX_TOKENS = 4096;   // incluye el razonamiento del modelo: con 1500 un caso se corto (max_tokens)
var IA_CHAT_PRUEBA = "120363412506101174@g.us";   // PRUEBA BOT
var IA_MAX_HALLAZGOS_MENSAJE = 3;
var IA_CODIGOS = ["ESP", "DUP", "DUR", "IND", "CAM", "DES"];
// Vancomicina y linezolid solos no disparan alerta; con un hallazgo de severidad alta si se envian.
var IA_ALERTA_SI_ALTA_SIN_DISPARO = true;
var IA_FICHAS_URL = "https://raw.githubusercontent.com/jsaavedran1-glitch/alertas-whatsapp-antimicrobianos/main/docs/antimicrobianos-restringidos.md";
var IA_FICHAS_CACHE_SEG = 21600;
var IA_ESPERA_RESPUESTA_MS = 1500;               // entre el mensaje base y la revision citada

// USD por millon de tokens (entrada, salida), solo para el costo aproximado del registro.
var IA_PRECIOS_MTOK = { "claude-haiku-5-5": [0.10, 0.50], "claude-sonnet-5-5": [2, 10], "claude-opus-5-5": [4, 20] };

var IA_REGLAS = [
  "Eres el quimico farmaceutico del Programa de Optimizacion de Antimicrobianos (PROA) del Hospital Departamental de Villavicencio, Colombia.",
  "Revisas una solicitud de antimicrobiano restringido y devuelves hallazgos en seis revisiones:",
  "- ESP espectro frente a microorganismo y foco: farmaco sin actividad frente al aislado o que no sirve en ese foco (p. ej. daptomicina en neumonia, tigeciclina en bacteriemia o neumonia nosocomial, ertapenem con Pseudomonas, Acinetobacter o Enterococcus, ceftazidima/avibactam sola frente a NDM, rifampicina sin acompanante).",
  "- DUP duplicidad de espectro en la combinacion (dos carbapenemicos, carbapenemico + piperacilina/tazobactam, dos anti-SARM, un carbapenemico agregado a ceftazidima/avibactam frente a KPC).",
  "- DUR duracion ordenada frente a foco e indicacion (profilaxis de mas de 24 h, un Reserve ordenado a 14 dias cuando el foco admite 7, dias que no cuadran con el diagnostico).",
  "- IND indicacion frente a la ficha: si el diagnostico, el microorganismo, el origen (IAAS o comunidad) y el tipo de indicacion (empirica, etiologica, profilactica) justifican ese antimicrobiano restringido segun su ficha (para que se usa y por que esta restringido). Ejemplos: ceftazidima/avibactam sin carbapenemasa ni Pseudomonas multirresistente documentada o con sospecha fundada; caspofungina sin Candida aislada ni sospecha de candidiasis invasiva; tigeciclina fuera de infeccion intraabdominal o de piel; linezolid o daptomicina sin grampositivo resistente documentado o sospechado; anfotericina B liposomal donde la convencional bastaria; rifampicina sin tuberculosis ni material protesico; un Reserve en profilaxis.",
  "- CAM coherencia del cambio: razon declarada que no cuadra con el cultivo o el microorganismo, indicacion empirica con aislado y cambio por antibiograma, escalamiento sin cultivo tomado.",
  "- DES oportunidad de desescalar o pasar a via oral (acompanante de amplio espectro que no aporta frente al aislado, linezolid IV con via oral disponible).",
  "Reglas:",
  "- Referencia: las fichas del PROA que siguen. Severidad alta solo cuando la ficha lo sustenta; un principio farmacologico general que no este en las fichas va como media o baja, con ficha = \"conocimiento general\".",
  "- Severidad alta = riesgo de falla terapeutica o de toxicidad; media = optimizacion con impacto clinico o de costo; baja = registro incoherente o dato faltante.",
  "- No evalues dosis ni ajuste renal: el formulario no trae creatinina y los rangos de dosis los marca el bot.",
  "- No repitas la sugerencia de revaluar a las 48-72 h con cultivos: el bot ya la da.",
  "- El formulario no trae antibiograma, solo el nombre del microorganismo: los hallazgos DES van como \"considerar\".",
  "- Si falta el dato que una revision necesita, no supongas: omite esa revision y nombra el dato en datos_faltantes.",
  "- detalle: una frase de maximo 120 caracteres, en espanol, con tono de sugerencia (valorar, revaluar, considerar), nunca una orden.",
  "- En detalle usa ortograf\u00eda espa\u00f1ola correcta, con tildes (p. ej. neumon\u00eda, d\u00edas).",
  "- Maximo 5 hallazgos, de mayor a menor severidad. Sin hallazgos, lista vacia."
].join("\n");

var IA_ESQUEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hallazgos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          codigo: { type: "string", enum: IA_CODIGOS },
          severidad: { type: "string", enum: ["alta", "media", "baja"] },
          antimicrobiano: { type: "string", description: "Antimicrobiano al que se refiere el hallazgo." },
          detalle: { type: "string", description: "Una frase de maximo 120 caracteres." },
          ficha: { type: "string", description: "Ficha que lo sustenta (p. ej. Ficha 7 Ertapenem) o conocimiento general." }
        },
        required: ["codigo", "severidad", "antimicrobiano", "detalle", "ficha"]
      }
    },
    datos_faltantes: { type: "array", items: { type: "string" } }
  },
  required: ["hallazgos", "datos_faltantes"]
};

// =====================================================================
// Flujo (llamado desde notificarNuevaRespuesta en Codigo.gs)
// =====================================================================

function iaConfigProa_() {
  var props = PropertiesService.getScriptProperties();
  var clave = props.getProperty("ANTHROPIC_API_KEY");
  var modo = String(props.getProperty("IA_PROA_MODO") || "PRUEBA").trim().toUpperCase();
  if (modo !== "PRODUCCION" && modo !== "NO") modo = "PRUEBA";
  return {
    activa: !!clave && modo !== "NO",
    clave: clave,
    modo: modo,
    modelo: props.getProperty("CLAUDE_MODEL") || IA_MODELO_DEFECTO,
    chatPrueba: props.getProperty("GREENAPI_PRUEBA_CHATID") || IA_CHAT_PRUEBA
  };
}

// Devuelve false si la IA no esta activa (Codigo.gs sigue con el flujo de siempre) y true si ya se
// encargo del caso. En PRUEBA, produccion recibe exactamente el mensaje de siempre.
function notificarConRevisionIa_(e, coincidencias) {
  var cfg = iaConfigProa_();
  if (!cfg.activa) return false;
  var alerta = debeAlertar(coincidencias);
  var revision;

  if (cfg.modo === "PRODUCCION") {
    if (alerta) {
      var base = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias, true));
      revision = revisarCasoConIa_(e, coincidencias, cfg);
      responderConRevision_(e, coincidencias, revision, base, null);
    } else {
      revision = revisarCasoConIa_(e, coincidencias, cfg);
      if (hayHallazgoAlto_(revision)) {
        var baseSin = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias, true));
        responderConRevision_(e, coincidencias, revision, baseSin, null);
      }
    }
    return true;
  }

  // PRUEBA: produccion igual que hoy; PRUEBA BOT recibe la copia base + la revision citada.
  if (alerta) enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias));
  revision = revisarCasoConIa_(e, coincidencias, cfg);
  if (alerta || hayHallazgoAlto_(revision)) {
    var respuesta = mensajeRevision_(e, coincidencias, revision);
    if (respuesta) {
      var basePrueba = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias, true), { chatId: cfg.chatPrueba });
      responderConRevision_(e, coincidencias, revision, basePrueba, cfg.chatPrueba);
    }
  }
  return true;
}

function responderConRevision_(e, coincidencias, revision, base, chatId) {
  var respuesta = mensajeRevision_(e, coincidencias, revision);
  if (!respuesta) return;
  if (!base || !base.ok || !base.idMessage) {
    Logger.log("Revision IA no enviada: el mensaje base no salio o no devolvio idMessage.");
    return;
  }
  Utilities.sleep(IA_ESPERA_RESPUESTA_MS);
  var opciones = { quotedMessageId: base.idMessage, sinFirma: true };
  if (chatId) opciones.chatId = chatId;
  enviarAlertaWhatsApp(respuesta, opciones);
}

function hayHallazgoAlto_(revision) {
  return !!revision && IA_ALERTA_SI_ALTA_SIN_DISPARO && revision.hallazgos.some(function(h) { return h.severidad === "alta"; });
}

// Mensaje de revision: sugerencia PROA (48-72 h) + hallazgos alta/media. "" si no hay nada que decir.
function mensajeRevision_(e, coincidencias, revision) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var tipo = tipoIndicacionTexto(campoDelEvento(valores, CAMPOS.TIPO_INDICACION));
  var sugerencia = sugerenciaPROA(tipo, coincidencias, acompanantesNoRestringidos(e));
  var hallazgos = (revision ? revision.hallazgos : []).filter(function(h) {
    return h.severidad === "alta" || h.severidad === "media";
  }).sort(function(a, b) {
    return (a.severidad === "alta" ? 0 : 1) - (b.severidad === "alta" ? 0 : 1);
  }).slice(0, IA_MAX_HALLAZGOS_MENSAJE);
  if (!sugerencia && hallazgos.length === 0) return "";

  var E = function(cp) { return String.fromCodePoint(cp); };
  var nombres = coincidencias.map(function(am) { return capitalizar(am.nombre); }).join(" + ");
  var lineas = [E(0x1F50E) + " *Revisi\u00f3n PROA \u00b7 " + nombres + "*"];
  if (sugerencia) lineas.push(E(0x1F4A1) + " " + sugerencia.replace(/^Sugerencia PROA:\s*/, "").replace(/^./, function(c) { return c.toUpperCase(); }));
  hallazgos.forEach(function(h) {
    lineas.push((h.severidad === "alta" ? E(0x1F534) : E(0x1F7E0)) + " " + h.codigo + " \u00b7 " + h.detalle);
  });
  if (hallazgos.length > 0) lineas.push("_Revisi\u00f3n asistida por IA_");
  return lineas.join("\n");
}

// Pide la revision a la API. Devuelve { hallazgos, datosFaltantes, tokens } o null si algo falla.
function revisarCasoConIa_(e, coincidencias, cfg) {
  try {
    var fichas = fichasProa_();
    if (!fichas) {
      Logger.log("Revision IA omitida: no se pudieron leer las fichas (%s).", IA_FICHAS_URL);
      return null;
    }
    var cuerpo = {
      model: cfg.modelo,
      max_tokens: IA_MAX_TOKENS,
      system: IA_REGLAS + "\n\nFICHAS DEL PROA (referencia):\n\n" + fichas,
      output_config: { format: { type: "json_schema", schema: IA_ESQUEMA } },
      messages: [{ role: "user", content: textoCasoIa_(e, coincidencias) }]
    };
    var resp = UrlFetchApp.fetch(IA_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(cuerpo),
      muteHttpExceptions: true,
      headers: { "x-api-key": cfg.clave, "anthropic-version": IA_VERSION_API }
    });
    var texto = resp.getContentText();
    if (resp.getResponseCode() !== 200) {
      Logger.log("Revision IA: API HTTP %s: %s", resp.getResponseCode(), ocultarClaveIa_(texto.substring(0, 300), cfg.clave));
      return null;
    }
    var datos = JSON.parse(texto);
    if (datos.stop_reason === "refusal" || datos.stop_reason === "max_tokens") {
      Logger.log("Revision IA sin resultado (%s).", datos.stop_reason);
      return null;
    }
    var bloque = (datos.content || []).filter(function(b) { return b.type === "text" && b.text; })[0];
    var salida = JSON.parse(bloque.text);
    var revision = {
      hallazgos: (salida.hallazgos || []).map(normalizarHallazgo_).filter(function(h) {
        return h.detalle && IA_CODIGOS.indexOf(h.codigo) >= 0;
      }),
      datosFaltantes: salida.datos_faltantes || [],
      entrada: (datos.usage && datos.usage.input_tokens) || 0,
      salida: (datos.usage && datos.usage.output_tokens) || 0
    };
    var p = IA_PRECIOS_MTOK[cfg.modelo];
    Logger.log("Revision IA (%s): %s hallazgo(s) %s; faltan: %s; tokens %s/%s%s.", cfg.modelo, revision.hallazgos.length,
      JSON.stringify(revision.hallazgos), revision.datosFaltantes.join(", ") || "nada", revision.entrada, revision.salida,
      p ? ", aprox. USD " + ((revision.entrada * p[0] + revision.salida * p[1]) / 1e6).toFixed(4) : "");
    return revision;
  } catch (err) {
    Logger.log("Revision IA sin resultado: %s", ocultarClaveIa_(String(err), cfg.clave));
    return null;
  }
}

// =====================================================================
// Auxiliares
// =====================================================================

// Caso seudonimizado: sin historia clinica, nombre, cama, EPS ni medico.
function textoCasoIa_(e, coincidencias) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var c = function(nombre) { return campoDelEvento(valores, nombre) || "-"; };
  var pesoKg = pesoKgDesde(c(CAMPOS.PESO_KG), c(CAMPOS.PESO_G));
  var reglas = obtenerRangosDosis();
  var lista = obtenerAntimicrobianosRestringidos();
  var lineas = [
    "Edad: " + edadTexto(c(CAMPOS.EDAD_ANIOS), c(CAMPOS.EDAD_MESES), c(CAMPOS.EDAD_DIAS)),
    "Sexo: " + c("Sexo"),
    "Peso: " + (pesoKg !== null ? formatoNumero(pesoKg, 2) + " kg" : "-"),
    "Servicio: " + c(CAMPOS.SERVICIO),
    "Especialidad que prescribe: " + c(CAMPOS.ESPECIALIDAD),
    "Diagnostico CIE10: " + formatearDiagnosticoCIE10(c(CAMPOS.DIAGNOSTICO)),
    "Microorganismo aislado: " + c(CAMPOS.MICROORGANISMO),
    "Cultivos tomados: " + c(CAMPOS.CULTIVOS),
    "Tipo de indicacion: " + tipoIndicacionTexto(c(CAMPOS.TIPO_INDICACION)),
    "Indicacion (inicio o cambio): " + c(CAMPOS.INDICACION),
    "Razon del cambio: " + c(CAMPOS.RAZON_CAMBIO),
    "Origen de la infeccion: " + c(CAMPOS.ORIGEN),
    "Infeccion nosocomial: " + c("Infecci\u00f3n nosocomial"),
    "Interconsulta a Infectologia: " + c(CAMPOS.INTERCONSULTA),
    "Ajuste renal marcado por el medico: " + c(CAMPOS.AJUSTE_RENAL),
    "Falla hepatica: " + c(CAMPOS.FALLA_HEPATICA),
    "",
    "Antimicrobianos de la solicitud:"
  ];
  leerSlots(e).forEach(function(am, i) {
    var ev = evaluarDosis(am.nombre, am.dosis, pesoKg, reglas);
    lineas.push((i + 1) + ". " + am.nombre + (esRestringido(am.nombre, lista) ? " (restringido)" : " (acompanante)") +
      " \u00b7 dosis " + am.dosis + " mg \u00b7 via " + am.via + " \u00b7 cada " + am.frecuencia + " h \u00b7 " + am.dias + " dias" +
      (ev.revisar ? " \u00b7 el bot ya marco la dosis fuera de rango" : ""));
  });
  return lineas.join("\n");
}

// Fichas del repositorio, en cache 6 h. null si no se pueden leer.
function fichasProa_() {
  var cache = null;
  try {
    cache = CacheService.getScriptCache();
    var enCache = cache.get("IA_PROA_FICHAS");
    if (enCache) return enCache;
  } catch (e) {}
  var url = PropertiesService.getScriptProperties().getProperty("IA_FICHAS_URL") || IA_FICHAS_URL;
  try {
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) return null;
    var texto = resp.getContentText("UTF-8");
    if (texto.length < 1000) return null;
    try { if (cache) cache.put("IA_PROA_FICHAS", texto, IA_FICHAS_CACHE_SEG); } catch (e2) {}
    return texto;
  } catch (e3) {
    return null;
  }
}

function normalizarHallazgo_(h) {
  var limpiar = function(s) { return String(s === undefined || s === null ? "" : s).replace(/[*_~\x60]/g, " ").replace(/\s+/g, " ").trim(); };
  // "DepCr 18" -> "depuraci\u00f3n de creatinina de 18": el termino completo se entiende en todos los servicios.
  var detalle = limpiar(h.detalle)
    .replace(/\b(?:DepCr|ClCr|CrCl)\s+(?:de\s+)?(?=\d)/g, "depuraci\u00f3n de creatinina de ")
    .replace(/\b(?:DepCr|ClCr|CrCl)\b/g, "depuraci\u00f3n de creatinina")
    .replace(/^./, function(c) { return c.toUpperCase(); });
  if (detalle.length > 180) detalle = detalle.substring(0, 179).replace(/\s+\S*$/, "") + "\u2026";
  return {
    codigo: limpiar(h.codigo).toUpperCase(),
    severidad: limpiar(h.severidad).toLowerCase(),
    antimicrobiano: limpiar(h.antimicrobiano),
    detalle: detalle,
    ficha: limpiar(h.ficha)
  };
}

function ocultarClaveIa_(texto, clave) {
  return clave ? String(texto).split(clave).join("***") : String(texto);
}

// =====================================================================
// Pruebas (no envian nada)
// =====================================================================

// Revisa con la API los casos ficticios y escribe en el registro los dos mensajes que saldrian.
// No envia nada a WhatsApp. Requiere ANTHROPIC_API_KEY.
function probarRevisionIa() {
  var cfg = iaConfigProa_();
  if (!cfg.clave) {
    Logger.log("Falta ANTHROPIC_API_KEY en Propiedades del script.");
    return;
  }
  [["Daptomicina + meropenem, sepsis por SARM", eventoPruebaDaptomicina()],
   ["Ceftazidima/avibactam + meropenem, ITU por KPC", eventoPruebaIaCeftazidimaMeropenem()],
   ["Ceftazidima/avibactam emp\u00edrica, neumon\u00eda de la comunidad sin cultivos", eventoPruebaIaCeftazidimaComunidad()],
   ["Daptomicina en neumonia por SARM + piperacilina/tazobactam", eventoPruebaIaDaptomicinaNeumonia()],
   ["Ertapenem con Pseudomonas", eventoPruebaIaErtapenemPseudomonas()],
   ["Vancomicina sola (no dispara alerta)", eventoPruebaVancomicinaSola()]].forEach(function(caso) {
    var coincidencias = filtrarAntimicrobianosRestringidos(caso[1]);
    var revision = revisarCasoConIa_(caso[1], coincidencias, cfg);
    var sale = debeAlertar(coincidencias) || hayHallazgoAlto_(revision);
    Logger.log("=== %s ===\nSe enviaria: %s\n\n--- Mensaje 1 (base) ---\n%s\n\n--- Mensaje 2 (respuesta citada) ---\n%s",
      caso[0], sale ? "si" : "no", construirMensajeDesdeEvento(caso[1], coincidencias, true),
      mensajeRevision_(caso[1], coincidencias, revision) || "(sin mensaje de revision)");
  });
}

function eventoPruebaIaCeftazidimaMeropenem() {
  var ev = eventoPruebaCeftazidimaAvibactam();
  var nv = ev.namedValues;
  nv["Nombre Antimicrobiano 2"] = ["MEROPENEM - UT-19973890-3"]; nv["Dosis en miligramos o UI AM2"] = ["1000"];
  nv["V\u00eda de adminsitraci\u00f3n de  AM2"] = ["Intravenoso"]; nv["Frecuencia AM 2 (En horas)"] = ["8"]; nv["D\u00edas ordenados AM2"] = ["7"];
  return ev;
}

function eventoPruebaIaDaptomicinaNeumonia() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ["55555555"]; nv[CAMPOS.EDAD_ANIOS] = ["58"]; nv[CAMPOS.PESO_KG] = ["80"];
  nv[CAMPOS.SERVICIO] = ["Unidad de Cuidado Cr\u00edtico UCI A"]; nv[CAMPOS.ESPECIALIDAD] = ["Medicina Interna"];
  nv[CAMPOS.DIAGNOSTICO] = ["J189"]; nv[CAMPOS.MICROORGANISMO] = ["Staphylococcus aureus resistente a meticilina"];
  nv[CAMPOS.TIPO_INDICACION] = ["Tratamiento Etiol\u00f3gico (En presencia de aislamiento conocido)"];
  nv[CAMPOS.CULTIVOS] = ["ASPIRADO TRAQUEAL"]; nv[CAMPOS.ORIGEN] = ["IAAS"]; nv[CAMPOS.INDICACION] = ["TERAPEUTICO"];
  nv[CAMPOS.INTERCONSULTA] = ["S\u00ed"]; nv[CAMPOS.AJUSTE_RENAL] = ["No"]; nv[CAMPOS.FALLA_HEPATICA] = ["No"];
  nv["Nombre Antimicrobiano 1"] = ["DAPTOMICINA - UT-19981181-1"]; nv["Dosis en miligramos o UI AB1"] = ["500"];
  nv["V\u00eda de adminsitraci\u00f3n de  AM1"] = ["Intravenoso"]; nv["Frecuencia AM 1 (En Horas)"] = ["24"]; nv["D\u00edas ordenados AM1"] = ["14"];
  nv["Nombre Antimicrobiano 2"] = ["PIPERACILINA / TAZOBACTAM - UT-19970001-1"]; nv["Dosis en miligramos o UI AM2"] = ["4500"];
  nv["V\u00eda de adminsitraci\u00f3n de  AM2"] = ["Intravenoso"]; nv["Frecuencia AM 2 (En horas)"] = ["6"]; nv["D\u00edas ordenados AM2"] = ["7"];
  return { namedValues: nv };
}

function eventoPruebaIaErtapenemPseudomonas() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ["44444444"]; nv[CAMPOS.EDAD_ANIOS] = ["71"]; nv[CAMPOS.PESO_KG] = ["62"];
  nv[CAMPOS.SERVICIO] = ["Hospitalizaci\u00f3n Medicina Interna"]; nv[CAMPOS.ESPECIALIDAD] = ["Medicina Interna"];
  nv[CAMPOS.DIAGNOSTICO] = ["N390"]; nv[CAMPOS.MICROORGANISMO] = ["Pseudomonas aeruginosa"];
  nv[CAMPOS.TIPO_INDICACION] = ["Tratamiento Etiol\u00f3gico (En presencia de aislamiento conocido)"];
  nv[CAMPOS.CULTIVOS] = ["UROCULTIVO"]; nv[CAMPOS.ORIGEN] = ["IAAS"]; nv[CAMPOS.INDICACION] = ["CAMBIO"];
  nv[CAMPOS.RAZON_CAMBIO] = ["POR ANTIBIOGRAMA"]; nv[CAMPOS.INTERCONSULTA] = ["No"];
  nv[CAMPOS.AJUSTE_RENAL] = ["S\u00ed"]; nv[CAMPOS.DEP_CREATININA] = ["24"];
  nv["Nombre Antimicrobiano 1"] = ["ERTAPENEM - UT-19973898-1"]; nv["Dosis en miligramos o UI AB1"] = ["1000"];
  nv["V\u00eda de adminsitraci\u00f3n de  AM1"] = ["Intravenoso"]; nv["Frecuencia AM 1 (En Horas)"] = ["24"]; nv["D\u00edas ordenados AM1"] = ["7"];
  return { namedValues: nv };
}

function eventoPruebaIaCeftazidimaComunidad() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ["33333333"]; nv[CAMPOS.EDAD_ANIOS] = ["47"]; nv[CAMPOS.PESO_KG] = ["72"];
  nv[CAMPOS.SERVICIO] = ["Urgencias"]; nv[CAMPOS.ESPECIALIDAD] = ["Medicina Interna"];
  nv[CAMPOS.DIAGNOSTICO] = ["J189"]; nv[CAMPOS.MICROORGANISMO] = ["Ninguno"];
  nv[CAMPOS.TIPO_INDICACION] = ["Tratamiento Emp\u00edrico (En presencia o sospecha de infecci\u00f3n sin germen documentado - sin antibiograma))"];
  nv[CAMPOS.CULTIVOS] = ["NINGUNO"]; nv[CAMPOS.ORIGEN] = ["COMUNIDAD"]; nv[CAMPOS.INDICACION] = ["TERAPEUTICO"];
  nv[CAMPOS.INTERCONSULTA] = ["No"]; nv[CAMPOS.AJUSTE_RENAL] = ["No"]; nv[CAMPOS.FALLA_HEPATICA] = ["No"];
  nv["Nombre Antimicrobiano 1"] = ["CEFTAZIDIMA / AVIBACTAM - UT-19998801-1"]; nv["Dosis en miligramos o UI AB1"] = ["2500"];
  nv["V\u00eda de adminsitraci\u00f3n de  AM1"] = ["Intravenoso"]; nv["Frecuencia AM 1 (En Horas)"] = ["8"]; nv["D\u00edas ordenados AM1"] = ["7"];
  return { namedValues: nv };
}

// Envia SOLO a PRUEBA BOT (IA_CHAT_PRUEBA fijo; no usa GREENAPI_GROUP_CHATID ni toca produccion) el
// flujo completo de dos casos de prueba: mensaje base + revision de la IA citada. Unos USD 0,04 por caso.
function enviarPruebaIaAPruebaBot() {
  var cfg = iaConfigProa_();
  if (!cfg.clave) { Logger.log("Falta ANTHROPIC_API_KEY en Propiedades del script."); return; }
  [eventoPruebaIaCeftazidimaComunidad(), eventoPruebaIaCeftazidimaMeropenem()].forEach(function(e) {
    var coincidencias = filtrarAntimicrobianosRestringidos(e);
    var revision = revisarCasoConIa_(e, coincidencias, cfg);
    var base = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias, true), { chatId: IA_CHAT_PRUEBA });
    responderConRevision_(e, coincidencias, revision, base, IA_CHAT_PRUEBA);
    Logger.log("PRUEBA BOT: base " + JSON.stringify(base) + " \u00b7 hallazgos " + (revision ? revision.hallazgos.length : "sin revision"));
  });
}
