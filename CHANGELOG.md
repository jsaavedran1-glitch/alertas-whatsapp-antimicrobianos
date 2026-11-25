# Changelog

Todas las fechas en hora de Colombia (America/Bogota).

## [1.36.25] - 2026-11-25 (solo Codigo.gs)

### Cambiado (decisión del referente): la línea de vía oral solo cuando el paciente es candidato
`💊 Tolera vía oral: …` (revisión de duración y caso PROA) sale solo si se cumplen **todos** (`motivoSinViaOral_()`, `CONFIG.VIA_ORAL_DIAS_MINIMOS`, `CONFIG.VIA_ORAL_FOCOS_IV`):
- tolera la vía oral (por boca o por sonda) y el antimicrobiano va IV con presentación oral de biodisponibilidad alta (como antes);
- adulto (≥18 años; los criterios de consenso son para adultos);
- **sin sepsis ni choque séptico** marcados en la solicitud (paciente estable);
- al menos **48 h** de tratamiento continuo del mismo tipo (antibacteriano o antifúngico);
- foco que no exige IV: no SNC, endocarditis ni neutropenia febril;
- sin bacteriemia por *S. aureus* (foco bacteriemia o catéter con *S. aureus*).

Evidencia: consenso nacional IVOS (Harvey et al., *J Clin Med* 2023, doi 10.3390/jcm12062086); paso temprano a oral en bacteriemia y sepsis (Li et al., *Clin Microbiol Infect* 2025, doi 10.1016/j.cmi.2024.11.035); *S. aureus* de bajo riesgo tras 5-7 d IV (SABATO, *Lancet Infect Dis* 2024, doi 10.1016/S1473-3099(23)00756-9); endocarditis (POET, *N Engl J Med* 2019, doi 10.1056/NEJMoa1808312); neutropenia febril de bajo riesgo (EASI-SWITCH, *Health Technol Assess*, doi 10.3310/RGTP7112). Temperatura, signos vitales y mejoría clínica no están en el formulario: la línea sigue siendo una sugerencia para el equipo.

Con los datos del 23 al 25/11, las dos solicitudes que mostraban la línea (linezolid y levofloxacino) tenían "Sepsis" marcada: ya no la mostrarían.

## [1.36.24] - 2026-11-25 (solo Codigo.gs)

### Retirado de la revisión de duración (decisión del referente; el caso PROA no cambia)
- La línea `💉 VANCOMICINA no viene en esta orden; si no se suspendió, sigue hasta 01/12` (el caso PROA la conserva).
- La línea `Con esta orden: CEFEPIME 22 d` (se quita `lineaConEstaOrden()`).
- El motivo del color en la línea de días: queda `⏱️ Lleva 12 d; con esta orden 26 d`. El color de la línea del paciente indica el nivel y la referencia con su fuente sigue en la línea 📏 del registro.

El mensaje del 24/11 de 26 d (paciente de 32 años) queda en 8 líneas.

## [1.36.23] - 2026-11-25 (Codigo.gs e IA_PROA.gs)

### Cambiado (decisión del referente: mensaje de duración más corto)
Solo la **revisión de duración**; el caso PROA no cambia. En el mensaje del paciente de 87 años del 24/11: de 13 a 11 líneas y de 784 a 556 caracteres, con los mismos datos.
- Servicio abreviado: `Hosp. Quirúrgicos ortopedia`, `UCI B` (`servicioCorto()`, que pasa de IA_PROA.gs a Codigo.gs; el informe semanal la sigue usando).
- Foco, sepsis y diagnóstico en una línea: `🎯 Bacteriemia / sepsis sin foco claro · Sepsis · A499`. Con foco "Otro" o sin foco sale el diagnóstico escrito, como antes (con la sepsis en la misma línea).
- Días y motivo del color en una línea: `⏱️ Lleva 45 d; con esta orden 59 d: más del doble de la referencia (7-14 d)` (el color ya va en la línea del paciente; los antifúngicos dicen "Lleva 20 d de antifúngico").
- Vía oral corta: `💊 Tolera vía oral: LINEZOLID tiene presentación oral`.
- "Por antimicrobiano" pasa a `Con esta orden: MEROPENEM 27 d · LINEZOLID 29 d`: solo los antimicrobianos de esta orden con sus días en el tratamiento continuo (`lineaConEstaOrden()`); no sale si ninguno venía de antes.
- Negrita: los días que lleva y con esta orden, la orden nueva completa y los antimicrobianos de "Con esta orden" con sus días. Las órdenes anteriores van sin negrita.

## [1.36.22] - 2026-11-25 (solo Codigo.gs)

### Retirado (decisión del referente, mismo día)
- La línea `💧 Depuración estimada … · ficha técnica: …` de la v1.36.21 ya no va en el caso PROA ni en la revisión de duración (se quitan `lineaAjusteRenal()` y `CONFIG.AJUSTE_RENAL_EN_MENSAJE`). El ajuste renal vuelve a estar solo en modo prueba: una fila en `REGISTRO_REVISIONES`, sin mensaje.
- Se mantiene la fecha de fin en lo formulado antes (`💉 VANCOMICINA no viene en esta orden; si no se suspendió, sigue hasta 01/12`).

## [1.36.21] - 2026-11-25 (solo Codigo.gs)

### Cambiado (decisión del referente; mensajes cortos)
- **Ajuste renal dentro del mismo mensaje** (`CONFIG.AJUSTE_RENAL_EN_MENSAJE = true`, `lineaAjusteRenal()`): si sale el caso PROA o la revisión de duración y la revisión renal encuentra algo, va una sola línea `💧 Depuración estimada 29 ml/min · ficha técnica: MEROPENEM la misma dosis c/12 h`. No hay mensaje renal aparte: sigue dependiendo de `AJUSTE_RENAL_ENVIAR` (false). La fila `AJUSTE RENAL` del registro dice "va como línea del mensaje enviado". Motivo: el 24/11 la revisión de un paciente de 87 años (meropenem 1 g c/8 h, depuración estimada 29 ml/min) salió sin ese dato; en dos días el modo prueba encontró 3 casos. La tabla sigue pendiente de validación por el comité.
- **"Formulado antes" con fecha de fin:** `💉 VANCOMICINA no viene en esta orden; si no se suspendió, sigue hasta 01/12` (con varios: `💉 No vienen en esta orden; si no se suspendieron, siguen: VANCOMICINA hasta 01/12 · CEFEPIME hasta 28/11`). Antes decía "desde 17/11 (14 d)" junto a una lista que mostraba "VANCOMICINA 17/11-21/11 · 4 d", y no se entendía si seguía.

## [1.36.20] - 2026-11-23 (solo IA_PROA.gs)

