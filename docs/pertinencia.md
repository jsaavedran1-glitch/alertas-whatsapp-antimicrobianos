# Verificación de pertinencia: duración y espectro

Desde la versión 1.6.0 el bot PROA agrega al final de cada alerta un bloque de pertinencia. Es **apoyo a la revisión, no una decisión clínica**: marca lo que se sale de la referencia para que el farmacéutico y el comité lo miren. La tabla es una propuesta que **debe validar el comité PROA / Infectología del HDV**; se edita en la pestaña `PERTINENCIA_DURACION` sin tocar el código.

## Qué revisa

1. **Duración.** Ubica el síndrome por el código CIE10 (prefijo más largo) o, si el diagnóstico viene en texto libre (30 % de las solicitudes), por palabra clave. Muestra la duración de referencia y su fuente, y marca los antimicrobianos de la solicitud cuyos **días ordenados superan el máximo**. No marca cuando los días son menos que el mínimo (las órdenes se renuevan).
2. **Profilaxis.** Si la indicación es profiláctica y se ordenó más de 1 día, recuerda que la profilaxis quirúrgica no debe pasar de 24 h.
3. **Espectro.** Reglas fijas de antimicrobiano frente a síndrome o aislamiento (tabla de abajo).
4. **Coherencia.** Indicación "etiológica" sin microorganismo registrado.

Ejemplo:

```
📏 Duración de referencia · Infección urinaria complicada / pielonefritis: 5-7 días (IDSA 2025 ITU complicada; ACIN Infectio 2023)
⚠️ Superan la referencia: CEFTAZIDIMA / AVIBACTAM 14 d · hasta 10-14 d si hay absceso, obstrucción, prostatitis o respuesta lenta
⚠️ Espectro: CEFTAZIDIMA/AVIBACTAM sola no cubre metalo-betalactamasas (NDM, VIM, IMP): asociar aztreonam (IDSA 2026)
```

## Veredicto (desde 1.8.0)

El bloque abre con un veredicto global, que es el peor de los individuales:

| Color | Tratamiento | Días |
|---|---|---|
| 🟢 pertinente | el aislamiento está entre los que justifican el antimicrobiano según su ficha, o no hay aislamiento y el foco está dentro de su indicación | dentro de la referencia |
| 🟡 verificar | el aislamiento no está entre los que lo justifican; sin aislamiento ni foco que lo sustente; restringido en profilaxis; etiológico sin germen | supera la referencia |
| 🔴 intervenir | una regla de espectro lo descarta (p. ej. daptomicina en neumonía) | el doble o más de la referencia; profilaxis de más de 24 h |

```
🔴 *Pertinencia PROA: intervenir*
🟢 CEFTAZIDIMA / AVIBACTAM: pertinente · el aislamiento registrado está dentro de su indicación
📏 Días · Infección urinaria complicada / pielonefritis: referencia 5-7 d (IDSA 2025 ITU complicada; ACIN Infectio 2023)
🔴 CEFTAZIDIMA / AVIBACTAM 14 d: supera la referencia · hasta 10-14 d si hay absceso, obstrucción, prostatitis o respuesta lenta
```

Para qué está reservado cada antimicrobiano sale de `docs/antimicrobianos-restringidos.md` y está en `CONFIG.INDICACIONES` (aislamientos y focos que lo sustentan). El formulario no trae antibiograma: "pertinente" significa que el germen o el foco registrados corresponden a la indicación de la ficha, no que la sensibilidad esté confirmada. Sobre las solicitudes reales de abril-mayo y octubre de 2026 (60 alertas con la lista actual): 21 pertinente, 27 verificar, 12 intervenir.

## Duración de referencia por síndrome

Estado: **V** = verificada el 2026-11-14 contra la guía o un resumen de ella ("resumen" = fuente secundaria, no el texto original); **G** = referencia general conocida, no contrastada en esta revisión: confirmar antes de darla por definitiva.

