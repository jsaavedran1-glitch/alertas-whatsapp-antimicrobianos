// =====================================================================
// IA_PROA.gs - Analisis de pertinencia asistido por IA (API de Claude, modelo Sonnet 5.5) de cada solicitud
// con antimicrobiano restringido. Servicio Farmaceutico - Hospital Departamental de Villavicencio E.S.E.
//
// Cada caso sale en dos mensajes al mismo grupo:
//   1. el mensaje base de siempre, sin la linea de sugerencia PROA ni el bloque de pertinencia;
//   2. segundos despues, la revision como RESPUESTA CITADA al mensaje 1 (quotedMessageId de Green-API):
//      un mensaje directo: titulo con el semaforo, una linea corta por cada observacion y, si la
//      observacion es sobre los dias, la duracion de referencia con su fuente.
// El modelo recibe como referencia: las fichas de docs/ que aplican al caso (antimicrobianos de la
// solicitud y microorganismo aislado), la tabla de duracion por sindrome (PERTINENCIA_DURACION) y el analisis de las tablas de
// Codigo.gs para ese caso. Si una regla de espectro de las tablas descarta un antimicrobiano, el veredicto
// no puede quedar por debajo de "intervenir". Si la API falla, sale el analisis de las tablas.
// IA_HALLAZGOS_ACTIVOS = false: no se llama a la API y siempre sale el analisis de las tablas.
// La dosis y el ajuste renal no se revisan aqui: el formulario no trae creatinina (decision del referente,
// 2026-11-07); los rangos de dosis los sigue marcando Codigo.gs. La IA no decide: propone, y el QF valida.
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
// Prueba sin enviar nada: probarRevisionIa().
// =====================================================================

var IA_HALLAZGOS_ACTIVOS = true;
var IA_MODELO_DEFECTO = "claude-sonnet-5-5";
var IA_ESFUERZO = "high";                        // output_config.effort: low | medium | high
var IA_URL = "https://api.anthropic.com/v1/messages";
var IA_VERSION_API = "2023-06-01";
var IA_BETA_RESPALDO = "server-side-fallback-2026-07-01";   // si el modelo declina, la API reintenta en otro
var IA_MAX_TOKENS = 8000;   // incluye el razonamiento del modelo: con 1500 un caso se corto (max_tokens)
var IA_CHAT_PRUEBA = "120363412506101174@g.us";   // PRUEBA BOT
var IA_MAX_CARACTERES = 150;                     // por frase del mensaje
// Vancomicina y linezolid solos no disparan alerta; con veredicto "intervenir" si se envian.
var IA_ALERTA_SI_ALTA_SIN_DISPARO = true;
var IA_DOCS_URL = "https://raw.githubusercontent.com/jsaavedran1-glitch/alertas-whatsapp-antimicrobianos/main/docs/";
var IA_DOCS = ["antimicrobianos-restringidos.md", "microorganismos.md"];
var IA_FICHAS_CACHE_SEG = 21600;
var IA_ESPERA_RESPUESTA_MS = 1500;               // entre el mensaje base y la revision citada
var IA_NIVELES = ["pertinente", "verificar", "intervenir"];

// USD por millon de tokens (entrada, salida), solo para el costo aproximado del registro.
var IA_PRECIOS_MTOK = { "claude-haiku-5-5": [0.10, 0.50], "claude-sonnet-5-5": [2, 10], "claude-opus-5-5": [4, 20] };