### Agregado (decisión del referente)
- Cultivos **pendientes de toma**, separados de los "sin cultivos" (`estadoCultivos_()`): la opción nueva `SOLICITADOS (PENDIENTES DE TOMA)` de "Cultivos tomados:" (y el texto "pendiente" o "no aún") cuenta como pendiente si no hay ningún cultivo tomado; con un cultivo tomado cuenta como tomado. "Sin cultivos" queda solo para NINGUNO o vacío. Antes "pendiente" se sumaba a los sin cultivos y "NO AUN" contaba como cultivo tomado.
- Informe semanal: `🧫 Empírico 84% (58% sin cultivos, 6% pendientes de toma)`; los pendientes solo aparecen si hay. La IA recibe `empiricos_pendientes_toma_pct` y se le advierte que una baja de los sin cultivos frente a semanas anteriores al 23/11 puede deberse a la opción nueva.
- El análisis de pertinencia y los mensajes del caso PROA no cambian: muestran el texto del campo tal como viene.

## [1.36.19] - 2026-11-23 (solo IA_PROA.gs)

### Cambiado (decisión del referente)
- La lectura del informe semanal abre siempre con `• Las solicitudes pasaron de 167 a 186 y los pacientes de 123 a 144` (`fraseVolumen_()`; "se mantuvieron en N" si no cambia). La escribe el bot, no la IA: en la prueba del mismo día la IA eligió otros cuatro hallazgos y esa frase no salió.
- La IA escribe ahora 2 o 3 hallazgos (`INFORME_MAX_HALLAZGOS = 3`), para que la lectura siga con un máximo de 4 puntos, y se le indica no repetir esa comparación ("solicitudes" sale de los indicadores que puede usar).
- `INFORMES_PROA` queda oculta en la hoja, como las demás pestañas del bot (el registro se escribe igual).

## [1.36.18] - 2026-11-23 (solo IA_PROA.gs)

### Cambiado (decisión del referente, tras el primer informe en producción)
- Informe semanal: la primera línea queda `📝 186 solicitudes (sem. ant. 167) · 144 pacientes`, sin "15 con restringido (sem. ant. 7)". Ponía solicitudes junto a pacientes y se leía como 15 pacientes (eran 15 solicitudes de 12 pacientes); además no incluía vancomicina ni linezolid, que sí aparecen en la línea de restringidos.
- La IA ya no recibe ese número (`datosParaIa_`), para que no lo comente ("las solicitudes con restringido, de 7 a 15"). Sigue recibiendo el porcentaje de interconsulta a Infectología en restringidos, que el informe muestra.

## [1.36.17] - 2026-11-23 (solo Codigo.gs)

### Agregado (tercera edición del formulario)
- "Microorganismo aislado" pasa a lista desplegable. Si eligen "Otro", el bot lee `Otro microorganismo (si eligió Otro)` (`microorganismoDe()`), en el caso PROA, el análisis de pertinencia, el registro y la historia del paciente. Los nombres de la lista (Escherichia coli, Klebsiella pneumoniae, Pseudomonas aeruginosa…) los reconocen las mismas reglas de espectro que el texto libre.
- La opción "Pendiente" cuenta como sin aislamiento (`sinAislamiento()`), igual que "00" y "000", que aparecían en el texto libre como "ninguno".

## [1.36.16] - 2026-11-23 (solo Codigo.gs)

### Agregado (segunda edición del formulario, 2026-11-23)
- Preguntas `Foco infeccioso principal` y `¿Sepsis o choque séptico?` en `CAMPOS` (en la hoja quedaron en AY-AZ; "Estado" y "Observación a la solicitud" pasaron a BA-BB).
- **El foco define la duración de referencia** por encima del CIE10 (`FOCO_A_SINDROME`, `dxParaSindrome()`): en el caso PROA, en la revisión de duración y en cada solicitud previa del tratamiento continuo que traiga foco. Con un foco de varias filas (SNC: meningitis o absceso; osteomielitis o artritis; infección fúngica invasiva) el CIE10 elige dentro del grupo y, si no, la fila por defecto (meningitis, osteomielitis; la fúngica sin defecto). "Otro", "Profilaxis quirúrgica" (va por el tipo de indicación) y las solicitudes antiguas sin foco siguen con el CIE10 como antes. Los mensajes muestran el diagnóstico tal como se escribió.
- Caso PROA y revisión: línea `🎯 Foco: Neumonía nosocomial o asociada a ventilador · Choque séptico` (la sepsis solo si no es "No").

## [1.36.15] - 2026-11-23 (solo Codigo.gs)

### Agregado (formulario actualizado el 2026-11-23)
- **Preguntas nuevas del formulario** en `CAMPOS`: `Creatinina sérica (mg/dL)`, `¿Terapia de reemplazo renal?`, `¿Tolera la vía oral o por sonda?` y `Fenotipo de resistencia del aislamiento`. Google las insertó en la hoja en AU-AX, antes de las columnas manuales "Estado" y "Observación a la solicitud", que pasaron a AY-AZ (el bot y el dashboard leen por nombre; un script que lea esas dos columnas por número debe revisarse).
- **Revisión de ajuste renal en MODO PRUEBA** (`revisionAjusteRenal()`, `CONFIG.AJUSTE_RENAL`, `docs/ajuste-renal.md`): con la creatinina nueva estima la depuración (Cockcroft-Gault, adultos) y compara cefepime, meropenem, piperacilina/tazobactam, ertapenem, ceftazidima, ceftazidima/avibactam, aztreonam, levofloxacino, ciprofloxacino y daptomicina con su tramo de la ficha técnica. No evalúa terapia de reemplazo renal, menores de 18 años ni vancomicina. Con `AJUSTE_RENAL_ENVIAR = false` solo deja una fila en `REGISTRO_REVISIONES` (fuente `AJUSTE RENAL`); no envía nada. Esas filas no cuentan para la regla de 7 días de la revisión de duración. Tabla pendiente de validación por el comité.
- **Caso PROA y revisión:** el fenotipo va junto al aislamiento (`🦠 Klebsiella pneumoniae (carbapenemasa)`); la terapia de reemplazo renal va en la línea 💧; si el paciente tolera la vía oral y hay un antimicrobiano IV con presentación oral de biodisponibilidad alta (`CONFIG.ORAL_BIODISPONIBLE`: linezolid, quinolonas, etc.), la línea `💊 Tolera la vía oral (sí, por sonda): LINEZOLID tiene presentación oral con biodisponibilidad alta`. La creatinina y la depuración estimada no van en el mensaje (decisión del 2026-11-07); las usa la revisión renal.

### Corregido
- Frecuencias del formulario nuevo (`frecuenciaHoras()`): "48 (interdiaria)" e "Interdiaria" son c/48 h; "3 dosis y suspender" ya no cuenta como c/3 h (antes disparaba "Verificar frecuencia"). 36 y 72 se leen como intervalos.

## [1.36.14] - 2026-11-23 (solo Codigo.gs)

### Agregado (decisión del referente)
- **Formularios separados entre días distintos:** el caso PROA y la revisión por tratamiento prolongado muestran `💉 Formulado antes y aún dentro de sus días: CEFEPIME desde 20/10 (14 d)` con los antimicrobianos del tratamiento continuo que no están en esta orden, que ninguna orden posterior reemplazó (mismo antimicrobiano o misma familia) y que aún están dentro de sus días ordenados. Solo informa: los días de tratamiento no cambian, porque una suspensión no genera formulario y el antimicrobiano pudo suspenderse. En 90 días, de 951 solicitudes en días distintos, en 217 la anterior seguía dentro de sus días y quedaba por fuera (vancomicina → meropenem 29, cefepime → vancomicina 29, meropenem → vancomicina 24); en 87 la nueva llegó antes de 48 h.

