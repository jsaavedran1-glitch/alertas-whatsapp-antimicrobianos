# Changelog

Todas las fechas en hora de Colombia (America/Bogota).

## [1.20.0] - 2026-11-16

### Cambiado (revisión por tratamiento prolongado: la patología cuenta)
- Cada solicitud de la lista muestra **su patología** (`1. PIPERACILINA / TAZOBACTAM · 16/10-24/10 · 8 d · Bacteriemia / sepsis`). En la matriz real, 16 de 24 revisiones cambiaban de diagnóstico dentro del mismo tratamiento.
- El total se compara con **la patología de mayor duración del tratamiento**, no solo con el diagnóstico de la orden actual, y se nombran las demás: `📏 Bacteriemia / sepsis: 7-14 d (...); la más larga de sus patologías (también Neumonía 5-7 d)`. Así una osteomielitis previa (42 d) no queda juzgada como celulitis (5-7 d). Con los datos de 01/11–15/11: verde/amarillo/rojo pasa de 0/12/12 a 1/8/15.

## [1.19.0] - 2026-11-16

### Cambiado (criterio del referente para la revisión por tratamiento prolongado)
- **Criterio nuevo:** la revisión sale cuando la solicitud es **la 3.ª o más del mismo tratamiento continuo** (contando esta; dos órdenes el mismo día cuentan como una) **y el paciente ya lleva más de 10 días**. Antes bastaba con más de 14 días. `CONFIG.PROLONGADO_MIN_SOLICITUDES` (3) y `PROLONGADO_DIAS` (10).
- **Mensaje aparte:** `*⏳ REVISIÓN PROA · Tratamiento prolongado*` ya no se mezcla con el caso PROA. Si la solicitud tiene restringido salen dos mensajes: primero `🚨 CASO PROA` (sin la línea ⏳) y después la revisión. Sin restringido, solo la revisión.
- La revisión lista **cada solicitud del tratamiento con sus fechas y días** (`1. PIPERACILINA / TAZOBACTAM · 16/10-24/10 · 8 d`, …, `3. CEFEPIME 2000 mg IV c/8 h · 01/11-08/11 · 7 d (esta orden)`), compara el total con la referencia del foco (misma regla de colores que el caso PROA: amarillo si la supera, rojo si la duplica; sin referencia, 🟡 verificar) y cierra con `💡 Sugerencia PROA: confirmar con el médico tratante el motivo para continuar (foco, cultivos, respuesta clínica) y la fecha de suspensión`.
- La revisión **no llama al modelo** (son datos de la matriz y de la tabla de duración): sale al instante y sin costo. El caso PROA sigue con el análisis de IA, que recibe como contexto que es un tratamiento prolongado.
- **Una revisión por paciente y día:** si el paciente ya tuvo otra orden del mismo tratamiento ese día, no se repite.
- `REGISTRO_REVISIONES`: la revisión queda en su propia fila con `Fuente del análisis` = `TRATAMIENTO PROLONGADO`, su semáforo y el listado de solicitudes en `Detalle`.
- Estimación con la matriz real (01/11–15/11): 24 revisiones de 359 solicitudes (17 pacientes, unas 1-2 al día); 21 sin restringido y 3 junto a un caso PROA; 12 en amarillo y 12 en rojo.
- `probarUltimoProlongado()` y `probarUltimaSolicitud(fila)` muestran los dos mensajes cuando aplican, sin enviar nada.

## [1.18.0] - 2026-11-16

