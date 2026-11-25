# Ajuste renal de antimicrobianos (bot PROA, v1.36.15)

**Estado: MODO PRUEBA y PENDIENTE de validación por el comité PROA.** Mientras `CONFIG.AJUSTE_RENAL_ENVIAR` sea `false`, el bot no envía nada: deja una fila en `REGISTRO_REVISIONES` (fuente `AJUSTE RENAL`, destino "prueba: no se envía") por cada solicitud con una dosis que no coincide con la tabla. Esas filas sirven para medir cuántos avisos son útiles antes de enviarlos al grupo.

**Desde la v1.36.21 (decisión del referente, 2026-11-25):** si la solicitud ya genera un caso PROA o una revisión de duración que se envía al grupo, el hallazgo va como **una línea dentro de ese mensaje** (`CONFIG.AJUSTE_RENAL_EN_MENSAJE = true`): `💧 Depuración estimada 29 ml/min · ficha técnica: MEROPENEM la misma dosis c/12 h`. La fila del registro queda con destino "va como línea del mensaje enviado". El mensaje renal aparte sigue apagado.

## Cómo calcula

- **Creatinina:** la pregunta nueva `Creatinina sérica (mg/dL)` (formulario del 2026-11-23). **No** usa la pregunta antigua "depuración de creatinina en (mg/dl)": en 90 días, 107 de 137 valores eran creatininas y no depuraciones.
- **Depuración estimada (Cockcroft-Gault):** (140 − edad) × peso / (72 × creatinina), × 0,85 en mujeres. Usa el peso real (en obesidad la sobreestima). Solo adultos (18 años o más), peso de 30 a 250 kg y creatinina de 0,1 a 20 mg/dL.
- **No evalúa:** pacientes en terapia de reemplazo renal (`¿Terapia de reemplazo renal?` distinto de "No"; la dosis depende de la técnica), menores de 18 años, ni vancomicina (se ajusta por niveles).
- **Compara la orden tal como se escribió.** Una dosis de carga completa (frecuente en Urgencias) puede salir marcada: es parte de lo que mide el modo prueba.
- El tramo es el primero cuya depuración máxima es mayor o igual a la estimada. Se marca si el intervalo es menor que el mínimo del tramo, si la dosis supera la máxima por dosis o si la dosis diaria (dosis × 24 / intervalo) supera la máxima diaria. Las frecuencias que no son un intervalo ("Dosis única", "3 dosis y suspender", "Infusión extendida") no se evalúan por intervalo.

## Tabla (`CONFIG.AJUSTE_RENAL`)

Fuente: fichas técnicas de la FDA (*prescribing information*) de cada producto; regímenes de adulto en infusión intermitente. Verificar contra la ficha INVIMA del producto que compra el HDV.

| Antimicrobiano | Depuración (ml/min) | Regla del bot | Referencia de la ficha |
|---|---|---|---|
| Cefepime | 30-60 | intervalo ≥ 12 h | 0,5-2 g c/12-24 h (2 g c/12 h si el régimen era 2 g c/8 h) |
| | 11-29 | intervalo ≥ 24 h | 0,5-2 g c/24 h |
| | ≤ 10 | intervalo ≥ 24 h y dosis ≤ 1 g | 0,25-1 g c/24 h |
| Meropenem | 26-50 | intervalo ≥ 12 h | la misma dosis c/12 h |
| | 10-25 | intervalo ≥ 12 h | la mitad de la dosis c/12 h |
| | < 10 | intervalo ≥ 24 h | la mitad de la dosis c/24 h |
| Piperacilina/tazobactam | 20-40 | dosis diaria ≤ 13,5 g | 2,25-3,375 g c/6 h (13,5 g/día es el régimen de neumonía nosocomial; en otras indicaciones la ficha da 9 g/día) |
| | < 20 | dosis diaria ≤ 9 g | 2,25 g c/6-8 h |
| Ertapenem | ≤ 30 | dosis ≤ 500 mg | 500 mg c/24 h |
| Ceftazidima/avibactam | 31-50 | dosis ≤ 1,25 g | 1,25 g c/8 h |
| | 16-30 | intervalo ≥ 12 h y dosis ≤ 0,94 g | 0,94 g c/12 h |
| | ≤ 15 | intervalo ≥ 24 h y dosis ≤ 0,94 g | 0,94 g c/24 h |
| Ceftazidima | 31-50 | intervalo ≥ 12 h | 1 g c/12 h |
| | 16-30 | intervalo ≥ 24 h | 1 g c/24 h |
| | ≤ 15 | intervalo ≥ 24 h y dosis ≤ 0,5 g | 0,5 g c/24 h |
| Aztreonam | 10-30 | dosis ≤ 1 g | 50 % de la dosis habitual después de la dosis de carga |
| | < 10 | dosis ≤ 0,5 g | 25 % de la dosis habitual después de la dosis de carga |
| Levofloxacino | ≤ 49 | dosis diaria ≤ 375 mg | 750 mg c/48 h o 250 mg c/24 h después de la dosis de carga |
| Ciprofloxacino | ≤ 29 | intervalo ≥ 18 h | c/18-24 h |
| Daptomicina | < 30 | intervalo ≥ 48 h | la misma dosis (mg/kg) c/48 h |

Sin regla (no requieren ajuste renal o se ajustan por otro método): ceftriaxona, linezolid, tigeciclina, rifampicina, caspofungina, anfotericina B y anfotericina B liposomal, polimixina B, colistina (esquema propio), vancomicina (niveles).

## Evidencia (PubMed)

- Función renal < 30 ml/min: principal factor de neurotoxicidad por cefepime (OR 10,06); la dosis inadecuada también es factor de riesgo. Hardi et al., *Br J Clin Pharmacol* 2025. https://doi.org/10.1002/bcp.70120
- La mayoría de los casos publicados de neurotoxicidad por cefepime con falla renal no tenían la dosis ajustada. Ajibola et al., *Cureus* 2023. https://doi.org/10.7759/cureus.40980
- Reglas de ajuste renal con revisión por farmacéutico: 71 % de las intervenciones aceptadas; valor predictivo positivo de las alertas 0,32 (de ahí el modo prueba). Garcia-Souto et al., *Appl Clin Inform* 2026. https://doi.org/10.1055/a-2893-7843
- Herramienta de monitoreo renal: +68 % de intervenciones y proporción de alertas útiles de 11 % a 39 %. Wilcox et al., *Am J Health Syst Pharm* 2025. https://doi.org/10.1093/ajhp/zxaf071

## Para pasar a producción

1. Revisar en `REGISTRO_REVISIONES` las filas con fuente `AJUSTE RENAL` de una o dos semanas: cuántas eran correctas (dosis de carga, régimen de infusión extendida, error de la tabla).
2. Que el comité valide la tabla (y la ajuste a las fichas INVIMA).
3. Poner `CONFIG.AJUSTE_RENAL_ENVIAR = true`. El mensaje sale como "💧 VERIFICAR AJUSTE RENAL", con lenguaje de verificación.