### Cambiado (decisión del referente)
- **Regla de 7 días de la revisión por tratamiento prolongado:** cuenta cualquier mensaje enviado al grupo (caso PROA o revisión), no solo las revisiones. Antes, un paciente podía recibir el caso PROA y al día siguiente la revisión (pasó 1 vez en la semana del 16 al 22/11: tigeciclina el 17/11 y meropenem el 18/11). En el registro: "no se envía: el paciente ya tuvo revisión o caso PROA en los últimos días". El caso PROA no cambia: un restringido nuevo sigue generando su mensaje.

## [1.36.13] - 2026-11-23 (solo Codigo.gs)

### Cambiado (decisión del referente)
- Solicitudes del mismo día marcadas como **CAMBIO**: ya no reemplazan todo lo anterior; siguen la misma regla que las demás (se reemplaza solo el mismo antimicrobiano o uno de la misma familia). En los datos de 90 días, unas 10 solicitudes marcadas CAMBIO agregaban un antimicrobiano en vez de reemplazarlo (meropenem en la mañana y linezolid marcado CAMBIO en la tarde). Las que sí son un cambio dentro de la familia (cefepime → meropenem) se siguen reemplazando.

## [1.36.12] - 2026-11-23 (solo Codigo.gs)

### Corregido (auditoría, decisión del referente)
- **Combinaciones registradas en dos formularios el mismo día.** Antes, una solicitud posterior del mismo día reemplazaba a la anterior, así que el bot se quedaba con una sola. En 90 días hubo 99 días-paciente en que la última solicitud dejaba por fuera un antimicrobiano de la anterior; 78 no estaban marcadas como CAMBIO, y los pares más frecuentes eran combinaciones: cefepime → vancomicina (10), vancomicina → cefepime (8), meropenem → linezolid (7). Efectos: en la revisión por tratamiento prolongado faltaba el otro antimicrobiano en la lista de prescripciones y en "Por antimicrobiano" (el 20/11, una vancomicina de un paciente de UCI); en el caso PROA, la pertinencia veía medio esquema (p. ej. "vancomicina sola frente a gramnegativo" con el cefepime en otro formulario).
- Regla nueva (`combinarMismoDia()`): la solicitud posterior del mismo día **se suma** a las anteriores, salvo que las reemplace:
  - viene marcada como CAMBIO (reemplaza lo anterior de su tipo: antibacteriano o antifúngico);
  - es el mismo antimicrobiano (otra presentación o una corrección: ciprofloxacino tableta → ampolla);
  - es de la misma familia (`CONFIG.MISMO_DIA_FAMILIAS`): betalactámicos (cefepime → meropenem, piperacilina/tazobactam → cefepime) o anti-grampositivos (vancomicina → linezolid);
  - excepto las combinaciones buscadas (`CONFIG.MISMO_DIA_COMBINACIONES`): ceftazidima/avibactam con aztreonam y ampicilina con una cefalosporina.
  Comprobada sobre los 90 días: los pares de betalactámicos sin CAMBIO son cambios (cefepime → meropenem, piperacilina/tazobactam → cefepime) y el resto, combinaciones.
- **Caso PROA:** lo que sigue vigente de otras solicitudes de hoy del mismo paciente va como acompañante (`➕ CEFEPIME 2000 mg IV c/8 h · 7 d hasta 12/11 · otra solicitud de hoy`) y cuenta en la pertinencia, la sugerencia de terapia combinada y las advertencias. Lo reemplazado no sale como "en curso". En el registro, la columna Acompañantes lo marca "(otra solicitud de hoy)".
- Sin cambios: qué solicitudes generan caso PROA o revisión (sigue siendo una revisión por paciente y día), los días de tratamiento continuo y el informe semanal.

### Retirado
- `enviarEjemploAlGrupo()`: enviaba un caso ficticio de daptomicina al grupo de `GREENAPI_GROUP_CHATID`, que es el de producción, y dejaba una fila falsa en el registro. Para ver un mensaje en WhatsApp queda `enviarPruebaCeftazidimaAPruebaBot()`, solo a PRUEBA BOT.

## [1.36.11] - 2026-11-23 (solo IA_PROA.gs)

### Cambiado (pedido del referente)
- Indicador mensual sin la nota al pie ("Razón del cambio «Por intervención PROA» que marca el médico…"). El mensaje queda en tres líneas: título, cifra del mes y tendencia. La advertencia de que la cifra se queda corta sigue en el código, el README y el CHANGELOG.

## [1.36.10] - 2026-11-23 (solo IA_PROA.gs)

### Cambiado (pedido del referente)
- Indicador mensual: la línea 🤝 muestra solo el mes informado ("Solicitudes por intervención PROA: *21* de 773 (2,7%)"), sin la comparación con el mes anterior. Los meses anteriores siguen en la línea de tendencia (📅).

## [1.36.9] - 2026-11-23 (solo IA_PROA.gs)

### Agregado (decisión del referente)
- **Indicador mensual PROA:** el día 1 de cada mes a las 7:00, al mismo destino del informe semanal (`INFORME_PROA_DESTINO`, hoy PRUEBA BOT), un mensaje con las solicitudes del mes que terminó con razón del cambio **"POR INTERVENCIÓN PROA"**: número, total de solicitudes del mes y porcentaje, el mes anterior y la tendencia de los últimos 6 meses (`INDICADOR_MESES`). Lo calcula el código, sin IA; deja su fila en `INFORMES_PROA` con el periodo "mes año (indicador mensual)". Cuenta las solicitudes con algún antimicrobiano (la misma definición del informe semanal) y lee solo cuatro columnas de la matriz. Se queda corto frente a la realidad: la pregunta es obligatoria, la mayoría responde "Condición propia del paciente" y una suspensión no genera formulario. En los datos reales: 83 solicitudes en los últimos 90 días; 37 en septiembre, 21 en octubre y 25 en noviembre hasta el 22.
- `crearTriggerInformeProa()` crea ahora los dos activadores (semanal y mensual) y se puede repetir sin duplicarlos. Hay que ejecutarlo una vez más después de pegar esta versión.
- `probarIndicadorMensual()` (no envía nada; muestra también la cifra parcial del mes en curso) y `enviarIndicadorMensualAPruebaBot()` (solo a PRUEBA BOT).

## [1.36.8] - 2026-11-23 (solo Codigo.gs; la pestaña ya cambió)

### Agregado (decisión del referente)
- Prefijo `R788` en la fila de bacteriemia/sepsis: algunos médicos escriben R78.81 (bacteriemia en la CIE-10 de EE. UU.), que el bot lee como R788, y sin el prefijo no tenía duración de referencia. En la pestaña `PERTINENCIA_DURACION` (rige desde la siguiente solicitud), el respaldo del código y `docs/pertinencia.md`.