var IA_REGLAS = [
  "Analizas cada solicitud de antimicrobiano restringido del Programa de Optimización de Antimicrobianos (PROA) del Hospital Departamental de Villavicencio, Colombia, con dos miradas a la vez: la de un médico infectólogo (¿es la infección que se dice, el germen es patógeno o colonizante, el esquema cubre el foco y el aislado, hay una opción de menor espectro, cuánto debe durar?) y la de un químico farmacéutico clínico (¿el fármaco llega al sitio de infección, la vía y la combinación tienen sentido, hay duplicidad o interacción de riesgo, el paciente tiene condiciones que cambian la elección, se justifica un medicamento de reserva y de alto costo?).",
  "Decides si el tratamiento y los días ordenados son pertinentes. Tu respuesta la lee el grupo de WhatsApp del PROA para decidir si interviene, así que debe ser corta y accionable; el análisis completo va antes, no en el mensaje.",
  "",
  "Antes de decidir, repasa TODOS los datos del caso, uno por uno, y qué implica cada uno: edad, sexo y peso; servicio (UCI, urgencias, hospitalización) y especialidad; diagnóstico y foco; microorganismo y mecanismo de resistencia escrito; si se tomaron cultivos y cuáles; tipo de indicación (empírica, etiológica, profiláctica); inicio o cambio y la razón del cambio; origen (IAAS o comunidad) e infección nosocomial; interconsulta a Infectología; ajuste renal y falla hepática marcados; cada antimicrobiano del esquema, restringido o acompañante, con su vía, frecuencia y días; y el análisis de las tablas del bot. Busca incoherencias entre ellos (p. ej. indicación etiológica sin germen, cambio por antibiograma sin cultivo, reserva en infección de la comunidad sin factores de riesgo). Escribe ese repaso en el campo analisis (queda en el registro, no va al grupo) y solo después fija el veredicto: un factor aislado no basta si otro lo explica.",
  "",
  "Referencias, en este orden: las fichas de antimicrobianos y de microorganismos del PROA, la tabla de duración por síndrome y el análisis de las tablas del bot para este caso, que van abajo. Lo que no esté en ellas puedes sustentarlo en guías reconocidas (IDSA, ESCMID, ACIN, OMS/OPS, CDC) solo si estás seguro; si no, dílo como algo por verificar. No inventes cifras ni citas.",
  "",
  "Qué evaluar:",
  "- Tratamiento: si cada antimicrobiano restringido se justifica frente al microorganismo aislado, el foco, el origen (IAAS o comunidad) y el tipo de indicación; si cubre o no al aislado; si hay una opción de menor espectro que bastaría; si la combinación duplica espectro.",
  "- Días: si los días ordenados de cada antimicrobiano corresponden a la duración de referencia del foco. Menos días que el mínimo no es un hallazgo: las órdenes se renuevan.",
  "",
  "Niveles, por cada antimicrobiano: no_pertinente = riesgo de falla terapéutica o toxicidad, o exceso claro (no cubre el aislado o no sirve en ese foco, días al doble de la referencia o más, profilaxis de más de 24 h); verificar = falta un dato o hay una optimización posible (aislado que no justifica la reserva, sin aislamiento ni foco que lo sustente, días por encima de la referencia); pertinente = acorde con la referencia.",
  "Parte del análisis de las tablas del bot: conserva su nivel y su redacción para cada antimicrobiano, y cámbialos solo cuando una ficha o la tabla de duración lo sustente con claridad; en ese caso el motivo dice por qué. Una regla de espectro en rojo de las tablas no se rebaja.",
  "",
  "Límites del formulario: no trae antibiograma (solo el nombre del microorganismo y lo que el médico escriba, como BLEE o KPC), ni creatinina, ni evolución clínica. No evalúes dosis ni ajuste renal. \"Ninguno\", \"0\", \"pendiente\" o una tinción de Gram no son un aislamiento. No supongas datos que no están: nómbralos en datos_faltantes.",
  "",
  "Si el tratamiento de un antimicrobiano queda en no_pertinente, no valores sus días: el bot los muestra como no valorados.",
  "",
  "Formato de la respuesta: en tratamiento, una entrada por cada antimicrobiano restringido de la solicitud, y por cada acompañante solo si tiene un hallazgo; en dias, una entrada por cada antimicrobiano con días ordenados, si hay duración de referencia para el foco. antimicrobiano es el nombre tal como viene en la solicitud.",
  "motivo es lo que leerá el grupo en WhatsApp: una sola frase directa de máximo 90 caracteres, en español corriente con tildes, que diga qué se observa y qué convendría hacer (\"no cubre Pseudomonas; valorar un antipseudomónico según antibiograma\", \"sin germen ni foco que lo sustente; confirmar la indicación\", \"14 d duplican la referencia; valorar suspender al día 7\"). Sin el nombre del antimicrobiano, sin citas ni fuentes y, en dias, sin repetir los días ordenados ni las cifras de la referencia (el bot ya escribe \"14 d:\" antes del motivo y la referencia debajo; basta \"duplica la referencia; confirmar absceso, obstrucción o respuesta lenta\"), sin siglas poco comunes, sin preámbulos, sin repetir los datos del caso y sin markdown. En las entradas de nivel pertinente el motivo puede ir vacío: el bot las resume. El mensaje es un apoyo para quien prescribe y para el QF, no un dictamen: tono de sugerencia, nunca una orden ni un juicio sobre el médico. No repitas la sugerencia de revaluar a las 48-72 h con cultivos: el bot ya la da."
].join("\n");

