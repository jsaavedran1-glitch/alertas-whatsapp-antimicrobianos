# Antimicrobianos restringidos PROA-HDV: fichas de referencia

Fichas de las 13 moléculas que vigilaba el bot PROA ALERTAS al 2026-10-30 (pestaña `ANTIMICROBIANOS_RESTRINGIDOS`). **Desde el 2026-11-02 vancomicina y linezolid no disparan alerta por sí solas** (decisión del Servicio Farmacéutico), aunque siguen siendo restringidas y se muestran con su dosis evaluada cuando otro antimicrobiano de la solicitud dispara la alerta; sus filas siguen en `RANGOS_DOSIS`. Preparadas el 2026-10-30 para sustentar los rangos de la pestaña `RANGOS_DOSIS` y la línea `⚠️ Dosis fuera del rango de referencia` del mensaje.

**Cómo leerlas.** Cada ficha trae la dosis autorizada por administración (que es lo que evalúa el bot: el formulario registra dosis, vía, frecuencia y días por separado), la regla que usa el bot, qué parte está verificada contra una fuente primaria y qué no. Los rangos del bot son deliberadamente amplios: su función es marcar valores atípicos para que el farmacéutico revise, no definir la dosis correcta. **La validación clínica final es del QF del Servicio Farmacéutico**; estas fichas son su insumo, no su reemplazo.

**Fuentes.** Fichas técnicas FDA (DailyMed / Drugs@FDA) y EMA (EPAR/SmPC), consenso ASHP/IDSA/PIDS/SIDP 2020 de vancomicina, consenso internacional de polimixinas 2019, guía IDSA 2026 de gramnegativos resistentes (reemplaza la de 2024), protocolo ACIN de candidiasis sistémica, Manual MSD versión para profesionales (contraste en español) y la guía OPS/OMS 2024 *Intervenciones para la optimización del uso de antimicrobianos* (criterios PROA, no dosis). Lo que se marca como "no verificado" proviene de conocimiento general y debe confirmarse en la ficha INVIMA del producto que compra el HDV o en la guía OPS *Tratamiento de las enfermedades infecciosas 2024-2026*.