## [1.36.7] - 2026-11-23 (solo Codigo.gs)

### Agregado (decisión del referente)
- Equivalencia **BACTEREMIA / BACTERIEMIA → A499** ("Infección bacteriana, no especificada") en `CIE10_EQUIVALENCIAS`: la CIE-10 de la OMS no tiene código de bacteriemia. Cubre también "BACTERIEMIA EN ESTUDIO". En el mensaje sale `A499 · Infeccion bacteriana, no especificada (escrito: bacteremia)`. La duración de referencia no cambia (prefijo A49 de bacteriemia/sepsis). "BACTEREMIA POR E. COLI" sigue sin código, porque nombra el microorganismo, y conserva su duración por palabra clave.

## [1.36.6] - 2026-11-23 (solo Codigo.gs; la pestaña ya cambió)

### Cambiado (decisión del referente)
- En la fila de bacteriemia/sepsis, `R65` pasa a `R650,R651`: solo el síndrome de respuesta inflamatoria sistémica de origen infeccioso toma la duración de sepsis; el no infeccioso (R652, R653) y el no especificado (R659), no. Mismo criterio que el cambio de `R57` a `R572`. En la pestaña `PERTINENCIA_DURACION` (rige desde la siguiente solicitud), el respaldo del código y `docs/pertinencia.md`.

## [1.36.5] - 2026-11-23 (solo Codigo.gs; la pestaña ya cambió)

### Cambiado (decisión del referente)
- **Duración de referencia de sepsis solo para el choque séptico:** en la fila de bacteriemia/sepsis, el prefijo `R57` (todos los choques) pasa a `R572` (choque séptico). El choque hipovolémico (R571), el cardiogénico (R570) y el no especificado (R579) ya no toman 7-14 d de sepsis; si el texto dice "choque séptico" o "sepsis", la palabra clave sigue encontrando la referencia. Se cambió en la pestaña `PERTINENCIA_DURACION` (rige desde la siguiente solicitud), en el respaldo del código y en `docs/pertinencia.md`.

## [1.36.4] - 2026-11-23 (solo Codigo.gs)

### Cambiado (auditoría, punto 5)
- Las solicitudes cuyo único restringido es vancomicina o linezolid (sin alerta propia) ya no dejan fila en `REGISTRO_REVISIONES`. No generan mensaje, nada las lee (ni el informe semanal ni la regla de 7 días) y eran 47 de las 70 filas de la semana del 16 al 22/11. Siguen registrándose los casos PROA, los restringidos que no superan 14 d (con el motivo) y las revisiones de duración. Las filas anteriores no se tocan.

## [1.36.3] - 2026-11-23 (solo IA_PROA.gs)

### Corregido
- El filtro de cifras descartaba sugerencias con intervalos clínicos en horas ("auditoría de vancomicina… revaloración a las 48-72 horas", primera prueba con la mediana). Los intervalos en horas se aceptan porque no son datos del informe. Días, pacientes y porcentajes siguen debiendo estar en los datos.

## [1.36.2] - 2026-11-23 (solo IA_PROA.gs)

### Cambiado (decisión del referente: una sola medida)
- Los días por antimicrobiano del informe (`💊` y `🔒`) muestran **solo la mediana**: `💊 Mediana de días de tratamiento por antimicrobiano (pacientes): CEFEPIME 9 d (49)`. Con pocos pacientes, un tratamiento muy largo no la mueve. `INFORME_MEDIDA = "promedio"` (al inicio de `IA_PROA.gs`) vuelve al promedio. La IA recibe solo la medida elegida.

## [1.36.1] - 2026-11-23 (solo IA_PROA.gs)

### Agregado (auditoría, punto 6)
- **Mediana junto al promedio** en las líneas `💊` y `🔒` del informe semanal: `CEFEPIME 12 / 9 d (49)` = promedio / mediana (pacientes); un solo número si coinciden. Con pocos pacientes, un tratamiento muy largo mueve el promedio y no la mediana. La IA recibe la mediana y sabe que un promedio muy por encima de ella indica unos pocos tratamientos largos.

### Cambiado
- Las versiones de `Codigo.gs` e `IA_PROA.gs` comparten mayor.menor (1.36). Un cambio que toca un solo archivo sube su último número y basta con pegar ese archivo. El aviso de versiones compara mayor.menor.

## [1.36.0] - 2026-11-23

### Cambiado (auditoría: mantenimiento, sin cambios en los mensajes)
- **Una sola regla de tratamiento continuo**, que usan los mensajes y el informe semanal: `diaCalendario()`, `inicioTratamientoContinuo()` y `diasTratamientoPrevio()` en `Codigo.gs`. `IA_PROA.gs` ya no tiene su propia copia (`diasPrevios_`). Si se cambia la tolerancia o la ventana, cambia en los dos.
- **Versión visible:** `VERSION_BOT` (Código) y `VERSION_INFORME` (IA_PROA) deben coincidir. `probarSolicitud_()`, `probarCruceCIE10()` y `probarInformeProa()` la escriben, y la pestaña `INFORMES_PROA` tiene la columna `Versión`. Si los dos archivos pegados no son de la misma versión, la prueba y el informe lo avisan.

### Retirado
- **Resumen diario de las 7:00** (apagado desde la v1.31.0): `enviarResumenProlongados()`, `probarResumenProlongados()`, `crearTriggerResumenProlongados()`, `CONFIG.PROLONGADO_RESUMEN_DIARIO`/`_HORA` y el estado `PENDIENTE`. La revisión de duración sale al llegar la solicitud, como hasta ahora.
- `CONFIG.ENCABEZADOS_DESTACADOS` y `encabezadosDestacados()` (vacíos desde la v1.32.0), y `lineaEsquema()`, `frecuenciaTexto()`, `pertinenciaDesdeEvento()` y `diasTexto()`, que nada usaba.

## [1.35.3] - 2026-11-23

### Corregido (tercera prueba con la matriz real: 39 cruzadas, 24 sin código; los cruces equivocados ya no aparecen)
- "SX FEBRIL EN ESTUDIO" no cruzaba: ESTUDIO no está en la pestaña y el corrector lo cambiaba a ESTUDIOS, que ya no se ignoraba. Las palabras ignoradas se quitan antes y después de corregir, también en plural.

## [1.35.2] - 2026-11-23

### Corregido
- La caché de 6 h del cruce por palabras devolvía los cruces calculados con las reglas anteriores: la segunda prueba con la matriz real salió idéntica a la primera. La llave de la caché lleva ahora una firma de la versión y de `CIE10_SINONIMOS`, `CIE10_PALABRAS_IGNORADAS` y `CIE10_EQUIVALENCIAS`. Editar esas listas también recalcula los cruces.
- `VERSION_BOT` al inicio de `Codigo.gs`; `probarCruceCIE10()` la escribe en el registro de ejecución para saber qué versión está pegada.

## [1.35.1] - 2026-11-22