### Agregado (petición del referente: revisar pacientes con más de 14 días de tratamiento cuando se formula un medicamento nuevo)
- **Revisión por tratamiento prolongado:** si el paciente ya lleva **más de 14 días de antimicrobiano continuo** (sumando los cambios entre fármacos, con la tolerancia de 3 días del seguimiento) y se formula una orden nueva, el bot envía `*⏳ REVISIÓN PROA · Tratamiento prolongado*` **aunque no haya restringido**. Cubre cefepime, piperacilina/tazobactam, meropenem, etc.
- Línea nueva en todos esos mensajes: `⏳ *Lleva 16 d de antibiótico continuo y se formula CEFEPIME; con esta orden, 23 d*`. Con restringido el caso sigue siendo `🚨 CASO PROA` y suma esta línea.
- El caso pasa por el modelo con el motivo de la revisión; si las tablas no tienen criterio para el diagnóstico, el veredicto mínimo es `🟡 Se sugiere verificar`.
- `CONFIG.PROLONGADO_ACTIVO` (true), `PROLONGADO_DIAS` (14) y `PROLONGADO_SOLO_CAMBIO` (false: revisa también las renovaciones del mismo fármaco; true: solo cuando se formula uno que el paciente no venía recibiendo).
- `REGISTRO_REVISIONES` agrega la columna **Días de tratamiento continuo** (la 22); si la pestaña tiene el encabezado anterior, se amplía sola.
- Estimación con la matriz real (01/11–15/11): 22 de 359 solicitudes (11 pacientes), la mitad sin restringido; unas 1-2 revisiones al día.
- `probarUltimoProlongado()`: escribe en el registro de ejecución el mensaje de la última solicitud con más de 14 d continuos (busca en las últimas 100 filas). **No envía nada** ni llama al modelo. `probarUltimaSolicitud(fila)` ahora también muestra el mensaje de una fila sin restringido si es un tratamiento prolongado.

### Corregido
- `💡 Sugerencia PROA` decía "terapia empírica combinada (CEFEPIME)" con un solo antimicrobiano: "combinada" solo con dos o más.
- En la revisión por tratamiento prolongado no sale "Revaluar a las 48-72 h con cultivos" (es para el inicio de la terapia empírica).

## [1.17.1] - 2026-11-16

### Corregido (primera prueba con la historia real del paciente de la fila 7638)
- Los días de cada tramo del tratamiento continuo se cuentan en **días calendario**, para que cuadren con las fechas que se muestran (08/10 a 22/10 salía como 15 d por la hora de las solicitudes; ahora 14 d).
- Un tramo de **0 días** (dos órdenes distintas el mismo día) ya no se muestra.
- La fecha de fin de la línea 💊 se cuenta **desde la fecha de la solicitud**, igual que la de "esta orden" en el seguimiento.

## [1.17.0] - 2026-11-16

### Cambiado (optimización del mensaje al grupo, decisión del referente)
- **Un solo mensaje por caso** en vez de dos: el bot espera la respuesta del modelo (~15 s) y la incluye debajo de los datos. Si el modelo falla o declina, el mensaje sale igual con el análisis de las tablas. Desaparecen `mensajeRevision_()` y la respuesta citada; `construirMensajeDesdeEvento(e, coincidencias, { analisis })` arma todo.
- **744 caracteres y 17 líneas** frente a 1.294 en dos mensajes: el veredicto va en la segunda línea, el esquema en una línea por antimicrobiano (`ERTAPENEM 1000 mg (14,3 mg/kg) IV c/24 h · 7 d hasta 23/11`), microorganismo, cultivos, indicación y origen en una sola línea, y el desglose de días ya no se repite en la línea de pertinencia.
- **Pie más corto:** `_Ecosistema de Vigilancia Digital Servicio Farmacéutico · QF JPSN_`. La línea de título del bot se omite en este bot (`sinFirma`), porque el mensaje ya empieza con `*🚨 CASO PROA · ...*`; el pie va siempre.

## [1.16.0] - 2026-11-16

### Cambiado
- El desglose del tratamiento continuo muestra las **fechas de cada antimicrobiano** y de la orden actual, con sus días: `MEROPENEM 17/10-22/10 5 d → ERTAPENEM 22/10-15/11 24 d → esta orden 15/11-22/11 7 d = 36 d`. El modelo tiene instrucción de nombrar esas fechas en su línea de historia.

## [1.15.0] - 2026-11-16

### Cambiado (mensaje más directo)
- **Seguimiento en una línea:** `Antibiótico continuo desde 17/10: MEROPENEM 5 d → ERTAPENEM 24 d → esta orden 7 d = 36 d`.
- **Líneas de pertinencia más cortas:** `ERTAPENEM: indicado para el aislamiento registrado`; `ERTAPENEM: 36 d continuos (...): supera la referencia; revaluar duración`. Sin repetir "se sugiere verificar/revaluar" en cada línea (queda en el título) y, cuando los días están en rojo, sin la nota de excepciones.