var IA_ITEM = {
  type: "object",
  additionalProperties: false,
  properties: {
    antimicrobiano: { type: "string", description: "Nombre tal como viene en la solicitud." },
    nivel: { type: "string", enum: ["pertinente", "verificar", "no_pertinente"] },
    motivo: { type: "string", description: "Una frase directa de maximo 90 caracteres." }
  },
  required: ["antimicrobiano", "nivel", "motivo"]
};

var IA_ESQUEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    analisis: { type: "string", description: "Repaso de todos los factores del caso y que implica cada uno, antes del veredicto. Maximo 1200 caracteres. No va al mensaje." },
    tratamiento: { type: "array", items: IA_ITEM },
    dias: { type: "array", items: IA_ITEM },
    datos_faltantes: { type: "array", items: { type: "string" } }
  },
  required: ["analisis", "tratamiento", "dias", "datos_faltantes"]
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
  var tablas = analisisPertinenciaDesdeEvento(e, coincidencias);
  // Sin alerta propia (vancomicina o linezolid solos): solo se analiza y se envia si las tablas lo dejan
  // en rojo. Asi no se llama al modelo en las solicitudes que casi nunca generan mensaje.
  if (!alerta && !(IA_ALERTA_SI_ALTA_SIN_DISPARO && tablas.nivel === 2)) {
    registrarRevision(e, coincidencias, { tablas: tablas, enviado: false });
    return true;
  }
  var revision, base, envio;

  if (cfg.modo === "PRODUCCION") {
    base = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias, true));
    revision = revisarCasoConIa_(e, coincidencias, cfg);
    responderConRevision_(e, coincidencias, revision, base, null);
    registrarRevisionIa_(e, coincidencias, tablas, revision, cfg, !!(base && base.ok), "PRODUCCION");
    return true;
  }

  // PRUEBA: produccion igual que hoy; PRUEBA BOT recibe la copia base + la revision citada.
  if (alerta) envio = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias));
  revision = revisarCasoConIa_(e, coincidencias, cfg);
  if (mensajeRevision_(e, coincidencias, revision)) {
    base = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias, true), { chatId: cfg.chatPrueba });
    responderConRevision_(e, coincidencias, revision, base, cfg.chatPrueba);
  }
  registrarRevisionIa_(e, coincidencias, tablas, revision, cfg, !!(envio && envio.ok), alerta ? "PRODUCCION (tablas) + PRUEBA BOT" : "PRUEBA BOT");
  return true;
}