### Corregido (primera prueba del cruce con la matriz real: 419 de 500 con código escrito, 43 cruzadas, 20 sin código)
- **"Otras …" ya no le gana a "no especificada"**: meningitis bacteriana → G009 (no G008), osteomielitis → M869, peritonitis → K659, colecistitis → K819, leucemia linfoide → C919.
- **Prefijo común más estricto** (7 letras y 75% de la palabra): "NEUTROPRENIA FEBRIL" ya no termina en la dermatosis neutrófila febril.
- **Se quita como máximo una palabra del final**: "TUMOR FOSA POSTERIOR" ya no termina en la fosa nasal.
- **Empate = sin código**: "CA PAPILAR DE OVARIO" ya no termina en el bazo, ni "Tumor de mama" en benigno.

### Agregado
- `CONFIG.CIE10_EQUIVALENCIAS`: textos frecuentes con código fijo (neumonía aspirativa o por broncoaspiración → J690, síndrome febril → R509, pielonefritis → N10X si existe en la pestaña).
- El cruce busca las palabras parecidas solo entre las que comparten las 7 primeras letras: `probarCruceCIE10()` tardaba 39 s con 500 solicitudes.

## [1.35.0] - 2026-11-22

### Agregado (pedido del referente: cruzar el diagnóstico con la pestaña CIE10)
- **Diagnóstico sin código → código CIE10 por palabras** (`resolverCIE10()`, `cruceCIE10PorTexto()`). Antes solo se cruzaba si el texto era idéntico a una descripción de la pestaña. Ahora entiende abreviaturas (`CONFIG.CIE10_SINONIMOS`), errores de digitación (MENIGITIS, PERITONISTIS, ENFEREMDAD) y omite palabras que no cambian el diagnóstico (`CONFIG.CIE10_PALABRAS_IGNORADAS`). Con varias palabras, la descripción debe contenerlas todas (quitando complementos del final); con una sola, solo vale la descripción genérica.
- El mensaje muestra lo escrito junto al código cruzado: `📋 G039 · Meningitis, no especificada (escrito: menigitis)`. Los códigos de 3 caracteres sin subcódigo (`K35`) salen con la descripción de su "no especificada".
- La duración de referencia aprovecha el cruce y las palabras corregidas ("PERITONISTIS ASOCIADO AL CATETER" → intraabdominal; "SHOCK SEPTICO" → bacteriemia/sepsis). Con código cruzado, las palabras clave de la tabla tienen prioridad sobre el código.
- `probarCruceCIE10(filas)`: revisa los diagnósticos de las últimas solicitudes sin enviar nada.
- Prueba nueva con diagnósticos tal como se escriben en la matriz, incluidos los que no deben cruzarse.

## [1.34.3] - 2026-11-22

### Cambiado (pedido del referente)
- Se quita del informe el promedio de tratamiento continuo por paciente (`⏱️`); tampoco va a la IA. Siguen el promedio por antimicrobiano y los tratamientos más largos, que usan el mismo cálculo de continuidad (documentado en el README).

## [1.34.2] - 2026-11-22

### Corregido (primera prueba con la matriz real: 13 s, USD 0,05, sin descartes)
- La lectura de la IA sale con coma decimal y el signo % pegado, como las cifras del informe (`12.5` → `12,5`, `86 %` → `86%`).
- El registro de ejecución ya no escribe los números como `13.0 s` o `4.0 hallazgo(s)`.

## [1.34.1] - 2026-11-22

### Cambiado (pedido del referente)
- **Promedios de días de tratamiento** en lugar de días ordenados sumados: `⏱️` tratamiento continuo promedio por paciente (antibiótico y antifúngico, frente a la semana anterior), `💊` promedio por antimicrobiano con el número de pacientes y `🔒` restringidos con su promedio. Se calculan con las reglas del seguimiento (prescripciones seguidas, 3 d de tolerancia, 60 d de historia) hasta el fin de la última orden de la semana; los tratamientos más largos salen del mismo cálculo, para todos los pacientes.
- Se quitan del informe las líneas de mensajes del bot (`📨 Caso PROA · Revisión de duración`) y de datos por corregir (`⚠️`). El informe ya no lee `REGISTRO_REVISIONES`.

### Corregido
- **La IA declinaba** (`reasoning_extraction`) porque el esquema le pedía escribir su repaso en el campo `analisis`. Se quita ese campo; el resumen del razonamiento se lee de los bloques de *thinking* (`display: "summarized"`) y queda en `INFORMES_PROA`.

## [1.34.0] - 2026-11-22

### Cambiado (decisión del referente: otro enfoque para la IA)
- **La IA deja de analizar casos** y pasa a escribir la lectura de un **informe semanal PROA** para el comité. Los mensajes de cada solicitud (caso PROA y revisión de duración) vuelven a ser los de la v1.32.0, sin IA.
- **Informe de los lunes a las 7:00** (`crearTriggerInformeProa()`, `enviarInformeSemanalProa()`), con las cifras de los 7 días anteriores frente a la semana anterior: solicitudes, pacientes, restringidos, antimicrobianos con más días ordenados, servicios, tipo de indicación y empíricos sin cultivos, profilaxis de más de 1 día, interconsulta a Infectología, mensajes del bot, tratamientos más largos y datos por corregir. Las cifras las calcula el código.
- **Lectura de la IA** (`claude-opus-5-5`): 2 a 4 hallazgos y hasta 2 sugerencias de programa. Se descarta toda frase con una cifra que no esté en los datos o con lenguaje de juicio; a la API solo salen cifras agregadas. Sin clave, o si la API falla, el informe sale solo con cifras. Si tarda demasiado con esfuerzo alto, se reintenta con `medium`.
- Destino con `INFORME_PROA_DESTINO` (PRUEBA BOT por defecto). Cada informe queda en la pestaña nueva `INFORMES_PROA` (mensaje, descartes, repaso de la IA, modelo, tokens y costo). `IA_PROA_MODO` ya no se lee.
- Las columnas Modelo, Tokens y Costo de `REGISTRO_REVISIONES` vuelven a quedar vacías.

## [1.33.0] - 2026-11-22

### Agregado (pedido del referente: análisis con Opus)
- **Vuelve la IA, como puntos para revisar** (`IA_PROA.gs`, modelo `claude-opus-5-5`, esfuerzo `high`, salida estructurada y respaldo del servidor si el modelo declina). Como máximo 3 puntos por mensaje, cada uno con su fuente entre paréntesis; sin veredicto ni color, que fue lo que generó controversia con Infectología en la versión anterior.
- **Fuentes controladas:** el modelo solo puede citar la tabla de duración, las fichas de `docs/` que aplican al caso, el análisis de las tablas o los datos de la solicitud. `puntosIa_()` descarta los puntos con otra fuente, con lenguaje de juicio o de un antimicrobiano que no está en la solicitud; quedan en el registro con el motivo.
- **Modo `PRUEBA` por defecto** (`IA_PROA_MODO`): el grupo recibe primero el mensaje de siempre y PRUEBA BOT una copia con los puntos, para que el QF los valide. `PRODUCCION` los lleva al grupo; `NO` la apaga. Sin `ANTHROPIC_API_KEY` el bot no cambia.
- Solo se analizan los mensajes que se envían (caso PROA y revisión de duración): una llamada como máximo por solicitud. Si la API falla, tarda o declina, el mensaje sale sin el bloque.
- `REGISTRO_REVISIONES` vuelve a llenar Modelo, Tokens y Costo; el Detalle agrega los puntos, los descartados, los datos faltantes, el repaso del caso y los segundos.
- `probarIaUltimaSolicitud(fila)` y `probarIaUltimoProlongado()`: la copia de PRUEBA BOT para una fila real, sin enviar nada. `IA_ESFUERZO` permite bajar el esfuerzo si la API tarda.
- 4 pruebas nuevas con la API simulada (modo PRUEBA y PRODUCCION, revisión de duración, fallas y declinación, seudonimización, IA apagada).