## [1.14.1] - 2026-11-16

### Cambiado
- Los días de tratamiento continuo se muestran desglosados por antimicrobiano (`36 d de tratamiento continuo: MEROPENEM 5 d + ERTAPENEM 24 d + esta orden 7 d`), para que no se lea que todos fueron del antimicrobiano actual.

## [1.14.0] - 2026-11-16

### Corregido (caso real del 2026-11-15: ertapenem por 7 d tras 24 d de ertapenem y 5 d de meropenem, que salió como "se sugiere verificar")
- **Seguimiento:** la duración se cuenta sobre el **tratamiento continuo del paciente aunque cambie de antimicrobiano** (meropenem → ertapenem), no solo sobre el mismo fármaco. La tolerancia entre órdenes pasa de 2 a 3 días (las renovaciones llegan tarde) y la ventana de 30 a 60 días. Si hubo un curso previo del mismo antimicrobiano que no es continuo, también se muestra.
- **Aislamiento:** "betalactamasa de amplio espectro / de espectro extendido" se reconoce como BLEE (`normalizarAislamiento()`); ertapenem se acepta en piel y tejidos blandos (indicación de ficha).
- **Revisión por IA:** el modelo recibe la historia completa del paciente (fecha, esquema, diagnóstico, aislamiento, tipo de indicación, razón de cambio y servicio de cada solicitud previa) y el cálculo de días continuos del bot, con la instrucción de reconstruir la línea de tiempo antes de opinar. El mensaje abre con una frase que interpreta esa historia (`🧭`).

## [1.13.0] - 2026-11-14

### Cambiado (revisión contra el texto de las guías y fichas técnicas)
- **Gramnegativos resistentes:** la referencia pasa a la guía **IDSA 2026** (reemplazó la de 2024): NDM con aztreonam/avibactam o cefiderocol (ceftazidima/avibactam más aztreonam si no hay), KPC y OXA-48 con ceftazidima/avibactam, y tigeciclina no sugerida en ITU ni bacteriemia. La regla de tigeciclina ahora también aplica en ITU.
- **Tabla de duración:** ITU (IDSA 2025: 5-7 d con fluoroquinolona, 7 d con otro antibiótico o con bacteriemia urinaria, 10-14 d si prostatitis), neumonía (ATS/IDSA 2019 e IDSA/ATS 2016), intraabdominal (STOP-IT), osteomielitis (IDSA 2015: 6 semanas), artritis séptica (Gjika 2019), catéter (IDSA 2009), candidemia (IDSA 2016) y sitio operatorio (IDSA 2014). Requiere `reescribirHojaPertinencia()`.
- **Candida en orina:** con caspofungina se añade que las equinocandinas no alcanzan nivel terapéutico en orina (IDSA 2016).
- **Fichas (`docs/`):** categorías AWaRe verificadas en el portal de la OMS; dosis de daptomicina, tigeciclina, ertapenem, ceftazidima/avibactam, caspofungina, linezolid y polimixina B contrastadas con la ficha técnica o el consenso de polimixinas 2019; fichas de microorganismos actualizadas a IDSA 2026, CDC e IDSA 2016.
- Sin poder leer: ESCMID 2016 (meningitis), BTS 2023 (empiema), SIS 2017 y Tokyo 2018 (duración), ficha de doripenem.

## [1.12.0] - 2026-11-14

### Cambiado
- Mensaje de la revisión por IA más directo: título con el semáforo, una línea corta (máx. 90 caracteres pedidos al modelo) solo por cada observación, lo verde resumido en una línea y la duración de referencia solo cuando la observación es sobre los días. Los días de un tratamiento en rojo no se mencionan.

## [1.11.0] - 2026-11-14