function registrarRevisionIa_(e, coincidencias, tablas, revision, cfg, enviado, destino) {
  var p = revision ? IA_PRECIOS_MTOK[cfg.modelo] : null;
  registrarRevision(e, coincidencias, {
    tablas: tablas, revision: revision, enviado: enviado, destino: destino,
    detalle: revision ? mensajeRevision_(e, coincidencias, revision) : "",
    costo: p ? Number(((revision.entrada * p[0] + revision.salida * p[1]) / 1e6).toFixed(4)) : ""
  });
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
  return !!revision && IA_ALERTA_SI_ALTA_SIN_DISPARO && revision.veredicto === "intervenir";
}

// Mensaje de revision: sugerencia PROA (48-72 h) + analisis del modelo; sin revision del modelo, el
// analisis de las tablas. "" si no hay nada que decir.
function mensajeRevision_(e, coincidencias, revision) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var tipo = tipoIndicacionTexto(campoDelEvento(valores, CAMPOS.TIPO_INDICACION));
  var sugerencia = sugerenciaPROA(tipo, coincidencias, acompanantesNoRestringidos(e));
  var E = function(cp) { return String.fromCodePoint(cp); };
  var cuerpo = [];
  if (revision) {
    // Mensaje directo: titulo, una linea por cada observacion (amarillo o rojo), lo verde resumido en una
    // sola linea y la duracion de referencia solo si hay una observacion sobre los dias.
    var color = [E(0x1F7E2), E(0x1F7E1), E(0x1F534)];
    var titulos = ["Acorde con la referencia", "Se sugiere verificar", "Se sugiere revaluar"];
    cuerpo.push(color[IA_NIVELES.indexOf(revision.veredicto)] + " *" + titulos[IA_NIVELES.indexOf(revision.veredicto)] + "*");
    var observaciones = 0, verdes = 0, diasObservados = false;
    revision.tratamiento.forEach(function(t) {
      if (t.nivel === 0) { verdes++; return; }
      observaciones++;
      cuerpo.push(color[t.nivel] + " " + capitalizar(t.nombre) + ": " + t.motivo);
    });
    revision.dias.forEach(function(d) {
      if (d.nivel === 0) { verdes++; return; }
      if (d.nivel < 0) return;   // tratamiento en rojo: sus dias no se valoran ni se mencionan
      observaciones++; diasObservados = true;
      cuerpo.push(color[d.nivel] + " " + capitalizar(d.nombre) + " " + d.dias + " d: " + d.motivo);
    });
    if (observaciones === 0) cuerpo.push(color[0] + " Tratamiento y d\u00edas sin observaciones");
    else if (verdes > 0) cuerpo.push(color[0] + " Lo dem\u00e1s, sin observaciones");
    if (diasObservados && revision.encabezadoDias) {
      cuerpo.push(E(0x1F4CF) + " " + revision.encabezadoDias.replace(/^D\u00edas \u00b7 /, "").replace(": referencia ", ": "));
    }
    cuerpo.push("_An\u00e1lisis asistido por IA_");
  } else {
    cuerpo = pertinenciaDesdeEvento(e, coincidencias);
  }
  if (!sugerencia && cuerpo.length === 0) return "";

  var nombres = coincidencias.map(function(am) { return capitalizar(am.nombre); }).join(" + ");
  var lineas = [E(0x1F50E) + " *Revisión PROA · " + nombres + "*"];
  if (sugerencia) lineas.push(E(0x1F4A1) + " " + sugerencia.replace(/^Sugerencia PROA:\s*/, "").replace(/^./, function(c) { return c.toUpperCase(); }));
  return lineas.concat(cuerpo).join("\n");
}

