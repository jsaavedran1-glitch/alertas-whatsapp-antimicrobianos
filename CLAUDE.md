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

- Filtro de negocio: **solo** se envía alerta si alguno de los 3 antimicrobianos formulados (AM1/AM2/AM3) contiene alguno de los nombres de la lista de restringidos. La lista se lee de la hoja `ANTIMICROBIANOS_RESTRINGIDOS` de la matriz (columna A, desde la fila 2); si la hoja no existe, está vacía o falla la lectura, se usa `CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO`. Los nombres deben escribirse como aparecen en el formulario (p. ej. `TYGECICLINA` con Y, `CASPOFUNGINA` cubre `CASPOFUNGINA 50, 70`). El sufijo ` - UT-XXXXXXX` se descarta con `nombreLimpio()`.
- **Lectura de respuestas:** siempre con `campoDelEvento(valores, nombre)`, que compara los títulos con los espacios colapsados (misma defensa que en Tecnovigilancia). Los nombres de las preguntas viven en `CAMPOS` y `SLOTS`; `verificarEncabezados()` comprueba contra la fila 1 de la hoja que todos existan (solo lectura).
- **Rangos de dosis:** pestaña `RANGOS_DOSIS` (columnas: antimicrobiano, min/max mg/kg/dosis, min/max mg/dosis, ajuste_renal SI/NO, nota con la fuente) con respaldo en `CONFIG.RANGOS_DOSIS_RESPALDO`. Una dosis se acepta si cumple **cualquiera** de las reglas definidas para su molécula; solo se marca "⚠️ revisar" si falla en todas. Sin peso no se evalúa mg/kg; sin regla (p. ej. Polimixina B, que puede venir en UI) no se marca nunca. La tabla es una propuesta de referencia: la valida y ajusta el QF en la pestaña, no en el código. En la réplica sobre octubre de 2026 marcó 16 de 148 alertas (11%).
- **Coherencia de datos:** `advertenciasCoherencia()` agrega `⚠️ Verificar peso/dosis` cuando el peso está fuera de 0,4–250 kg, no cuadra con la edad (< 20 kg con ≥ 12 años, < 30 kg con ≥ 18 años, > 20 kg con < 12 meses) o una dosis supera 100 mg/kg (umbrales en `CONFIG`). El bot no puede corregir el formulario; la validación de peso (0,5–250) se configura en Google Forms.
- **Sugerencia PROA:** `sugerenciaPROA()` agrega `💡 … Revaluar a las 48-72 h con cultivos para desescalar` cuando la indicación es empírica y hay un acompañante de `CONFIG.AMPLIO_ESPECTRO`. Con `SUGERENCIA_EMPIRICO_SOLO = true` sale en toda terapia empírica (82 % de las alertas de octubre 2026; por eso está apagado).
- **CIE10:** `extraerCodigoCIE10()` deja solo letras y números del primer token (`G06.0` → `G060`) y, si quedan 3 caracteres, se busca también con `X` (`J40` → `J40X`, como está el catálogo). La descripción se busca con `TextFinder` sobre la columna A (no se cargan las 12.600 filas) y se guarda en `CacheService` 6 h por código.
- **Fecha fin:** la columna `TERMINACION` de la hoja es una fórmula (`Días ordenados AM1 + Marca temporal`) y **no llega en `e.namedValues`**; el bot la calcula con `fechaFin()` (hoy + días ordenados).
- Los emojis se generan con `String.fromCodePoint()`, y los textos con tildes que van al mensaje se escriben con escapes `\u`, para que no se dañen al pegar en el editor.
- Este bot **no** envía correo electrónico; solo WhatsApp.
- Edad: años + meses si ambos existen ("2 años 3 meses"); si no hay ninguno, días. Peso: `Peso en Kg` o, si es 0/vacío, `Peso en gr`/1000.

## Campos del formulario relevantes

Los títulos exactos están en `CAMPOS` y `SLOTS` dentro de `Codigo.gs` (única fuente). Particularidades que no hay que "corregir": la dosis del primer antimicrobiano dice `AB1` y las otras `AM2`/`AM3`; la frecuencia del primero dice `(En Horas)` y las otras `(En horas)`; la vía dice `adminsitración` con dos espacios antes de `AM1`; los días del tercero dicen `AM 3` con espacio. Si alguien edita una pregunta del formulario, correr `verificarEncabezados()`.

## Marco regulatorio de referencia

Programa de Optimización de Antimicrobianos (PROA), Resolución 4816 de 2008, Resolución 3100 de 2019, algoritmo OMS-UMC de causalidad (aplicable transversalmente al programa de farmacovigilancia/PROA del HDV E.S.E.).

## Recursos del proyecto

- Google Form: `https://docs.google.com/forms/d/1u8XYmynHfAH0EoeyNFFcd8w12IA95J47oItrv34TyGI/edit`
- Hoja de respuestas: `https://docs.google.com/spreadsheets/d/1ZsjuygpRz1wPhCRxmL8LPLTNOo8kujGXplX8JRs6SZY/edit`
- Proyecto Apps Script "PROA ALERTAS" (standalone): `https://script.google.com/u/1/home/projects/12mUy9SqQGzRnGjkbAsFyycG9RxJxvFePpSuHl4Nv8MokONxKY7kwbIw0/edit`
- Repositorio GitHub: `https://github.com/jsaavedran1-glitch/alertas-whatsapp-antimicrobianos`

## Pie de firma

Todo mensaje de WhatsApp termina con `_Ecosistema de Vigilancia Digital del Servicio Farmacéutico HDV · Desarrollado por el QF Juan Pablo Saavedra_` (cursiva; este bot usa un texto de pie distinto al de los otros tres, decidido en el editor el 2026-10-21), agregado en `enviarAlertaWhatsApp()`. Si se cambia el texto, actualizar también `test/pie-firma.js`.