### Agregado
- **Seguimiento por paciente** (`seguimientoPaciente()`): lee la matriz por historia clínica (30 días) y agrega al mensaje las solicitudes previas, el curso en marcha de cada antimicrobiano ("en curso desde 01/11 (13 d); con esta orden completaría 20 d"), posibles solicitudes repetidas (mismo antimicrobiano en menos de 12 h) y otros antimicrobianos previos. La duración se valora sobre el curso completo.
- **Registro de revisiones** en la pestaña `REGISTRO_REVISIONES` (`registrarRevision()`): una fila por solicitud con restringido, con semáforo de las tablas, semáforo final, fuente (tablas o IA), detalle, enviado o no, modelo, tokens y costo.
- Tablas: *Candida* solo en urocultivo, antifúngico en foco bacteriano y caspofungina 70 mg de mantenimiento (ver `docs/pertinencia.md`).
- Calidad de datos: el código CIE10 se toma de cualquier parte del texto o de la descripción exacta de la pestaña `CIE10`; meses mayores de 11 junto a años no se muestran; palabras clave nuevas (`NAC`, `CONSECUTIVA A PROCEDIMIENTO`).

### Cambiado
- Validación de la tabla de duración contra guías: pie diabético (IWGDF/IDSA 2023), endocarditis (ESC 2023), prótesis articular (DATIPO), criptococosis (OMS 2022), histoplasmosis (OPS/OMS 2020: 14 d), aspergilosis (IDSA 2016), neutropenia febril (ECIL-4), piel (IDSA 2014) y empiema (SLIM). Artritis séptica queda sin verificar. Requiere `reescribirHojaPertinencia()`.
- Uso del modelo: en vancomicina o linezolid solos solo se llama al modelo (y se envía) si las tablas dejan el caso en rojo; al modelo se le envían solo las fichas de los antimicrobianos y del microorganismo del caso.

## [1.10.3] - 2026-11-14

### Cambiado
- Cuando el tratamiento de un antimicrobiano queda en rojo, sus días ya no salen en verde: la línea pasa a `⚪ ... d: la duración no se valora mientras se revalúa el tratamiento`, en las tablas y en la revisión por IA.

## [1.10.2] - 2026-11-14

### Cambiado
- Se quita la línea `💊 Tratamiento (fichas PROA)` del bloque de pertinencia.
- Revisión por IA: tope de 200 caracteres por motivo (con 140 una frase salió cortada), sin punto final, y el registro muestra la categoría cuando el modelo declina un caso.

## [1.10.1] - 2026-11-14

### Cambiado
- Redacción de la pertinencia como apoyo o sugerencia, no como veredicto: "acorde con la referencia", "se sugiere verificar", "se sugiere revaluar" (`ETIQUETA_NIVEL` en `Codigo.gs`), tanto en el análisis de las tablas como en el del modelo.

## [1.10.0] - 2026-11-14

### Cambiado
- La revisión por IA responde con **la misma estructura del análisis de las tablas** (preferida por el referente): veredicto global, `💊 Tratamiento (fichas PROA)` con una línea por antimicrobiano y `📏 Días · <síndrome>: referencia ... (fuente)` con una línea por antimicrobiano. El modelo parte del nivel y la redacción de las tablas y solo los cambia con sustento en una ficha; el encabezado de días y su fuente salen siempre de la tabla. Se descartan entradas de antimicrobianos que no estén en la solicitud. Se retira la línea de acción sugerida.

## [1.9.1] - 2026-11-14

### Cambiado
- La revisión por IA analiza con el rol de infectólogo y químico farmacéutico clínico y repasa todos los datos del caso antes de fijar el veredicto (campo `analisis`, que queda en el registro y no va al grupo). Esfuerzo del modelo `high`. Pie del mensaje: `_Análisis asistido por IA_`.

## [1.9.0] - 2026-11-14

### Agregado
- `docs/microorganismos.md`: fichas de los 16 grupos de microorganismos que aparecen en "Microorganismo aislado" (qué son, resistencia intrínseca y adquirida, tratamiento según mecanismo, qué restringidos se justifican), con fuente y estado de verificación.

### Cambiado
- **El análisis de la revisión lo hace el modelo Sonnet 5.5** (`IA_HALLAZGOS_ACTIVOS = true`, `claude-sonnet-5-5`, esfuerzo `medium`), con las fichas de antimicrobianos y de microorganismos, la tabla de duración y el análisis de las tablas como referencia. Respuesta concisa: veredicto y tres frases (tratamiento, días, acción sugerida) de máximo 170 caracteres.
- Una regla de espectro de las tablas fija el veredicto en "intervenir" aunque el modelo diga otra cosa. Si la API falla o declina, sale el análisis de las tablas.
- La petición pide respaldo automático ante declinaciones (`fallbacks: "default"`); si la API no lo acepta, se repite sin él.

