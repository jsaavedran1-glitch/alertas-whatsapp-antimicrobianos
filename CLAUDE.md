# CLAUDE.md - Contexto operativo (Alertas WhatsApp PROA Antimicrobianos HDV)

Reglas y contexto para cualquier asistente de IA que continúe este proyecto.

## Contexto institucional

- Proyecto del **Hospital Departamental de Villavicencio E.S.E. (HDV)**, Programa de Optimización de Antimicrobianos (PROA).
- Es análogo a `alertas-whatsapp-farmacovigilancia` y `alertas-whatsapp-tecnovigilancia` (mismos autores, misma instancia de Green-API), pero **no** debe mezclarse con esos dos proyectos ni con datos/documentos del Hospital San Juan de Dios de Puerto Carreño, Vichada (otro contexto institucional distinto del mismo usuario).
- La hoja de cálculo de origen ("MATRIZ FORMULARIO DE ANTIMICROBIANOS RESTRINGIDOS HDV") ya tiene un script de Apps Script **vinculado** (bound), llamado "FORMULARIO PROA DOT", que calcula estadísticas DOT (Days of Therapy) y corre bajo `procesarPROA` (trigger basado en tiempo) y su propio `notificarNuevaRespuesta` (trigger de envío de formulario, con errores). **Este bot NO debe modificar, eliminar ni interferir con ese script ni sus triggers.** Este bot vive en un proyecto de Apps Script completamente separado, standalone, llamado "PROA ALERTAS".

## Reglas de seguridad (heredadas de los otros dos bots + específicas de este)

1. **Nunca** enviar mensajes de prueba al grupo de producción. Todas las pruebas se hacen contra "PRUEBA BOT" (chatId `120363412506101174@g.us` en la instancia 710722693364).
2. **Antes de ejecutar cualquier función**, verificar por captura de pantalla el nombre exacto de la función seleccionada en el dropdown del editor de Apps Script (un clic puede no cerrar el dropdown a tiempo y ejecutar la función equivocada).
3. **Después de ejecutar**, revisar `/executions` para confirmar qué función corrió realmente — es la fuente de verdad, más confiable que el panel de registro inline.
4. **Nunca** escribir tokens, API keys ni contraseñas directamente en campos de formularios (Script Properties, etc.), ni siquiera si el usuario lo autoriza explícitamente o pega el valor en el chat. Se debe pedir al usuario que lo pegue él mismo.
5. Antes de tocar `GREENAPI_GROUP_CHATID`, confirmar que apunta al grupo de pruebas durante todo el desarrollo; solo se cambia a producción cuando el usuario lo pida explícitamente (como se hizo con Farmacovigilancia).
6. Este proyecto es **standalone**, no bound: para crear el trigger de "On form submit" no se puede usar la interfaz de Activadores (esa vista solo ofrece triggers basados en tiempo o calendario para proyectos no vinculados). Se debe usar `ScriptApp.newTrigger(...).forSpreadsheet(SpreadsheetApp.openById(ID)).onFormSubmit().create()`, ejecutando la función `crearTriggerFormSubmit()` una sola vez.

## Convenciones de código

- Filtro de negocio: **solo** se envía alerta si alguno de los 3 antimicrobianos formulados (AM1/AM2/AM3) coincide (por prefijo, insensible a mayúsculas) con: `LINEZOLID`, `CEFTAZIDIMA / AVIBACTAM`, `ANFOTERICINA`, `AZTREONAM`, `ERTAPENEM`. El nombre del formulario viene con un sufijo tipo ` - UT-XXXXXXX` que se descarta con `nombreLimpio()` antes de comparar y antes de mostrarlo en el mensaje.
- Los emojis del mensaje se generan con `String.fromCodePoint()`, nunca como caracteres literales (mismo criterio que los otros dos bots, para evitar corrupción de codificación en editores de código).
- Este bot **no** envía correo electrónico (a diferencia de Farmacovigilancia y Tecnovigilancia); solo WhatsApp.
- La edad se toma de "Edad del paciente en años"; si está vacío, se usa "Edad del paciente meses". Nunca se muestran ambos.

## Campos del formulario relevantes (nombres exactos, deben coincidir con `e.namedValues`)

- `Número de Historia Clínica`
- `Edad del paciente en años`
- `Edad del paciente meses`
- `Diagnóstico CIE10 para la cual se prescribe el antimicrobiano`
- `Especialidad que prescribe`
- `Servicio actual`
- `¿Solicitó interconsulta por infectología en Dinámica Gerencial?`
- `Nombre Antimicrobiano 1` / `2` / `3`
- `Dosis en miligramos o UI AB1` (nótese: "AB1", no "AM1", solo para el primer antimicrobiano), `Dosis en miligramos o UI AM2`, `Dosis en miligramos o UI AM3`
- `Frecuencia AM 1 (En Horas)` (con "H" mayúscula, distinto de AM2/AM3), `Frecuencia AM 2 (En horas)`, `Frecuencia AM 3 (En horas)`

## Marco regulatorio de referencia

Programa de Optimización de Antimicrobianos (PROA), Resolución 4816 de 2008, Resolución 3100 de 2019, algoritmo OMS-UMC de causalidad (aplicable transversalmente al programa de farmacovigilancia/PROA del HDV E.S.E.).

## Recursos del proyecto

- Google Form: `https://docs.google.com/forms/d/1u8XYmynHfAH0EoeyNFFcd8w12IA95J47oItrv34TyGI/edit`
- Hoja de respuestas: `https://docs.google.com/spreadsheets/d/1ZsjuygpRz1wPhCRxmL8LPLTNOo8kujGXplX8JRs6SZY/edit`
- Proyecto Apps Script "PROA ALERTAS" (standalone): `https://script.google.com/u/1/home/projects/12mUy9SqQGzRnGjkbAsFyycG9RxJxvFePpSuHl4Nv8MokONxKY7kwbIw0/edit`
- Repositorio GitHub: `https://github.com/jsaavedran1-glitch/alertas-whatsapp-antimicrobianos`