**Clasificación AWaRe.** Verificada el 2026-11-14 en el [portal AWaRe de la OMS](https://aware.essentialmeds.org/list): Reserve para aztreonam, ceftazidima/avibactam, daptomicina, linezolid, tigeciclina y polimixina B; Watch para ertapenem, doripenem, vancomicina y rifampicina (las seis primeras de esta lista, en el texto de la página; las demás, por el resumen de la página). Los antifúngicos no tienen categoría AWaRe.

## Resumen

| Molécula | Clase · AWaRe | Dosis adulto habitual | Pediatría | Ajuste renal | Regla del bot (por dosis) | Verificación |
|---|---|---|---|---|---|---|
| Vancomicina | Glucopéptido · Watch | Carga 20–35 mg/kg (máx. 3 g); mantenimiento 15–20 mg/kg c/8–12 h guiado por AUC 400–600 | Igual por AUC; meningitis 15 mg/kg c/6 h; neonatos carga 20 mg/kg | Sí (intervalo) | 10–35 mg/kg | Consenso 2020, MSD |
| Linezolid | Oxazolidinona · Reserve | 600 mg c/12 h IV/VO | < 12 años: 10 mg/kg c/8 h | No | 600 mg **o** 8–12 mg/kg | Ficha FDA |
| Daptomicina | Lipopéptido · Reserve | 4 mg/kg/día (piel) · 6 mg/kg/día (bacteriemia); 8–12 mg/kg en guías para bacteriemia complicada | 5–12 mg/kg/día según edad | Sí (c/48 h si DepCr < 30) | 4–12 mg/kg | Ficha FDA/EMA |
| Caspofungina | Equinocandina · — | 70 mg carga, luego 50 mg/día (70 mg/día si > 80 kg o con rifampicina) | 70 mg/m² carga, 50 mg/m²/día, máx. 70 mg | No (hepático: 35 mg en Child-Pugh B) | 35–70 mg **o** 1–4 mg/kg | Ficha FDA/EMA, ACIN |
| Anfotericina B deoxicolato | Poliénico · — | Inicio 0,25 mg/kg/día; habitual 0,5–1 mg/kg/día; nunca > 1,5 mg/kg | Igual | Nefrotóxica (vigilar) | 0,25–1,5 mg/kg | Ficha FDA |
| Anfotericina B liposomal | Poliénico · — | 3–5 mg/kg/día (6 en criptococo; hasta 10 en mucormicosis) | Igual | Menos nefrotóxica | 3–10 mg/kg | Ficha FDA, ACIN |
| Ertapenem | Carbapenémico · Watch | 1 g c/24 h | 3 m–12 a: 15 mg/kg c/12 h (máx. 1 g/día) | 500 mg/día si DepCr ≤ 30 | 500–1000 mg **o** 10–20 mg/kg | Ficha FDA |
| Aztreonam | Monobactámico · Reserve | 1–2 g c/8–12 h; grave 2 g c/6–8 h (máx. 8 g/día) | 30 mg/kg c/6–8 h (máx. 120 mg/kg/día) | Mitad de dosis si DepCr 10–30 | 500–2000 mg **o** 20–50 mg/kg | Ficha FDA |
| Ceftazidima/avibactam | Cefalosporina + inhibidor · Reserve | 2,5 g c/8 h en infusión de 2–3 h | ≥ 2 años: 62,5 mg/kg (máx. 2,5 g) c/8 h | 1,25 g c/8 h (DepCr 31–50); 0,94 g c/12–48 h (≤ 30) | 940–2500 mg **o** 30–65 mg/kg | Ficha FDA, IDSA 2026, ACIN |
| Tigeciclina | Glicilciclina · Reserve | 100 mg carga, luego 50 mg c/12 h | 8–11 a: 1,2 mg/kg c/12 h (máx. 50 mg); ≥ 12 a: 50 mg c/12 h | No (hepático: 25 mg c/12 h en Child-Pugh C) | 25–100 mg **o** 1–2,5 mg/kg | Ficha FDA/EMA |
| Doripenem | Carbapenémico · Watch | 500 mg c/8 h | No autorizado | 250 mg c/8 h (DepCr 30–50); 250 mg c/12 h (10–30) | 250–1000 mg | Ficha FDA 2009 (no en DailyMed actual) |
| Rifampicina | Rifamicina · Watch | 600 mg/día (10 mg/kg); en infección protésica 600–900 mg/día como adyuvante | 10–20 mg/kg/día, máx. 600 mg | No | 300–900 mg **o** 10–20 mg/kg | Ficha FDA, MSD |
| Polimixina B | Polipéptido · Reserve | Carga 2–2,5 mg/kg (20.000–25.000 UI/kg); 1,25–1,5 mg/kg c/12 h | Ficha: 15.000–25.000 UI/kg/día | No (consenso 2019) | **Sin regla** (el formulario no distingue mg de UI) | Consenso 2019, ficha |

Regla del bot: la dosis se acepta si cumple **cualquiera** de las dos reglas (mg/kg o mg absolutos); solo se marca si falla en todas. Sin peso no se evalúa mg/kg. La columna `ajuste_renal` (SI/NO) de la pestaña sale de la ficha técnica y del MSD profesional; el bot la usa para avisar cuando se marca ajuste renal en una molécula que no lo requiere. Esta tabla es la que carga `CONFIG.RANGOS_DOSIS_RESPALDO` (v1.3.0).

## Uso en el HDV (muestras de la matriz)

| Molécula | 11–30 oct 2026 (148 alertas) | 22 abr–14 may 2026 (131 alertas) |
|---|---|---|
| Vancomicina | 111 | 76 |
| Linezolid | 13 | 23 |
| Caspofungina | 10 | 6 |
| Ceftazidima/avibactam | 7 | 5 |
| Ertapenem | 4 | 12 |
| Aztreonam | 3 | 2 |
| Anfotericina B (deoxicolato) | 3 | 1 |
| Anfotericina B liposomal | 2 | 0 |
| Tigeciclina | 0 | 5 |
| Daptomicina | 0 | 4 |
| Doripenem, rifampicina, polimixina B | 0 | 0 |

Vancomicina concentra el 73 % de las alertas de octubre; en esa muestra el 67 % de las solicitudes restringidas no tenía interconsulta a Infectología y el 82 % era tratamiento empírico. Los acompañantes más frecuentes fueron cefepime (28), meropenem (25) y ceftriaxona (10). De 153 esquemas restringidos, 16 (11 %) quedarían marcados por el bot con los rangos actuales: vancomicina 500 mg en adultos de 51–70 kg, 100 mg en 75 kg, 1.000 mg con peso "1 kg" y 2.000 mg con peso 2,2 kg (errores de digitación evidentes).

---

## Fichas

### 1. Vancomicina

- **Clase / AWaRe:** glucopéptido · Watch.
- **Para qué se usa:** grampositivos resistentes, en especial *S. aureus* resistente a meticilina (SARM), *Enterococcus* sensible, infecciones de piel, bacteriemia, endocarditis, meningitis y osteomielitis. VO solo para *C. difficile*.
- **Dosis adulto:** el consenso ASHP/IDSA/PIDS/SIDP 2020 recomienda dosificar para **AUC/MIC 400–600** (MIC = 1 mg/L) y mantener AUC < 800 para reducir lesión renal; carga de 20–35 mg/kg (máx. 3 g) en pacientes graves, 20–25 mg/kg en obesos; mantenimiento 15–20 mg/kg c/8–12 h ajustado por niveles. El MSD (meningitis) da 10–15 mg/kg c/8 h en adultos.
- **Pediatría:** mismo objetivo de AUC; meningitis 15 mg/kg c/6 h; neonatos carga 20 mg/kg e intervalo c/12–48 h según creatinina y edad gestacional (tabla MSD). Los niños rara vez requieren > 3 g/día.
- **Ajuste:** renal, por intervalo y niveles.
- **Monitoreo:** AUC (o valle si no hay AUC), creatinina; nefrotoxicidad y ototoxicidad; "síndrome del hombre rojo" por infusión rápida.
- **Por qué está restringida:** presión de selección sobre enterococos (VRE) y *S. aureus* con sensibilidad disminuida; uso empírico masivo sin aislamiento.
- **Regla del bot:** 10–35 mg/kg/dosis. Una dosis de 500 mg en un adulto de 60–70 kg (7–8 mg/kg) se marca a propósito: puede ser un ajuste renal correcto o una subdosis, y en ambos casos vale la revisión.
- **Fuentes:** Rybak MJ et al., *Am J Health-Syst Pharm* 2020;77:835-864 ([AJHP](https://academic.oup.com/ajhp/article/77/11/835/5810200)); MSD profesional [vancomicina](https://www.msdmanuals.com/es/professional/enfermedades-infecciosas/bacterias-y-f%C3%A1rmacos-antibacterianos/vancomicina), [tabla meningitis](https://www.msdmanuals.com/es/professional/multimedia/table/dosificaciones-de-antibi%C3%B3ticos-iv-comunes-para-las-meningitis-bacterianas-agudas), [tabla neonatos](https://www.msdmanuals.com/es/professional/multimedia/table/dosis-de-vancomicina-para-neonatos).

### 2. Linezolid

- **Clase / AWaRe:** oxazolidinona · Reserve.
- **Para qué se usa:** SARM (incluida neumonía, donde daptomicina no sirve), VRE, infecciones de piel complicadas; alternativa oral a vancomicina.
- **Dosis adulto:** 600 mg c/12 h IV o VO (misma dosis por ambas vías; biodisponibilidad ~100 %).
- **Pediatría:** < 12 años 10 mg/kg c/8 h; ≥ 12 años 600 mg c/12 h; prematuros < 7 días 10 mg/kg c/12 h.
- **Ajuste:** no renal ni hepático.
- **Monitoreo:** hemograma semanal si > 2 semanas (mielosupresión reversible ~3 %), síndrome serotoninérgico con ISRS/tramadol (inhibidor reversible no selectivo de MAO), neuropatía y acidosis láctica en cursos largos.
- **Por qué está restringida:** antibiótico de reserva para grampositivos multirresistentes; el uso prolongado selecciona resistencia en enterococos y estafilococos.
- **Regla del bot:** 600 mg **o** 8–12 mg/kg. Así un adulto de 100 kg con 600 mg (6 mg/kg) no se marca, y un niño con 10 mg/kg tampoco.
- **Fuentes:** [Zyvox, ficha FDA 2024](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/021130s046,021131s044,021132s046lbl.pdf); MSD profesional [linezolida y tedizolida](https://www.msdmanuals.com/es/professional/enfermedades-infecciosas/bacterias-y-f%C3%A1rmacos-antibacterianos/linezolida-y-tedizolida).

### 3. Daptomicina

- **Clase / AWaRe:** lipopéptido cíclico · Reserve.
- **Para qué se usa:** bacteriemia y endocarditis derecha por *S. aureus* (incluido SARM), infecciones de piel complicadas, VRE (fuera de ficha). **No sirve en neumonía**: el surfactante la inactiva.
- **Dosis adulto:** 4 mg/kg c/24 h (piel) y 6 mg/kg c/24 h (bacteriemia) según ficha; 8–12 mg/kg/día en guías para bacteriemia complicada o VRE (uso fuera de ficha, frecuente).
- **Pediatría (1–17 años):** FDA por edad: 12–17 a 5 mg/kg; 7–11 a 7 mg/kg; 2–6 a 9 mg/kg; 1–< 2 a 10 mg/kg (piel). EMA: 5–10 mg/kg (piel) y 7–12 mg/kg (bacteriemia).
- **Ajuste:** DepCr < 30 mL/min o diálisis: misma dosis c/48 h.
- **Monitoreo:** CPK semanal (miopatía), más con estatinas; neumonía eosinofílica.
- **Por qué está restringida:** reserva para SARM/VRE, costo alto, resistencia emergente con exposición previa a vancomicina.
- **Regla del bot:** 4–12 mg/kg/dosis.
- **Fuentes:** [Cubicin, ficha FDA 2018](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/021572s061lbl.pdf); [revisión farmacología clínica pediátrica FDA](https://www.accessdata.fda.gov/drugsatfda_docs/pediatric/95_21572s055-daptomycin-clinpharm-prea.pdf); [EMA Cubicin](https://www.ema.europa.eu/en/medicines/human/EPAR/cubicin); MSD profesional [daptomicina](https://www.msdmanuals.com/es/professional/enfermedades-infecciosas/bacterias-y-f%C3%A1rmacos-antibacterianos/daptomicina).

### 4. Caspofungina

- **Clase / AWaRe:** equinocandina · sin categoría AWaRe.
- **Para qué se usa:** candidemia y candidiasis invasiva (primera línea en paciente grave o con exposición previa a azoles), aspergilosis refractaria, terapia empírica en neutropenia febril. Sin actividad frente a *Cryptococcus* ni mucorales.
- **Dosis adulto:** 70 mg el día 1, luego 50 mg/día; 70 mg/día si pesa > 80 kg, si hay respuesta insuficiente o con inductores (rifampicina, fenitoína, carbamazepina, dexametasona, efavirenz, nevirapina).
- **Pediatría (3 m–17 a):** 70 mg/m² carga, 50 mg/m²/día, máx. 70 mg/día. En un lactante de 7,5 kg eso son ~27 mg de carga (≈ 3,5 mg/kg).
- **Ajuste:** no renal; insuficiencia hepática moderada (Child-Pugh 7–9): 35 mg/día tras la carga; no usar en falla hepática grave.
- **Monitoreo:** enzimas hepáticas; interacciones (ciclosporina, tacrolimus, rifampicina).
- **Por qué está restringida:** antifúngico de alto costo y de reserva; su uso empírico prolongado sin cultivo es un objetivo clásico de PROA.
- **Regla del bot:** 35–70 mg **o** 1–4 mg/kg (la regla mg/kg existe solo para que pediatría no marque; es una aproximación del m²).
- **Fuentes:** [Cancidas, DailyMed](https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=3bad23a6-09a6-4194-9182-093ed61bc71c); [SmPC caspofungina 70 mg (emc)](https://www.medicines.org.uk/emc/product/2335/smpc); ACIN, [Protocolo de candidiasis sistémica en adultos, *Infectio*](https://www.sciencedirect.com/science/article/pii/S0123939212700371).

### 5. Anfotericina B deoxicolato (convencional)

- **Clase / AWaRe:** poliénico · sin categoría AWaRe.
- **Para qué se usa:** micosis invasivas graves (candidiasis, criptococosis, histoplasmosis, mucormicosis) y leishmaniasis visceral cuando no hay formulación lipídica.
- **Dosis adulto:** inicio 0,25 mg/kg/día; habitual 0,5–1 mg/kg/día; la ficha prohíbe superar 1,5 mg/kg/día (riesgo de paro cardiorrespiratorio por sobredosis). Infusión en 2–6 h.
- **Pediatría:** mismas dosis por kg.
- **Ajuste:** no formal, pero nefrotoxicidad dependiente de dosis acumulada; hidratación con solución salina.
- **Monitoreo:** creatinina, potasio y magnesio (hipopotasemia marcada), hemograma; reacciones infusionales (fiebre, escalofríos); premedicación.
- **Por qué está restringida:** toxicidad y necesidad de decisión entre convencional y liposomal.
- **Regla del bot:** 0,25–1,5 mg/kg/dosis. Una dosis de 120 mg en 70 kg (1,7 mg/kg) se marca; si en realidad era liposomal, el error está en el formulario y también vale revisarlo.
- **Fuentes:** [ficha FDA anfotericina B para inyección](https://dailymed.nlm.nih.gov/dailymed/getFile.cfm?amp=&setid=a0a54943-9ce4-4f3e-b681-a1a9144c16ce&type=pdf); ACIN, protocolo de candidiasis (arriba); MSD profesional [medicamentos antimicóticos](https://www.msdmanuals.com/es/professional/enfermedades-infecciosas/infecciones-mic%C3%B3ticas/medicamentos-antimic%C3%B3ticos).

### 6. Anfotericina B liposomal

- **Clase / AWaRe:** poliénico en liposomas · sin categoría AWaRe.
- **Para qué se usa:** las mismas indicaciones que la convencional con menos nefrotoxicidad y reacciones infusionales; de elección en mucormicosis, criptococosis en VIH (con flucitosina), leishmaniasis visceral y neutropenia febril.
- **Dosis adulto:** 3–5 mg/kg/día (terapia empírica 3 mg/kg; micosis sistémicas 3–5 mg/kg; meningitis criptocócica 6 mg/kg); hasta 10 mg/kg/día en mucormicosis. En ensayos se han dado hasta 10 mg/kg (niños) y 15 mg/kg (adultos). **No es intercambiable mg a mg** con la convencional.
- **Pediatría:** mismas dosis por kg.
- **Ajuste:** no formal; menos nefrotóxica.
- **Monitoreo:** creatinina, potasio, magnesio; reacciones infusionales menos frecuentes.
- **Por qué está restringida:** costo muy alto; PROA revisa que la indicación justifique la formulación lipídica.
- **Regla del bot:** 3–10 mg/kg/dosis. Una dosis de 120 mg en 70 kg (1,7 mg/kg) se marca por baja.
- **Fuentes:** [AmBisome, ficha FDA 2024](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/050740Orig1s037Lbl.pdf); ACIN, protocolo de candidiasis (3–5 mg/kg/día).

### 7. Ertapenem

- **Clase / AWaRe:** carbapenémico del grupo 1 · Watch.
- **Para qué se usa:** infecciones intraabdominales, pélvicas, urinarias y de pie diabético por enterobacterias productoras de BLEE; profilaxis en cirugía colorrectal. **No cubre** *Pseudomonas*, *Acinetobacter* ni *Enterococcus*: no sirve para infección nosocomial grave en UCI.
- **Dosis adulto (≥ 13 años):** 1 g c/24 h IV o IM.
- **Pediatría (3 m–12 a):** 15 mg/kg c/12 h, máx. 1 g/día.
- **Ajuste:** DepCr ≤ 30 mL/min: 500 mg c/24 h.
- **Monitoreo:** convulsiones (menos que imipenem), interacción con ácido valproico (baja sus niveles), *C. difficile*.
- **Por qué está restringida:** carbapenémico; su uso en infecciones que responden a otras opciones acelera la aparición de carbapenemasas (KPC), problema prioritario en Colombia.
- **Regla del bot:** 500–1000 mg **o** 10–20 mg/kg.
- **Fuentes:** [Invanz, ficha FDA 2020](https://www.accessdata.fda.gov/drugsatfda_docs/label/2020/021337s049lbl.pdf); [EMA Invanz](https://www.ema.europa.eu/en/documents/product-information/invanz-epar-product-information_en.pdf); MSD profesional [carbapenémicos](https://www.msdmanuals.com/professional/infectious-diseases/bacteria-and-antibacterial-medications/carbapenems).

### 8. Aztreonam

- **Clase / AWaRe:** monobactámico · Reserve.
- **Para qué se usa:** gramnegativos aerobios incluida *Pseudomonas*; sin actividad frente a grampositivos ni anaerobios. Útil en alergia grave a betalactámicos (no comparte reactividad cruzada salvo con ceftazidima) y, combinado con ceftazidima/avibactam, para enterobacterias productoras de metalo-betalactamasas (NDM).
- **Dosis adulto:** 1–2 g c/8–12 h; infección grave 2 g c/6–8 h; máx. 8 g/día. En la combinación con ceftazidima/avibactam: 2 g c/8 h en infusión de 3 h (IDSA 2026).
- **Pediatría:** 30 mg/kg c/8 h (leve-moderada) o c/6–8 h (grave); máx. 120 mg/kg/día.
- **Ajuste:** DepCr 10–30 mL/min: carga 1–2 g y luego la mitad de la dosis; < 10: un cuarto.
- **Monitoreo:** pocas toxicidades; elevación de transaminasas; usar siempre con cobertura para grampositivos/anaerobios si se sospechan.
- **Por qué está restringida:** reserva para multirresistentes y alérgicos; en Colombia su uso principal es el rescate de NDM.
- **Regla del bot:** 500–2000 mg **o** 20–50 mg/kg.
- **Fuentes:** [Azactam, ficha FDA 2021](https://www.accessdata.fda.gov/drugsatfda_docs/label/2021/050580Orig1s046lbl.pdf); IDSA 2026, [Guidance on the Treatment of Antimicrobial-Resistant Gram-Negative Infections](https://academic.oup.com/cid/advance-article/doi/10.1093/cid/ciae403/7728556); MSD profesional [monobactámicos](https://www.msdmanuals.com/es/professional/enfermedades-infecciosas/bacterias-y-f%C3%A1rmacos-antibacterianos/monobact%C3%A1micos).

### 9. Ceftazidima/avibactam

- **Clase / AWaRe:** cefalosporina de 3.ª generación + inhibidor de betalactamasas · Reserve.
- **Para qué se usa:** enterobacterias productoras de KPC, OXA-48, AmpC y BLEE, y *Pseudomonas* multirresistente; neumonía nosocomial, infección intraabdominal y urinaria complicadas. **No cubre** metalo-betalactamasas (NDM) sola: ahí se combina con aztreonam.
- **Dosis adulto:** 2,5 g (2 g ceftazidima + 0,5 g avibactam) c/8 h en infusión de 2 h (ficha) o 3 h (IDSA, consenso ACIN de carbapenemasas). Revisar cómo registra el formulario la dosis: 2.000 (solo ceftazidima) o 2.500 (total).
- **Pediatría (≥ 2 años):** 62,5 mg/kg c/8 h, máx. 2,5 g; 3 m–2 a: 62,5 mg/kg c/8 h (ficha FDA).
- **Ajuste:** DepCr 31–50: 1,25 g c/8 h; 16–30: 0,94 g c/12 h; 6–15: 0,94 g c/24 h; < 6: 0,94 g c/48 h. Mayor mortalidad reportada cuando la dosis no se reajusta al mejorar la función renal (ficha).
- **Monitoreo:** función renal frecuente (la dosis cambia con ella), alteraciones neurológicas en falla renal con dosis plena, *C. difficile*; resistencia emergente durante el tratamiento (vigilar antibiograma).
- **Por qué está restringida:** antibiótico de último recurso para carbapenemasas; su protección es prioridad nacional.
- **Regla del bot:** 940–2500 mg **o** 30–65 mg/kg.
- **Fuentes:** [Avycaz, DailyMed](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d9c2803f-dc9c-4b19-b4a3-8303bc8c15fd); [ficha FDA 2024](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/206494s012lbl.pdf); IDSA 2026 (arriba); ACIN, [consenso enterobacterales productores de carbapenemasas, *Infectio*](https://www.revistainfectio.org/P_OJS/index.php/infectio/article/download/1130/1269/3816).

### 10. Tigeciclina

- **Clase / AWaRe:** glicilciclina · Reserve.
- **Para qué se usa:** infecciones intraabdominales y de piel complicadas por multirresistentes (SARM, VRE, BLEE, *Acinetobacter*, carbapenemasas en combinación). **No** para bacteriemia ni neumonía nosocomial/VAP: concentraciones séricas bajas y mayor mortalidad (advertencia en recuadro de la FDA sobre mortalidad por todas las causas).
- **Dosis adulto:** 100 mg carga, luego 50 mg c/12 h; en guías de carbapenemasas se usan esquemas de dosis alta (200 mg carga, 100 mg c/12 h), fuera de ficha.
- **Pediatría:** 8–11 años 1,2 mg/kg c/12 h (máx. 50 mg); 12–17 años 50 mg c/12 h; evitar < 8 años (dientes).
- **Ajuste:** no renal; Child-Pugh C: 100 mg carga y 25 mg c/12 h.
- **Monitoreo:** náuseas y vómito frecuentes, pancreatitis, hepatotoxicidad; reservar para cuando no hay alternativa.
- **Por qué está restringida:** reserva, toxicidad y la advertencia de mortalidad.
- **Regla del bot:** 25–100 mg **o** 1–2,5 mg/kg. La dosis alta de 200 mg se marcaría: es intencional, debe quedar justificada.
- **Fuentes:** [Tygacil, ficha FDA 2025](https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/021821s056lbl.pdf); [EMA Tygacil](https://www.ema.europa.eu/en/documents/product-information/tygacil-epar-product-information_en.pdf); MSD profesional [tigeciclina](https://www.msdmanuals.com/es/professional/enfermedades-infecciosas/bacterias-y-f%C3%A1rmacos-antibacterianos/tigeciclina).

### 11. Doripenem

- **Clase / AWaRe:** carbapenémico del grupo 2 · Watch.
- **Para qué se usa:** infecciones intraabdominales y urinarias complicadas por gramnegativos incluida *Pseudomonas*. La FDA retiró la indicación de neumonía asociada a ventilador por mayor mortalidad; el producto original (Doribax) fue descontinuado en EE. UU. y Europa, por lo que la ficha vigente es la de genéricos. Sin uso registrado en las muestras del HDV.
- **Dosis adulto:** 500 mg c/8 h en infusión de 1 h.
- **Pediatría:** no autorizado.
- **Ajuste:** DepCr 30–50: 250 mg c/8 h; 10–30: 250 mg c/12 h.
- **Monitoreo:** convulsiones, interacción con valproato, *C. difficile*.
- **Por qué está restringida:** carbapenémico antipseudomónico.
- **Regla del bot:** 250–1000 mg.
- **Verificación:** la dosis y el ajuste renal provienen de la ficha FDA 2009 y del EPAR europeo 2009, no de una ficha actual; el producto no aparece en DailyMed vigente. Marcar como "verificar" si se llega a usar.
- **Fuentes:** [Doribax, ficha FDA 2009](https://www.accessdata.fda.gov/drugsatfda_docs/label/2009/022106s002s005lbl.pdf); [EPAR Doribax 2009](https://ec.europa.eu/health/documents/community-register/2009/2009091765910/anx_65910_en.pdf).

### 12. Rifampicina

- **Clase / AWaRe:** rifamicina · Watch.
- **Para qué se usa:** tuberculosis (indicación de ficha); como **adyuvante** en infecciones estafilocócicas sobre material protésico (prótesis articulares, dispositivos) y endocarditis sobre válvula protésica, siempre en combinación (nunca sola: resistencia rápida). Profilaxis de meningococo.
- **Dosis adulto:** 600 mg/día (10 mg/kg), VO o IV; en infección protésica 600–900 mg/día o 300–450 mg c/12 h según la guía IDSA de infección articular protésica.
- **Pediatría:** 10–20 mg/kg/día, máx. 600 mg; < 1 mes 5 mg/kg c/12 h (profilaxis).
- **Ajuste:** no renal; vigilar función hepática.
- **Monitoreo:** hepatotoxicidad (pruebas hepáticas basales y cada 2–4 semanas), coloración naranja de fluidos, y sobre todo **interacciones**: inductor potente de CYP450 (anticoagulantes, anticonvulsivantes, antirretrovirales, inmunosupresores, caspofungina).
- **Por qué está restringida:** uso fuera de TB requiere justificación (combinación, duración) y revisión de interacciones.
- **Regla del bot:** 300–900 mg **o** 10–20 mg/kg (900 cubre el adyuvante en infección protésica).
- **Fuentes:** [Rifadin IV, ficha FDA 2024](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/050420s092%2C050627s037lbl.pdf); MSD profesional [rifamicinas](https://www.msdmanuals.com/es/professional/enfermedades-infecciosas/bacterias-y-f%C3%A1rmacos-antibacterianos/rifamicinas) y [tabla antituberculosos](https://www.msdmanuals.com/es/professional/multimedia/table/dosificaci%C3%B3n-de-los-f%C3%A1rmacos-antituberculosos-orales-de-primera-elecci%C3%B3n); [revisión rifampicina en infección protésica, PMC 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12681345/).

### 13. Polimixina B

- **Clase / AWaRe:** polipéptido · Reserve.
- **Para qué se usa:** último recurso en gramnegativos panresistentes (*Acinetobacter*, *Pseudomonas*, enterobacterias productoras de carbapenemasas, en especial NDM), casi siempre en combinación. El consenso internacional 2019 la prefiere sobre colistina para infección invasiva (colistina para vía urinaria).
- **Dosis adulto (consenso 2019):** carga 2–2,5 mg/kg de peso total (20.000–25.000 UI/kg) en 1 h; mantenimiento 1,25–1,5 mg/kg (12.500–15.000 UI/kg) c/12 h. La ficha clásica dice 15.000–25.000 UI/kg/día divididos c/12 h. Equivalencia: 1 mg = 10.000 UI.
- **Pediatría:** ficha 15.000–25.000 UI/kg/día; evidencia limitada.
- **Ajuste:** el consenso recomienda **no** reducir la dosis en falla renal ni en terapia de reemplazo renal (dato controvertido en la literatura posterior).
- **Monitoreo:** nefrotoxicidad dependiente de dosis (creatinina diaria), neurotoxicidad; evitar otros nefrotóxicos; objetivo de concentración 2–4 mg/L.
- **Por qué está restringida:** último recurso absoluto; toxicidad.
- **Regla del bot:** **ninguna**. El formulario pregunta "Dosis en miligramos o UI" sin distinguir unidad; 500.000 UI y 50 mg son la misma dosis, y el bot no puede saber cuál se escribió. Si el comité quiere vigilarla, hay que agregar la unidad al formulario.
- **Fuentes:** Tsuji BT et al., [International Consensus Guidelines for the Optimal Use of the Polymyxins, *Pharmacotherapy* 2019](https://accpjournals.onlinelibrary.wiley.com/doi/full/10.1002/phar.2209); [monografía polimixina B (Drugs.com)](https://www.drugs.com/monograph/polymyxin-b-sulfate-systemic-topical.html); MSD profesional [polipéptidos](https://www.msdmanuals.com/es/professional/enfermedades-infecciosas/bacterias-y-f%C3%A1rmacos-antibacterianos/antibi%C3%B3ticos-polipept%C3%ADdicos-bacitracina-colistina-polimixina-b).

---

## Hallazgos para el comité PROA

1. **Vancomicina es el 73 % de las alertas** y casi siempre empírica y sin interconsulta. El bot no decide si eso está bien; el comité sí. Con los datos del mensaje (indicación, cultivos, mg/kg, acompañante) se puede definir si la alerta de vancomicina debe limitarse a casos empíricos sin interconsulta o repetidos.
2. **Vancomicina + carbapenémico** (meropenem 25, cefepime 28 acompañantes en octubre) es la combinación empírica más frecuente: candidata a auditoría prospectiva con desescalamiento a las 48–72 h, que es la intervención PROA con más evidencia según la guía OPS 2024.
3. **Doripenem, rifampicina y polimixina B** no aparecen en ninguna solicitud de las dos muestras. Si el HDV no las tiene en stock, mantenerlas en la lista no estorba; si las tiene, el formulario debería capturar la **unidad** de polimixina B.
4. **La dosis de ceftazidima/avibactam** puede registrarse como 2.000 o 2.500 mg según el prescriptor. Convendría fijar el criterio en el formulario (dosis total del producto) para que el rango del bot no marque falsos positivos.
5. **Errores de digitación detectables:** peso 1 kg con 1.000 mg de vancomicina, 10.000 mg, 100 mg en adulto. El mensaje ahora los hace visibles; una validación mínima en el formulario (peso entre 0,5 y 250 kg) los evitaría desde el origen.
6. **Pediatría:** las reglas en mg/kg existen para no marcar dosis pediátricas correctas, pero caspofungina y tigeciclina se dosifican por m² o por edad; la aproximación en mg/kg puede marcar un caso correcto. Cuando eso pase, el farmacéutico lo verá en la línea "⚠️ revisar" y nada más.

## Verificación del 2026-11-14 contra fichas técnicas y consensos

Leído en la ficha técnica de EE. UU. (openFDA) o en el consenso indicado:

- **Daptomicina:** 4 mg/kg c/24 h (piel) y 6 mg/kg c/24 h (bacteriemia por *S. aureus*, 2-6 semanas); c/48 h si la depuración es < 30 mL/min; "no está indicada para el tratamiento de la neumonía".
- **Tigeciclina:** 100 mg y luego 50 mg c/12 h; 25 mg c/12 h en Child-Pugh C. Indicaciones: piel complicada, intraabdominal complicada y neumonía bacteriana de la comunidad; **no** en neumonía nosocomial ni asociada a ventilador. Recuadro de mayor mortalidad: reservar para cuando no haya alternativa. IDSA 2026 no la sugiere en ITU ni en bacteriemia por enterobacterias resistentes a carbapenémicos.
- **Ertapenem:** 1 g c/24 h desde los 13 años; 500 mg/día si la depuración es ≤ 30; 3 meses a 12 años: 15 mg/kg c/12 h (máx. 1 g/día).
- **Ceftazidima/avibactam:** 2,5 g c/8 h en infusión de 2 h; 1,25 g c/8 h (depuración 31-50); 0,94 g c/12 h (16-30), c/24 h (6-15) y c/48 h (≤ 5); 2 a 17 años: 62,5 mg/kg (máx. 2,5 g) c/8 h.
- **Caspofungina:** 70 mg el día 1 y luego 50 mg/día; 70 mg/día con rifampicina; 35 mg/día en Child-Pugh 7-9; pediatría 70 mg/m² y luego 50 mg/m² (máx. 70 mg). La dosis de 70 mg/día en mayores de 80 kg es de la ficha europea.
- **Linezolid:** 600 mg c/12 h desde los 12 años; 10 mg/kg c/8 h hasta los 11 años.
- **Aztreonam:** máximo 8 g/día (texto de la ficha); dosis y ajuste renal, por resumen de la ficha.
- **Polimixina B:** ficha: 15.000-25.000 UI/kg/día, 1 mg = 10.000 UI. [Consenso internacional 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC7437259/): carga 2,0-2,5 mg/kg, mantenimiento 1,25-1,5 mg/kg c/12 h, **sin** ajuste renal, y de elección frente a colistina en infección invasiva (colistina en ITU baja).
- **Doripenem:** openFDA no devuelve ficha vigente, lo que concuerda con que el producto original fue descontinuado.

## Pendientes de verificación

- Doripenem con una ficha vigente (genérico) o con la guía OPS 2024-2026.
- Dosis alta de tigeciclina (200/100 mg) y esquemas de daptomicina 8–12 mg/kg contra las guías que las respaldan (IDSA SARM 2011; IDSA gramnegativos 2026).
- Ficha INVIMA de cada producto que compra el HDV (la unidad de polimixina B y la forma de expresar ceftazidima/avibactam dependen del fabricante).
- Guía institucional de antibióticos del HDV, si existe: manda sobre todo lo anterior.