## [1.8.0] - 2026-11-14

### Cambiado
- **La pertinencia sale como veredicto con semáforo**, no como dato suelto: una línea global (`pertinente` / `verificar` / `intervenir`), un veredicto por antimicrobiano restringido sobre el **tratamiento** (aislamiento y foco frente a su ficha, `CONFIG.INDICACIONES`, más las reglas de espectro) y otro sobre los **días** (dentro de la referencia, la supera, o la duplica). Rojo: espectro que no sirve, días al doble o más de la referencia, o profilaxis de más de 24 h.

## [1.7.0] - 2026-11-14

### Cambiado
- **El análisis del mensaje de revisión (respuesta citada) pasa a ser la pertinencia de las tablas**: duración de referencia por síndrome con su fuente, días que la superan, profilaxis de más de 24 h y reglas de espectro. `IA_HALLAZGOS_ACTIVOS = false` en `IA_PROA.gs`: ya no se llama a la API del modelo (sin costo por caso). Con `true` se agregan además los hallazgos del modelo, salvo los de duración.
- En el flujo de dos mensajes el bloque de pertinencia sale solo en la revisión; en el de un mensaje sigue en el mensaje base.

### Agregado al repositorio
- `IA_PROA.gs` y los cambios de `Codigo.gs` que solo estaban en el proyecto de Apps Script (encabezado destacado de ceftazidima/avibactam, `enviarAlertaWhatsApp(mensaje, opciones)`, ajuste renal sin valor de depuración), fusionados con la v1.6.0.

## [1.6.0] - 2026-11-14

### Agregado
- **Verificación de pertinencia** en el mensaje: duración de referencia por síndrome (21 síndromes por CIE10 o palabra clave, pestaña `PERTINENCIA_DURACION`), aviso cuando los días ordenados la superan, profilaxis de más de 24 h, 12 reglas de espectro (daptomicina en neumonía, ertapenem frente a *Pseudomonas*, ceftazidima/avibactam sola frente a NDM, etc.) e indicación etiológica sin aislamiento. `crearHojaPertinencia()` / `reescribirHojaPertinencia()`. Fuentes y estado de verificación en `docs/pertinencia.md`.

## [1.5.0] - 2026-11-02

### Cambiado
- Precisión del retiro: **vancomicina y linezolid no disparan alerta por sí solas, pero siguen siendo restringidas**. Si otro antimicrobiano de la solicitud dispara la alerta, salen como "Antimicrobiano restringido N" con su dosis evaluada (no como acompañante). Nueva columna opcional `dispara_alerta` (SI/NO) en `ANTIMICROBIANOS_RESTRINGIDOS`; `CONFIG.RESTRINGIDOS_SIN_ALERTA_PROPIA` cubre el caso en que la pestaña no la tenga. `filtrarAntimicrobianosRestringidos()` devuelve `dispara` por molécula y `debeAlertar()` decide el envío.
- `eventoPruebaVancomicinaSola()` y pruebas de que vancomicina sola no envía y que, en segundo lugar con ceftazidima/avibactam, se muestra como restringida.

## [1.4.0] - 2026-11-02

### Cambiado
- **Vancomicina y linezolid salen de la lista de restringidos** por decisión del Servicio Farmacéutico. Se quitaron de la pestaña `ANTIMICROBIANOS_RESTRINGIDOS` (efecto inmediato en producción) y de la lista de respaldo del código. Sus filas de `RANGOS_DOSIS` se conservan.
- Casos de prueba reescritos con moléculas vigentes: `eventoPruebaDaptomicina()` (etiológico + meropenem), `eventoPruebaCeftazidimaAvibactam()` (750 mg, ajuste renal, sin interconsulta: marca "revisar") y `eventoPruebaPediatrico()` (caspofungina 27 mg en lactante de 7,5 kg, dosis única).