// Pide el analisis a la API. Devuelve { veredicto, tratamiento[], dias[], encabezadoDias, ... } o null
// si algo falla (el mensaje lleva entonces el analisis de las tablas).
function revisarCasoConIa_(e, coincidencias, cfg) {
  if (!IA_HALLAZGOS_ACTIVOS) return null;
  try {
    var referencia = referenciaProa_(e);
    if (!referencia) {
      Logger.log("Revision IA omitida: no se pudieron leer las fichas (%s).", IA_DOCS_URL);
      return null;
    }
    var tablas = analisisPertinenciaDesdeEvento(e, coincidencias);
    var cuerpo = {
      model: cfg.modelo,
      max_tokens: IA_MAX_TOKENS,
      system: IA_REGLAS + "\n\n" + referencia + "\n\n" + tablaDuracionIa_(),
      output_config: { effort: IA_ESFUERZO, format: { type: "json_schema", schema: IA_ESQUEMA } },
      fallbacks: "default",
      messages: [{ role: "user", content: textoCasoIa_(e, coincidencias) + "\n\nAnálisis de las tablas del bot para este caso:\n" +
        (tablas.lineas.length ? tablas.lineas.join("\n").replace(/[*_]/g, "") : "Sin criterio en las tablas.") }]
    };
    var resp = llamarApiIa_(cuerpo, cfg, true);
    // Si la API no acepta el respaldo ante declinaciones, se repite la peticion sin el.
    if (resp.getResponseCode() === 400 && /fallback/i.test(resp.getContentText())) {
      delete cuerpo.fallbacks;
      resp = llamarApiIa_(cuerpo, cfg, false);
    }
    var texto = resp.getContentText();
    if (resp.getResponseCode() !== 200) {
      Logger.log("Revision IA: API HTTP %s: %s", resp.getResponseCode(), ocultarClaveIa_(texto.substring(0, 300), cfg.clave));
      return null;
    }
    var datos = JSON.parse(texto);
    if (datos.stop_reason === "refusal" || datos.stop_reason === "max_tokens") {
      // stop_details.category dice que filtro declino (p. ej. bio): sirve para ajustar el texto del caso.
      Logger.log("Revision IA sin resultado (%s%s; modelo %s).", datos.stop_reason,
        datos.stop_details && datos.stop_details.category ? ", categoria " + datos.stop_details.category : "", datos.model || cfg.modelo);
      return null;
    }
    var bloque = (datos.content || []).filter(function(b) { return b.type === "text" && b.text; })[0];
    var salida = JSON.parse(bloque.text);
    var esquemas = leerSlots(e);
    var tratamiento = itemsIa_(salida.tratamiento, esquemas);
    var diasIa = tablas.encabezadoDias ? itemsIa_(salida.dias, esquemas).filter(function(d) { return d.dias; }) : [];
    if (tratamiento.length === 0 && diasIa.length === 0) { Logger.log("Revision IA sin resultado: respuesta sin antimicrobianos de la solicitud."); return null; }
    // Tratamiento en rojo (del modelo o de las tablas): sus dias no se valoran.
    var rojos = tablas.rojos.concat(tratamiento.filter(function(t) { return t.nivel === 2; }).map(function(t) { return t.nombre; }));
    diasIa.forEach(function(d) { if (rojos.indexOf(d.nombre) > -1) { d.nivel = -1; d.motivo = TEXTO_DIAS_SIN_VALORAR; } });
    var nivel = 0;
    tratamiento.concat(diasIa).forEach(function(x) { if (x.nivel > nivel) nivel = x.nivel; });
    // Piso: una regla de espectro de las tablas no se puede rebajar.
    if (tablas.espectroRojo) nivel = 2;
    var revision = {
      veredicto: IA_NIVELES[nivel],
      tratamiento: tratamiento,
      dias: diasIa,
      encabezadoDias: tablas.encabezadoDias,
      datosFaltantes: salida.datos_faltantes || [],
      modelo: datos.model || cfg.modelo,
      entrada: (datos.usage && datos.usage.input_tokens) || 0,
      salida: (datos.usage && datos.usage.output_tokens) || 0
    };
    var p = IA_PRECIOS_MTOK[cfg.modelo];
    Logger.log("Revision IA (%s): %s; tablas: %s; faltan: %s; tokens %s/%s%s.", revision.modelo, revision.veredicto,
      tablas.nivel < 0 ? "sin criterio" : IA_NIVELES[tablas.nivel], revision.datosFaltantes.join(", ") || "nada", revision.entrada, revision.salida,
      p ? ", aprox. USD " + ((revision.entrada * p[0] + revision.salida * p[1]) / 1e6).toFixed(4) : "");
    Logger.log("Revision IA, analisis: %s", String(salida.analisis || "").substring(0, 1500));
    return revision;
  } catch (err) {
    Logger.log("Revision IA sin resultado: %s", ocultarClaveIa_(String(err), cfg.clave));
    return null;
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
  var seguimiento = seguimientoPaciente(e).lineas;
  if (seguimiento.length) {
    lineas.push("", "Solicitudes previas del mismo paciente (la duraci\u00f3n se valora sobre el curso completo):");
    seguimiento.forEach(function(l) { lineas.push(l.replace(/^\s+/, "- ")); });
  }
  return lineas.join("\n");
}

// Tabla de duracion por sindrome (la misma que usa Codigo.gs), como texto para el modelo.
function tablaDuracionIa_() {
  var filas = obtenerPertinencia().map(function(f) {
    var rango = f.max === null ? "sin rango" : ((f.min !== null && f.min !== f.max) ? f.min + "-" + f.max : f.max) + " días";
    return "- " + f.sindrome + " (CIE10 " + (f.prefijos.join(", ") || "-") + "): " + rango + (f.nota ? " · " + f.nota : "") + " · fuente: " + f.fuente;
  });
  return "TABLA DE DURACIÓN POR SÍNDROME (referencia)\n" + filas.join("\n") +
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
// (resumen y como leerlas) va siempre. Si ninguna cumple, va el documento completo o solo ese texto inicial.
function fichasDelCaso_(texto, incluir, soloCabezaSiNinguna) {
  var partes = texto.split(/\n(?=### )/);
  var cabeza = partes.shift();
  var elegidas = partes.filter(function(seccion) {
    var titulo = seccion.split("\n")[0];
    return incluir(titulo, Number((titulo.match(/^### (\d+)\./) || [])[1]));
  }).map(function(seccion) { return seccion.split(/\n(?=## )/)[0]; });
  cabeza = cabeza.split(/\n(?=## Fichas)/)[0];
  if (elegidas.length === 0) return soloCabezaSiNinguna ? cabeza : texto;
  return cabeza + "\n\n## Fichas del caso\n\n" + elegidas.join("\n\n");
}

// Fichas del repositorio que aplican al caso (antimicrobianos de la solicitud y microorganismo aislado),
// leidas de GitHub con cache de 6 h. null si falta algun documento. Sin evento, los documentos completos.
function referenciaProa_(e) {
  var nombres = e ? leerSlots(e).map(function(am) { return String(am.nombre).toUpperCase(); }) : null;
  var micro = e ? normalizarTexto(campoDelEvento(e.namedValues || {}, CAMPOS.MICROORGANISMO)) : "";
  var filtros = {
    "antimicrobianos-restringidos.md": function(titulo) {
      return IA_FICHAS_AM.some(function(par) { return titulo.indexOf(par[1]) > -1 && nombres.some(function(n) { return n.indexOf(par[0]) > -1; }); });
    },
    "microorganismos.md": function(titulo, numero) {
      return IA_FICHAS_MICRO.some(function(par) { return par[1] === numero && (new RegExp(par[0])).test(micro); });
    }
  };
  var partes = [];
  for (var i = 0; i < IA_DOCS.length; i++) {
    var texto = documentoProa_(IA_DOCS[i]);
    if (!texto) return null;
    if (nombres && filtros[IA_DOCS[i]]) texto = fichasDelCaso_(texto, filtros[IA_DOCS[i]], IA_DOCS[i] === "microorganismos.md");
    partes.push("=== " + IA_DOCS[i] + " (referencia) ===\n\n" + texto);
  }
  return partes.join("\n\n");
}

function documentoProa_(nombre) {
  var cache = null, clave = "IA_PROA_DOC_" + nombre;
  try {
    cache = CacheService.getScriptCache();
    var enCache = cache.get(clave);
    if (enCache) return enCache;
  } catch (e) {}
  var base = PropertiesService.getScriptProperties().getProperty("IA_DOCS_URL") || IA_DOCS_URL;
  try {
    var resp = UrlFetchApp.fetch(base + nombre, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) return null;
    var texto = resp.getContentText("UTF-8");
    if (texto.length < 1000) return null;
    try { if (cache) cache.put(clave, texto, IA_FICHAS_CACHE_SEG); } catch (e2) {}
    return texto;
  } catch (e3) {
    return null;
  }
}

// Entradas del modelo (tratamiento o dias) limitadas a los antimicrobianos de la solicitud.
function itemsIa_(lista, esquemas) {
  var niveles = ["pertinente", "verificar", "no_pertinente"];
  var clave = function(t) { return normalizarTexto(t).replace(/[^A-Z0-9]/g, ""); };
  var salida = [];
  (lista || []).forEach(function(x) {
    var nombre = clave(x.antimicrobiano), nivel = niveles.indexOf(String(x.nivel || "").toLowerCase());
    if (!nombre || nivel < 0) return;
    var am = null;
    esquemas.forEach(function(q) { var c = clave(q.nombre); if (!am && (c === nombre || c.indexOf(nombre) > -1 || nombre.indexOf(c) > -1)) am = q; });
    if (!am) return;
    var n = numeroONulo(am.dias);
    salida.push({ nombre: am.nombre, nivel: nivel, motivo: fraseIa_(x.motivo).replace(/^[A-ZÁÉÍÓÚÑ](?=[a-záéíóúñ ])/, function(c) { return c.toLowerCase(); }), dias: (n !== null && n > 0) ? formatoNumero(n, 0) : "" });
  });
  return salida;
}

// Una frase limpia para WhatsApp: sin marcas de formato y con tope de longitud.
function fraseIa_(s) {
  var t = String(s === undefined || s === null ? "" : s).replace(/[*~\x60]/g, "").replace(/_/g, " ").replace(/\s+/g, " ").trim()
    .replace(/\b(?:DepCr|ClCr|CrCl)\b/g, "depuración de creatinina")
    .replace(/^./, function(c) { return c.toUpperCase(); }).replace(/\.$/, "");
  if (t.length > IA_MAX_CARACTERES) t = t.substring(0, IA_MAX_CARACTERES - 1).replace(/\s+\S*$/, "") + "…";
  return t;
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
   ["Ceftazidima/avibactam empírica, neumonía de la comunidad sin cultivos", eventoPruebaIaCeftazidimaComunidad()],
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
// flujo completo de dos casos de prueba: mensaje base + revision de la IA citada. Unos USD 0,05 por caso.
function enviarPruebaIaAPruebaBot() {
  var cfg = iaConfigProa_();
  if (!cfg.clave) { Logger.log("Falta ANTHROPIC_API_KEY en Propiedades del script."); return; }
  [eventoPruebaIaCeftazidimaComunidad(), eventoPruebaIaCeftazidimaMeropenem()].forEach(function(e) {
    var coincidencias = filtrarAntimicrobianosRestringidos(e);
    var revision = revisarCasoConIa_(e, coincidencias, cfg);
    var base = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias, true), { chatId: IA_CHAT_PRUEBA });
    responderConRevision_(e, coincidencias, revision, base, IA_CHAT_PRUEBA);
    Logger.log("PRUEBA BOT: base " + JSON.stringify(base) + " · veredicto " + (revision ? revision.veredicto : "sin revision (tablas)"));
  });
}