## [1.32.0] - 2026-11-22

### Cambiado (los mensajes en el grupo resultaban confusos; formato elegido por el referente)
- **Revisión de duración:** título sin días; paciente (HC, edad, servicio, cama); `📋` diagnóstico con su nombre; `⏱️ Lleva *15 d* de antibiótico; con esta orden llegaría a *29 d*`; una línea que dice **contra qué se compara el color** (`🔴 Más del doble de la duración de referencia para infección de piel y tejidos blandos (5-7 d)`); la lista de prescripciones **sin códigos CIE10**. Desaparece "N prescripciones seguidas · … · se sugiere revaluar".
- **Caso PROA:** un solo encabezado (`ENCABEZADOS_DESTACADOS` vacío: ya no sale `🚨CEFTAZIDIMA/AVIBACTAM🚨` además del título); cambio e interconsulta en una línea; la orden actual ya no se repite en la lista: `🔁 Antes de esta orden: …` y `⏱️ Con esta orden: *25 d* de antibiótico continuo`.
- **Por antimicrobiano** solo sale si algún antimicrobiano aparece en más de una prescripción (si no, repetía la lista), y sin "(con esta orden)".
- **Otros antimicrobianos del paciente:** los vigentes salen "en curso" (`🍄 Antifúngico en curso: ANFOTERICINA B LIPOSOMAL desde 18/11 (14 d)`) y los demás como "Ya terminados"; antes todos decían "Otros previos", aunque siguieran activos.
- **Aviso de frecuencia** (`CONFIG.FRECUENCIA_MINIMA_H = 4`): `⚠️ Verificar frecuencia de VANCOMICINA: c/3 h` cuando se digita una dosis cada menos de 4 h.
- Las renovaciones seguidas del mismo esquema se agrupan aunque el diagnóstico digitado cambie; el diagnóstico de cada prescripción se sigue usando para elegir la referencia de duración.

## [1.31.1] - 2026-11-16

### Corregido
- `crearTriggerFormSubmit()` borra primero los activadores de `notificarNuevaRespuesta` que ya existan en el proyecto y deja uno solo. En el proyecto en vivo había dos (uno sin ejecuciones): con dos activadores, cada formulario se procesa dos veces y el caso PROA llega duplicado.

## [1.31.0] - 2026-11-16

### Cambiado (decisión del referente)
- **La revisión de duración sale al llegar la solicitud**, como el caso PROA, en lugar de quedar pendiente para las 7:00 (`CONFIG.PROLONGADO_RESUMEN_DIARIO = false`). Siguen los filtros: sin verdes, un paciente como máximo cada 7 días, uno por día. En el registro queda `Enviado al grupo` = SI y `Destino` = PRODUCCION.
- El activador de las 7:00 ya no hace falta; si queda, solo envía lo que hubiera quedado pendiente de antes. Con `true` vuelve el envío diario.
- Con la matriz real (01/11–15/11): 12 revisiones en 15 días, una de ellas de noche (00:42).

## [1.30.0] - 2026-11-16

### Cambiado (decisión del referente)
- **Vancomicina y linezolid ya no generan la revisión de duración por sí solos** (`CONFIG.PROLONGADO_EXCLUIDOS`, `excluidoDeRevision()`). Si la orden trae otro antibiótico, la revisión sale por ese otro y la orden muestra los dos. Sus días se siguen contando en el tratamiento continuo y en la línea por antimicrobiano. Para volver a incluirlos, se quitan de la lista.
- Con la matriz real (01/11–15/11): 12 revisiones en lugar de 17.

## [1.29.4] - 2026-11-16

### Cambiado (rendimiento, tercera parte: la prueba de la fila 7603 seguía en 48 s)
- La matriz se abre **una vez por ejecución** (`libroProa()`): antes 16 funciones llamaban a `SpreadsheetApp.openById` por su cuenta, y cada apertura es una llamada a Google.
- `probarUltimaSolicitud()` y `probarUltimoProlongado()` escriben al final cuánto tardó cada parte (`Tiempos: abrir la matriz y leer la fila · restringidos · historia · revisión · caso PROA · registro (7 d)`), para ubicar con datos dónde se va el tiempo.

## [1.29.3] - 2026-11-16

### Corregido (rendimiento, segunda parte: `probarUltimaSolicitud(7603)` seguía en 37 s)
- `seguimientoPaciente()` leía de la hoja **cada fila** donde aparece la HC (hasta 40, incluso las que quedan fuera de los 60 días). Ahora hace dos lecturas en bloque: la columna de fechas del tramo donde está la HC y, después, solo las filas dentro de la ventana. El resultado es el mismo (la reproducción de 01/11–15/11 da los mismos 12 casos PROA y 17 revisiones).

## [1.29.2] - 2026-11-16

### Corregido (rendimiento: `probarUltimaSolicitud(7603)` tardaba 46-59 s)
- Las pestañas `PERTINENCIA_DURACION`, `RANGOS_DOSIS` y `ANTIMICROBIANOS_RESTRINGIDOS` se leían de la hoja en cada uso (la patología de cada prescripción volvía a leer la tabla de duración). Ahora se leen **una vez por ejecución** (`enCacheEjecucion()`): en la réplica de la fila 7638, de 18 lecturas a 3 por solicitud. Cada formulario es una ejecución nueva, así que un cambio en esas pestañas se ve en la siguiente solicitud; `crearHoja…`/`reescribirHoja…` limpian la caché.

## [1.29.1] - 2026-11-16

### Cambiado (pedido del referente)
- **Nombres sin la presentación del formulario:** `nombreLimpio()` corta en la primera palabra de presentación (ampolla, tableta, cápsula, vial, frasco…) o en el primer número: `CIPROFLOXACINO AMPOLLA 100, 200` → `CIPROFLOXACINO`, `CASPOFUNGINA 50, 70` → `CASPOFUNGINA`. `ANFOTERICINA B`, `POLIMIXINA B` y `CEFTAZIDIMA / AVIBACTAM` no cambian. Vale para todos los mensajes, la sugerencia y el ajuste renal.
- Como el nombre es el mismo, la ampolla y la tableta de un medicamento se suman juntas en la lista de prescripciones y en los días por antimicrobiano. La lista de restringidos y los rangos de dosis siguen funcionando, porque se buscan por nombre contenido.

## [1.29.0] - 2026-11-16