## [1.3.0] - 2026-10-30

### Agregado
- `💡 Sugerencia PROA` en el mensaje cuando un restringido va en terapia empírica junto a un acompañante de amplio espectro (`AMPLIO_ESPECTRO`): "Revaluar a las 48-72 h con el resultado de cultivos para desescalar". `SUGERENCIA_EMPIRICO_SOLO` (apagado) la extiende a toda terapia empírica.
- `⚠️ Verificar peso / dosis`: avisos de incoherencia de digitación (peso implausible, peso vs. edad, más de 100 mg/kg por dosis). En la réplica de octubre 2026 detecta exactamente los 2 casos reales (peso 1 kg y 2,2 kg con dosis de adulto).
- Columna `ajuste_renal` en `RANGOS_DOSIS`; si el prescriptor marca ajuste renal y la molécula no lo requiere (linezolid, tigeciclina, rifampicina, caspofungina, anfotericina), el mensaje lo indica.
- `reescribirHojaRangosDosis()` para volcar la tabla del código a la pestaña.

### Cambiado
- Tabla de rangos revisada contra fichas FDA/EMA y consensos, con la fuente en cada fila: vancomicina 10–35 mg/kg (carga hasta 35), anfotericina B deoxicolato desde 0,25 mg/kg, ceftazidima/avibactam desde 940 mg (menor dosis renal autorizada), tigeciclina 25–100 mg o 1–2,5 mg/kg (pediatría y Child-Pugh C), rifampicina hasta 900 mg (adyuvante en infección protésica), caspofungina 1–4 mg/kg para pediatría; doripenem marcado "verificar"; polimixina B sin regla.

## [Documentación] - 2026-10-30

- `docs/antimicrobianos-restringidos.md`: fichas de referencia de las 13 moléculas restringidas con fuentes primarias (fichas FDA/EMA, consensos de vancomicina 2020 y polimixinas 2019, IDSA 2024, ACIN, MSD profesional), el uso observado en el HDV y los pendientes de verificación. Sustenta la pestaña `RANGOS_DOSIS`.

## [1.2.0] - 2026-10-30

### Agregado
- Mensaje con lo que PROA interviene: peso y mg/kg por dosis, cama, indicación (Empírico/Etiológico/Profiláctico), cultivos, origen, cambio de antimicrobiano y su razón, ajuste renal con DepCr y falla hepática, `⚠️ Sin interconsulta a Infectología`, fecha fin prevista por antimicrobiano, y los antimicrobianos no restringidos de la misma solicitud como `➕ Acompañante`.
- Rangos de dosis: pestaña `RANGOS_DOSIS` (con `crearHojaRangosDosis()` para crearla) y respaldo en `CONFIG`; `⚠️ Dosis fuera del rango de referencia (…): revisar` cuando la dosis falla en todas las reglas de su molécula. La tabla inicial es una propuesta que valida el QF. Réplica sobre octubre de 2026: 16 de 148 alertas marcadas.
- `campoDelEvento()`: lectura tolerante a espacios en los títulos de las preguntas; `verificarEncabezados()` comprueba los títulos contra la fila 1 de la hoja.
- Edad con años y meses (o días), peso en gramos para neonatos, frecuencias en texto ("Dosis única", "72 HORAS") sin el "cada … horas" roto.
- `eventoPruebaPediatrico()`; `test/dry-run.js` ahora carga el `Codigo.gs` real con la hoja simulada (10 pruebas).

### Cambiado
- CIE10: el código se normaliza quitando puntos (`G06.0` → `G060`) y un código de 3 caracteres se busca con `X` (`J40` → `J40X`); la descripción se busca con TextFinder sobre la columna A y se guarda en `CacheService` 6 h, en vez de cargar las 12.600 filas en cada alerta. `obtenerMapaCIE10()` se retiró.
- La fecha fin se calcula en el bot (`TERMINACION` es una fórmula de la hoja y no llega en el evento).

## [1.1.1] - 2026-10-30

