# Changelog

Todas las fechas en hora de Colombia (America/Bogota).

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
