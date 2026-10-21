# Changelog

Todas las fechas en hora de Colombia (America/Bogota).

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