### Sincronizado
- El pie de firma que quedó en el proyecto vivo es `_Ecosistema de Vigilancia Digital del Servicio Farmacéutico HDV · Desarrollado por el QF Juan Pablo Saavedra_` (se pegó en el editor con ese texto, distinto al propuesto). El repo, `test/pie-firma.js`, el README y el CLAUDE.md se ajustan a lo que corre en producción.

## [1.1.0] - 2026-10-20

### Documentación (2026-10-21)
- README reescrito con el flujo completo del bot: diagrama, paso a paso, datos del mensaje con su pregunta de origen, ejemplo con datos ficticios, configuración, funciones (cuáles envían), cómo actualizar el bot desde el repo y el cupo de chats compartido de Green-API entre los 4 bots.

### Sincronizado con el proyecto vivo "PROA ALERTAS"
- `Codigo.gs` se reemplazó por la versión que corre en Apps Script, que ya incluía cambios hechos directamente en el editor y nunca subidos al repo: lista de antimicrobianos leída de la hoja `ANTIMICROBIANOS_RESTRINGIDOS` (columna A, desde la fila 2) con lista de respaldo en `CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO`; Vancomicina, Caspofungina, Anfotericina B liposomal, Tygeciclina, Doripenem, Rifampicina, Polimixina B y Daptomicina en esa lista; cruce del diagnóstico con la hoja `CIE10`; vía de administración y días ordenados en el mensaje; manejo de errores HTTP de Green-API.

### Agregado
- Pie de firma en todos los mensajes de WhatsApp, en cursiva y debajo del cuerpo (mismo estilo que el bot de Alertas INVIMA): `_Bot diseñado por el QF Juan Pablo Saavedra · Servicio Farmacéutico HDV_`. Se agrega en `enviarAlertaWhatsApp()`, así que aplica a toda alerta que envíe el bot. El texto va con escapes `\u` para que las tildes no se corrompan al pegar en el editor de Apps Script. El correo electrónico no cambia.
- `test/pie-firma.js`: prueba en seco que carga el `.gs` real con Green-API simulado y verifica que el mensaje termine con el pie. No envía nada.
- `test/pie-firma.js` también verifica que los 7 antimicrobianos nuevos (con el nombre exacto del formulario, p. ej. `CASPOFUNGINA 50, 70`, `TYGECICLINA`) generen alerta y que Ceftriaxona, Meropenem y Piperacilina/Tazobactam no.

## [1.0.0] - 2026-07-26

### Agregado
- Versión inicial: `notificarNuevaRespuesta(e)`, `filtrarAntimicrobianosRestringidos(e)`, `construirMensajeDesdeEvento(e)`, `enviarAlertaWhatsApp(mensaje)`.
- Filtro de negocio: solo se envía alerta si alguno de los 3 antimicrobianos formulados (AM1/AM2/AM3) es Linezolid, Ceftazidima/Avibactam, Anfotericina, Aztreonam o Ertapenem.
- Proyecto Apps Script standalone ("PROA ALERTAS"), independiente del script "FORMULARIO PROA DOT" ya vinculado a la misma hoja de cálculo (no se modificó ni se interfirió con ese script).
- Integración con Green-API (instancia compartida `710722693364` con los bots de Farmacovigilancia y Tecnovigilancia, Script Properties independientes).
- Sin envío de correo electrónico (a diferencia de los otros dos bots): solo WhatsApp.
- `crearTriggerFormSubmit()`: crea el activador instalable `onFormSubmit` contra la hoja externa, ya que un proyecto standalone no permite seleccionar la hoja desde la interfaz de Activadores.
- `listarChatsGreenAPI()`: función de solo lectura para descubrir chatIds de grupos de WhatsApp visibles para la instancia.
- `eventoPruebaLinezolid()`, `eventoPruebaSinRestringidos()`, `testConstruccionMensaje()`, `enviarEjemploAlGrupo()`: utilidades de prueba con datos ficticios.
- Pruebas realizadas exclusivamente contra el grupo "PRUEBA BOT" (`120363412506101174@g.us`).
- 7 campos incluidos en la alerta: Historia Clínica, edad (años o meses), Diagnóstico CIE10, Especialidad que prescribe, Servicio actual, interconsulta infectología, y nombre/dosis/frecuencia del/los antimicrobiano(s) restringido(s) detectado(s).