### Agregado (pedido del referente: sumar los días de cada antimicrobiano)
- Debajo de la lista de prescripciones, en el caso PROA y en la revisión de duración: `Por antimicrobiano: ERTAPENEM *52 d* (con esta orden) · MEROPENEM *14 d*` (`lineaPorAntimicrobiano()`). Cada antimicrobiano suma los días de las prescripciones en que estuvo más los de esta orden; primero los de esta orden y luego de mayor a menor.
- Son días de terapia por molécula (DOT): en una combinación cada uno cuenta sus días, así que la suma puede pasar el total de días de antibiótico continuo (que es la duración de la terapia, LOT).
- Revisiones con la matriz real: de 516 a 741 caracteres, máximo 11 líneas.

## [1.28.1] - 2026-11-16

### Cambiado
- `probarUltimaSolicitud()` y `probarUltimoProlongado()` escriben en el registro de ejecución, para cada mensaje, si se enviaría y cuándo (`▶ CASO PROA: se enviaría al grupo al llegar la solicitud`, `▶ REVISIÓN DE DURACIÓN: se enviaría al día siguiente, a las 7:00`, o `no se enviaría (motivo)`). La primera línea dice `PRUEBA (no se envió nada al grupo)`. Desaparece el separador "mensaje aparte", que se confundía con un segundo mensaje.

## [1.28.0] - 2026-11-16

### Cambiado (decisión del referente: "si el atb además de estar en el listado de restringidos presenta más de los 14 días; para los otros, solamente la revisión de tto")
- **El `🚨 CASO PROA` sale solo si el tratamiento continuo del restringido, contando los días de esta orden, supera 14 días** (`CONFIG.CASO_DIAS_MINIMOS = 14`; `diasCasoProa()`, `generaCasoProa()`). Una solicitud de restringido con 14 d o menos no genera mensaje y queda en el registro con el motivo ("no se envía: 7 d (caso PROA desde más de 14 d)"). Con 0 vuelve a salir en cada solicitud.
- **Los que no están en el listado** (o no disparan alerta, como vancomicina y linezolid) solo reciben la `📆 REVISIÓN DE DURACIÓN DE TTO` (3 o más prescripciones seguidas y más de 10 d). Una solicitud con restringido nunca recibe la revisión: va por el caso PROA.
- Ertapenem sigue en la lista con `dispara_alerta = SI` (se probó quitarlo y se revirtió en la pestaña antes de esta versión): la regla de 14 días lo filtra como a los demás.
- `probarUltimaSolicitud(fila)` dice si sale el caso PROA y, si no, cuántos días suma; `probarUltimaSolicitud()` busca la última que sí lo genera.
- Con la matriz real (01/11–15/11): **12 casos PROA** (antes 26) y 17 revisiones de duración, unos 2 mensajes al día.

## [1.27.0] - 2026-11-16

### Cambiado (pedido del referente)
- **Sin mensajes repetidos:** si la solicitud ya genera `🚨 CASO PROA` (restringido), la revisión de duración no se envía, porque el caso trae la misma lista de prescripciones con el total. Queda en el registro con `Destino` = "no se envía: la lista de prescripciones ya va en el caso PROA". La revisión sale para los antibióticos no restringidos (cefepime, piperacilina/tazobactam, meropenem…). `CONFIG.PROLONGADO_CON_CASO = true` la vuelve a enviar también con caso.
- La fecha de fin de la línea 💊 va **sin año** (`*7 d* hasta 22/11`), igual que la lista de prescripciones.
- `probarUltimaSolicitud(fila)` muestra la revisión solo si de verdad saldría (si no, dice por qué); `probarUltimoProlongado()` busca la última revisión que se enviaría.
- Con la matriz real (01/11–15/11): 17 revisiones en 11 días (3 no se envían por ir ya en el caso PROA y 4 por repetidas), de 426 a 562 caracteres y como máximo 10 líneas.

## [1.26.0] - 2026-11-16

### Cambiado (pedido del referente)
- Título: `*📆 REVISIÓN DE DURACIÓN DE TTO · 66 d de antibiótico*` (todo en negrita, días incluidos).
- Se quitan del mensaje la línea `📏` (referencia de la guía) y la `💡` (sugerencia). La línea 📏 se sigue guardando en `Detalle` de `REGISTRO_REVISIONES` para auditoría, y la comparación con la guía sigue decidiendo el color y el filtro de verdes.
- El mensaje queda en 6 líneas más una por prescripción.

## [1.25.0] - 2026-11-16

### Cambiado (nombre elegido por el referente para distinguirlo del caso PROA)
- La revisión de las 7:00 se llama **`📆 REVISIÓN DE DURACIÓN`** y lleva el total de días en el título: `*📆 REVISIÓN DE DURACIÓN · 66 d de antibiótico*` (o "de antifúngico"). Antes: `⏳ REVISIÓN PROA · Tratamiento prolongado`.
- La línea de resumen dice `5 prescripciones seguidas · lleva *59 d*, con esta orden *66 d*` (antes "solicitudes"). Las filas pendientes guardadas con el texto anterior salen con el título nuevo.
- Sin cambios en el criterio ni en los filtros. En el registro la fuente sigue siendo `TRATAMIENTO PROLONGADO`, y las funciones conservan su nombre (`probarUltimoProlongado()`, `enviarResumenProlongados()`), para no romper el activador ni las filas ya guardadas.

## [1.24.0] - 2026-11-16

### Eliminado (decisión del referente: el caso lo valora la infectóloga y el análisis automático generaba controversia)
- **Se retira la revisión por IA:** se borra `IA_PROA.gs` (llamada a la API de Anthropic, prompt, fichas leídas desde el repositorio, modo PRUEBA/PRODUCCION y envío a PRUEBA BOT). El bot no llama a ninguna API externa aparte de Green-API; una prueba lo verifica.
- `construirMensajeDesdeEvento(e, coincidencias)` ya no recibe un análisis externo; `registrarRevision()` deja vacías las columnas Modelo, Tokens y Costo (se conservan para no mover las demás).
- Sin cambios en los mensajes: el caso PROA ya iba solo con datos (v1.23.0) y la revisión por tratamiento prolongado nunca usó IA.
- `docs/antimicrobianos-restringidos.md` y `docs/microorganismos.md` quedan como referencia del equipo PROA.

## [1.23.0] - 2026-11-16

### Cambiado (decisión del referente: el caso PROA, solo con datos)
- **Sin análisis en el CASO PROA:** salen el veredicto (`🟡 Se sugiere verificar`) y el bloque de pertinencia (`🟢 indicado…`, `📏 referencia`, días frente a la referencia). La duración la muestran la lista de prescripciones con su total y la revisión por tratamiento prolongado de las 7:00. `CONFIG.CASO_ANALISIS = false`; con `true` vuelve todo como antes.
- **Sin modelo:** con `CASO_ANALISIS = false` no se llama a la API de Anthropic para el caso PROA (costo cero), aunque `ANTHROPIC_API_KEY` siga configurada.
- **Ubicación y diagnóstico primero**, bajo el título: `📍 Hospitalización General Adulto (Salud Mental) · Cama 7` y `📋 L031 · Celulitis de otras partes de los miembros`. La especialidad pasa a la línea de la HC (`📄 HC … · 62 años · 70 kg · Ortopedia`); el aislamiento abrevia "betalactamasa de amplio espectro" a `BLEE`.
- El análisis de las tablas se sigue calculando y guardando en `REGISTRO_REVISIONES` (semáforo y detalle), para auditoría del comité.
- Fila 7638: de 22 a 16 líneas (unos 820 caracteres con el pie).

