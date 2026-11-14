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
⚠️ Espectro: CEFTAZIDIMA/AVIBACTAM sola no cubre metalo-betalactamasas (NDM, VIM, IMP): asociar aztreonam (IDSA 2024)
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
💊 Tratamiento (fichas PROA)
🟢 CEFTAZIDIMA / AVIBACTAM: pertinente · el aislamiento registrado está dentro de su indicación
📏 Días · Infección urinaria complicada / pielonefritis: referencia 5-7 d (IDSA 2025 ITU complicada; ACIN Infectio 2023)
🔴 CEFTAZIDIMA / AVIBACTAM 14 d: supera la referencia · hasta 10-14 d si hay absceso, obstrucción, prostatitis o respuesta lenta
```

Para qué está reservado cada antimicrobiano sale de `docs/antimicrobianos-restringidos.md` y está en `CONFIG.INDICACIONES` (aislamientos y focos que lo sustentan). El formulario no trae antibiograma: "pertinente" significa que el germen o el foco registrados corresponden a la indicación de la ficha, no que la sensibilidad esté confirmada. Sobre las solicitudes reales de abril-mayo y octubre de 2026 (60 alertas con la lista actual): 21 pertinente, 27 verificar, 12 intervenir.

## Duración de referencia por síndrome

Estado: **V** = verificada en esta revisión (2026-11-14) contra la guía o un resumen de ella; **G** = referencia general conocida, no contrastada en esta revisión: confirmar antes de darla por definitiva.

| Síndrome | CIE10 | Días | Nota | Fuente | Estado |
|---|---|---|---|---|---|
| Infección urinaria complicada / pielonefritis | N10, N12, N30, N39 | 5-7 | hasta 10-14 si absceso, obstrucción, prostatitis o respuesta lenta | [IDSA 2025](https://www.guidelinecentral.com/insights/july-2025-idsa-cuti-guideline-spotlight/); [ACIN, Infectio 2023](https://www.acin.org/images/guias/2025/Guia_Infeccion_urinaria_complicada_INFECTIO_2023.pdf) | V (el valor exacto para no fluoroquinolonas no se pudo leer en el texto original) |
| Bacteriemia / sepsis | A40, A41, A49, R57, R65 | 7-14 | 7 d con control del foco si no es *S. aureus* ni *Candida*; *S. aureus* mínimo 14 d | [BALANCE, NEJM 2025](https://www.thebottomline.org.uk/summaries/icm/balance-7-vs-14-days-of-antibiotics); Surviving Sepsis 2021 | V (BALANCE); G (SSC) |
| Neumonía | J12-J18, J22 | 5-7 | comunitaria 5 d con estabilidad clínica; nosocomial/ventilador 7 d | [ACIN NAC 2022](https://www.acin.org/images/guias/Guia_de_practica_clinica_para_el_manejo_de_la_neumonia_adquiri2022.pdf) y [GPC Infectio 2026](http://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0123-93922026000200185); ATS/IDSA 2019; [IDSA/ATS 2016](https://uspharmacist.com/article/updated-idsa-ats-guidelines-on-management-of-adults-with-hap-and-vap) | V |
| Empiema / absceso pulmonar | J85, J86 | 14-42 | según drenaje | BTS 2023 | G |
| Infección intraabdominal | K35-K37, K57, K63, K65, K80, K81, K83 | 4-7 | 4 d tras control adecuado del foco | [STOP-IT, NEJM 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4469182); SIS 2017; Tokyo 2018 | V (STOP-IT, SIS); G (Tokyo) |
| Piel y tejidos blandos | L01-L03, L08, A46 | 5-7 | extender solo si no hay mejoría | IDSA 2014 | G |
| Pie diabético | (texto) | 7-14 | osteomielitis 6 sem | IWGDF/IDSA 2023 | G |
| Osteomielitis / espondilodiscitis | M46, M86 | 28-42 | 6 semanas | IDSA 2015; [OVIVA](https://about.ebsco.com/clinical-decisions/dynamed-solutions/about/ebm-focus/patients-bone-and-joint-infections-consider) | V (secundaria) |
| Artritis séptica | M00 | 14-28 | tras drenaje | Gjika 2019 | G |
| Prótesis articular | T84 | 42-84 | 12 sem mejor que 6 con retención | DATIPO, NEJM 2021 | G |
| Endocarditis | I33, I38, I39 | 14-42 | según germen y válvula | ESC 2023 | G |
| Bacteriemia asociada a catéter | T82 | 5-14 | SCN 5-7 d con retiro; *S. aureus*/*Candida* ≥ 14 d | IDSA 2009 | V (secundaria) |
| Meningitis bacteriana | G00, G01, G03 | 7-21 | meningococo 5-7; neumococo 10-14; *Listeria* 21 | ESCMID 2016 | V parcial (las fuentes difieren en meningococo y neumococo) |
| Absceso cerebral | G06, G07 | 42-56 | 6-8 semanas IV | [ESCMID 2023](https://vbn.aau.dk/files/547507586/Bodilsen_Nielsen_2023_Early_switch_to_oral_antimicrobials_in_brain_abscess.pdf) | V |
| Candidemia | B37 | 14-21 | 14 d desde el primer hemocultivo negativo | [IDSA 2016](https://www.rightdecisions.scot.nhs.uk/antimicrobial-prescribing-nhs-lothian/body-systems/blood-stream-infections-and-endocarditis/candida-blood-stream-infection); ACIN | V |
| Criptococosis (inducción) | B45 | 1-14 | OMS 2022: dosis única de anfotericina liposomal | OMS 2022; IDSA 2010 | G |
| Histoplasmosis (inducción) | B39 | 7-14 | luego itraconazol | OPS 2020; IDSA 2007 | G |
| Aspergilosis invasiva | B44 | 42-84 | mínimo 6-12 sem | IDSA 2016 | G |
| Neutropenia febril | D70 | sin rango | hasta 48-72 h afebril y recuperación de neutrófilos | IDSA 2010; ECIL-4 | G (las fuentes difieren entre 48 y 72 h) |
| Sitio operatorio | T81 | sin rango | según profundidad | IDSA 2014 | G |
| Tuberculosis | A15-A19 | sin rango | no se evalúa | Programa nacional | — |
| Profilaxis quirúrgica | (indicación) | ≤ 1 | 48 h en cirugía cardiaca | [OMS 2018; CDC 2017; ASHP](https://www.aafp.org/pubs/afp/issues/2011/0301/p585.html) | V |

## Reglas de espectro (`CONFIG.REGLAS_ESPECTRO`)

| Antimicrobiano | Se avisa cuando | Base |
|---|---|---|
| Daptomicina | síndrome neumonía o empiema | Ficha técnica: el surfactante la inactiva |
| Tigeciclina | bacteriemia, neumonía o catéter | Advertencia FDA de mortalidad; niveles séricos bajos |
| Ertapenem | aislamiento *Pseudomonas*, *Acinetobacter* o *Enterococcus* | Ficha técnica |
| Aztreonam (único) | aislamiento grampositivo | Espectro |
| Caspofungina | *Cryptococcus*, mucorales o *Histoplasma* (aislamiento o síndrome) | Espectro de equinocandinas |
| Ceftazidima/avibactam (sin aztreonam) | aislamiento NDM / metalo-betalactamasa | IDSA 2024 |
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