| Síndrome | CIE10 | Días | Nota | Fuente | Estado |
|---|---|---|---|---|---|
| Infección urinaria complicada / pielonefritis | N10, N12, N30, N39 | 5-7 | 5-7 d con fluoroquinolona o 7 d con otro antibiótico si hay mejoría clínica; 7 d también con bacteriemia de foco urinario; 10-14 d si se sospecha prostatitis; individualizar con absceso, obstrucción o sonda | [IDSA 2025](https://www.idsociety.org/practice-guideline/complicated-urinary-tract-infections/); [ACIN, Infectio 2023](https://www.acin.org/images/guias/2025/Guia_Infeccion_urinaria_complicada_INFECTIO_2023.pdf) | V (texto de la guía IDSA) |
| Bacteriemia / sepsis | A40, A41, A49, R57, R65 | 7-14 | 7 d con control del foco si no es *S. aureus* ni *Candida*; *S. aureus* mínimo 14 d | [BALANCE, NEJM 2025](https://www.thebottomline.org.uk/summaries/icm/balance-7-vs-14-days-of-antibiotics); [Surviving Sepsis 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8486643/): cursos cortos y revaluación diaria, sin número fijo de días | V (BALANCE por resumen; SSC por resumen del texto) |
| Neumonía | J12-J18, J22 | 5-7 | comunitaria: mínimo 5 d y hasta la estabilidad clínica; 7 d si es por SARM o *Pseudomonas*; nosocomial o asociada a ventilador: 7 d | [ATS/IDSA 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6812437/); [IDSA/ATS 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4981759/); [ACIN NAC 2022](https://www.acin.org/images/guias/Guia_de_practica_clinica_para_el_manejo_de_la_neumonia_adquiri2022.pdf) | V (resumen del texto de las guías) |
| Empiema / absceso pulmonar | J85, J86 | 14-42 | 2-3 semanas pueden bastar con drenaje y buena evolución | [Ensayo SLIM](https://pmc.ncbi.nlm.nih.gov/articles/PMC10086695); BTS 2023 | V (SLIM); el texto de BTS 2023 no se pudo abrir |
| Infección intraabdominal | K35-K37, K57, K63, K65, K80, K81, K83 | 4-7 | 4 d completos tras el control del foco dieron el mismo resultado que 8 d (21,8 % frente a 22,3 % de complicaciones) | [STOP-IT, NEJM 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4469182/); SIS 2017 | V (texto de STOP-IT); la duración de SIS 2017 y de Tokyo 2018 (colangitis) no se pudo leer |
| Piel y tejidos blandos | L01-L03, L08, A46 | 5-7 | 5 d en celulitis no complicada; extender solo si no hay mejoría | [IDSA 2014](https://mdedge.com/content/infectious-diseases-society-america-2014-practice-guidelines-diagnose-manage-skin-soft) | V (resumen) |
| Pie diabético | (texto) | 7-14 | partes blandas 1-2 sem; osteomielitis 6 sem sin resección, hasta 3 tras amputación menor con margen positivo | [IWGDF/IDSA 2023](https://www.guidelinecentral.com/guideline/3279835/) | V (resumen) |
| Osteomielitis / espondilodiscitis | M46, M86 | 42 | 6 semanas en total, parenteral u oral de alta biodisponibilidad (3 meses si es *Brucella*) | [IDSA 2015](https://academic.oup.com/cid/article/61/6/e26/452579); OVIVA | V (texto de la guía) |
| Artritis séptica | M00 | 14-28 | 2 semanas no fueron inferiores a 4 tras el drenaje, pero 99 de 154 casos eran de mano y muñeca; en articulaciones grandes, 4 semanas o más | [Gjika, Ann Rheum Dis 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6691865/) | V (resumen del artículo); la aplicación a rodilla o cadera la define Infectología |
| Prótesis articular | T84 | 42-84 | 6 sem no fueron no inferiores a 12 (18,1 % frente a 9,4 % de infección persistente) | [DATIPO, NEJM 2021](https://pubmed.ncbi.nlm.nih.gov/34042388/) | V |
| Endocarditis | I33, I38, I39 | 14-42 | válvula nativa 2-6 sem; protésica 6 sem o más, desde el primer hemocultivo negativo | [ESC 2023](https://www.acc.org/Latest-in-Cardiology/ten-points-to-remember/2023/08/29/20/49/2023-esc-guidelines-for-endocarditis-esc-2023) | V (resumen) |
| Bacteriemia asociada a catéter | T82 | 5-14 | con retiro del catéter: SCN 5-7 d, enterococo y gramnegativos 7-14 d, *S. aureus* ≥ 14 d; 4-6 sem si persiste más de 72 h; el día 1 es el del primer hemocultivo negativo | [IDSA 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC4039170/) | V (texto y resumen del texto) |
| Meningitis bacteriana | G00, G01, G03 | 7-21 | meningococo 5-7; neumococo 10-14; *Listeria* 21 | ESCMID 2016 | G: el texto de la guía no se pudo abrir; validar con Infectología |
| Absceso cerebral | G06, G07 | 42-56 | 6-8 semanas IV | [ESCMID 2023](https://vbn.aau.dk/files/547507586/Bodilsen_Nielsen_2023_Early_switch_to_oral_antimicrobials_in_brain_abscess.pdf) | V |
| Candidemia | B37 | 14-21 | 2 semanas después del primer hemocultivo negativo y de la resolución de los síntomas | [IDSA 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4725385/) | V (texto de la guía) |
| Criptococosis (inducción) | B45 | 1-14 | dosis única de anfotericina B liposomal 10 mg/kg más 14 d de flucitosina y fluconazol | [OMS 2022](https://www.who.int/news/item/20-04-2022-rapid-advice-new-guidelines-for-simpler-safer-treatment-for-cryptococcal-disease-in-plhiv) | V |
| Histoplasmosis (inducción) | B39 | 14 | anfotericina B liposomal 3 mg/kg por 2 semanas y luego itraconazol 12 meses | [OPS/OMS 2020](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7918769/) | V (texto) |
| Aspergilosis invasiva | B44 | 42-84 | mínimo 6-12 sem según inmunosupresión y respuesta | [IDSA 2016](https://guidelinecentral.com/guideline/21923) | V (resumen) |
| Neutropenia febril | D70 | sin rango | sin foco: suspender tras 72 h o más si lleva 48 h afebril y estable, sin esperar neutrófilos | [ECIL-4](https://haematologica.org/article/view/6857) | V (resumen) |
| Sitio operatorio | T81 | sin rango | abrir y drenar; antibiótico en curso breve solo si hay respuesta sistémica importante | [IDSA 2014](https://academic.oup.com/cid/article/59/2/e10/2895845) | V (resumen del texto) |
| Tuberculosis | A15-A19 | sin rango | no se evalúa | Programa nacional | — |
| Profilaxis quirúrgica | (indicación) | ≤ 1 | 48 h en cirugía cardiaca | [OMS 2018; CDC 2017; ASHP](https://www.aafp.org/pubs/afp/issues/2011/0301/p585.html) | V |

## Reglas adicionales (desde 1.11.0)

- **Curso completo.** Si el paciente ya tenía órdenes del mismo antimicrobiano (seguimiento por historia clínica), los días se comparan sobre el curso completo: `ERTAPENEM 7 d (20 d acumulados desde 01/11)`.
- **Antifúngico en foco bacteriano.** La duración de un foco bacteriano (ITU, neumonía...) no se aplica a caspofungina ni anfotericina: la línea sale en ⚪.
- **Candida solo en urocultivo.** Con antifúngico, *Candida* o levaduras y cultivo de orina sin hemocultivo: "se sugiere verificar" (la candiduria asintomática no se trata, [IDSA 2016](https://pubmed.ncbi.nlm.nih.gov/26679628/); el CDC no recomienda tratar *C. auris* de sitios no invasivos sin infección). La guía IDSA 2016 indica que las equinocandinas no alcanzan nivel terapéutico en orina (leído en el resumen del texto); con caspofungina el mensaje lo menciona.
- **Caspofungina 70 mg por más de un día** en paciente de 80 kg o menos y sin rifampicina: aviso de dosis (carga 70 mg el día 1, luego 50 mg/día; 70 mg/día en > 80 kg según ficha europea o con rifampicina según ficha de EE. UU.).

## Reglas de espectro (`CONFIG.REGLAS_ESPECTRO`)

| Antimicrobiano | Se avisa cuando | Base |
|---|---|---|
| Daptomicina | síndrome neumonía o empiema | Ficha técnica ("no está indicada para el tratamiento de la neumonía"); IDSA/ATS 2016 |
| Tigeciclina | bacteriemia, neumonía, catéter o ITU | Ficha técnica (recuadro de mortalidad; no indicada en neumonía nosocomial); IDSA 2026 (no se sugiere en ITU ni bacteriemia por enterobacterias resistentes a carbapenémicos) |
| Ertapenem | aislamiento *Pseudomonas*, *Acinetobacter* o *Enterococcus* | Ficha técnica |
| Aztreonam (único) | aislamiento grampositivo | Espectro |
| Caspofungina | *Cryptococcus*, mucorales o *Histoplasma* (aislamiento o síndrome) | Espectro de equinocandinas |
| Ceftazidima/avibactam (sin aztreonam) | aislamiento NDM / metalo-betalactamasa | IDSA 2026 (de elección aztreonam/avibactam o cefiderocol; ceftazidima/avibactam más aztreonam si no hay) |
| Polimixina B | *Proteus*, *Serratia*, *Morganella*, *Providencia*, *Burkholderia* | Resistencia intrínseca |
| Vancomicina, linezolid, daptomicina (únicos) | aislamiento gramnegativo | Espectro |
| Rifampicina (única, no TB) | siempre | Resistencia en monoterapia |

## Réplica sobre solicitudes reales (sin enviar nada)

Con la lista de restringidos anterior (que incluía vancomicina), sobre 279 alertas de abril-mayo y octubre de 2026: 152 (54 %) tuvieron duración de referencia; de ellas 57 superaban el máximo (sobre todo 10-14 d en piel y tejidos blandos, neumonía e ITU, y 21 d en sepsis). Las reglas de espectro marcaron 7 casos, entre ellos una ceftazidima/avibactam sola frente a un aislamiento "KPC + NDM". 9 indicaciones "etiológicas" no tenían microorganismo.

## Límites

- El diagnóstico del formulario es un solo campo: no distingue complicada/no complicada, foco controlado ni germen; por eso los rangos son amplios y la nota aclara las excepciones.
- "Días ordenados" es la orden actual, no el acumulado del paciente: una orden de 7 d que renueva otra de 7 no se detecta (requeriría el seguimiento por historia clínica, pendiente).
- El aislamiento es texto libre; las reglas de espectro dependen de cómo se escriba.
- No evalúa la elección empírica según epidemiología local ni antibiograma: eso sigue siendo criterio de Infectología.