## [1.22.0] - 2026-11-16

### Cambiado (pedido del referente: orden de las prescripciones y días en negrita)
- El caso PROA muestra el tratamiento continuo como **lista numerada en orden de prescripción**, igual que la revisión por tratamiento prolongado (`lineasPrescripciones()`, compartida por los dos mensajes):
  ```
  🔁 Antibiótico continuo, en orden de prescripción:
  1. ERTAPENEM 17/09-08/10 · *21 d* · L008
  2. MEROPENEM 08/10-17/10 · *9 d* · Bacteriemia / sepsis
  3. MEROPENEM 17/10-22/10 · *5 d* · Osteomielitis / espondilodiscitis
  4. ERTAPENEM 22/10-15/11 · *24 d* · Infección de piel y tejidos blandos
  5. ERTAPENEM 15/11-22/11 · *7 d* (esta orden)
  Total: *66 d* de antibiótico continuo
  ```
- **Días en negrita** en la lista, en la línea 💊 de cada antimicrobiano, en la línea de días de la pertinencia (`ERTAPENEM · *66 d* de antibiótico continuo`) y en la referencia de la revisión. El desglose `(21 + 14 + 24 + 7)` sale de esa línea porque ya está en la lista.
- La lista es por prescripción (una por día; las renovaciones seguidas del mismo esquema y patología van juntas, `2-3.`), con la patología cuando cambia. Desaparecen los tramos por marca temporal.
- Al modelo le llega la misma lista, sin asteriscos.
- El caso PROA de la fila 7638 pasa de 16 a 22 líneas (unos 1.200 caracteres).

## [1.21.1] - 2026-11-16

### Corregido (prueba con la fila 7638 en el proyecto en vivo)
- El **caso PROA y la revisión por tratamiento prolongado daban veredictos distintos** para los mismos 66 d: el caso comparaba con el diagnóstico actual (piel, 5-7 d → 🔴) y la revisión con la patología más larga del tratamiento (osteomielitis, 42 d → 🟡). Ahora el caso PROA usa la misma regla (`sindromeDeDuracion()`): si el tratamiento continuo pasó por otras patologías, la línea 📏 muestra la de mayor duración y dice "la más larga de sus patologías". Los antifúngicos se siguen comparando con el diagnóstico actual.
- La línea de días del caso PROA (tablas e IA) **muestra la suma de cada tramo**: `ERTAPENEM · 66 d de antibiótico continuo (21 + 14 + 24 + 7)`, los mismos tramos de la línea 🔁 más los días de esta orden. Antes decía `ERTAPENEM 66 d continuos`, que se leía como 66 días de ertapenem. `textoDiasContinuos()` y `asignarCursos()` son compartidas por `Codigo.gs` e `IA_PROA.gs`.
- **Dos órdenes el mismo día con antimicrobianos distintos** salían como combinación (`MEROPENEM + ERTAPENEM 17/09`): la posterior reemplaza a la anterior, como en la línea 🔁 del caso PROA. Si son del mismo formulario (varios antimicrobianos a la vez), se siguen sumando.

## [1.21.0] - 2026-11-16

### Cambiado (revisión por tratamiento prolongado, pedido del referente)
- **Un mensaje por paciente** en el envío de las 7:00, los rojos primero, para que WhatsApp no corte el mensaje con "Leer más". Cada revisión se marca como enviada por separado; la que falle queda pendiente para el día siguiente. Entre mensajes hay una pausa de 1,5 s para conservar el orden.
- **Días en negrita:** `5 solicitudes · lleva *21 d*, con esta orden *35 d* · se sugiere revaluar`.
- Más corto: sin subtítulo ni líneas en blanco; las **renovaciones seguidas** del mismo esquema y patología van en una línea (`2-3. CEFTAZIDIMA / AVIBACTAM 14/10-22/10 · 8 d`); la línea 📏 dice "la más larga de sus patologías" sin repetir las otras (ya están en la lista).
- Con la matriz real (01/11–15/11): 18 mensajes en 11 días (1-2 por día), de 575 a 745 caracteres con el pie y como máximo 12 líneas.

## [1.20.0] - 2026-11-16

### Cambiado (revisión por tratamiento prolongado: la patología cuenta)
- Cada solicitud de la lista muestra **su patología** (`1. PIPERACILINA / TAZOBACTAM · 16/10-24/10 · 8 d · Bacteriemia / sepsis`). En la matriz real, 16 de 24 revisiones cambiaban de diagnóstico dentro del mismo tratamiento.
- El total se compara con **la patología de mayor duración del tratamiento**, no solo con el diagnóstico de la orden actual, y se nombran las demás: `📏 Bacteriemia / sepsis: 7-14 d (...); la más larga de sus patologías (también Neumonía 5-7 d)`. Así una osteomielitis previa (42 d) no queda juzgada como celulitis (5-7 d). Con los datos de 01/11–15/11: verde/amarillo/rojo pasa de 0/12/12 a 1/8/15.

### Cambiado (contra el spam en el grupo, decisión del referente)
- **Resumen diario único:** la revisión ya no se envía al llegar la solicitud. Queda **PENDIENTE** en `REGISTRO_REVISIONES` y `enviarResumenProlongados()` la envía a las 7:00 en **un solo mensaje** con todos los pacientes del día, los rojos primero (`*⏳ REVISIÓN PROA · Tratamientos prolongados · 16/11*`). El activador se crea una vez con `crearTriggerResumenProlongados()`. Si el envío falla, quedan pendientes para el día siguiente.
- **Sin verdes:** si el total está dentro de la referencia de sus patologías, no se envía (`PROLONGADO_ENVIAR_VERDES = false`).
- **Sin repetir:** un paciente sale como máximo una vez cada 7 días (`PROLONGADO_REPETIR_DIAS`), según las revisiones enviadas o pendientes del registro.
- **Formato compacto:** por paciente, una línea con HC, edad, servicio, cama y CIE10; otra con solicitudes, días y veredicto; las solicitudes numeradas con fechas, días y patología (solo cuando cambia), y la referencia. La sugerencia va una sola vez al final.
- Las que no se envían también quedan en el registro, con el motivo en `Destino`.
- `probarResumenProlongados()` muestra el resumen pendiente sin enviarlo. Con `PROLONGADO_RESUMEN_DIARIO = false` la revisión sale de inmediato con el mismo formato.
- Reproducción con la matriz real (01/11–15/11): de 24 revisiones, 18 entran al resumen, 5 no se repiten y 1 es verde; el grupo recibe **11 resúmenes** (1-2 pacientes cada uno, máximo 1.533 caracteres) en lugar de 24 mensajes.

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
