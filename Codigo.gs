// Version del codigo; sale en las funciones de prueba para saber que version esta pegada en el editor.
var VERSION_BOT = '1.36.4';

var CONFIG = {
  SPREADSHEET_ID: '1ZsjuygpRz1wPhCRxmL8LPLTNOo8kujGXplX8JRs6SZY',
  HOJA_RESPUESTAS: 'Respuestas de formulario 1',
  HOJA_ANTIMICROBIANOS_RESTRINGIDOS: 'ANTIMICROBIANOS_RESTRINGIDOS',
  ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO: ['CEFTAZIDIMA / AVIBACTAM', 'ANFOTERICINA', 'AZTREONAM', 'ERTAPENEM', 'CASPOFUNGINA', 'ANFOTERICINA B LIPOSOMAL', 'TYGECICLINA', 'DORIPENEM', 'RIFAMPICINA', 'POLIMIXINA B', 'DAPTOMICINA'],
  // Restringidos que NO disparan alerta por si solos (decision del Servicio Farmaceutico, 2026-11-02),
  // pero que se muestran como restringidos (con su dosis evaluada) cuando otro antimicrobiano de la
  // misma solicitud si dispara la alerta. Equivale a la columna "dispara_alerta = NO" de la pestana;
  // si la pestana trae esa columna, la pestana manda.
  RESTRINGIDOS_SIN_ALERTA_PROPIA: ['VANCOMICINA', 'LINEZOLID'],
  // Caso PROA solo si el tratamiento continuo del restringido, contando los dias de esta orden, supera estos dias
  // (decision del referente, 2026-11-16: "si el atb ademas de estar en el listado de restringidos presenta mas de
  // los 14 dias"). Un restringido con 14 d o menos no genera mensaje. 0 = caso PROA en cada solicitud, como antes.
  CASO_DIAS_MINIMOS: 14,
  HOJA_CIE10: 'CIE10',
  // Cruce del diagnostico escrito con la pestana CIE10 cuando el medico no pone el codigo (v1.35.0, pedido del
  // referente). Abreviaturas que se expanden antes de buscar y palabras que no cambian el diagnostico; las ajusta el QF.
  CIE10_SINONIMOS: { ITU: 'INFECCION VIAS URINARIAS', IVU: 'INFECCION VIAS URINARIAS', SHOCK: 'CHOQUE', SX: 'SINDROME',
    ISO: 'INFECCION CONSECUTIVA PROCEDIMIENTO', NAC: 'NEUMONIA', CA: 'TUMOR MALIGNO', TBC: 'TUBERCULOSIS', TB: 'TUBERCULOSIS',
    ERC: 'ENFERMEDAD RENAL CRONICA', IRC: 'ENFERMEDAD RENAL CRONICA', EPOC: 'ENFERMEDAD PULMONAR OBSTRUCTIVA CRONICA' },
  CIE10_PALABRAS_IGNORADAS: ['ESTUDIO', 'PROBABLE', 'POSIBLE', 'SOSPECHA', 'DESCARTAR', 'ORIGEN', 'FOCO', 'DETERMINAR', 'DERECHA',
    'DERECHO', 'IZQUIERDA', 'IZQUIERDO', 'BILATERAL', 'ADQUIRIDA', 'ADQUIRIDO', 'COMUNIDAD', 'ASOCIADA', 'ASOCIADO', 'CUIDADO',
    'CUIDADOS', 'SALUD', 'TRATAMIENTO', 'MANEJO', 'REGION', 'SEVERA', 'SEVERO', 'GRAVE', 'LEVE', 'MODERADA', 'MODERADO',
    'PACIENTE', 'DX', 'DIAGNOSTICO'],
  // Textos frecuentes con su codigo fijo (se comparan sin las palabras ignoradas, con las abreviaturas y la ortografia
  // corregida; el codigo debe existir en la pestana). Van antes del cruce por palabras.
  CIE10_EQUIVALENCIAS: { 'NEUMONIA ASPIRATIVA': 'J690', 'NEUMONIA BRONCOASPIRATIVA': 'J690', 'NEUMONIA POR BRONCOASPIRACION': 'J690',
    'NEUMONIA POR ASPIRACION': 'J690', 'SINDROME FEBRIL': 'R509', 'PIELONEFRITIS': 'N10X', 'PIELONEFRITIS AGUDA': 'N10X' },
  CACHE_CIE10_SEG: 21600,
  HOJA_RANGOS_DOSIS: 'RANGOS_DOSIS',
  // Rangos de referencia POR DOSIS para marcar "revisar dosis". Una dosis se acepta si cumple
  // cualquiera de las dos reglas definidas (mg/kg o mg absolutos); se marca solo si falla en todas.
  // La lista vigente es la pestana RANGOS_DOSIS, que valida y ajusta el QF; esta tabla es el
  // respaldo y la propuesta inicial (fuentes en docs/antimicrobianos-restringidos.md).
  // Columnas: antimicrobiano, min mg/kg/dosis, max mg/kg/dosis, min mg/dosis, max mg/dosis,
  //           ajuste renal (SI/NO), nota con la fuente.
  RANGOS_DOSIS_RESPALDO: [
    ['VANCOMICINA', 10, 35, null, null, 'SI', 'Consenso ASHP/IDSA/PIDS/SIDP 2020: carga 20-35 mg/kg (max 3 g), mantenimiento 15-20 mg/kg c/8-12 h, AUC 400-600'],
    ['LINEZOLID', 8, 12, 600, 600, 'NO', 'Ficha FDA Zyvox 2024: 600 mg c/12 h (>=12 a); 10 mg/kg c/8 h (<12 a). Sin ajuste renal'],
    ['DAPTOMICINA', 4, 12, null, null, 'SI', 'Ficha FDA/EMA Cubicin: 4 mg/kg (piel) y 6 mg/kg (bacteriemia) c/24 h; pediatria 5-12 mg/kg; guias 8-12 mg/kg; c/48 h si DepCr <30'],
    ['CASPOFUNGINA', 1, 4, 35, 70, 'NO', 'Ficha FDA/EMA Cancidas: 70 mg carga, 50 mg/dia (70 si >80 kg o con rifampicina); pediatria 70/50 mg/m2 max 70 mg; Child-Pugh B 35 mg'],
    ['ANFOTERICINA B LIPOSOMAL', 3, 10, null, null, 'NO', 'Ficha FDA AmBisome 2024: 3-5 mg/kg/dia (6 criptococo; hasta 10 mucormicosis); ACIN candidiasis 3-5 mg/kg/dia'],
    ['ANFOTERICINA B', 0.25, 1.5, null, null, 'NO', 'Ficha FDA deoxicolato: inicio 0,25 mg/kg/dia, habitual 0,5-1, nunca >1,5 mg/kg/dia. Nefrotoxica (vigilar K y creatinina)'],
    ['ERTAPENEM', 10, 20, 500, 1000, 'SI', 'Ficha FDA Invanz 2020: 1 g c/24 h (>=13 a); 15 mg/kg c/12 h (3 m-12 a, max 1 g/dia); 500 mg/dia si DepCr <=30'],
    ['AZTREONAM', 20, 50, 500, 2000, 'SI', 'Ficha FDA Azactam 2021: 0,5-2 g c/6-12 h (max 8 g/dia); pediatria 30 mg/kg c/6-8 h; mitad de dosis si DepCr 10-30'],
    ['CEFTAZIDIMA / AVIBACTAM', 30, 65, 940, 2500, 'SI', 'Ficha FDA Avycaz 2024: 2,5 g c/8 h; 1,25 g (DepCr 31-50); 0,94 g c/12-48 h (<=30); pediatria 62,5 mg/kg max 2,5 g. ficha: infusion de 2 h'],
    ['TYGECICLINA', 1, 2.5, 25, 100, 'NO', 'Ficha FDA Tygacil 2025: 100 mg carga, 50 mg c/12 h; 8-11 a 1,2 mg/kg (max 50); Child-Pugh C 25 mg. Dosis alta 200/100 fuera de ficha'],
    ['DORIPENEM', null, null, 250, 1000, 'SI', 'Ficha FDA 2009 (producto original descontinuado): 500 mg c/8 h; 250 mg c/8 h (DepCr 30-50) o c/12 h (10-30). Verificar con ficha vigente'],
    ['RIFAMPICINA', 10, 20, 300, 900, 'NO', 'Ficha FDA Rifadin 2024: 600 mg/dia (10 mg/kg); pediatria 10-20 mg/kg max 600; infeccion protesica 600-900 mg/dia (IDSA). Sin ajuste renal; inductor CYP450'],
    ['POLIMIXINA B', null, null, null, null, 'NO', 'Sin regla: el formulario no distingue mg de UI (1 mg = 10.000 UI). Consenso polimixinas 2019: carga 2-2,5 mg/kg, 1,25-1,5 mg/kg c/12 h, sin ajuste renal']
  ],
  // Sugerencia PROA en el mensaje (revaluacion a las 48-72 h de la terapia empirica; guia OPS/OMS 2024).
  SUGERENCIAS_ACTIVAS: true,
  // false: la sugerencia solo sale cuando el restringido va con un acompanante de amplio espectro
  // (combinacion empirica). true: tambien en toda terapia empirica (en octubre 2026 seria el 82% de alertas).
  SUGERENCIA_EMPIRICO_SOLO: false,
  // Acompanantes de amplio espectro que, junto a un restringido en terapia empirica, se senalan como
  // combinacion a revaluar con cultivos.
  AMPLIO_ESPECTRO: ['MEROPENEM', 'IMIPENEM', 'CEFEPIME', 'PIPERACILINA / TAZOBACTAM', 'CEFTAZIDIMA', 'CEFTRIAXONA'],
  // Coherencia de datos: avisos cuando peso, edad o dosis no cuadran entre si (errores de digitacion).
  PESO_MIN_KG: 0.4,
  PESO_MAX_KG: 250,
  MG_KG_IMPLAUSIBLE: 100,

  // ---- Pertinencia: duracion de referencia por sindrome y reglas de espectro ----
  // Seguimiento por paciente: solicitudes previas de la misma historia clinica en la matriz.
  SEGUIMIENTO_ACTIVO: true,
  SEGUIMIENTO_DIAS: 60,
  // Una orden continua el tratamiento anterior si empieza hasta N dias despues de su fin (las renovaciones
  // suelen llegar tarde: con 2 dias se perdio un curso de ertapenem de 24 dias, caso del 2026-11-15).
  SEGUIMIENTO_TOLERANCIA_DIAS: 3,
  // Caso PROA solo con datos (decision del referente, 2026-11-16): sin el bloque de pertinencia ni el veredicto.
  // El analisis de las tablas se sigue guardando en REGISTRO_REVISIONES; true lo devuelve al mensaje.
  // La IA no analiza casos (decision del referente: el caso lo valora Infectologia); solo escribe la lectura del
  // informe semanal (IA_PROA.gs, v1.34.0).
  CASO_ANALISIS: false,
  // Revision por tratamiento prolongado (decision del referente, 2026-11-16): mensaje APARTE del caso PROA
  // cuando la solicitud es al menos la PROLONGADO_MIN_SOLICITUDES-esima del mismo tratamiento continuo (contando
  // esta) y el paciente ya lleva mas de PROLONGADO_DIAS dias. Aplica con o sin restringido.
  // Con PROLONGADO_SOLO_CAMBIO = true, solo cuando se formula un antimicrobiano que el paciente no venia recibiendo.
  PROLONGADO_ACTIVO: true,
  PROLONGADO_DIAS: 10,
  PROLONGADO_MIN_SOLICITUDES: 3,
  PROLONGADO_SOLO_CAMBIO: false,
  // Antimicrobianos que no generan revision de duracion por si solos (decision del referente, 2026-11-16):
  // una orden solo de vancomicina o linezolid no la genera; con otro antibiotico, sale por el otro. Sus dias
  // se siguen contando en el tratamiento continuo. Para volver a incluirlos, quitarlos de esta lista.
  PROLONGADO_EXCLUIDOS: ['VANCOMICINA', 'LINEZOLID'],
  // Contra el spam (decision del referente, 2026-11-16): sin verdes y un paciente como maximo cada 7 dias.
  PROLONGADO_ENVIAR_VERDES: false,
  // Si la solicitud tiene un restringido que dispara alerta, la revision no se envia: va por el caso PROA, que
  // trae la misma lista de prescripciones (decision del referente, 2026-11-16). true la envia tambien.
  PROLONGADO_CON_CASO: false,
  PROLONGADO_REPETIR_DIAS: 7,
  // Registro de cada revision (indicadores PROA y auditoria del analisis).
  REGISTRO_ACTIVO: true,
  HOJA_REGISTRO: 'REGISTRO_REVISIONES',
  // La duracion de los focos bacterianos no aplica a estos; si a los sindromes fungicos.
  ANTIFUNGICOS: ['CASPOFUNGINA', 'ANFOTERICINA'],
  SINDROMES_FUNGICOS: ['CANDIDEMIA', 'CRIPTOCOCOSIS', 'HISTOPLASMOSIS', 'ASPERGILOSIS', 'NEUTROPENIA'],
  PERTINENCIA_ACTIVA: true,
  HOJA_PERTINENCIA: 'PERTINENCIA_DURACION',
  // Duracion de referencia (dias totales de tratamiento) por sindrome. El diagnostico se ubica por
  // prefijo CIE10 (gana el mas largo) o, si no hay codigo, por palabra clave del texto (gana la mas
  // larga). Solo se marca cuando los dias ordenados SUPERAN el maximo; un rango vacio muestra solo la nota.
  // La lista vigente es la pestana PERTINENCIA_DURACION, que valida y ajusta el comite PROA; esta es el
  // respaldo (fuentes y estado de verificacion en docs/pertinencia.md).
  // Columnas: clave, prefijos CIE10, palabras clave, sindrome, dias min, dias max, nota, fuente.
  PERTINENCIA_RESPALDO: [
    ['ITU', 'N39,N10,N12,N30', 'INFECCION URINARIA,VIAS URINARIAS,SEPSIS URINARIA,UROSEPSIS,PIELONEFRITIS,IVU,ITU', 'Infección urinaria complicada / pielonefritis', 5, 7, '7 d si no es fluoroquinolona y también con bacteriemia de foco urinario; 10-14 d si se sospecha prostatitis; individualizar con absceso, obstrucción o sonda', 'IDSA 2025 ITU complicada; ACIN Infectio 2023'],
    ['BACTERIEMIA', 'A40,A41,A49,R57,R65', 'BACTEREMIA,BACTERIEMIA,SEPSIS,SEPTICEMIA,CHOQUE SEPTICO', 'Bacteriemia / sepsis', 7, 14, '7 d si hay control del foco y no es S. aureus ni Candida; S. aureus: mínimo 14 d desde el hemocultivo negativo (4-6 sem si es complicada)', 'BALANCE, NEJM 2025; Surviving Sepsis 2021 (cursos cortos)'],
    ['NEUMONIA', 'J12,J13,J14,J15,J16,J17,J18,J22', 'NEUMONIA,BRONCONEUMONIA,NAC', 'Neumonía', 5, 7, 'comunitaria: mínimo 5 d y hasta la estabilidad clínica; 7 d si es por SARM o Pseudomonas; nosocomial o asociada a ventilador: 7 d', 'ATS/IDSA 2019; IDSA/ATS 2016; ACIN NAC 2022'],
    ['EMPIEMA', 'J85,J86', 'EMPIEMA,ABSCESO PULMONAR', 'Empiema / absceso pulmonar', 14, 42, '2-3 semanas pueden bastar con drenaje y buena evolución (ensayo SLIM); más si la evolución es lenta', 'SLIM, ERJ Open Res 2023; BTS 2023'],
    ['INTRAABDOMINAL', 'K35,K36,K37,K57,K63,K65,K80,K81,K83', 'PERITONITIS,APENDICITIS,COLANGITIS,COLECISTITIS,INTRAABDOMINAL,DIVERTICULITIS', 'Infección intraabdominal', 4, 7, '4 d completos después del control del foco dieron el mismo resultado que 8 d', 'STOP-IT, NEJM 2015; SIS 2017'],
    ['PIEL', 'L01,L02,L03,L08,A46', 'CELULITIS,ERISIPELA,PIEL Y TEJIDOS BLANDOS,TEJIDOS BLANDOS,ABSCESO CUTANEO', 'Infección de piel y tejidos blandos', 5, 7, 'extender solo si no hay mejoría; fascitis necrosante: hasta 48-72 h después del último desbridamiento', 'IDSA 2014'],
    ['PIE_DIABETICO', '', 'PIE DIABETICO', 'Pie diabético', 7, 14, 'partes blandas 1-2 semanas; osteomielitis 6 semanas sin resección y hasta 3 tras amputación menor con margen positivo', 'IWGDF/IDSA 2023'],
    ['OSTEOMIELITIS', 'M86,M46', 'OSTEOMIELITIS,ESPONDILODISCITIS,DISCITIS', 'Osteomielitis / espondilodiscitis', 42, 42, '6 semanas en total, por vía parenteral u oral de alta biodisponibilidad', 'IDSA 2015 vertebral; OVIVA, NEJM 2019'],
    ['ARTRITIS', 'M00', 'ARTRITIS SEPTICA', 'Artritis séptica', 14, 28, '2 semanas no fueron inferiores a 4 tras el drenaje, en un ensayo con predominio de mano y muñeca; en articulaciones grandes se usan 4 semanas o más', 'Gjika, Ann Rheum Dis 2019'],
    ['PROTESIS', 'T84', 'PROTESIS ARTICULAR,PERIPROTESICA', 'Infección de prótesis articular', 42, 84, '6 semanas no fueron no inferiores a 12 (18,1 % frente a 9,4 % de infección persistente)', 'DATIPO, NEJM 2021'],
    ['ENDOCARDITIS', 'I33,I38,I39', 'ENDOCARDITIS', 'Endocarditis infecciosa', 14, 42, 'válvula nativa 2-6 semanas; válvula protésica 6 semanas o más, contadas desde el primer hemocultivo negativo', 'ESC 2023'],
    ['CATETER', 'T82', 'ASOCIADA A CATETER,INFECCION DE CATETER', 'Bacteriemia asociada a catéter', 5, 14, 'con retiro del catéter: estafilococo coagulasa negativo 5-7 d, enterococo y gramnegativos 7-14 d, S. aureus mínimo 14 d; 4-6 semanas si la bacteriemia persiste más de 72 h tras el retiro', 'IDSA 2009'],
    ['MENINGITIS', 'G00,G01,G03', 'MENINGITIS', 'Meningitis bacteriana', 7, 21, 'meningococo 5-7 d; neumococo 10-14 d; Listeria y bacilos gramnegativos 21 d', 'ESCMID 2016'],
    ['ABSCESO_CEREBRAL', 'G06,G07', 'ABSCESO CEREBRAL', 'Absceso cerebral', 42, 56, '6-8 semanas IV', 'ESCMID 2023'],
    ['CANDIDEMIA', 'B37', 'CANDIDEMIA,CANDIDIASIS INVASIVA,FUNGEMIA', 'Candidemia / candidiasis invasiva', 14, 21, '2 semanas después del primer hemocultivo negativo y de la resolución de los síntomas, sin focos metastásicos', 'IDSA 2016'],
    ['CRIPTOCOCOSIS', 'B45', 'CRIPTOCOC,CRYPTOCOC', 'Criptococosis (inducción)', 1, 14, 'OMS 2022: dosis única de anfotericina B liposomal 10 mg/kg más 14 d de flucitosina y fluconazol', 'OMS 2022'],
    ['HISTOPLASMOSIS', 'B39', 'HISTOPLASM', 'Histoplasmosis (inducción con anfotericina)', 14, 14, 'anfotericina B liposomal 3 mg/kg por 2 semanas y luego itraconazol 12 meses', 'OPS/OMS 2020'],
    ['ASPERGILOSIS', 'B44', 'ASPERGIL', 'Aspergilosis invasiva', 42, 84, 'mínimo 6-12 semanas', 'IDSA 2016'],
    ['NEUTROPENIA', 'D70', 'NEUTROPENIA FEBRIL', 'Neutropenia febril', '', '', 'sin foco: se puede suspender tras 72 h o más de tratamiento si lleva 48 h afebril y estable, sin esperar la recuperación de neutrófilos; con foco, la duración del foco', 'ECIL-4'],
    ['ISO', 'T81', 'SITIO OPERATORIO,HERIDA QUIRURGICA,CONSECUTIVA A PROCEDIMIENTO', 'Infección del sitio operatorio', '', '', 'el tratamiento es abrir y drenar; antibiótico sistémico en curso breve solo si hay respuesta sistémica importante; órgano o espacio: según el foco', 'IDSA 2014'],
    ['TUBERCULOSIS', 'A15,A16,A17,A18,A19', 'TUBERCULOSIS,TBC', 'Tuberculosis', '', '', 'esquema de meses: la duración no se evalúa aquí', 'Programa nacional de TB']
  ],
  // Reglas de espectro/indicacion. am: nombre contenido en el antimicrobiano; sindromes: claves de la tabla
  // de duracion; micro: expresion regular sobre el aislamiento (mayusculas, sin tildes); soloSiUnico: solo si
  // es el unico antimicrobiano de la solicitud; salvoCon: no avisar si la solicitud incluye ese antimicrobiano.
  REGLAS_ESPECTRO: [
    { am: 'DAPTOMICINA', sindromes: ['NEUMONIA', 'EMPIEMA'], mensaje: 'DAPTOMICINA no está indicada en neumonía: el surfactante pulmonar la inactiva (ficha técnica; IDSA/ATS 2016)' },
    { am: 'TYGECICLINA', sindromes: ['BACTERIEMIA', 'NEUMONIA', 'CATETER', 'ITU'], mensaje: 'TIGECICLINA no se sugiere en bacteriemia ni en infección urinaria (IDSA 2026) y no está indicada en neumonía nosocomial; advertencia de mayor mortalidad (ficha técnica): solo si no hay alternativa' },
    { am: 'ERTAPENEM', micro: 'PSEUDOMONA|ACINETOBACTER|ENTEROCOC', mensaje: 'ERTAPENEM no tiene actividad frente a Pseudomonas, Acinetobacter ni Enterococcus (ficha técnica)' },
    { am: 'AZTREONAM', micro: 'STAPH|ESTAF|STREPTO|ESTREPTO|ENTEROCOC|GRAM ?POSITIV|SAMR|MRSA', soloSiUnico: true, mensaje: 'AZTREONAM no tiene actividad frente a grampositivos: verificar cobertura' },
    { am: 'CASPOFUNGINA', micro: 'CRYPTOCOC|CRIPTOCOC|MUCOR|RHIZOPUS|HISTOPLASM', mensaje: 'CASPOFUNGINA no tiene actividad frente a Cryptococcus, mucorales ni Histoplasma' },
    { am: 'CASPOFUNGINA', sindromes: ['CRIPTOCOCOSIS', 'HISTOPLASMOSIS'], mensaje: 'CASPOFUNGINA no tiene actividad frente a Cryptococcus ni Histoplasma' },
    { am: 'CEFTAZIDIMA / AVIBACTAM', micro: 'NDM|METALO|MBL|\\bVIM\\b|\\bIMP\\b', salvoCon: 'AZTREONAM', mensaje: 'CEFTAZIDIMA/AVIBACTAM sola no cubre metalo-betalactamasas (NDM, VIM, IMP): asociar aztreonam (IDSA 2026)' },
    { am: 'POLIMIXINA B', micro: 'PROTEUS|SERRATIA|MORGANELLA|PROVIDENCIA|BURKHOLDERIA', mensaje: 'POLIMIXINA B: Proteus, Serratia, Morganella, Providencia y Burkholderia son intrínsecamente resistentes' },
    { am: 'VANCOMICINA', micro: 'E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|PSEUDOMONA|ACINETOBACTER|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|GRAM ?NEGATIV|KPC|BLEE', soloSiUnico: true, mensaje: 'VANCOMICINA no tiene actividad frente a gramnegativos: verificar cobertura' },
    { am: 'LINEZOLID', micro: 'E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|PSEUDOMONA|ACINETOBACTER|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|GRAM ?NEGATIV|KPC|BLEE', soloSiUnico: true, mensaje: 'LINEZOLID no tiene actividad frente a gramnegativos: verificar cobertura' },
    { am: 'DAPTOMICINA', micro: 'E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|PSEUDOMONA|ACINETOBACTER|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|GRAM ?NEGATIV|KPC|BLEE', soloSiUnico: true, mensaje: 'DAPTOMICINA no tiene actividad frente a gramnegativos: verificar cobertura' },
    { am: 'RIFAMPICINA', soloSiUnico: true, exceptoSindromes: ['TUBERCULOSIS'], mensaje: 'RIFAMPICINA no debe usarse en monoterapia: genera resistencia rápidamente' }
  ],
  // Para que esta reservado cada antimicrobiano (docs/antimicrobianos-restringidos.md): aislamientos (micro)
  // y focos (claves de PERTINENCIA) que sustentan su uso; con: acompanante que lo justifica.
  INDICACIONES: [
    { am: 'VANCOMICINA', micro: 'STAPH|ESTAF|SAMR|SARM|MRSA|ENTEROCOC|GRAM ?POSITIV|STREPTO|ESTREPTO|DIFFICILE', sindromes: ['PIEL', 'BACTERIEMIA', 'ENDOCARDITIS', 'MENINGITIS', 'OSTEOMIELITIS', 'CATETER', 'ARTRITIS', 'PROTESIS', 'PIE_DIABETICO', 'ISO'], reserva: 'grampositivos resistentes (SARM, Enterococcus)' },
    { am: 'LINEZOLID', micro: 'STAPH|ESTAF|SAMR|SARM|MRSA|ENTEROCOC|GRAM ?POSITIV|VRE|ERV', sindromes: ['NEUMONIA', 'PIEL'], reserva: 'SARM (incluida neumonía) y enterococo resistente a vancomicina' },
    { am: 'DAPTOMICINA', micro: 'STAPH|ESTAF|SAMR|SARM|MRSA|ENTEROCOC|GRAM ?POSITIV|VRE|ERV', sindromes: ['BACTERIEMIA', 'ENDOCARDITIS', 'PIEL', 'CATETER'], reserva: 'bacteriemia, endocarditis o piel por SARM o enterococo resistente' },
    { am: 'CASPOFUNGINA', micro: 'CANDIDA|ASPERG', sindromes: ['CANDIDEMIA', 'NEUTROPENIA', 'ASPERGILOSIS'], reserva: 'candidiasis invasiva, neutropenia febril o aspergilosis refractaria' },
    { am: 'ANFOTERICINA', micro: 'CANDIDA|CRYPTOCOC|CRIPTOCOC|HISTOPLASM|MUCOR|RHIZOPUS|LEISHMAN|ASPERG', sindromes: ['CRIPTOCOCOSIS', 'HISTOPLASMOSIS', 'CANDIDEMIA', 'NEUTROPENIA', 'ASPERGILOSIS'], reserva: 'micosis invasiva grave (criptococosis, histoplasmosis, mucormicosis, candidiasis) o leishmaniasis visceral' },
    { am: 'ERTAPENEM', micro: 'E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|BLEE|ESBL', sindromes: ['INTRAABDOMINAL', 'ITU', 'PIE_DIABETICO', 'PIEL'], reserva: 'infección intraabdominal, urinaria, de piel o de pie diabético por enterobacterias BLEE' },
    { am: 'AZTREONAM', micro: 'NDM|METALO|MBL|PSEUDOMONA|E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|BLEE|ESBL', sindromes: [], con: 'AVIBACTAM', reserva: 'gramnegativos en alergia grave a betalactámicos o, con ceftazidima/avibactam, metalo-betalactamasas' },
    { am: 'CEFTAZIDIMA / AVIBACTAM', micro: 'KPC|OXA|CARBAPENEM|SERINO|PSEUDOMONA', sindromes: [], reserva: 'enterobacterias con carbapenemasa (KPC, OXA-48) o Pseudomonas multirresistente documentadas' },
    { am: 'TYGECICLINA', micro: 'ACINETOBACTER|KPC|CARBAPENEM|SAMR|SARM|MRSA|VRE|ERV|BLEE', sindromes: ['INTRAABDOMINAL', 'PIEL'], reserva: 'infección intraabdominal o de piel por multirresistentes' },
    { am: 'DORIPENEM', micro: 'PSEUDOMONA|ACINETOBACTER|E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|BLEE|ESBL', sindromes: ['INTRAABDOMINAL', 'ITU'], reserva: 'infección intraabdominal o urinaria complicada por gramnegativos' },
    { am: 'RIFAMPICINA', micro: 'TUBERC|MYCOBACT|MICOBACT|STAPH|ESTAF|SAMR|SARM|MRSA', sindromes: ['TUBERCULOSIS', 'PROTESIS', 'ENDOCARDITIS', 'OSTEOMIELITIS'], reserva: 'tuberculosis o, en combinación, estafilococo sobre material protésico' },
    { am: 'POLIMIXINA B', micro: 'ACINETOBACTER|PSEUDOMONA|KPC|NDM|METALO|CARBAPENEM|PANRESIST|XDR|MDR', sindromes: [], reserva: 'gramnegativos resistentes a carbapenémicos, como último recurso' }
  ],
  // Frecuencia menor que esta (horas) se marca para verificar: "VANCOMICINA c/3 h" suele ser un error de digitacion.
  FRECUENCIA_MINIMA_H: 4
};

/* =====================================================================
   Lectura tolerante de e.namedValues. Las claves son el texto exacto de
   cada pregunta del formulario, que puede traer espacios sobrantes
   (fue la causa de los "-" en el bot de Tecnovigilancia). Se compara
   con los espacios colapsados y sin espacios al inicio/final.
   ===================================================================== */
function normalizarClave(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function campoDelEvento(valores, nombre) {
  var objetivo = normalizarClave(nombre);
  for (var k in valores) {
    if (normalizarClave(k) === objetivo) {
      var v = valores[k];
      var texto = (v && v.length) ? String(v[0]) : '';
      return texto.trim() ? texto.trim() : '';
    }
  }
  return '';
}

// Preguntas del formulario que usa el mensaje (nombres tal como estan en la fila 1 de la hoja).
var CAMPOS = {
  HC: 'Número de Historia Clínica',
  EDAD_ANIOS: 'Edad del paciente en años',
  EDAD_MESES: 'Edad del paciente meses',
  EDAD_DIAS: 'Edad del paciente días',
  PESO_KG: 'Peso en Kg',
  PESO_G: 'Peso en gr',
  CAMA: 'Numero de cama',
  DIAGNOSTICO: 'Diagnóstico CIE10 para la cual se prescribe el antimicrobiano',
  TIPO_INDICACION: 'Indicación del antibiótico',
  FALLA_HEPATICA: 'Falla Hepática',
  AJUSTE_RENAL: 'Ajuste Renal',
  DEP_CREATININA: 'Si en Ajuste Renal, marcó Sí, indique el valor de depuración de Creatinina en (mg/dl), si marcó "No" coloque 0',
  CULTIVOS: 'Cultivos tomados:',
  MICROORGANISMO: 'Microorganismo aislado',
  ORIGEN: 'Origen de la infección?',
  INDICACION: 'Indicación',
  RAZON_CAMBIO: 'Si fue cambiado, cual fue la razón?',
  INTERCONSULTA: '¿Solicitó interconsulta por infectología en Dinámica Gerencial?',
  ESPECIALIDAD: 'Especialidad que prescribe',
  SERVICIO: 'Servicio actual'
};

var SLOTS = [
  { nombre: 'Nombre Antimicrobiano 1', dosis: 'Dosis en miligramos o UI AB1', via: 'Vía de adminsitración de  AM1', frecuencia: 'Frecuencia AM 1 (En Horas)', dias: 'Días ordenados AM1' },
  { nombre: 'Nombre Antimicrobiano 2', dosis: 'Dosis en miligramos o UI AM2', via: 'Vía de adminsitración de  AM2', frecuencia: 'Frecuencia AM 2 (En horas)', dias: 'Días ordenados AM2' },
  { nombre: 'Nombre Antimicrobiano 3', dosis: 'Dosis en miligramos o UI AM3', via: 'Vía de adminsitración de  AM3', frecuencia: 'Frecuencia AM 3 (En horas)', dias: 'Días ordenados AM 3' }
];

/* =====================================================================
   Lista de antimicrobianos restringidos: se lee de la hoja
   'ANTIMICROBIANOS_RESTRINGIDOS' en la matriz (columna A nombre, desde fila 2;
   columna B opcional "dispara_alerta" SI/NO, vacio = SI).
   Devuelve [{ nombre, dispara }]. Si la hoja no existe o falla la lectura,
   se usa CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO. En ambos casos se
   agregan los de CONFIG.RESTRINGIDOS_SIN_ALERTA_PROPIA que no esten en la
   lista, con dispara = false.
   ===================================================================== */
function entradaRestringido(nombre, dispara) {
  return { nombre: String(nombre || '').trim().toUpperCase(), dispara: dispara !== false };
}

function completarSinAlertaPropia(lista) {
  CONFIG.RESTRINGIDOS_SIN_ALERTA_PROPIA.forEach(function(n) {
    var nombre = String(n).trim().toUpperCase();
    if (!lista.some(function(x) { return x.nombre === nombre; })) lista.push(entradaRestringido(nombre, false));
  });
  return lista;
}

function listaRespaldoRestringidos() {
  return completarSinAlertaPropia(CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO.map(function(n) { return entradaRestringido(n, true); }));
}

// Cache de la ejecucion: cada pestana de configuracion se lee una sola vez por ejecucion. Cada formulario es una
// ejecucion nueva de Apps Script, asi que un cambio en la hoja se ve en la siguiente solicitud. Antes se leia en
// cada uso (decenas de lecturas por solicitud con un paciente de muchas prescripciones: 40-60 s).
var CACHE_EJECUCION = {};
function enCacheEjecucion(clave, leer) {
  if (!Object.prototype.hasOwnProperty.call(CACHE_EJECUCION, clave)) CACHE_EJECUCION[clave] = leer();
  return CACHE_EJECUCION[clave];
}
function limpiarCacheEjecucion() { CACHE_EJECUCION = {}; }

// La matriz se abre una vez por ejecucion (cada apertura es una llamada a Google).
function libroProa() {
  return enCacheEjecucion('libro', function() { return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); });
}

function obtenerAntimicrobianosRestringidos() {
  return enCacheEjecucion('restringidos', leerAntimicrobianosRestringidos_);
}

function leerAntimicrobianosRestringidos_() {
  try {
    var hoja = libroProa().getSheetByName(CONFIG.HOJA_ANTIMICROBIANOS_RESTRINGIDOS);
    if (!hoja) {
      Logger.log('No se encontro la hoja "' + CONFIG.HOJA_ANTIMICROBIANOS_RESTRINGIDOS + '", se usa la lista de respaldo.');
      return listaRespaldoRestringidos();
    }
    var ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) {
      Logger.log('La hoja de antimicrobianos restringidos esta vacia, se usa la lista de respaldo.');
      return listaRespaldoRestringidos();
    }
    var valores = hoja.getRange(2, 1, ultimaFila - 1, 2).getValues();
    var lista = [];
    valores.forEach(function(fila) {
      var nombre = String(fila[0] || '').trim().toUpperCase();
      if (!nombre) return;
      var dispara = String(fila[1] || '').trim().toUpperCase() !== 'NO';
      lista.push(entradaRestringido(nombre, dispara));
    });
    return lista.length ? completarSinAlertaPropia(lista) : listaRespaldoRestringidos();
  } catch (err) {
    Logger.log('Error leyendo la hoja de antimicrobianos restringidos, se usa la lista de respaldo: ' + err);
    return listaRespaldoRestringidos();
  }
}

/* =====================================================================
   Rangos de dosis: pestana RANGOS_DOSIS (misma estructura que el respaldo).
   ===================================================================== */
function numeroONulo(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  var n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

function filaARegla(fila) {
  var nombre = String(fila[0] || '').trim().toUpperCase();
  if (!nombre) return null;
  return {
    nombre: nombre,
    minMgKg: numeroONulo(fila[1]), maxMgKg: numeroONulo(fila[2]),
    minMg: numeroONulo(fila[3]), maxMg: numeroONulo(fila[4]),
    ajusteRenal: String(fila[5] || '').trim().toUpperCase(),
    nota: String(fila[6] || '').trim()
  };
}

function obtenerRangosDosis() {
  return enCacheEjecucion('rangos', leerRangosDosis_);
}

function leerRangosDosis_() {
  var respaldo = CONFIG.RANGOS_DOSIS_RESPALDO.map(filaARegla).filter(Boolean);
  try {
    var hoja = libroProa().getSheetByName(CONFIG.HOJA_RANGOS_DOSIS);
    if (!hoja || hoja.getLastRow() < 2) {
      Logger.log('Sin hoja "' + CONFIG.HOJA_RANGOS_DOSIS + '" (o vacia); se usan los rangos de respaldo. Ejecute crearHojaRangosDosis() para crearla.');
      return respaldo;
    }
    var reglas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 7).getValues().map(filaARegla).filter(Boolean);
    return reglas.length ? reglas : respaldo;
  } catch (err) {
    Logger.log('Error leyendo la hoja de rangos de dosis, se usan los de respaldo: ' + err);
    return respaldo;
  }
}

// Crea la pestana RANGOS_DOSIS con la propuesta inicial. No toca la pestana si ya existe.
function crearHojaRangosDosis() {
  var ss = libroProa();
  if (ss.getSheetByName(CONFIG.HOJA_RANGOS_DOSIS)) {
    Logger.log('La pestana ' + CONFIG.HOJA_RANGOS_DOSIS + ' ya existe; no se modifica.');
    return;
  }
  escribirRangosDosis(ss.insertSheet(CONFIG.HOJA_RANGOS_DOSIS));
  Logger.log('Pestana ' + CONFIG.HOJA_RANGOS_DOSIS + ' creada con ' + CONFIG.RANGOS_DOSIS_RESPALDO.length + ' antimicrobianos. Revisar y ajustar los rangos.');
}

// Reemplaza el contenido de la pestana RANGOS_DOSIS por la tabla del codigo (por ejemplo, tras
// actualizar los rangos o las fuentes). Borra lo que el QF haya editado en la pestana: usar a conciencia.
function reescribirHojaRangosDosis() {
  var ss = libroProa();
  var hoja = ss.getSheetByName(CONFIG.HOJA_RANGOS_DOSIS) || ss.insertSheet(CONFIG.HOJA_RANGOS_DOSIS);
  hoja.clearContents();
  escribirRangosDosis(hoja);
  Logger.log('Pestana ' + CONFIG.HOJA_RANGOS_DOSIS + ' reescrita con ' + CONFIG.RANGOS_DOSIS_RESPALDO.length + ' antimicrobianos.');
}

function escribirRangosDosis(hoja) {
  limpiarCacheEjecucion();
  var enc = ['antimicrobiano', 'min_mg_kg_dosis', 'max_mg_kg_dosis', 'min_mg_dosis', 'max_mg_dosis', 'ajuste_renal', 'nota'];
  hoja.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold');
  hoja.setFrozenRows(1);
  var filas = CONFIG.RANGOS_DOSIS_RESPALDO.map(function(f) {
    return f.map(function(v) { return v === null ? '' : v; });
  });
  hoja.getRange(2, 1, filas.length, enc.length).setValues(filas);
  hoja.autoResizeColumns(1, enc.length - 1);
}

// Regla cuyo nombre esta contenido en el del antimicrobiano; si varias aplican, la mas larga
// (ANFOTERICINA B LIPOSOMAL antes que ANFOTERICINA B).
function reglaDosisPara(nombreLimpioAm, reglas) {
  var n = String(nombreLimpioAm || '').toUpperCase();
  var mejor = null;
  reglas.forEach(function(r) {
    if (n.indexOf(r.nombre) > -1 && (!mejor || r.nombre.length > mejor.nombre.length)) mejor = r;
  });
  return mejor;
}

function dentroDe(valor, min, max) {
  if (min !== null && valor < min) return false;
  if (max !== null && valor > max) return false;
  return true;
}

// Numero con coma decimal y sin ceros sobrantes (1000 -> "1000", 14.29 -> "14,3", 4.5 -> "4,5").
function formatoNumero(n, decimales) {
  var d = (decimales === undefined) ? 1 : decimales;
  var s = (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toString();
  return s.replace('.', ',');
}

// Devuelve { mgKg, revisar, referencia }. Solo marca "revisar" si hay regla y la dosis falla
// en todas las reglas definidas para ese antimicrobiano.
function evaluarDosis(nombreLimpioAm, dosis, pesoKg, reglas) {
  var d = numeroONulo(dosis);
  var r = { mgKg: null, revisar: false, referencia: '' };
  if (d === null || d <= 0) return r;
  if (pesoKg !== null && pesoKg > 0) r.mgKg = d / pesoKg;
  var regla = reglaDosisPara(nombreLimpioAm, reglas);
  if (!regla) return r;
  var verificaciones = [];
  var partes = [];
  if (regla.minMg !== null || regla.maxMg !== null) {
    verificaciones.push(dentroDe(d, regla.minMg, regla.maxMg));
    partes.push(rangoTexto(regla.minMg, regla.maxMg) + ' mg/dosis');
  }
  if (r.mgKg !== null && (regla.minMgKg !== null || regla.maxMgKg !== null)) {
    verificaciones.push(dentroDe(r.mgKg, regla.minMgKg, regla.maxMgKg));
    partes.push(rangoTexto(regla.minMgKg, regla.maxMgKg) + ' mg/kg/dosis');
  }
  if (verificaciones.length && !verificaciones.some(function(ok) { return ok; })) {
    r.revisar = true;
    r.referencia = partes.join(' o ');
  }
  return r;
}

function rangoTexto(min, max) {
  if (min !== null && max !== null) return (min === max) ? formatoNumero(min) : formatoNumero(min) + '-' + formatoNumero(max);
  if (min !== null) return '≥ ' + formatoNumero(min);
  return '≤ ' + formatoNumero(max);
}

/* =====================================================================
   Flujo principal
   ===================================================================== */
function notificarNuevaRespuesta(e) {
  var coincidencias = filtrarAntimicrobianosRestringidos(e);
  notificarCaso_(e, coincidencias);
  // Mensaje aparte, tenga o no restringido: tratamiento continuo largo con varias solicitudes.
  notificarTratamientoProlongado(e, coincidencias);
}

// Caso PROA. Si no sale, queda en el registro solo cuando hay un restringido que dispara alerta (con el motivo: no
// supera CONFIG.CASO_DIAS_MINIMOS). Vancomicina o linezolid solos no dejan fila (v1.36.4): no generan mensaje y eran dos
// de cada tres filas del registro.
function notificarCaso_(e, coincidencias) {
  if (!generaCasoProa(e, coincidencias)) {
    if (debeAlertar(coincidencias)) registrarRevision(e, coincidencias, { enviado: false,
      destino: 'no se envía: ' + formatoNumero(diasCasoProa(e, coincidencias), 0) + ' d (caso PROA desde más de ' + CONFIG.CASO_DIAS_MINIMOS + ' d)' });
    return;
  }
  // El mensaje ya se encabeza con "CASO PROA": no lleva la linea de titulo del bot.
  var envio = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, coincidencias), { sinFirma: true });
  registrarRevision(e, coincidencias, { enviado: !!(envio && envio.ok), destino: 'PRODUCCION' });
}

// Revision por tratamiento prolongado, sin modelo (son datos de la matriz y la tabla de duracion): sale al llegar la
// solicitud (el resumen diario de las 7:00 se retiro en la v1.36.0). Un error aqui no afecta al caso PROA.
function notificarTratamientoProlongado(e, coincidencias) {
  try {
    var revision = revisionProlongado(e, coincidencias);
    if (!revision) return;
    var accion = accionProlongado(revision, e, coincidencias), envio = null;
    if (accion === 'ENVIAR') envio = enviarAlertaWhatsApp(revision.mensaje, { sinFirma: true });
    registrarRevision(e, coincidencias, { fuente: FUENTE_PROLONGADO, nivelFinal: revision.nivel, detalle: revision.bloque.join('\n'),
      enviado: !!(envio && envio.ok), destino: accion === 'ENVIAR' ? 'PRODUCCION' : TEXTO_ACCION_PROLONGADO[accion] });
  } catch (err) {
    Logger.log('Revision por tratamiento prolongado no disponible: ' + err);
  }
}

// Nombre del antimicrobiano sin el codigo interno del formulario (" - UT-...") ni la presentacion (pedido del
// referente, 2026-11-16): "CIPROFLOXACINO AMPOLLA 100, 200" y "CIPROFLOXACINO TABLETA" -> "CIPROFLOXACINO";
// "CASPOFUNGINA 50, 70" -> "CASPOFUNGINA". Se corta en la primera palabra de presentacion o en el primer numero
// (nunca la primera palabra), asi que "ANFOTERICINA B" y "CEFTAZIDIMA / AVIBACTAM" no cambian. Como el nombre
// es el mismo, las presentaciones de un medicamento se suman juntas en el seguimiento.
var PRESENTACIONES = /^(AMPOLLAS?|AMP|TABLETAS?|TAB|CAPSULAS?|CAP|VIAL|VIALES|FRASCOS?|SOLUCION|SUSPENSION|POLVO|INYECTABLE|JARABE|GRAGEAS?|SOBRES?|ORAL|BOLSAS?)$/;

function nombreLimpio(valor) {
  if (!valor) return '-';
  var palabras = String(valor).split(' - UT-')[0].trim().split(/\s+/), fin = palabras.length;
  for (var i = 1; i < palabras.length; i++) {
    var w = normalizarTexto(palabras[i]).replace(/[^A-Z0-9]/g, '');
    if (/^\d/.test(w) || PRESENTACIONES.test(w)) { fin = i; break; }
  }
  return palabras.slice(0, fin).join(' ').replace(/[\s,;\/+-]+$/, '');
}

// Primer token del diagnostico, solo letras y numeros, 4 caracteres (A41.9 -> A419, G06.0 -> G060).
function extraerCodigoCIE10(diagnosticoCrudo) {
  if (!diagnosticoCrudo) return '';
  var primerToken = String(diagnosticoCrudo).trim().split(/\s+/)[0];
  var codigo = primerToken.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!/^[A-Z]\d{2}/.test(codigo)) return '';
  return codigo.slice(0, 4);
}

// Codigo CIE10 del diagnostico aunque no venga al principio: primer token, despues cualquier token con
// forma de codigo que exista en la pestana CIE10 y, por ultimo, la descripcion exacta de la pestana.
function codigoCIE10Resuelto(diagnosticoCrudo) {
  return resolverCIE10(diagnosticoCrudo).codigo;
}

// { codigo, via, texto }: via 'escrito' (el codigo esta en el texto), 'descripcion' (el texto es una descripcion
// exacta de la pestana), 'texto' (cruce por palabras, cruceCIE10PorTexto) o '' (sin codigo). texto: las palabras
// corregidas del cruce, para buscar la duracion por palabra clave. Una vez por texto y ejecucion.
function resolverCIE10(diagnosticoCrudo) {
  var vacio = { codigo: '', via: '', texto: '' };
  if (!diagnosticoCrudo) return vacio;
  return enCacheEjecucion('cie10r:' + String(diagnosticoCrudo).slice(0, 300), function() {
    var directo = extraerCodigoCIE10(diagnosticoCrudo);
    if (directo) return { codigo: directo, via: 'escrito', texto: '' };
    var texto = normalizarTexto(diagnosticoCrudo);
    if (!texto || texto === '-') return vacio;
    var tokens = texto.split(/[^A-Z0-9]+/);
    for (var i = 0; i < tokens.length; i++) {
      if (/^[A-Z]\d{2}[0-9X]?$/.test(tokens[i]) && buscarDescripcionCIE10(tokens[i])) return { codigo: tokens[i], via: 'escrito', texto: '' };
    }
    var exacto = codigoCIE10PorDescripcion(texto);
    if (exacto) return { codigo: exacto, via: 'descripcion', texto: '' };
    var cruce = cruceCIE10PorTexto(texto);
    return { codigo: cruce.codigo, via: cruce.codigo ? 'texto' : '', texto: cruce.texto };
  });
}

function codigoCIE10PorDescripcion(texto) {
  if (texto.length < 8) return '';
  var cache = null, clave = 'CIE10D:' + texto.slice(0, 200);
  try { cache = CacheService.getScriptCache(); var enCache = cache.get(clave); if (enCache !== null) return enCache; } catch (err) { cache = null; }
  var codigo = '';
  try {
    var hoja = libroProa().getSheetByName(CONFIG.HOJA_CIE10);
    var ultima = hoja ? hoja.getLastRow() : 0;
    if (ultima >= 2) {
      var celda = hoja.getRange(2, 2, ultima - 1, 1).createTextFinder(texto).matchEntireCell(true).matchCase(false).findNext();
      if (celda) codigo = String(hoja.getRange(celda.getRow(), 1).getValue()).trim().toUpperCase();
    }
  } catch (err2) {
    return '';
  }
  if (cache) { try { cache.put(clave, codigo, CONFIG.CACHE_CIE10_SEG); } catch (err3) {} }
  return codigo;
}

function buscarEnColumnaA(hoja, codigo) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return '';
  var celda = hoja.getRange(2, 1, ultima - 1, 1).createTextFinder(codigo).matchEntireCell(true).matchCase(false).findNext();
  return celda ? String(hoja.getRange(celda.getRow(), 2).getValue()).trim() : '';
}

// Descripcion de un codigo CIE10. Busca solo la celda (TextFinder) en vez de cargar las 12.600
// filas, y guarda el resultado en cache 6 h. Un codigo de 3 caracteres se busca tambien con X
// (J40 -> J40X, como esta en el catalogo).
// ---- Cruce del diagnostico escrito con la pestana CIE10 (v1.35.0) ----
// Cuando el medico no escribe el codigo, se buscan sus palabras en las descripciones de la pestana CIE10, con las
// abreviaturas de CONFIG.CIE10_SINONIMOS, sin las palabras de CONFIG.CIE10_PALABRAS_IGNORADAS y corrigiendo errores de
// digitacion (una letra de diferencia; dos en palabras de 9 o mas) contra el vocabulario de la pestana. Para no
// inventar un diagnostico:
//  - antes, CONFIG.CIE10_EQUIVALENCIAS (textos frecuentes con codigo fijo);
//  - con dos o mas palabras, la descripcion debe contenerlas todas; si ninguna las tiene, se quita UNA del final
//    (el complemento: "INFECCION DE VIAS URINARIAS COMPLICADA" -> N390; quitar mas cambiaba el sentido: "TUMOR FOSA
//    POSTERIOR" terminaba en la fosa nasal);
//  - al final, solo la primera palabra y solo con su descripcion generica ("NEUMONIA" -> J189 "NEUMONIA, NO
//    ESPECIFICADA"; "ACCIDENTE OFIDICO" no termina en un accidente cerebrovascular).
// Entre varias, gana la de mas palabras identicas y menos palabras de sobra, y la "no especificada" antes que "otras"
// (G009 y no G008 "OTRAS MENINGITIS BACTERIANAS"). Si aun asi empatan dos ("TUMOR DE MAMA": benigno o maligno), queda
// sin codigo. En el mensaje sale lo escrito junto al codigo cruzado (formatearDiagnosticoCIE10). probarCruceCIE10()
// muestra el resultado sobre la matriz real (2026-11-22: 419 de 500 con codigo escrito; los errores que mostro el cruce
// llevaron a las reglas de empate, prefijo y una sola palabra quitada).
var CIE10_VACIAS = ['DE', 'DEL', 'LA', 'LAS', 'EL', 'LOS', 'Y', 'E', 'EN', 'POR', 'CON', 'SIN', 'A', 'AL', 'O', 'U', 'NO', 'PARA', 'SU', 'SE',
  'QUE', 'VS', 'MAS', 'OTRA', 'OTRAS', 'OTRO', 'OTROS', 'ESPECIFICADO', 'ESPECIFICADA', 'ESPECIFICADOS', 'ESPECIFICADAS', 'ESPECIFICACION',
  'CLASIFICADO', 'CLASIFICADA', 'CLASIFICADOS', 'CLASIFICADAS', 'PARTE', 'SITIO', 'TIPO', 'DEBIDO', 'DEBIDA', 'DEBIDOS', 'DEBIDAS'];

function palabrasCIE10_(texto) {
  return normalizarTexto(texto).replace(/[^A-Z0-9]+/g, ' ').trim().split(' ').filter(function(w) {
    return w.length >= 2 && !/\d/.test(w) && CIE10_VACIAS.indexOf(w) === -1;
  });
}

// Raiz para comparar singular/plural y masculino/femenino: URINARIAS y URINARIO -> URINARI.
function raizCIE10_(w) { return w.length >= 5 ? w.replace(/S$/, '').replace(/[AO]$/, '') : w; }

// Dos raices equivalen si son iguales o comparten un prefijo de 7 letras o mas que cubre el 75% de la mas corta
// (NEUMONIA ~ NEUMONITIS, INFECCION ~ INFECCIOSA; no NEUTROPENIA ~ NEUTROFILA ni PERITONITIS ~ PERITONEAL).
function raicesEquivalen_(a, b) {
  if (a === b) return true;
  var n = 0, max = Math.min(a.length, b.length);
  while (n < max && a.charAt(n) === b.charAt(n)) n++;
  return n >= 7 && n >= 0.75 * max;
}

// Distancia de edicion con transposiciones (ENFEREMDAD -> ENFERMEDAD es 1); corta en cuanto supera tope.
function distanciaCIE10_(a, b, tope) {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  var d = [], i, j;
  for (i = 0; i <= a.length; i++) { d[i] = [i]; }
  for (j = 0; j <= b.length; j++) d[0][j] = j;
  for (i = 1; i <= a.length; i++) {
    var minFila = tope + 1;
    for (j = 1; j <= b.length; j++) {
      var costo = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      if (d[i][j] < minFila) minFila = d[i][j];
    }
    if (minFila > tope) return tope + 1;
  }
  return d[a.length][b.length];
}

// La pestana CIE10 en memoria (una lectura por ejecucion): filas { codigo, desc, raices }, vocabulario por letra
// inicial (palabra -> veces) y raices -> filas. null si no se puede leer.
function indiceCIE10_() {
  return enCacheEjecucion('indiceCIE10', function() {
    try {
      var hoja = libroProa().getSheetByName(CONFIG.HOJA_CIE10);
      if (!hoja || hoja.getLastRow() < 2) return null;
      var idx = { filas: [], vocab: {}, porLetra: {}, porRaiz: {} };
      hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues().forEach(function(f) {
        var codigo = String(f[0] || '').trim().toUpperCase(), desc = String(f[1] || '').trim();
        if (!/^[A-Z]\d{2}/.test(codigo) || !desc) return;
        var palabras = palabrasCIE10_(desc), raices = [];
        palabras.forEach(function(w) {
          idx.vocab[w] = (idx.vocab[w] || 0) + 1;
          var r = raizCIE10_(w);
          if (raices.indexOf(r) === -1) raices.push(r);
        });
        if (!raices.length) return;
        var i = idx.filas.push({ codigo: codigo, desc: desc, raices: raices }) - 1;
        raices.forEach(function(r) { (idx.porRaiz[r] = idx.porRaiz[r] || []).push(i); });
      });
      Object.keys(idx.vocab).forEach(function(w) { (idx.porLetra[w.charAt(0)] = idx.porLetra[w.charAt(0)] || []).push(w); });
      idx.porPrefijo = {};
      Object.keys(idx.porRaiz).forEach(function(r) { if (r.length >= 7) (idx.porPrefijo[r.slice(0, 7)] = idx.porPrefijo[r.slice(0, 7)] || []).push(r); });
      return idx;
    } catch (err) {
      Logger.log('No se pudo leer la pestana CIE10 para el cruce: ' + err);
      return null;
    }
  });
}

// Palabra corregida contra el vocabulario de la pestana (la mas frecuente a la menor distancia), o la misma.
function corregirPalabraCIE10_(w, idx) {
  if (idx.vocab[w] || w.length < 5) return w;
  var tope = w.length >= 9 ? 2 : 1, mejor = w, mejorD = tope + 1, mejorF = 0;
  (idx.porLetra[w.charAt(0)] || []).forEach(function(v) {
    if (Math.abs(v.length - w.length) > tope) return;
    var d = distanciaCIE10_(w, v, tope);
    if (d < mejorD || (d === mejorD && d <= tope && idx.vocab[v] > mejorF)) { mejor = v; mejorD = d; mejorF = idx.vocab[v]; }
  });
  return mejorD <= tope ? mejor : w;
}

// Palabras del diagnostico listas para buscar: abreviaturas expandidas, sin las ignoradas y corregidas. Las ignoradas
// se quitan antes y despues de corregir, tambien en plural: ESTUDIO no esta en la pestana y se corregia a ESTUDIOS, que
// ya no se ignoraba ("SX FEBRIL EN ESTUDIO" no cruzaba, 2026-11-23).
function palabrasDiagnosticoCIE10_(texto, idx) {
  var sinonimos = CONFIG.CIE10_SINONIMOS || {}, ignoradas = (CONFIG.CIE10_PALABRAS_IGNORADAS || []).map(raizCIE10_);
  var ignorada = function(w) { return ignoradas.indexOf(raizCIE10_(w)) > -1; };
  var palabras = [];
  normalizarTexto(texto).replace(/[^A-Z0-9]+/g, ' ').trim().split(' ').forEach(function(w) {
    (sinonimos[w] || w).split(' ').forEach(function(x) { palabras.push(x); });
  });
  return palabras.filter(function(w) { return w.length >= 3 && !/\d/.test(w) && CIE10_VACIAS.indexOf(w) === -1 && !ignorada(w); })
    .map(function(w) { return corregirPalabraCIE10_(w, idx); })
    .filter(function(w, i, a) { return !ignorada(w) && a.indexOf(w) === i; });
}

// La mejor descripcion que contiene todas las raices (soloGenerica: la que no tiene otra palabra que esa), o null si
// no hay ninguna o si empatan dos.
function mejorDescripcionCIE10_(raices, idx, soloGenerica) {
  // filas con una raiz equivalente; se memoriza por ejecucion (se copia: la interseccion borra claves)
  var filasDe = function(r) {
    idx.memo = idx.memo || {};
    if (!idx.memo[r]) {
      var set = {};
      (idx.porRaiz[r] || []).forEach(function(i) { set[i] = true; });
      (idx.porPrefijo[r.slice(0, 7)] || []).forEach(function(x) { if (x !== r && raicesEquivalen_(r, x)) idx.porRaiz[x].forEach(function(i) { set[i] = true; }); });
      idx.memo[r] = set;
    }
    var copia = {};
    Object.keys(idx.memo[r]).forEach(function(i) { copia[i] = true; });
    return copia;
  };
  var candidatas = filasDe(raices[0]);
  for (var k = 1; k < raices.length; k++) {
    var otras = filasDe(raices[k]);
    Object.keys(candidatas).forEach(function(i) { if (!otras[i]) delete candidatas[i]; });
  }
  // clave: [mas palabras identicas, menos de sobra, sin "OTRAS ..."]; si las dos mejores empatan, es ambiguo
  var puntuadas = [];
  Object.keys(candidatas).forEach(function(i) {
    var f = idx.filas[i];
    if (soloGenerica && f.raices.length !== 1) return;
    var exactas = raices.filter(function(r) { return f.raices.indexOf(r) > -1; }).length;
    var usadas = f.raices.filter(function(x) { return raices.some(function(r) { return raicesEquivalen_(r, x); }); }).length;
    var otrasDesc = /\bOTR[AO]S?\b/.test(normalizarTexto(f.desc).replace(/SIN OTRA ESPECIFICACION/g, '')) ? 1 : 0;
    puntuadas.push({ f: f, clave: [-exactas, f.raices.length - usadas, otrasDesc] });
  });
  if (!puntuadas.length) return null;
  var cmp = function(a, b) { for (var c = 0; c < 3; c++) if (a.clave[c] !== b.clave[c]) return a.clave[c] - b.clave[c]; return 0; };
  puntuadas.sort(cmp);
  if (puntuadas.length > 1 && cmp(puntuadas[0], puntuadas[1]) === 0) return null;
  return puntuadas[0].f;
}

// Firma de las reglas del cruce: cambia con la version del codigo o al editar sinonimos, palabras ignoradas o
// equivalencias en CONFIG, para que la cache no devuelva cruces calculados con reglas viejas (paso el 2026-11-22).
function firmaCIE10_() {
  return enCacheEjecucion('firmaCIE10', function() {
    var t = JSON.stringify([VERSION_BOT, CONFIG.CIE10_SINONIMOS, CONFIG.CIE10_PALABRAS_IGNORADAS, CONFIG.CIE10_EQUIVALENCIAS]), h = 5381;
    for (var i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
    return h.toString(36);
  });
}

// { codigo, texto } del cruce de un diagnostico sin codigo (texto: sus palabras corregidas). Cache de 6 h por texto y
// por firma de las reglas.
function cruceCIE10PorTexto(texto) {
  var cache = null, clave = 'CIE10T' + firmaCIE10_() + ':' + texto.slice(0, 200);
  try { cache = CacheService.getScriptCache(); var enCache = cache.get(clave); if (enCache !== null) return JSON.parse(enCache); } catch (err) { cache = null; }
  var res = { codigo: '', texto: '' };
  var idx = indiceCIE10_();
  if (!idx) return res;
  var palabras = palabrasDiagnosticoCIE10_(texto, idx);
  res.texto = palabras.join(' ');
  // equivalencias fijas (comparadas con el mismo tratamiento de palabras)
  var equivalencias = CONFIG.CIE10_EQUIVALENCIAS || {};
  Object.keys(equivalencias).forEach(function(k) {
    if (!res.codigo && palabrasDiagnosticoCIE10_(k, idx).join(' ') === res.texto && buscarDescripcionCIE10(equivalencias[k])) res.codigo = equivalencias[k];
  });
  var raices = palabras.map(raizCIE10_).filter(function(r, i, a) { return a.indexOf(r) === i; });
  // todas las palabras; si no, sin la ultima (si quedan dos o mas); si no, la primera con su descripcion generica
  var intentos = [raices.length];
  if (raices.length - 1 >= 2) intentos.push(raices.length - 1);
  if (raices.length > 1) intentos.push(1);
  intentos.forEach(function(n) {
    if (res.codigo || !n) return;
    var f = mejorDescripcionCIE10_(raices.slice(0, n), idx, n === 1);
    if (f) res.codigo = f.codigo;
  });
  if (cache) { try { cache.put(clave, JSON.stringify(res), CONFIG.CACHE_CIE10_SEG); } catch (err2) {} }
  return res;
}

// Descripcion de una categoria de 3 caracteres escrita sin subcodigo (K35 -> la de K359, la no especificada), o ''.
function descripcionCategoriaCIE10_(codigo) {
  var idx = indiceCIE10_();
  if (!idx) return '';
  var delGrupo = idx.filas.filter(function(f) { return f.codigo.indexOf(codigo) === 0; });
  var generica = delGrupo.filter(function(f) { return /NO ESPECIFICAD/.test(normalizarTexto(f.desc)); })[0];
  return (generica || delGrupo[0] || {}).desc || '';
}

function buscarDescripcionCIE10(codigo) {
  if (!codigo) return '';
  var cache = null;
  var clave = 'CIE10:' + codigo;
  try {
    cache = CacheService.getScriptCache();
    var enCache = cache.get(clave);
    if (enCache !== null) return enCache;
  } catch (err) {
    cache = null;
  }
  var descripcion = '';
  try {
    var hoja = libroProa().getSheetByName(CONFIG.HOJA_CIE10);
    if (hoja) {
      descripcion = buscarEnColumnaA(hoja, codigo);
      if (!descripcion && codigo.length === 3) descripcion = buscarEnColumnaA(hoja, codigo + 'X');
    }
  } catch (err) {
    Logger.log('Error consultando CIE10 ' + codigo + ': ' + err);
    return '';
  }
  if (cache) {
    try { cache.put(clave, descripcion, CONFIG.CACHE_CIE10_SEG); } catch (err2) {}
  }
  return descripcion;
}

// "G060 - ABSCESO Y GRANULOMA INTRACRANEAL". Si el codigo salio del cruce por palabras, tambien lo que escribio el
// medico: "G039 - MENINGITIS, NO ESPECIFICADA (escrito: MENIGITIS)".
function formatearDiagnosticoCIE10(diagnosticoCrudo) {
  if (!diagnosticoCrudo || diagnosticoCrudo === '-') return diagnosticoCrudo || '-';
  var r = resolverCIE10(diagnosticoCrudo), codigo = r.codigo;
  if (!codigo) return diagnosticoCrudo;
  var descripcion = buscarDescripcionCIE10(codigo), mostrado = (codigo.length === 3) ? codigo + 'X' : codigo;
  // categoria de 3 caracteres sin subcodigo ni "X" en la pestana (K35, K65): la descripcion de la no especificada
  if (!descripcion && codigo.length === 3) { descripcion = descripcionCategoriaCIE10_(codigo); mostrado = codigo; }
  if (!descripcion) return diagnosticoCrudo;
  var escrito = String(diagnosticoCrudo).replace(/\s+/g, ' ').trim();
  return mostrado + ' - ' + descripcion + (r.via === 'texto' ? ' (escrito: ' + (escrito.length > 40 ? escrito.slice(0, 39) + '…' : escrito) + ')' : '');
}

/* =====================================================================
   Lectura de los 3 antimicrobianos de la solicitud
   ===================================================================== */
function leerSlots(e) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var lista = [];
  SLOTS.forEach(function(slot) {
    var nombreCrudo = campoDelEvento(valores, slot.nombre);
    if (!nombreCrudo) return;
    lista.push({
      nombre: nombreLimpio(nombreCrudo),
      dosis: campoDelEvento(valores, slot.dosis) || '-',
      via: campoDelEvento(valores, slot.via) || '-',
      frecuencia: campoDelEvento(valores, slot.frecuencia) || '-',
      dias: campoDelEvento(valores, slot.dias) || '-'
    });
  });
  return lista;
}

// Entrada de la lista (string o { nombre, dispara }) contenida en el nombre del antimicrobiano;
// si varias aplican, la mas larga (ANFOTERICINA B LIPOSOMAL antes que ANFOTERICINA).
function entradaRestringida(nombreLimpioAm, lista) {
  var nombre = String(nombreLimpioAm || '').toUpperCase();
  var mejor = null;
  lista.forEach(function(item) {
    var entrada = (typeof item === 'string') ? entradaRestringido(item, true) : item;
    if (nombre.indexOf(entrada.nombre) > -1 && (!mejor || entrada.nombre.length > mejor.nombre.length)) mejor = entrada;
  });
  return mejor;
}

function esRestringido(nombreLimpioAm, lista) {
  return entradaRestringida(nombreLimpioAm, lista) !== null;
}

// Restringidos de la solicitud, cada uno con dispara (true: la alerta sale por el; false: solo se muestra).
function filtrarAntimicrobianosRestringidos(e) {
  var lista = obtenerAntimicrobianosRestringidos();
  var coincidencias = [];
  leerSlots(e).forEach(function(am) {
    var entrada = entradaRestringida(am.nombre, lista);
    if (!entrada) return;
    am.dispara = entrada.dispara;
    coincidencias.push(am);
  });
  return coincidencias;
}

// Hay alerta solo si al menos un restringido de la solicitud dispara por si mismo.
function debeAlertar(coincidencias) {
  return coincidencias.some(function(am) { return am.dispara !== false; });
}

// Dias del tratamiento continuo de los restringidos que disparan alerta, contando los de esta orden (sin curso
// previo, los dias ordenados). El mayor de la solicitud.
function diasCasoProa(e, coincidencias) {
  var seg = seguimientoPaciente(e), max = 0;
  coincidencias.forEach(function(am) {
    if (am.dispara === false) return;
    var c = seg.porAm[am.nombre], n = numeroONulo(am.dias) || 0;
    var total = (c && c.transcurridos >= 1) ? c.proyectado : n;
    if (total > max) max = total;
  });
  return max;
}

// El caso PROA sale si hay un restringido que dispara alerta y su tratamiento supera CONFIG.CASO_DIAS_MINIMOS.
function generaCasoProa(e, coincidencias) {
  if (!debeAlertar(coincidencias)) return false;
  return !CONFIG.CASO_DIAS_MINIMOS || diasCasoProa(e, coincidencias) > CONFIG.CASO_DIAS_MINIMOS;
}

function acompanantesNoRestringidos(e) {
  var lista = obtenerAntimicrobianosRestringidos();
  return leerSlots(e).filter(function(am) { return !esRestringido(am.nombre, lista); });
}

/* =====================================================================
   Formato de los datos del mensaje
   ===================================================================== */
function edadTexto(anios, meses, dias) {
  var a = numeroONulo(anios), m = numeroONulo(meses), d = numeroONulo(dias);
  var partes = [];
  if (a !== null && a > 0) partes.push(formatoNumero(a, 0) + (a === 1 ? ' año' : ' años'));
  // meses > 11 con anios registrados es un error de digitacion del formulario: no se muestran
  if (m !== null && m > 0 && !(a !== null && a > 0 && m > 11)) partes.push(formatoNumero(m, 0) + (m === 1 ? ' mes' : ' meses'));
  if (partes.length === 0 && d !== null && d > 0) partes.push(formatoNumero(d, 0) + (d === 1 ? ' día' : ' días'));
  return partes.length ? partes.join(' ') : '-';
}

function pesoKgDesde(pesoKg, pesoG) {
  var kg = numeroONulo(pesoKg), g = numeroONulo(pesoG);
  if (kg !== null && kg > 0) return kg;
  if (g !== null && g > 0) return g / 1000;
  return null;
}

// Fecha de fin de una orden: desde la fecha de la solicitud (o desde hoy si no se pasa) mas los dias.
function fechaFin(dias, desde) {
  var n = numeroONulo(dias);
  if (n === null || n <= 0) return '';
  var base = (desde instanceof Date && !isNaN(desde.getTime())) ? desde.getTime() : Date.now();
  var fin = new Date(base + Math.round(n) * 24 * 3600 * 1000);
  return Utilities.formatDate(fin, 'America/Bogota', 'dd/MM/yyyy');
}

function tipoIndicacionTexto(valor) {
  var s = String(valor || '');
  if (/emp[ií]rico/i.test(s)) return 'Empírico';
  if (/etiol/i.test(s)) return 'Etiológico';
  if (/profil/i.test(s)) return 'Profiláctico';
  return s.trim() || '-';
}

function esSi(valor) {
  return /^s[ií]$/i.test(String(valor || '').trim());
}

function capitalizar(s) {
  s = String(s || '').trim();
  if (!s) return '-';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/* =====================================================================
   Coherencia de datos y sugerencia PROA
   ===================================================================== */
// Avisos cuando peso, edad o dosis no cuadran (errores de digitacion del formulario).
function advertenciasCoherencia(pesoKg, edadAnios, edadMeses, esquemas) {
  var avisos = [];
  var a = numeroONulo(edadAnios), m = numeroONulo(edadMeses);
  if (pesoKg !== null) {
    if (pesoKg < CONFIG.PESO_MIN_KG || pesoKg > CONFIG.PESO_MAX_KG) {
      avisos.push('Verificar peso: ' + formatoNumero(pesoKg, 2) + ' kg no es un valor plausible');
    } else if (a !== null && ((a >= 12 && pesoKg < 20) || (a >= 18 && pesoKg < 30))) {
      avisos.push('Verificar peso: ' + formatoNumero(pesoKg, 2) + ' kg no es coherente con ' + formatoNumero(a, 0) + ' años');
    } else if ((a === null || a === 0) && m !== null && m > 0 && m < 12 && pesoKg > 20) {
      avisos.push('Verificar peso: ' + formatoNumero(pesoKg, 2) + ' kg no es coherente con ' + formatoNumero(m, 0) + ' meses');
    }
  }
  esquemas.forEach(function(am) {
    if (am.mgKg !== null && am.mgKg !== undefined && am.mgKg > CONFIG.MG_KG_IMPLAUSIBLE && !/POLIMIXINA/.test(String(am.nombre).toUpperCase())) {
      avisos.push('Verificar dosis o peso: ' + am.nombre + ' ' + am.dosis + ' mg equivalen a ' + formatoNumero(am.mgKg, 0) + ' mg/kg');
    }
  });
  return avisos;
}

// Sugerencia de revaluacion a las 48-72 h para la terapia empirica (time-out antibiotico; guia OPS/OMS
// 2024 de intervenciones PROA). Si hay un acompanante de amplio espectro, se nombra la combinacion.
function sugerenciaPROA(tipoIndicacion, coincidencias, acompanantes) {
  if (!CONFIG.SUGERENCIAS_ACTIVAS) return '';
  if (tipoIndicacion !== 'Empírico') return '';
  var amplios = acompanantes.filter(function(am) { return esRestringido(am.nombre, CONFIG.AMPLIO_ESPECTRO); });
  var restringidos = coincidencias.map(function(am) { return am.nombre; });
  // "combinada" solo cuando de verdad son dos o mas (una revision por tratamiento prolongado puede no traer restringido)
  if (amplios.length && restringidos.length + amplios.length > 1) {
    var combinacion = restringidos.concat(amplios.map(function(am) { return am.nombre; })).join(' + ');
    return 'Sugerencia PROA: terapia empírica combinada (' + combinacion + '). Revaluar a las 48-72 h con el resultado de cultivos para desescalar.';
  }
  if (!CONFIG.SUGERENCIA_EMPIRICO_SOLO) return '';
  return 'Sugerencia PROA: terapia empírica. Revaluar a las 48-72 h con el resultado de cultivos.';
}

/* =====================================================================
   Pertinencia: duracion de referencia por sindrome y espectro
   ===================================================================== */
// Mayusculas, sin tildes, espacios colapsados.
function normalizarTexto(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function listaDe(texto) {
  return String(texto || '').split(',').map(normalizarTexto).filter(Boolean);
}

function filaAPertinencia(fila) {
  var clave = normalizarTexto(fila[0]);
  if (!clave) return null;
  return {
    clave: clave, prefijos: listaDe(fila[1]), palabras: listaDe(fila[2]), sindrome: String(fila[3] || '').trim(),
    min: numeroONulo(fila[4]), max: numeroONulo(fila[5]), nota: String(fila[6] || '').trim(), fuente: String(fila[7] || '').trim()
  };
}

function obtenerPertinencia() {
  return enCacheEjecucion('pertinencia', leerPertinencia_);
}

function leerPertinencia_() {
  var respaldo = CONFIG.PERTINENCIA_RESPALDO.map(filaAPertinencia).filter(Boolean);
  try {
    var hoja = libroProa().getSheetByName(CONFIG.HOJA_PERTINENCIA);
    if (!hoja || hoja.getLastRow() < 2) return respaldo;
    var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 8).getValues().map(filaAPertinencia).filter(Boolean);
    return filas.length ? filas : respaldo;
  } catch (err) {
    Logger.log('Error leyendo la hoja de pertinencia, se usa el respaldo: ' + err);
    return respaldo;
  }
}

// Crea la pestana PERTINENCIA_DURACION con la tabla del codigo. No la toca si ya existe.
function crearHojaPertinencia() {
  var ss = libroProa();
  if (ss.getSheetByName(CONFIG.HOJA_PERTINENCIA)) {
    Logger.log('La pestana ' + CONFIG.HOJA_PERTINENCIA + ' ya existe; no se modifica.');
    return;
  }
  escribirPertinencia(ss.insertSheet(CONFIG.HOJA_PERTINENCIA));
  Logger.log('Pestana ' + CONFIG.HOJA_PERTINENCIA + ' creada con ' + CONFIG.PERTINENCIA_RESPALDO.length + ' sindromes. Debe revisarla el comite PROA.');
}

// Reemplaza la pestana por la tabla del codigo (borra lo editado a mano en ella).
function reescribirHojaPertinencia() {
  var ss = libroProa();
  var hoja = ss.getSheetByName(CONFIG.HOJA_PERTINENCIA) || ss.insertSheet(CONFIG.HOJA_PERTINENCIA);
  hoja.clearContents();
  escribirPertinencia(hoja);
}

function escribirPertinencia(hoja) {
  limpiarCacheEjecucion();
  var enc = ['clave', 'cie10_prefijos', 'palabras_clave', 'sindrome', 'dias_min', 'dias_max', 'nota', 'fuente'];
  hoja.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold');
  hoja.setFrozenRows(1);
  hoja.getRange(2, 1, CONFIG.PERTINENCIA_RESPALDO.length, enc.length).setValues(CONFIG.PERTINENCIA_RESPALDO);
}

// Sindrome del diagnostico: por prefijo CIE10 (el mas largo) y, si no, por palabra clave (la mas larga).
// Sindrome de la tabla de duracion para un diagnostico. Con codigo escrito por el medico manda el prefijo CIE10 mas
// largo y, si no hay, la palabra clave mas larga. Con codigo cruzado por palabras (resolverCIE10 via 'texto') mandan
// primero las palabras clave, que pueden ser mas precisas ("SEPSIS URINARIA" es ITU aunque el cruce de A419), y el
// codigo solo si ninguna coincide.
function sindromePara(diagnosticoCrudo, tabla) {
  var resuelto = resolverCIE10(diagnosticoCrudo), codigo = resuelto.codigo;
  var porCodigo = function() {
    var mejor = null, largo = 0;
    if (codigo) tabla.forEach(function(f) {
      f.prefijos.forEach(function(p) { if (codigo.indexOf(p) === 0 && p.length > largo) { mejor = f; largo = p.length; } });
    });
    return mejor;
  };
  var porPalabras = function() {
    // tambien con las palabras corregidas del cruce (MENIGITIS -> MENINGITIS, SHOCK -> CHOQUE)
    var texto = ' ' + normalizarTexto(diagnosticoCrudo) + (resuelto.texto ? ' ' + resuelto.texto : '') + ' ';
    var mejor = null, largo = 0;
    tabla.forEach(function(f) {
      f.palabras.forEach(function(p) {
        // palabras de hasta 4 letras (ITU, IVU, TBC) deben ir como palabra completa
        var hay = (p.length <= 4) ? texto.indexOf(' ' + p + ' ') > -1 : texto.indexOf(p) > -1;
        if (hay && p.length > largo) { mejor = f; largo = p.length; }
      });
    });
    return mejor;
  };
  return resuelto.via === 'texto' ? (porPalabras() || porCodigo()) : (porCodigo() || porPalabras());
}

// Aislamiento en mayusculas y sin tildes, con el mecanismo de resistencia escrito en palabras llevado a su sigla.
function normalizarAislamiento(microorganismo) {
  return normalizarTexto(microorganismo)
    .replace(/BETA ?-?LACTAMASAS? DE (AMPLIO ESPECTRO|ESPECTRO EXTENDIDO|ESPECTRO AMPLIADO|ESPECTRO AMPLIO)/g, 'BLEE')
    .replace(/PRODUCTORA? DE CARBAPENEMASAS?/g, 'CARBAPENEMASA');
}

function sinAislamiento(microorganismo) {
  var m = normalizarTexto(microorganismo).replace(/[^A-Z0-9 ]/g, '').trim();
  return m === '' || m === '0' || m === 'NO' || m === 'NA' || m === 'N A' || /^NIN/.test(m) || /^NEGATIV/.test(m) || /^SIN /.test(m);
}

// Redaccion de apoyo (sugerencia, no veredicto): decision del referente PROA, 2026-11-14.
// Dias de un antimicrobiano cuyo tratamiento esta en rojo: no se valoran (linea neutra, sin semaforo).
var TEXTO_DIAS_SIN_VALORAR = 'la duración no se valora mientras se revalúa el tratamiento';
var ETIQUETA_NIVEL = ['acorde con la referencia', 'se sugiere verificar', 'se sugiere revaluar'];

// Veredicto de un antimicrobiano frente al aislamiento y el foco (CONFIG.INDICACIONES y REGLAS_ESPECTRO).
// Devuelve { nivel: 0 pertinente | 1 verificar | 2 no pertinente, texto } o null si no hay criterio.
function esAntifungico(nombre) {
  var n = String(nombre).toUpperCase();
  return CONFIG.ANTIFUNGICOS.some(function(a) { return n.indexOf(a) > -1; });
}

function veredictoTratamiento(am, esquemas, sindrome, tipoIndicacion, microorganismo, contexto) {
  var nombre = String(am.nombre).toUpperCase();
  var micro = normalizarAislamiento(microorganismo);
  var nombres = esquemas.map(function(x) { return String(x.nombre).toUpperCase(); });
  var fallo = null;
  CONFIG.REGLAS_ESPECTRO.forEach(function(r) {
    if (fallo || nombre.indexOf(r.am) === -1) return;
    if (r.soloSiUnico && esquemas.length !== 1) return;
    if (r.salvoCon && nombres.some(function(n) { return n.indexOf(r.salvoCon) > -1; })) return;
    if (r.sindromes && !(sindrome && r.sindromes.indexOf(sindrome.clave) > -1)) return;
    if (r.exceptoSindromes && sindrome && r.exceptoSindromes.indexOf(sindrome.clave) > -1) return;
    if (r.micro && !(new RegExp(r.micro)).test(micro)) return;
    fallo = r.mensaje;
  });
  if (fallo) return { nivel: 2, texto: fallo };

  var ind = null;
  CONFIG.INDICACIONES.forEach(function(i) { if (!ind && nombre.indexOf(i.am) > -1) ind = i; });
  if (!ind) return null;
  if (tipoIndicacion === 'Profiláctico') return { nivel: 1, texto: 'restringido usado en profilaxis; reservado para ' + ind.reserva };
  if (ind.con && nombres.some(function(n) { return n.indexOf(ind.con) > -1; })) return { nivel: 0, texto: 'combinación indicada (' + ind.reserva + ')' };
  var cultivos = normalizarTexto(contexto && contexto.cultivos);
  if (esAntifungico(nombre) && /CANDIDA|LEVADURA/.test(micro) && /URO|ORINA/.test(cultivos) && !/HEMO|SANGRE/.test(cultivos)) {
    return { nivel: 1, texto: 'Candida solo en urocultivo suele ser colonización; confirmar infección, tomar hemocultivos y cambiar la sonda' +
      (nombre.indexOf('CASPOFUNGINA') > -1 ? '; las equinocandinas no llegan a la orina' : '') + ' (IDSA 2016; CDC)' };
  }
  if (!sinAislamiento(microorganismo)) {
    if ((new RegExp(ind.micro)).test(micro)) return { nivel: 0, texto: 'indicado para el aislamiento registrado' };
    return { nivel: 1, texto: 'el aislamiento registrado no lo justifica; reservado para ' + ind.reserva };
  }
  if (sindrome && ind.sindromes.indexOf(sindrome.clave) > -1) {
    return { nivel: 0, texto: 'indicado para el foco; sin aislamiento, revaluar con cultivos' };
  }
  return { nivel: 1, texto: 'sin aislamiento ni foco que lo sustente; reservado para ' + ind.reserva };
}

// Lineas de pertinencia del mensaje: veredicto global, tratamiento y dias. esquemas: todos los
// antimicrobianos de la solicitud. Semaforo: verde pertinente, amarillo verificar, rojo intervenir.
function evaluarPertinencia(diagnosticoCrudo, tipoIndicacion, microorganismo, esquemas) {
  return analisisPertinencia(diagnosticoCrudo, tipoIndicacion, microorganismo, esquemas).lineas;
}

// { lineas, nivel (-1 sin criterio, 0 pertinente, 1 verificar, 2 intervenir), espectroRojo (una regla de
// espectro descarta algun antimicrobiano) }.
var TEXTO_PROFILAXIS = 'Profilaxis quirúrgica: máximo 24 h (OMS 2018; CDC 2017)';

// "5-7"
function rangoDuracion(sindrome) {
  return (sindrome.min !== null && sindrome.min !== sindrome.max) ? formatoNumero(sindrome.min, 0) + '-' + formatoNumero(sindrome.max, 0) : formatoNumero(sindrome.max, 0);
}

// "Neumonía: 5-7 d (ATS/IDSA 2019)"
function encabezadoDuracion(sindrome) {
  return sindrome.sindrome + ': ' + rangoDuracion(sindrome) + ' d (' + sindrome.fuente + ')';
}


// Total de dias frente al maximo del sindrome: amarillo si lo supera, rojo si lo duplica. La misma regla
// para el caso PROA y para la revision por tratamiento prolongado.
function valorarDuracion(sindrome, total) {
  if (total > sindrome.max) {
    var doble = total >= 2 * sindrome.max;
    // en rojo, directo; en amarillo se agrega la nota con las excepciones que justifican extender
    return { nivel: doble ? 2 : 1, texto: 'supera la referencia; revaluar duración' + (!doble && sindrome.nota ? ' · ' + sindrome.nota : '') };
  }
  return { nivel: 0, texto: 'dentro de la referencia' };
}

// Duracion total de un tratamiento frente a la referencia de sus patologias (los diagnosticos de cada
// solicitud): { encabezado, nivel (-1 sin referencia), texto }. Si el tratamiento paso por varias, se compara
// con la de mayor duracion (una osteomielitis justifica semanas aunque la orden actual diga celulitis).
function duracionFrenteReferencia(diagnosticos, tipoIndicacion, antifungico, total) {
  var sin = { encabezado: '', nivel: -1, texto: '', motivo: 'Sin duración de referencia en las tablas para estos diagnósticos' };
  if (!CONFIG.PERTINENCIA_ACTIVA) return sin;
  if (tipoIndicacion === 'Profiláctico') {
    return { encabezado: TEXTO_PROFILAXIS, nivel: total > 1 ? 2 : 0, texto: total > 1 ? 'supera las 24 h de la profilaxis' : 'dentro de la referencia',
      motivo: total > 1 ? 'Supera las 24 h de la profilaxis quirúrgica' : 'Dentro de las 24 h de la profilaxis quirúrgica' };
  }
  var tabla = obtenerPertinencia(), vistos = {}, sindromes = [];
  [].concat(diagnosticos).forEach(function(dx) {
    var s = sindromePara(dx, tabla);
    if (s && !vistos[s.clave]) { vistos[s.clave] = true; sindromes.push(s); }
  });
  if (!sindromes.length) return sin;
  if (antifungico) {
    sindromes = sindromes.filter(function(s) { return CONFIG.SINDROMES_FUNGICOS.indexOf(s.clave) > -1; });
    if (!sindromes.length) return { encabezado: '', nivel: -1, texto: 'sin duración de referencia para un antifúngico en este foco',
      motivo: 'Sin duración de referencia para un antifúngico en este foco' };
  }
  var conMax = sindromes.filter(function(s) { return s.max !== null; });
  if (!conMax.length) {
    var s0 = sindromes[0];
    return { encabezado: s0.nota ? s0.sindrome + ': ' + s0.nota + ' (' + s0.fuente + ')' : '', nivel: -1, texto: '',
      motivo: 'Sin duración fija de referencia para ' + minusculaInicial(s0.sindrome) };
  }
  var elegido = conMax.reduce(function(a, b) { return b.max > a.max ? b : a; });
  // las demas patologias ya se ven en la lista de solicitudes; aqui solo se dice que es la mas larga
  var nivel = valorarDuracion(elegido, total).nivel;
  return { encabezado: elegido.sindrome + ' ' + rangoDuracion(elegido) + ' d (' + elegido.fuente + ')' +
    (conMax.length > 1 ? ', la más larga de sus patologías' : ''),
    nivel: nivel, texto: ['dentro de la referencia', 'supera la referencia', 'duplica la referencia'][nivel],
    motivo: ['Dentro de la duración de referencia', 'Supera la duración de referencia', 'Más del doble de la duración de referencia'][nivel] +
      ' para ' + minusculaInicial(elegido.sindrome) + ' (' + rangoDuracion(elegido) + ' d)' };
}

function minusculaInicial(t) { t = String(t || ''); return t.charAt(0).toLowerCase() + t.slice(1); }

// Datos del tratamiento continuo en cada antimicrobiano de la solicitud: diasAcumulados (dias ya recibidos +
// los de esta orden) y diagnosticosCurso, para el analisis de las tablas.
function asignarCursos(esquemas, seg) {
  esquemas.forEach(function(am) {
    var curso = seg.porAm[am.nombre];
    if (!curso || curso.transcurridos < 1) return;
    am.diasAcumulados = curso.proyectado;
    am.diagnosticosCurso = curso.episodio.solicitudes.map(function(x) { return x.dx; });
  });
}

// "*66 d* de antibiótico continuo": la suma de las prescripciones de la lista 🔁 (de una a la siguiente, en dias
// calendario) mas los dias ordenados en esta solicitud.
function textoDiasContinuos(am) {
  return '*' + formatoNumero(am.diasAcumulados, 0) + ' d* de ' + (esAntifungico(am.nombre) ? 'antifúngico' : 'antibiótico') + ' continuo';
}

// Prescripciones del tratamiento continuo en orden: "1. ERTAPENEM 17/09-08/10 · 21 d". Sin la patologia de cada una
// (los codigos CIE10 sueltos confundian; 2026-11-22): el diagnostico actual va en su propia linea. ultima = esta orden
// { texto, inicio (ms), dias } o null (el caso PROA ya la muestra en las lineas 💊). Con negrita, los dias van entre
// asteriscos (en la revision se ponen al armar el mensaje; el registro guarda el texto sin formato).
function lineasPrescripciones(episodio, ultima, negrita) {
  var b = function(t) { return negrita ? '*' + t + '*' : t; };
  var lineas = episodio.prescripciones.map(function(tr) {
    return tr.desde + (tr.hasta > tr.desde ? '-' + tr.hasta : '') + '. ' + tr.esquema + ' ' + fechaCorta(new Date(tr.inicio)) + '-' +
      fechaCorta(new Date(tr.fin)) + ' · ' + b(formatoNumero(tr.dias, 0) + ' d');
  });
  if (!ultima) return lineas;
  var dias = (ultima.dias !== null && ultima.dias > 0) ? ultima.dias : 0;
  lineas.push((episodio.solicitudes.length + 1) + '. ' + ultima.texto + ' ' + fechaCorta(new Date(ultima.inicio)) +
    (dias > 0 ? '-' + fechaCorta(new Date(ultima.inicio + dias * 24 * 3600 * 1000)) + ' · ' + b(formatoNumero(dias, 0) + ' d') : '') + ' (esta orden)');
  return lineas;
}

// Dias por antimicrobiano en el tratamiento continuo, contando esta orden (pedido del referente):
// "Por antimicrobiano: ERTAPENEM *52 d* · MEROPENEM *14 d*". Cada antimicrobiano suma los dias de las prescripciones
// en que estuvo (en una combinacion, cada uno cuenta sus dias: dias de terapia, DOT), asi que la suma puede pasar el
// total de dias de antibiotico continuo. Primero los de esta orden; luego de mayor a menor. '' si ningun
// antimicrobiano aparece en mas de una prescripcion (contando esta orden): entonces la linea solo repetiria la lista.
function lineaPorAntimicrobiano(episodio, actuales, negrita) {
  var b = function(t) { return negrita ? '*' + t + '*' : t; };
  var veces = {}, repite = false;
  var contar = function(nm) { veces[nm] = (veces[nm] || 0) + 1; if (veces[nm] > 1) repite = true; };
  episodio.prescripciones.forEach(function(tr) { tr.esquema.split(' + ').forEach(contar); });
  actuales.forEach(function(am) { contar(am.nombre); });
  if (!repite) return '';
  var suma = {}, orden = [], esta = {};
  var agregar = function(nombre, d) { if (!(nombre in suma)) { suma[nombre] = 0; orden.push(nombre); } suma[nombre] += d; };
  episodio.solicitudes.forEach(function(x) { x.nombres.forEach(function(nm) { agregar(nm, x.dias); }); });
  actuales.forEach(function(am) {
    var n = numeroONulo(am.dias);
    agregar(am.nombre, (n !== null && n > 0) ? n : 0);
    esta[am.nombre] = true;
  });
  orden.sort(function(a, c) { return ((esta[c] ? 1 : 0) - (esta[a] ? 1 : 0)) || (suma[c] - suma[a]); });
  return 'Por antimicrobiano: ' + orden.map(function(nm) { return nm + ' ' + b(formatoNumero(suma[nm], 0) + ' d'); }).join(' · ');
}

// Referencia de duracion del caso: la del diagnostico actual o, si el tratamiento continuo de algun
// antibacteriano paso por otras patologias (am.diagnosticosCurso), la de mayor duracion. Es la misma regla
// de la revision por tratamiento prolongado, para que los dos mensajes digan lo mismo.
function sindromeDeDuracion(sindrome, esquemas) {
  var tabla = obtenerPertinencia(), candidatos = (sindrome && sindrome.max !== null) ? [sindrome] : [];
  esquemas.forEach(function(am) {
    if (esAntifungico(am.nombre)) return;
    (am.diagnosticosCurso || []).forEach(function(dx) {
      var s = sindromePara(dx, tabla);
      if (s && s.max !== null) candidatos.push(s);
    });
  });
  if (!candidatos.length) return sindrome;
  // ante empate gana el diagnostico actual (es el primero)
  return candidatos.reduce(function(a, b) { return b.max > a.max ? b : a; });
}

function analisisPertinencia(diagnosticoCrudo, tipoIndicacion, microorganismo, esquemas, contexto) {
  var vacio = { lineas: [], nivel: -1, espectroRojo: false, encabezadoDias: '', rojos: [] };
  if (!CONFIG.PERTINENCIA_ACTIVA) return vacio;
  var E = function(cp) { return String.fromCodePoint(cp); };
  var color = [E(0x1F7E2), E(0x1F7E1), E(0x1F534)];
  var sindrome = sindromePara(diagnosticoCrudo, obtenerPertinencia());
  var sindromeDias = sindromeDeDuracion(sindrome, esquemas);
  var peor = -1, tratamiento = [], dias = [], espectroRojo = false, rojos = [];
  var neutro = E(0x26AA);
  var sinValorar = function(am, n) { dias.push(neutro + ' ' + am.nombre + ' ' + formatoNumero(n, 0) + ' d: ' + TEXTO_DIAS_SIN_VALORAR); };
  // Con seguimiento (am.diasAcumulados), la duracion que se compara es la del curso completo.
  var etiquetaDias = function(am, n) {
    // el desglose por fechas va en la linea de seguimiento; aqui solo el total del tratamiento continuo
    return am.diasAcumulados > n ? am.nombre + ' · ' + textoDiasContinuos(am) : am.nombre + ' ' + formatoNumero(n, 0) + ' d';
  };
  var marcar = function(lista, nivel, texto) { lista.push(color[nivel] + ' ' + texto); if (nivel > peor) peor = nivel; };

  esquemas.forEach(function(am) {
    var v = veredictoTratamiento(am, esquemas, sindrome, tipoIndicacion, microorganismo, contexto);
    if (v) { marcar(tratamiento, v.nivel, am.nombre + ': ' + v.texto); if (v.nivel === 2) { espectroRojo = true; rojos.push(am.nombre); } }
  });
  if (tipoIndicacion === 'Etiológico' && sinAislamiento(microorganismo)) {
    marcar(tratamiento, 1, 'Indicación etiológica sin microorganismo registrado');
  }

  var soloAntifungico = 0;
  var conDias = esquemas.filter(function(am) { var n = numeroONulo(am.dias); return n !== null && n > 0; });
  var encabezadoDias = '';
  if (tipoIndicacion === 'Profiláctico') {
    encabezadoDias = TEXTO_PROFILAXIS;
    conDias.forEach(function(am) {
      var n = numeroONulo(am.dias);
      if (rojos.indexOf(am.nombre) > -1) { sinValorar(am, n); return; }
      if (n > 1) marcar(dias, 2, am.nombre + ' ' + formatoNumero(n, 0) + ' d: supera las 24 h de la profilaxis; revaluar');
      else marcar(dias, 0, am.nombre + ' ' + formatoNumero(n, 0) + ' d: dentro de la referencia');
    });
  } else if (sindromeDias && sindromeDias.max !== null) {
    encabezadoDias = encabezadoDuracion(sindromeDias) + (sindromeDias !== sindrome ? ', la más larga de sus patologías' : '');
    conDias.forEach(function(am) {
      var n = numeroONulo(am.dias);
      if (rojos.indexOf(am.nombre) > -1) { sinValorar(am, n); return; }
      // los antifungicos se comparan con el diagnostico actual (sus cursos son aparte de los antibacterianos)
      var ref = esAntifungico(am.nombre) ? sindrome : sindromeDias;
      if (esAntifungico(am.nombre) && (!ref || ref.max === null || CONFIG.SINDROMES_FUNGICOS.indexOf(ref.clave) === -1)) {
        dias.push(neutro + ' ' + etiquetaDias(am, n) + ': sin duración de referencia para un antifúngico en este foco');
        soloAntifungico++;
        return;
      }
      var v = valorarDuracion(ref, am.diasAcumulados > n ? am.diasAcumulados : n);
      marcar(dias, v.nivel, etiquetaDias(am, n) + ': ' + v.texto);
    });
  } else if (sindrome && sindrome.nota) {
    encabezadoDias = sindrome.sindrome + ': ' + sindrome.nota + ' (' + sindrome.fuente + ')';
  }

  // Si ninguna linea de dias se comparo con la referencia bacteriana, esa referencia no se muestra.
  if (soloAntifungico > 0 && soloAntifungico === dias.length) encabezadoDias = '';
  if (peor < 0 && !encabezadoDias && dias.length === 0) return vacio;
  // lineas[0] es el titulo con el semaforo, el mismo que encabeza el mensaje; el resto es el cuerpo.
  var lineas = [color[Math.max(peor, 0)] + ' *' + capitalizar(ETIQUETA_NIVEL[Math.max(peor, 0)]) + '*'];
  tratamiento.forEach(function(l) { lineas.push(l); });
  if (encabezadoDias) lineas.push(E(0x1F4CF) + ' ' + encabezadoDias);
  dias.forEach(function(l) { lineas.push(l); });
  return { lineas: lineas, nivel: peor, espectroRojo: espectroRojo, encabezadoDias: encabezadoDias, rojos: rojos };
}

/* =====================================================================
   Mensaje
   ===================================================================== */
/* =====================================================================
   Seguimiento por paciente y registro de revisiones
   ===================================================================== */
// Fecha de una celda de la matriz (Date) o del evento ("dd/mm/aaaa h:mm:ss"). null si no se entiende.
function fechaDe(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  var m = String(v || '').match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
}

function fechaCorta(d) {
  return Utilities.formatDate(d, 'America/Bogota', 'dd/MM');
}

// ---- Regla del tratamiento continuo: una sola, la usan los mensajes (seguimientoPaciente) y el informe semanal
// (IA_PROA.gs). Si cambia (p. ej. la tolerancia), cambia en los dos. ----
// Dia calendario (hora de Colombia, la del script): los dias coinciden con las fechas que se muestran (08/10 a 22/10 son
// 14 d aunque la primera orden sea de madrugada y la segunda de noche).
function diaCalendario(t) {
  var d = new Date(t);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
}

// Inicio (ms) del tratamiento continuo que llega hasta el momento t: se retrocede mientras alguna orden anterior de los
// ultimos CONFIG.SEGUIMIENTO_DIAS dias termine (fecha + dias + CONFIG.SEGUIMIENTO_TOLERANCIA_DIAS) en o despues del
// inicio conocido. ordenes: [{ fecha (Date) o t (ms), dias }]; una orden sin dias cuenta 1; las de t en adelante no cuentan.
function inicioTratamientoContinuo(ordenes, t) {
  var dia = 864e5, tolerancia = CONFIG.SEGUIMIENTO_TOLERANCIA_DIAS * dia, ventana = t - CONFIG.SEGUIMIENTO_DIAS * dia;
  var lista = ordenes.map(function(o) { return { t: o.t !== undefined ? o.t : o.fecha.getTime(), dias: o.dias }; })
    .filter(function(o) { return o.t < t - 1000 && o.t >= ventana; });
  var inicio = t, cambio = true;
  while (cambio) {
    cambio = false;
    lista.forEach(function(o) { if (o.t < inicio && o.t + (o.dias || 1) * dia + tolerancia >= inicio) { inicio = o.t; cambio = true; } });
  }
  return inicio;
}

// Dias de tratamiento continuo ya recibidos al momento t (sin contar la orden de t).
function diasTratamientoPrevio(ordenes, t) {
  return diaCalendario(t) - diaCalendario(inicioTratamientoContinuo(ordenes, t));
}

// Solicitudes previas de la misma historia clinica en los ultimos CONFIG.SEGUIMIENTO_DIAS dias.
// Devuelve { previas, lineas (para el mensaje), historia (texto de cada solicitud previa, en orden),
// porAm: { nombre: { inicio, transcurridos, proyectado } } }. La duracion se cuenta sobre el tratamiento
// continuo del paciente, aunque haya cambiado de antimicrobiano (antibacterianos y antifungicos por separado).
// Se calcula una vez por evento (queda en e._seguimiento). Solo lee la matriz; si falla, devuelve vacio.
function seguimientoPaciente(e) {
  if (e && e._seguimiento) return e._seguimiento;
  var res = { previas: 0, lineas: [], historia: [], porAm: {} };
  if (e) e._seguimiento = res;
  if (!CONFIG.SEGUIMIENTO_ACTIVO || !e) return res;
  try {
    var valores = e.namedValues || {};
    var hc = String(campoDelEvento(valores, CAMPOS.HC) || '').replace(/\s+/g, '');
    if (!hc || hc === '-' || /^0+$/.test(hc)) return res;
    var hoja = libroProa().getSheetByName(CONFIG.HOJA_RESPUESTAS);
    if (!hoja) return res;
    var ultima = hoja.getLastRow(), columnas = hoja.getLastColumn();
    if (ultima < 2) return res;
    var encabezados = hoja.getRange(1, 1, 1, columnas).getValues()[0].map(normalizarClave);
    var col = function(nombre) { return encabezados.indexOf(normalizarClave(nombre)); };
    var cHc = col(CAMPOS.HC);
    if (cHc < 0) return res;
    var ahora = fechaDe(campoDelEvento(valores, 'Marca temporal')) || new Date();
    var filaActual = (e.range && e.range.getRow) ? e.range.getRow() : -1;
    var dia = 24 * 3600 * 1000;
    var desde = ahora.getTime() - CONFIG.SEGUIMIENTO_DIAS * dia;
    var celdas = hoja.getRange(2, cHc + 1, ultima - 1, 1).createTextFinder(hc).matchEntireCell(true).findAll() || [];
    var previas = [], solicitudes = [];
    // Dos lecturas en bloque en vez de una por fila (cada lectura a la hoja tarda): primero la columna de fechas
    // del tramo donde esta la HC, despues solo las filas que caen en la ventana de SEGUIMIENTO_DIAS.
    var enVentana = [], filasHc = celdas.slice(-40).map(function(c) { return c.getRow(); }).filter(function(f) { return f !== filaActual; });
    if (filasHc.length) {
      var r0 = Math.min.apply(null, filasHc), r1 = Math.max.apply(null, filasHc);
      var fechas = hoja.getRange(r0, 1, r1 - r0 + 1, 1).getValues();
      enVentana = filasHc.filter(function(f) {
        var fecha = fechaDe(fechas[f - r0][0]);
        return fecha && fecha.getTime() < ahora.getTime() - 1000 && fecha.getTime() >= desde;
      });
    }
    var v0 = enVentana.length ? Math.min.apply(null, enVentana) : 0;
    var filasBloque = enVentana.length ? hoja.getRange(v0, 1, Math.max.apply(null, enVentana) - v0 + 1, columnas).getValues() : [];
    enVentana.forEach(function(f) {
      var fila = filasBloque[f - v0];
      var fecha = fechaDe(fila[0]);
      if (!fecha) return;
      var dato = function(nombre) { var c = col(nombre); return c < 0 ? '' : String(fila[c] === null || fila[c] === undefined ? '' : fila[c]).trim(); };
      var items = [];
      SLOTS.forEach(function(slot) {
        var nombre = nombreLimpio(dato(slot.nombre));
        if (!nombre || nombre === '-') return;
        var p = { fecha: fecha, nombre: nombre, dias: numeroONulo(dato(slot.dias)), dosis: dato(slot.dosis), frecuencia: dato(slot.frecuencia),
          dx: dato(CAMPOS.DIAGNOSTICO) };
        previas.push(p);
        items.push(nombre + ' ' + (p.dosis || '-') + ' mg cada ' + (p.frecuencia || '-') + ' h por ' + (p.dias !== null ? formatoNumero(p.dias, 0) + ' d' : '-'));
      });
      if (items.length === 0) return;
      var razon = dato(CAMPOS.RAZON_CAMBIO);
      solicitudes.push({ fecha: fecha, texto: fechaCorta(fecha) + ': ' + items.join(' + ') + ' · diagnóstico ' + (dato(CAMPOS.DIAGNOSTICO) || '-') +
        ' · aislamiento ' + (dato(CAMPOS.MICROORGANISMO) || '-') + ' · ' + tipoIndicacionTexto(dato(CAMPOS.TIPO_INDICACION)) +
        ' · ' + (dato(CAMPOS.INDICACION) || '-') + (razon ? ' (razón registrada: ' + razon + ')' : '') + ' · ' + (dato(CAMPOS.SERVICIO) || '-') });
    });
    if (previas.length === 0) return res;
    previas.sort(function(a, b) { return b.fecha.getTime() - a.fecha.getTime(); });
    solicitudes.sort(function(a, b) { return a.fecha.getTime() - b.fecha.getTime(); });
    res.previas = solicitudes.length;
    res.historia = solicitudes.map(function(x) { return x.texto; });

    // Inicio del tratamiento continuo y dias calendario: la regla compartida con el informe semanal.
    var inicioContinuo = function(lista) { return inicioTratamientoContinuo(lista, ahora.getTime()); };
    var diaCal = diaCalendario;
    var diasDesde = function(inicio) { return diaCal(ahora.getTime()) - diaCal(inicio); };

    var E = function(cp) { return String.fromCodePoint(cp); };
    var actuales = leerSlots(e);
    var detalle = [], continuos = [], enEpisodio = {};
    [false, true].forEach(function(antifungico) {
      var delTipo = actuales.filter(function(am) { return esAntifungico(am.nombre) === antifungico; });
      if (delTipo.length === 0) return;
      var previasTipo = previas.filter(function(p) { return esAntifungico(p.nombre) === antifungico; });
      var inicioEpisodio = inicioContinuo(previasTipo);
      var transcurridosEpisodio = diasDesde(inicioEpisodio);
      var maxDias = 0;
      // Solicitudes del tratamiento continuo, una por dia calendario (dos ordenes el mismo dia cuentan como
      // una; una orden previa del mismo dia que esta es esta misma solicitud, repetida o corregida).
      var solicitudesEp = [], mismoDia = false;
      if (transcurridosEpisodio >= 1) {
        previasTipo.filter(function(p) { return p.fecha.getTime() >= inicioEpisodio; })
          .sort(function(a, b) { return a.fecha.getTime() - b.fecha.getTime(); })
          .forEach(function(p) {
            var d = diaCal(p.fecha.getTime()), t = p.fecha.getTime(), ult = solicitudesEp[solicitudesEp.length - 1];
            if (ult && ult.dia === d) {
              // misma solicitud con varios antimicrobianos: se suman; una orden posterior del mismo dia la reemplaza
              if (ult.t === t) { if (ult.nombres.indexOf(p.nombre) === -1) ult.nombres.push(p.nombre); }
              else { ult.t = t; ult.nombres = [p.nombre]; if (p.dx) ult.dx = p.dx; }
              return;
            }
            solicitudesEp.push({ dia: d, t: t, inicio: t, nombres: [p.nombre], dx: p.dx });
          });
        var mismoDia = solicitudesEp.some(function(x) { return x.dia === diaCal(ahora.getTime()); });
        solicitudesEp = solicitudesEp.filter(function(x) { return x.dia !== diaCal(ahora.getTime()); });
        solicitudesEp.forEach(function(x, i) {
          x.fin = (i < solicitudesEp.length - 1) ? solicitudesEp[i + 1].inicio : ahora.getTime();
          x.dias = diaCal(x.fin) - diaCal(x.inicio);
        });
      }
      // mismoDia: el paciente ya tuvo hoy otra orden de este tratamiento (la revision ya salio con ella)
      // Prescripciones para mostrar: las renovaciones seguidas del mismo esquema van juntas
      // ("2-3. CEFTAZIDIMA / AVIBACTAM 14/10-22/10 · 8 d"). Su suma son los dias ya recibidos.
      var prescripciones = [];
      solicitudesEp.forEach(function(x, i) {
        var esquema = x.nombres.join(' + '), ult = prescripciones[prescripciones.length - 1];
        if (ult && ult.esquema === esquema) { ult.hasta = i + 1; ult.fin = x.fin; ult.dias += x.dias; return; }
        prescripciones.push({ desde: i + 1, hasta: i + 1, esquema: esquema, inicio: x.inicio, fin: x.fin, dias: x.dias });
      });
      var episodio = { antifungico: antifungico, inicio: inicioEpisodio, transcurridos: transcurridosEpisodio, solicitudes: solicitudesEp,
        prescripciones: prescripciones, mismoDia: mismoDia };
      delTipo.forEach(function(am) {
        var n = numeroONulo(am.dias);
        if (n !== null && n > maxDias) maxDias = n;
        var mismas = previas.filter(function(p) { return p.nombre === am.nombre; });
        res.porAm[am.nombre] = { inicio: fechaCorta(new Date(inicioEpisodio)), transcurridos: transcurridosEpisodio,
          proyectado: transcurridosEpisodio + ((n !== null && n > 0) ? n : 0), solicitudes: solicitudesEp.length + 1, episodio: episodio };
        if (mismas.length === 0) return;
        var horas = (ahora.getTime() - mismas[0].fecha.getTime()) / 3600000;
        if (horas < 12) {
          detalle.push(E(0x26A0) + E(0xFE0F) + ' ' + am.nombre + ': también solicitado hace ' + (horas < 1 ? 'menos de 1 h' : formatoNumero(Math.round(horas), 0) + ' h') +
            ' (' + (mismas[0].dosis || '-') + ' mg cada ' + (mismas[0].frecuencia || '-') + ' h' + (mismas[0].dias ? ', ' + formatoNumero(mismas[0].dias, 0) + ' d' : '') + '); posible solicitud repetida');
        }
        if (transcurridosEpisodio < 1 && horas >= 12) {
          detalle.push(E(0x1F5C2) + E(0xFE0F) + ' ' + am.nombre + ': curso previo el ' + fechaCorta(mismas[0].fecha) + (mismas[0].dias ? ' (' + formatoNumero(mismas[0].dias, 0) + ' d)' : ''));
        }
      });
      // Caso PROA (formato simple, decision del referente 2026-11-22): las prescripciones ANTERIORES a esta orden (esta
      // ya va en las lineas 💊), el total con esta orden y los dias por antimicrobiano solo si alguno se repite.
      if (transcurridosEpisodio >= 1) {
        previasTipo.forEach(function(p) { if (p.fecha.getTime() >= inicioEpisodio) enEpisodio[p.nombre] = true; });
        var antes = lineasPrescripciones(episodio, null, true);
        var titulo = E(0x1F501) + ' ' + (antifungico ? 'Antifúngico antes de esta orden' : 'Antes de esta orden');
        var bloque = antes.length === 1 ? [titulo + ': ' + antes[0].replace(/^\d+(-\d+)?\. /, '')] : [titulo + ':'].concat(antes);
        bloque.push(E(0x23F1) + E(0xFE0F) + ' Con esta orden: *' + formatoNumero(transcurridosEpisodio + maxDias, 0) + ' d* de ' +
          (antifungico ? 'antifúngico' : 'antibiótico') + ' continuo');
        var porAm = lineaPorAntimicrobiano(episodio, delTipo, true);
        if (porAm) bloque.push(porAm);
        continuos.push(bloque);
      }
    });
    // Otros antimicrobianos del paciente que no estan en esta orden ni en su tratamiento continuo: los que siguen
    // vigentes van "en curso" (p. ej. un antifungico a la par del antibiotico); los demas, "ya terminados".
    var nombresActuales = actuales.map(function(am) { return am.nombre; });
    var enCursoAf = [], enCursoAb = [], terminados = [], vistos = {};
    previas.forEach(function(p) {   // de la mas reciente a la mas antigua
      if (nombresActuales.indexOf(p.nombre) > -1 || vistos[p.nombre] || enEpisodio[p.nombre]) return;
      vistos[p.nombre] = true;
      var vigente = p.dias && p.fecha.getTime() + p.dias * dia > ahora.getTime();
      var texto = p.nombre + ' desde ' + fechaCorta(p.fecha) + (p.dias ? ' (' + formatoNumero(p.dias, 0) + ' d)' : '');
      if (!vigente) terminados.push(texto);
      else if (esAntifungico(p.nombre)) enCursoAf.push(texto);
      else enCursoAb.push(texto);
    });
    if (enCursoAf.length) detalle.push(E(0x1F344) + ' Antifúngico en curso: ' + enCursoAf.join('; '));
    if (enCursoAb.length) detalle.push(E(0x1F489) + ' Antibiótico en curso: ' + enCursoAb.join('; '));
    if (terminados.length) detalle.push(E(0x1F5C2) + E(0xFE0F) + ' Ya terminados: ' + terminados.slice(0, 4).join('; '));
    res.lineas = [].concat.apply([], continuos).concat(detalle);
  } catch (err) {
    Logger.log('Seguimiento por paciente no disponible: ' + err);
  }
  return res;
}

// Tratamiento continuo del paciente al momento de esta solicitud, si esta es al menos la
// CONFIG.PROLONGADO_MIN_SOLICITUDES-esima del tratamiento y ya lleva mas de CONFIG.PROLONGADO_DIAS dias:
// { dias (ya recibidos), proyectado (con esta orden), solicitudes (contando esta), antifungico, episodio,
// nuevos (antimicrobianos de la solicitud que el paciente no venia recibiendo) }. null si no o si esta desactivado.
function tratamientoProlongado(e) {
  if (!CONFIG.PROLONGADO_ACTIVO || !e) return null;
  if (e._prolongado !== undefined) return e._prolongado;
  var seg = seguimientoPaciente(e), historia = seg.historia.join(' \n '), mejor = null;
  // los de CONFIG.PROLONGADO_EXCLUIDOS no generan la revision (sus dias si cuentan en la historia)
  var slots = leerSlots(e).filter(function(am) { return !excluidoDeRevision(am.nombre); });
  slots.forEach(function(am) {
    var c = seg.porAm[am.nombre];
    if (c && c.transcurridos > CONFIG.PROLONGADO_DIAS && c.solicitudes >= (CONFIG.PROLONGADO_MIN_SOLICITUDES || 1) &&
        (!mejor || c.transcurridos > mejor.dias || (c.transcurridos === mejor.dias && c.proyectado > mejor.proyectado))) {
      mejor = { dias: c.transcurridos, proyectado: c.proyectado, solicitudes: c.solicitudes, antifungico: esAntifungico(am.nombre),
        episodio: c.episodio };
    }
  });
  if (mejor) {
    mejor.nuevos = slots.filter(function(am) { return historia.indexOf(am.nombre) === -1; }).map(function(am) { return am.nombre; });
    if (CONFIG.PROLONGADO_SOLO_CAMBIO && mejor.nuevos.length === 0) mejor = null;
  }
  e._prolongado = mejor;
  return mejor;
}

function excluidoDeRevision(nombre) {
  var n = normalizarTexto(nombre);
  return (CONFIG.PROLONGADO_EXCLUIDOS || []).some(function(x) { return n.indexOf(normalizarTexto(x)) > -1; });
}

// Revision por tratamiento prolongado de una solicitud: { hc, nivel, bloque, mensaje } o null.
// bloque: lineas sin formato del paciente, las que guarda el registro (la primera identifica al paciente);
// mensaje: el mismo bloque como mensaje de un solo paciente. Una revision por paciente y dia.
function revisionProlongado(e, coincidenciasOpt) {
  var p = tratamientoProlongado(e);
  if (!p || p.episodio.mismoDia) return null;
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var campo = function(clave) { return campoDelEvento(valores, CAMPOS[clave]) || '-'; };
  var E = function(cp) { return String.fromCodePoint(cp); };
  var dia = 24 * 3600 * 1000;
  var pesoKg = pesoKgDesde(campo('PESO_KG'), campo('PESO_G'));
  var fechaSolicitud = fechaDe(campoDelEvento(valores, 'Marca temporal')) || new Date();
  var dxActual = campoDelEvento(valores, CAMPOS.DIAGNOSTICO);
  var actuales = leerSlots(e).filter(function(am) { return esAntifungico(am.nombre) === p.antifungico; });

  var dur = duracionFrenteReferencia(p.episodio.solicitudes.map(function(x) { return x.dx; }).concat([dxActual]),
    tipoIndicacionTexto(campo('TIPO_INDICACION')), p.antifungico, p.proyectado);
  var nivel = dur.nivel >= 0 ? dur.nivel : 1;   // sin referencia para sus patologias, se sugiere verificar

  // Formato simple (decision del referente, 2026-11-22). El registro guarda estas lineas sin negrita:
  // [0] paciente, [1] diagnostico, [2] dias, [3] motivo del color, la lista, avisos, por antimicrobiano y 📏 (solo registro).
  var cama = campo('CAMA'), servicio = campo('SERVICIO'), tipo = p.antifungico ? 'antifúngico' : 'antibiótico';
  var bloque = ['HC ' + campo('HC') + ' · ' + edadTexto(campo('EDAD_ANIOS'), campo('EDAD_MESES'), campo('EDAD_DIAS')) +
    (servicio !== '-' ? ' · ' + servicio : '') + (cama !== '-' ? ' · Cama ' + cama : '')];
  bloque.push(E(0x1F4CB) + ' ' + diagnosticoCorto(dxActual || '-'));
  bloque.push(E(0x23F1) + E(0xFE0F) + ' Lleva ' + formatoNumero(p.dias, 0) + ' d de ' + tipo +
    (p.proyectado > p.dias ? '; con esta orden llegaría a ' + formatoNumero(p.proyectado, 0) + ' d' : ''));
  var color = [E(0x1F7E2), E(0x1F7E1), E(0x1F534)];
  bloque.push(color[nivel] + ' ' + dur.motivo);
  var diasOrden = p.proyectado - p.dias;
  lineasPrescripciones(p.episodio, { texto: actuales.map(function(am) {
    var d = numeroONulo(am.dosis);
    return am.nombre + ' ' + (d !== null ? formatoNumero(d, 2) + ' mg' : am.dosis) + ' ' + viaCorta(am.via) + ' ' + frecuenciaCorta(am.frecuencia);
  }).join(' + '), inicio: fechaSolicitud.getTime(), dias: diasOrden }, false).forEach(function(l) { bloque.push(l); });
  actuales.forEach(function(am) { if (avisoFrecuencia(am)) bloque.push(E(0x26A0) + E(0xFE0F) + ' ' + avisoFrecuencia(am)); });
  var porAm = lineaPorAntimicrobiano(p.episodio, actuales, false);
  if (porAm) bloque.push(porAm);
  bloque.push(E(0x1F4CF) + ' ' + (dur.encabezado
    ? dur.encabezado + (dur.nivel >= 0 ? ': ' + formatoNumero(p.proyectado, 0) + ' d ' + dur.texto : '')
    : (dur.texto ? capitalizar(dur.texto) : 'Sin duración de referencia en las tablas para estas patologías')));
  return { hc: String(campo('HC')).replace(/\s+/g, ''), nivel: nivel, bloque: bloque, mensaje: mensajeProlongado({ nivel: nivel, bloque: bloque }) };
}

// Mensaje de la revision de duracion ("REVISION DE DURACION DE TTO", nombre elegido por el referente). Formato simple
// (2026-11-22): paciente, diagnostico, dias que lleva y con esta orden, motivo del color, la lista y, si algun
// antimicrobiano se repite, los dias por antimicrobiano. Corto y sin lineas en blanco para que WhatsApp no lo corte;
// los dias en negrita. La linea 📏 (referencia completa con su fuente) queda solo en el registro. item: { nivel, bloque }.
function mensajeProlongado(item) {
  var E = function(cp) { return String.fromCodePoint(cp); };
  var color = [E(0x1F7E2), E(0x1F7E1), E(0x1F534)];
  var nivel = (item.nivel >= 0 && item.nivel <= 2) ? item.nivel : 1;
  var lineas = ['*' + E(0x1F4C6) + ' REVISIÓN DE DURACIÓN DE TTO*', color[nivel] + ' *' + item.bloque[0] + '*'];
  item.bloque.slice(1).forEach(function(l) {
    if (l.indexOf(E(0x1F4CF)) === 0) return;
    if (l.indexOf(E(0x23F1)) === 0 || l.indexOf('Por antimicrobiano:') === 0) l = l.replace(/(\d+ d)\b/g, '*$1*');
    else if (/^\d+(-\d+)?\. /.test(l)) l = l.replace(/ · (\d+ d)\b/, ' · *$1*');
    lineas.push(l);
  });
  return lineas.join('\n');
}

// Que se hace con la revision: 'CASO' (la solicitud tiene un restringido: va por el caso PROA, que trae la misma lista
// de prescripciones; decision del referente: la revision es para los que no estan en el listado), 'ENVIAR', 'VERDE'
// (dentro de la referencia: no se envia) o 'REPETIDO' (el paciente ya tuvo revision en los ultimos
// CONFIG.PROLONGADO_REPETIR_DIAS dias).
function accionProlongado(revision, e, coincidencias) {
  if (!CONFIG.PROLONGADO_CON_CASO && debeAlertar(coincidencias || filtrarAntimicrobianosRestringidos(e))) return 'CASO';
  if (revision.nivel === 0 && !CONFIG.PROLONGADO_ENVIAR_VERDES) return 'VERDE';
  if (prolongadoRevisadoReciente(revision.hc, fechaDe(campoDelEvento(e.namedValues || {}, 'Marca temporal')) || new Date())) return 'REPETIDO';
  return 'ENVIAR';
}

var TEXTO_ACCION_PROLONGADO = {
  CASO: 'no se envía: tiene restringido (va por el caso PROA si supera ' + CONFIG.CASO_DIAS_MINIMOS + ' d)',
  ENVIAR: 'se envía al grupo',
  VERDE: 'no se envía: dentro de la referencia de sus patologías',
  REPETIDO: 'no se envía: el paciente ya tuvo revisión en los últimos días'
};

// true si la historia clinica ya tuvo una revision por tratamiento prolongado enviada en los ultimos
// CONFIG.PROLONGADO_REPETIR_DIAS dias (segun la marca temporal de la solicitud, en REGISTRO_REVISIONES).
function prolongadoRevisadoReciente(hc, fecha) {
  var dias = CONFIG.PROLONGADO_REPETIR_DIAS;
  if (!dias || !hc) return false;
  var hoja = libroProa().getSheetByName(CONFIG.HOJA_REGISTRO);
  if (!hoja || hoja.getLastRow() < 2) return false;
  var col = function(n) { return ENCABEZADOS_REGISTRO.indexOf(n); };
  var celdas = hoja.getRange(2, col('Historia clínica') + 1, hoja.getLastRow() - 1, 1).createTextFinder(hc).matchEntireCell(true).findAll() || [];
  return celdas.some(function(celda) {
    var fila = hoja.getRange(celda.getRow(), 1, 1, ENCABEZADOS_REGISTRO.length).getValues()[0];
    var f = fechaDe(fila[col('Marca temporal de la solicitud')]);
    var estado = String(fila[col('Enviado al grupo')]);
    return fila[col('Fuente del análisis')] === FUENTE_PROLONGADO && estado === 'SI' &&
      f && Math.abs(fecha.getTime() - f.getTime()) < dias * 24 * 3600 * 1000;
  });
}

var FUENTE_PROLONGADO = 'TRATAMIENTO PROLONGADO';

var ENCABEZADOS_REGISTRO = ['Fecha de registro', 'Marca temporal de la solicitud', 'Historia clínica', 'Servicio', 'Especialidad', 'Diagnóstico',
  'Microorganismo', 'Tipo de indicación', 'Antimicrobianos restringidos', 'Acompañantes', 'Semáforo tablas', 'Semáforo final', 'Fuente del análisis',
  'Detalle', 'Solicitudes previas', 'Enviado al grupo', 'Destino', 'Modelo', 'Tokens de entrada', 'Tokens de salida', 'Costo aproximado USD',
  'Días de tratamiento continuo'];

// Una fila por solicitud con restringido que dispara alerta y por revision de duracion en la pestana CONFIG.HOJA_REGISTRO (la crea si no
// existe). datos: { tablas, revision, detalle, enviado, destino, costo }. Nunca interrumpe el flujo.
function registrarRevision(e, coincidencias, datos) {
  if (!CONFIG.REGISTRO_ACTIVO) return;
  try {
    datos = datos || {};
    var valores = (e && e.namedValues) ? e.namedValues : {};
    var c = function(nombre) { return campoDelEvento(valores, nombre) || ''; };
    var libro = libroProa();
    var hoja = libro.getSheetByName(CONFIG.HOJA_REGISTRO);
    if (!hoja) { hoja = libro.insertSheet(CONFIG.HOJA_REGISTRO); hoja.appendRow(ENCABEZADOS_REGISTRO); }
    else if (hoja.getLastColumn() < ENCABEZADOS_REGISTRO.length) hoja.getRange(1, 1, 1, ENCABEZADOS_REGISTRO.length).setValues([ENCABEZADOS_REGISTRO]);
    var seg = seguimientoPaciente(e), diasContinuos = 0;
    Object.keys(seg.porAm).forEach(function(k) { if (seg.porAm[k].transcurridos > diasContinuos) diasContinuos = seg.porAm[k].transcurridos; });
    var semaforo = ['VERDE', 'AMARILLO', 'ROJO'];
    var tablas = datos.tablas || analisisPertinenciaDesdeEvento(e, coincidencias);
    var nivelFinal = datos.nivelFinal !== undefined ? datos.nivelFinal : tablas.nivel;
    hoja.appendRow([new Date(), c('Marca temporal'), c(CAMPOS.HC), c(CAMPOS.SERVICIO), c(CAMPOS.ESPECIALIDAD),
      diagnosticoCorto(c(CAMPOS.DIAGNOSTICO)), c(CAMPOS.MICROORGANISMO), tipoIndicacionTexto(c(CAMPOS.TIPO_INDICACION)),
      coincidencias.map(function(am) { return am.nombre + ' ' + am.dias + ' d'; }).join('; '),
      acompanantesNoRestringidos(e).map(function(am) { return am.nombre + ' ' + am.dias + ' d'; }).join('; '),
      tablas.nivel < 0 ? 'SIN CRITERIO' : semaforo[tablas.nivel], nivelFinal < 0 ? 'SIN CRITERIO' : semaforo[nivelFinal], datos.fuente || 'TABLAS',
      // el bloque de la revision por tratamiento prolongado es el mensaje completo: no se recorta
      String(datos.detalle || tablas.lineas.join(' | ')).replace(/[*_]/g, '').slice(0, datos.fuente === FUENTE_PROLONGADO ? 8000 : 1500), seg.previas,
      datos.estadoEnvio || (datos.enviado ? 'SI' : 'NO'), datos.destino || '',
      // Modelo, tokens y costo: columnas de cuando la IA analizaba cada caso; quedan vacias (el informe semanal
      // guarda los suyos en la pestana INFORMES_PROA)
      '', '', '', '',
      diasContinuos]);
  } catch (err) {
    Logger.log('No se pudo registrar la revision: ' + err);
  }
}

// Frecuencia que casi seguro es un error de digitacion (pedido del referente, 2026-11-22): mas de una dosis cada
// CONFIG.FRECUENCIA_MINIMA_H horas, p. ej. "VANCOMICINA c/3 h". Es un dato a verificar, no un juicio clinico. '' si no aplica.
function avisoFrecuencia(am) {
  var n = numeroONulo(String(am.frecuencia || '').replace(/[^\d.,]/g, ''));
  if (n === null || n <= 0 || n >= (CONFIG.FRECUENCIA_MINIMA_H || 0)) return '';
  return 'Verificar frecuencia de ' + am.nombre + ': ' + frecuenciaCorta(am.frecuencia);
}

// Aviso de dosis que el rango general no detecta. '' si no aplica.
function avisoDosisEspecifico(am, pesoKg, esquemas) {
  var nombre = String(am.nombre).toUpperCase();
  var dosis = numeroONulo(am.dosis), dias = numeroONulo(am.dias);
  if (nombre.indexOf('CASPOFUNGINA') > -1 && dosis === 70 && dias !== null && dias > 1 && (pesoKg === null || pesoKg <= 80) &&
      !esquemas.some(function(x) { return String(x.nombre).toUpperCase().indexOf('RIFAMPICINA') > -1; })) {
    return '70 mg es la dosis de carga del día 1; el mantenimiento habitual es 50 mg/día (70 mg/día si pesa más de 80 kg o recibe rifampicina; ficha técnica): verificar';
  }
  return '';
}

function analisisPertinenciaDesdeEvento(e, coincidenciasOpt) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var coincidencias = coincidenciasOpt || filtrarAntimicrobianosRestringidos(e);
  var micro = campoDelEvento(valores, CAMPOS.MICROORGANISMO);
  var esquemas = coincidencias.concat(acompanantesNoRestringidos(e));
  asignarCursos(esquemas, seguimientoPaciente(e));
  return analisisPertinencia(campoDelEvento(valores, CAMPOS.DIAGNOSTICO), tipoIndicacionTexto(campoDelEvento(valores, CAMPOS.TIPO_INDICACION)),
    micro === '-' ? '' : micro, esquemas, { cultivos: campoDelEvento(valores, CAMPOS.CULTIVOS) });
}

// Via abreviada para el mensaje (Intravenoso -> IV).
function viaCorta(via) {
  var v = normalizarTexto(via);
  if (/INTRAVEN/.test(v)) return 'IV';
  if (/ORAL|^VO$/.test(v)) return 'VO';
  if (/INTRAMUSCUL/.test(v)) return 'IM';
  if (/SUBCUT/.test(v)) return 'SC';
  if (/INHAL|NEBULIZ/.test(v)) return 'INH';
  return String(via || '-').trim();
}

function frecuenciaCorta(valor) {
  var s = String(valor || '').trim();
  if (!s || s === '-') return '-';
  var m = s.match(/^(?:cada\s+)?(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)?\.?$/i);
  return m ? 'c/' + m[1].replace('.', ',') + ' h' : s;
}

// "1000 mg (14,3 mg/kg) IV c/24 h"
function esquemaCorto(am) {
  var dosisNum = numeroONulo(am.dosis);
  var dosis = (dosisNum !== null) ? formatoNumero(dosisNum, 2) + ' mg' : am.dosis;
  if (am.mgKg !== null && am.mgKg !== undefined) dosis += ' (' + formatoNumero(am.mgKg, 1) + ' mg/kg)';
  return dosis + ' ' + viaCorta(am.via) + ' ' + frecuenciaCorta(am.frecuencia);
}

// "7 d hasta 23/11/2026"
function diasCorto(valor, desde) {
  var n = numeroONulo(valor);
  if (n === null) return String(valor || '-').trim() || '-';
  var fin = fechaFin(n, desde);
  // sin el ano, igual que las fechas de la lista de prescripciones (15/11-22/11)
  return formatoNumero(n, 0) + ' d' + (fin ? ' hasta ' + String(fin).replace(/\/\d{4}$/, '') : '');
}

// "L031 · Celulitis de otras partes de los miembros"
function diagnosticoCorto(diagnosticoCrudo) {
  var texto = formatearDiagnosticoCIE10(diagnosticoCrudo);
  var m = String(texto).match(/^([A-Z]\d{2}[0-9X]?) - (.+)$/);
  return m ? m[1] + ' · ' + capitalizar(m[2]) : texto;
}

// Datos del paciente del caso PROA: primero donde esta (servicio y cama) y su diagnostico.
// campo(clave) devuelve el valor de CAMPOS[clave] o '-'.
function lineasPaciente(campo, pesoKg) {
  var E = function(cp) { return String.fromCodePoint(cp); };
  var cama = campo('CAMA'), especialidad = campo('ESPECIALIDAD');
  var lineas = [E(0x1F4CD) + ' ' + campo('SERVICIO') + (cama !== '-' ? ' · Cama ' + cama : '')];
  lineas.push(E(0x1F4CB) + ' ' + diagnosticoCorto(campo('DIAGNOSTICO')));
  lineas.push(E(0x1F4C4) + ' HC ' + campo('HC') + ' · ' + edadTexto(campo('EDAD_ANIOS'), campo('EDAD_MESES'), campo('EDAD_DIAS')) +
    ' · ' + ((pesoKg !== null) ? formatoNumero(pesoKg, 2) + ' kg' : '-') + (especialidad !== '-' ? ' · ' + especialidad : ''));
  // "BETALACTAMASA DE AMPLIO ESPECTRO" -> "BLEE" (solo en el mensaje)
  var micro = String(campo('MICROORGANISMO')).replace(/beta ?-?lactamasas? de (amplio espectro|espectro extendido|espectro ampliado|espectro amplio)/gi, 'BLEE');
  lineas.push(E(0x1F9A0) + ' ' + [micro, campo('CULTIVOS'), tipoIndicacionTexto(campo('TIPO_INDICACION')), campo('ORIGEN')]
    .filter(function(x) { return x && x !== '-'; }).join(' · '));
  var conInterconsulta = esSi(campo('INTERCONSULTA'));
  if (String(campo('INDICACION')).toUpperCase() === 'CAMBIO') {
    lineas.push(E(0x1F504) + ' Cambio: ' + capitalizar(campo('RAZON_CAMBIO')) + ' · ' +
      (conInterconsulta ? E(0x1F9EA) + ' Infectología: Sí' : E(0x26A0) + E(0xFE0F) + ' Sin interconsulta a Infectología'));
  } else {
    lineas.push(conInterconsulta ? E(0x1F9EA) + ' Interconsulta a Infectología: Sí' : E(0x26A0) + E(0xFE0F) + ' Sin interconsulta a Infectología');
  }
  return lineas;
}

// Mensaje del caso PROA: datos del paciente, esquema, prescripciones del tratamiento continuo y avisos; con
// CONFIG.CASO_ANALISIS, tambien el veredicto y el analisis de pertinencia de las tablas.
function construirMensajeDesdeEvento(e, coincidenciasOpt) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  function campo(clave) {
    var v = campoDelEvento(valores, CAMPOS[clave]);
    return v ? v : '-';
  }
  var coincidencias = coincidenciasOpt || filtrarAntimicrobianosRestringidos(e);
  var acompanantes = acompanantesNoRestringidos(e);
  var reglas = obtenerRangosDosis();
  var pesoKg = pesoKgDesde(campo('PESO_KG'), campo('PESO_G'));
  var esquemas = coincidencias.concat(acompanantes);
  // la fecha de fin se cuenta desde la solicitud, igual que en la linea de seguimiento
  var fechaSolicitud = fechaDe(campoDelEvento(valores, 'Marca temporal'));

  var E = function(cp) { return String.fromCodePoint(cp); };
  var adv = E(0x26A0) + E(0xFE0F), color = [E(0x1F7E2), E(0x1F7E1), E(0x1F534)];

  // mg/kg de cada antimicrobiano: lo usan la linea del esquema y los avisos de coherencia
  coincidencias.forEach(function(am) { am.ev = evaluarDosis(am.nombre, am.dosis, pesoKg, reglas); am.mgKg = am.ev.mgKg; });
  acompanantes.forEach(function(am) { am.mgKg = (pesoKg !== null && numeroONulo(am.dosis) !== null) ? numeroONulo(am.dosis) / pesoKg : null; });

  // Con CONFIG.CASO_ANALISIS = false (decision del referente) el mensaje va solo con datos.
  var analisis = CONFIG.CASO_ANALISIS ? analisisPertinenciaDesdeEvento(e, coincidencias) : { lineas: [], nivel: -1 };
  var cuerpoAnalisis = analisis.lineas.slice(1);
  var nivel = (analisis.nivel === undefined || analisis.nivel === null) ? -1 : analisis.nivel;

  var lineas = ['*' + E(0x1F6A8) + ' CASO PROA · ' +
    (coincidencias.map(function(am) { return capitalizar(am.nombre); }).join(' + ') || 'Antimicrobiano restringido') + '*'];
  if (nivel >= 0) lineas.push(color[nivel] + ' *' + capitalizar(ETIQUETA_NIVEL[nivel]) + '*');
  lineasPaciente(campo, pesoKg).forEach(function(l) { lineas.push(l); });
  var tipoIndicacion = tipoIndicacionTexto(campo('TIPO_INDICACION'));

  if (esSi(campo('AJUSTE_RENAL')) || esSi(campo('FALLA_HEPATICA'))) {
    var extras = [];
    if (esSi(campo('AJUSTE_RENAL'))) {
      // Sin el valor de depuracion (DepCr): decision del referente PROA, 2026-11-07.
      var texto = 'Ajuste renal: Sí';
      var sinAjuste = coincidencias.filter(function(am) {
        var regla = reglaDosisPara(am.nombre, reglas);
        return regla && regla.ajusteRenal === 'NO';
      }).map(function(am) { return am.nombre; });
      if (sinAjuste.length) texto += ' · ' + sinAjuste.join(', ') + ' no requiere ajuste renal';
      extras.push(texto);
    }
    if (esSi(campo('FALLA_HEPATICA'))) extras.push('Falla hepática: Sí');
    lineas.push(E(0x1F4A7) + ' ' + extras.join(' · '));
  }

  lineas.push('');
  coincidencias.forEach(function(am) {
    lineas.push(E(0x1F48A) + ' ' + am.nombre + ' ' + esquemaCorto(am) + ' · ' + diasCorto(am.dias, fechaSolicitud).replace(/^(\d+ d)\b/, '*$1*'));
    if (am.ev.revisar) lineas.push('   ' + adv + ' Dosis fuera del rango de referencia (' + am.ev.referencia + ')');
    var avisoDosis = avisoDosisEspecifico(am, pesoKg, esquemas);
    if (avisoDosis) lineas.push('   ' + adv + ' ' + avisoDosis);
    if (avisoFrecuencia(am)) lineas.push('   ' + adv + ' ' + avisoFrecuencia(am));
  });
  acompanantes.forEach(function(am) {
    lineas.push(E(0x2795) + ' ' + am.nombre + ' ' + esquemaCorto(am) + ' · ' + diasCorto(am.dias, fechaSolicitud).replace(/^(\d+ d)\b/, '*$1*'));
    if (avisoFrecuencia(am)) lineas.push('   ' + adv + ' ' + avisoFrecuencia(am));
  });
  seguimientoPaciente(e).lineas.forEach(function(l) { lineas.push(l); });

  if (cuerpoAnalisis.length) lineas.push('');
  cuerpoAnalisis.forEach(function(l) { lineas.push(l); });

  var avisos = advertenciasCoherencia(pesoKg, campo('EDAD_ANIOS'), campo('EDAD_MESES'), esquemas);
  // Revaluar a las 48-72 h es para el inicio de la terapia empirica; con mas de CONFIG.PROLONGADO_DIAS ya no aplica.
  var sugerencia = tratamientoProlongado(e) ? '' : sugerenciaPROA(tipoIndicacion, coincidencias, acompanantes);
  if (avisos.length || sugerencia) lineas.push('');
  avisos.forEach(function(av) { lineas.push(adv + ' ' + av); });
  if (sugerencia) lineas.push(E(0x1F4A1) + ' ' + sugerencia);

  return lineas.join('\n');
}

/* =====================================================================
   Envio (solo al grupo configurado)
   ===================================================================== */
// opciones: chatId (otro grupo, p. ej. PRUEBA BOT), quotedMessageId (responde citando un mensaje del
// mismo chat) y sinFirma (sin la linea de titulo del bot; el pie siempre va). Devuelve { ok, idMessage }.
function enviarAlertaWhatsApp(mensaje, opciones) {
  opciones = opciones || {};
  var props = PropertiesService.getScriptProperties();
  var idInstance = props.getProperty('GREENAPI_ID_INSTANCE');
  var apiToken = props.getProperty('GREENAPI_API_TOKEN');
  var chatId = opciones.chatId || props.getProperty('GREENAPI_GROUP_CHATID');
  if (!idInstance || !apiToken || !chatId) {
    Logger.log('Faltan credenciales de Green-API en Propiedades del script.');
    return { ok: false };
  }
  if (!/@g\.us$/.test(chatId)) {
    Logger.log('El destino no es un grupo (@g.us); envio bloqueado.');
    return { ok: false };
  }
  var firmaBot = props.getProperty('GREENAPI_BOT_LABEL') || 'Bot PROA Antimicrobianos HDV';
  var pieBot = '_Ecosistema de Vigilancia Digital Servicio Farmacéutico · QF JPSN_';
  var mensajeFirmado = (opciones.sinFirma ? mensaje : '*' + firmaBot + '*' + '\n\n' + mensaje) + '\n\n' + pieBot;
  var url = props.getProperty('GREENAPI_API_URL') + '/waInstance' + idInstance + '/sendMessage/' + apiToken;
  var payload = { chatId: chatId, message: mensajeFirmado };
  if (opciones.quotedMessageId) payload.quotedMessageId = opciones.quotedMessageId;
  var options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true };
  try {
    var response = UrlFetchApp.fetch(url, options);
    var codigoRespuesta = response.getResponseCode();
    if (codigoRespuesta < 200 || codigoRespuesta >= 300) {
      Logger.log('Green-API respondio con error HTTP ' + codigoRespuesta + ': ' + response.getContentText());
      return { ok: false, codigo: codigoRespuesta };
    }
    Logger.log(response.getContentText());
    var idMessage = '';
    try { idMessage = JSON.parse(response.getContentText()).idMessage || ''; } catch (errJson) {}
    return { ok: true, idMessage: idMessage };
  } catch (err) {
    Logger.log('Error al enviar alerta por WhatsApp (Green-API): ' + err);
    return { ok: false };
  }
}

function listarChatsGreenAPI() {
  var props = PropertiesService.getScriptProperties();
  var idInstance = props.getProperty('GREENAPI_ID_INSTANCE');
  var apiToken = props.getProperty('GREENAPI_API_TOKEN');
  var url = props.getProperty('GREENAPI_API_URL') + '/waInstance' + idInstance + '/getChats/' + apiToken;
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var chats = JSON.parse(response.getContentText());
  chats.forEach(function(c) {
    if (String(c.id).indexOf('@g.us') > -1) Logger.log((c.name || '(sin nombre)') + ' -> ' + c.id);
  });
}

// Crea el activador del formulario. Antes borra los que ya existan para notificarNuevaRespuesta en este proyecto:
// con dos activadores cada formulario se procesa dos veces y el caso PROA llega duplicado (paso el 2026-11-16).
function crearTriggerFormSubmit() {
  var borrados = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'notificarNuevaRespuesta') { ScriptApp.deleteTrigger(t); borrados++; }
  });
  ScriptApp.newTrigger('notificarNuevaRespuesta')
    .forSpreadsheet(libroProa())
    .onFormSubmit()
    .create();
  Logger.log('Activador del formulario creado' + (borrados ? ' (se borraron ' + borrados + ' que ya existían)' : '') + '.');
}

/* =====================================================================
   Verificacion de encabezados (solo lectura, no envia nada).
   Lee la fila 1 de la hoja de respuestas y comprueba que cada pregunta
   usada por el mensaje se encuentre con campoDelEvento().
   ===================================================================== */
function verificarEncabezados() {
  var hoja = libroProa().getSheetByName(CONFIG.HOJA_RESPUESTAS);
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var simulado = {};
  encabezados.forEach(function(h) { if (String(h).trim()) simulado[String(h)] = ['x']; });
  var nombres = [];
  for (var k in CAMPOS) nombres.push(CAMPOS[k]);
  SLOTS.forEach(function(s) { nombres.push(s.nombre, s.dosis, s.via, s.frecuencia, s.dias); });
  var faltantes = [];
  nombres.forEach(function(n) {
    var ok = campoDelEvento(simulado, n) === 'x';
    Logger.log((ok ? '✅ ' : '❌ ') + n);
    if (!ok) faltantes.push(n);
  });
  Logger.log(faltantes.length ? 'FALTAN ' + faltantes.length + ' campo(s): revisar el formulario.' : 'Todos los campos del mensaje existen en la hoja (' + nombres.length + ').');
  return faltantes;
}

/* =====================================================================
   Datos de prueba (ficticios) y pruebas manuales
   ===================================================================== */
function eventoBase() {
  var nv = {};
  SLOTS.forEach(function(s) { nv[s.nombre] = ['']; nv[s.dosis] = ['']; nv[s.via] = ['']; nv[s.frecuencia] = ['']; nv[s.dias] = ['']; });
  for (var k in CAMPOS) nv[CAMPOS[k]] = [''];
  return nv;
}

function eventoPruebaDaptomicina() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['99999999']; nv[CAMPOS.EDAD_ANIOS] = ['54']; nv[CAMPOS.PESO_KG] = ['70'];
  nv[CAMPOS.CAMA] = ['C13']; nv[CAMPOS.SERVICIO] = ['Unidad de Cuidado Crítico UCI C'];
  nv[CAMPOS.ESPECIALIDAD] = ['Medicina Interna'];
  nv[CAMPOS.DIAGNOSTICO] = ['A419 - Sepsis, no especificada'];
  nv[CAMPOS.MICROORGANISMO] = ['Staphylococcus aureus resistente a meticilina'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Etiológico (En presencia de aislamiento conocido)'];
  nv[CAMPOS.CULTIVOS] = ['HEMOCULTIVO']; nv[CAMPOS.ORIGEN] = ['IAAS']; nv[CAMPOS.INDICACION] = ['TERAPEUTICO'];
  nv[CAMPOS.INTERCONSULTA] = ['Sí']; nv[CAMPOS.AJUSTE_RENAL] = ['No']; nv[CAMPOS.FALLA_HEPATICA] = ['No'];
  nv['Nombre Antimicrobiano 1'] = ['DAPTOMICINA - UT-19981181-1']; nv['Dosis en miligramos o UI AB1'] = ['420'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['24']; nv['Días ordenados AM1'] = ['14'];
  nv['Nombre Antimicrobiano 2'] = ['MEROPENEM - UT-19973890-3']; nv['Dosis en miligramos o UI AM2'] = ['1000'];
  nv['Vía de adminsitración de  AM2'] = ['Intravenoso']; nv['Frecuencia AM 2 (En horas)'] = ['8']; nv['Días ordenados AM2'] = ['7'];
  return { namedValues: nv };
}

// Ceftazidima/avibactam con la dosis renal antigua (750 mg): debe marcar "revisar" (minimo autorizado 0,94 g).
function eventoPruebaCeftazidimaAvibactam() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['88888888']; nv[CAMPOS.EDAD_ANIOS] = ['63']; nv[CAMPOS.PESO_KG] = ['70'];
  nv[CAMPOS.SERVICIO] = ['Unidad de Cuidado Crítico UCI B']; nv[CAMPOS.ESPECIALIDAD] = ['Medicina Interna'];
  nv[CAMPOS.DIAGNOSTICO] = ['N39.0']; nv[CAMPOS.MICROORGANISMO] = ['Klebsiella pneumoniae KPC'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Empírico (En presencia o sospecha de infección sin germen documentado - sin antibiograma))'];
  nv[CAMPOS.CULTIVOS] = ['UROCULTIVO']; nv[CAMPOS.ORIGEN] = ['IAAS']; nv[CAMPOS.INDICACION] = ['CAMBIO'];
  nv[CAMPOS.RAZON_CAMBIO] = ['POR ANTIBIOGRAMA']; nv[CAMPOS.INTERCONSULTA] = ['No'];
  nv[CAMPOS.AJUSTE_RENAL] = ['Sí']; nv[CAMPOS.DEP_CREATININA] = ['18'];
  nv['Nombre Antimicrobiano 1'] = ['CEFTAZIDIMA / AVIBACTAM - UT-19998801-1']; nv['Dosis en miligramos o UI AB1'] = ['750'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['12']; nv['Días ordenados AM1'] = ['14'];
  return { namedValues: nv };
}

// Lactante con carga de caspofungina registrada como dosis unica y peso en gramos:
// prueba edad en meses, "Dosis unica", mg/kg y que la regla pediatrica no marque.
function eventoPruebaPediatrico() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['77777777']; nv[CAMPOS.EDAD_ANIOS] = ['0']; nv[CAMPOS.EDAD_MESES] = ['4']; nv[CAMPOS.PESO_KG] = ['0']; nv[CAMPOS.PESO_G] = ['7500'];
  nv[CAMPOS.CAMA] = ['208']; nv[CAMPOS.SERVICIO] = ['Hospitalización Pediatría']; nv[CAMPOS.ESPECIALIDAD] = ['Pediatria'];
  nv[CAMPOS.DIAGNOSTICO] = ['B377']; nv[CAMPOS.MICROORGANISMO] = ['Candida albicans'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Etiológico (En presencia de aislamiento conocido)'];
  nv[CAMPOS.CULTIVOS] = ['HEMOCULTIVO']; nv[CAMPOS.ORIGEN] = ['IAAS']; nv[CAMPOS.INDICACION] = ['TERAPEUTICO']; nv[CAMPOS.INTERCONSULTA] = ['Si'];
  nv['Nombre Antimicrobiano 1'] = ['CASPOFUNGINA 50, 70 - UT-19974012-1']; nv['Dosis en miligramos o UI AB1'] = ['27'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['Dosis única']; nv['Días ordenados AM1'] = ['Dosis Unica'];
  return { namedValues: nv };
}

// Vancomicina como unico antimicrobiano: se reconoce como restringida pero no dispara alerta.
function eventoPruebaVancomicinaSola() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['66666666']; nv[CAMPOS.EDAD_ANIOS] = ['40']; nv[CAMPOS.PESO_KG] = ['70'];
  nv[CAMPOS.TIPO_INDICACION] = ['Tratamiento Empírico (En presencia o sospecha de infección sin germen documentado - sin antibiograma))'];
  nv['Nombre Antimicrobiano 1'] = ['VANCOMICINA - UT-19993853-1']; nv['Dosis en miligramos o UI AB1'] = ['1000'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['12']; nv['Días ordenados AM1'] = ['10'];
  return { namedValues: nv };
}

function eventoPruebaSinRestringidos() {
  var nv = eventoBase();
  nv[CAMPOS.HC] = ['11111111']; nv[CAMPOS.EDAD_MESES] = ['8']; nv[CAMPOS.PESO_KG] = ['8'];
  nv[CAMPOS.DIAGNOSTICO] = ['J189 - Neumonía']; nv[CAMPOS.MICROORGANISMO] = ['Ninguno'];
  nv[CAMPOS.ESPECIALIDAD] = ['Pediatría']; nv[CAMPOS.SERVICIO] = ['Hospitalización Pediatría']; nv[CAMPOS.INTERCONSULTA] = ['No'];
  nv['Nombre Antimicrobiano 1'] = ['CEFTRIAXONA - UT-19932457-2']; nv['Dosis en miligramos o UI AB1'] = ['1000'];
  nv['Vía de adminsitración de  AM1'] = ['Intravenoso']; nv['Frecuencia AM 1 (En Horas)'] = ['24']; nv['Días ordenados AM1'] = ['7'];
  return { namedValues: nv };
}

// Escribe en el registro el mensaje que saldria para una fila real de la matriz, con seguimiento y
// pertinencia. Sin argumento, busca hacia atras la ultima solicitud que dispara alerta (hasta 300 filas).
// No envia nada ni escribe en ninguna pestana.
function probarUltimaSolicitud(filaOpcional) { probarSolicitud_(filaOpcional, false); }

// Igual, pero busca la ultima solicitud que genera revision por tratamiento prolongado
// (hasta 100 filas: cada una consulta la historia del paciente). No envia nada.
function probarUltimoProlongado() { probarSolicitud_(null, true); }

function probarSolicitud_(filaOpcional, buscarProlongado) {
  // Tiempos de cada parte, para saber donde se va el tiempo de una solicitud
  var t0 = Date.now(), tiempos = [];
  var marca = function(nombre) { var t = Date.now(); tiempos.push(nombre + ' ' + ((t - t0) / 1000).toFixed(1) + ' s'); t0 = t; };
  var hoja = libroProa().getSheetByName(CONFIG.HOJA_RESPUESTAS);
  var ultima = hoja.getLastRow(), columnas = hoja.getLastColumn();
  var encabezados = hoja.getRange(1, 1, 1, columnas).getValues()[0];
  var eventoDeFila = function(fila, datos) {
    var nv = {};
    encabezados.forEach(function(h, i) { if (h) nv[h] = [datos[i]]; });
    return { namedValues: nv, range: { getRow: function() { return fila; } } };
  };
  var fila = filaOpcional, e = null;
  if (fila) {
    e = eventoDeFila(fila, hoja.getRange(fila, 1, 1, columnas).getDisplayValues()[0]);
  } else {
    var n = buscarProlongado ? 100 : 300;
    var desde = Math.max(2, ultima - n + 1);
    var bloque = hoja.getRange(desde, 1, ultima - desde + 1, columnas).getDisplayValues();
    for (var i = bloque.length - 1; i >= 0 && !e; i--) {
      var candidato = eventoDeFila(desde + i, bloque[i]);
      // revision de duracion que saldria: sin caso PROA en la misma solicitud (salvo PROLONGADO_CON_CASO)
      var dispara = buscarProlongado
        ? !!revisionProlongado(candidato) && (CONFIG.PROLONGADO_CON_CASO || !debeAlertar(filtrarAntimicrobianosRestringidos(candidato)))
        : generaCasoProa(candidato, filtrarAntimicrobianosRestringidos(candidato));
      if (dispara) { e = candidato; fila = desde + i; }
    }
    if (!e) {
      Logger.log('Ninguna de las ultimas %s solicitudes %s.', n,
        buscarProlongado ? 'genera revisión por tratamiento prolongado' : 'dispara alerta');
      return;
    }
  }
  marca(filaOpcional ? 'abrir la matriz y leer la fila' : 'buscar la fila');
  var coincidencias = filtrarAntimicrobianosRestringidos(e);
  marca('restringidos');
  seguimientoPaciente(e);
  marca('historia');
  var revision = revisionProlongado(e, coincidencias);
  marca('revisión');
  // Cada bloque dice que pasaria con ese mensaje; las lineas con ▶ son solo de esta prueba, nunca van al grupo.
  var bloques = [];
  if (generaCasoProa(e, coincidencias)) {
    bloques.push('▶ CASO PROA: se enviaría al grupo al llegar la solicitud\n\n' + construirMensajeDesdeEvento(e, coincidencias));
  } else if (debeAlertar(coincidencias)) {
    bloques.push('▶ CASO PROA: no se enviaría (' + formatoNumero(diasCasoProa(e, coincidencias), 0) + ' d con esta orden; sale desde más de ' +
      CONFIG.CASO_DIAS_MINIMOS + ' d)');
  }
  marca('caso PROA');
  if (revision) {
    var accion = accionProlongado(revision, e, coincidencias);
    if (accion === 'ENVIAR') bloques.push('▶ REVISIÓN DE DURACIÓN: se enviaría al grupo al llegar la solicitud\n\n' + revision.mensaje);
    else bloques.push('▶ REVISIÓN DE DURACIÓN: ' + TEXTO_ACCION_PROLONGADO[accion].replace(/^no se envía: /, 'no se enviaría (') + ')');
    marca('registro (7 d)');
  }
  var p = tratamientoProlongado(e);
  Logger.log('PRUEBA (no se envió nada al grupo) · v' + VERSION_BOT + ' · fila %s · restringidos: %s · caso PROA: %s · revisión de duración: %s\n\n%s', fila,
    coincidencias.length, generaCasoProa(e, coincidencias) ? 'sí' : 'no',
    p ? 'sí (' + p.solicitudes + ' prescripciones seguidas, ' + p.dias + ' d)' :
      'no (necesita ' + CONFIG.PROLONGADO_MIN_SOLICITUDES + ' prescripciones seguidas y más de ' + CONFIG.PROLONGADO_DIAS + ' d)',
    (bloques.length ? bloques.join('\n\n') : '▶ No generaría ningún mensaje.') + '\n\nTiempos: ' + tiempos.join(' · '));
}

// Cruce de los diagnosticos de las ultimas `filas` solicitudes (500 por defecto) con la pestana CIE10: cuantos traen el
// codigo, cuantos son una descripcion exacta, cuales se cruzaron por palabras (para revisar) y cuales quedaron sin
// codigo, con la duracion de referencia que les toca. Solo lee; no envia nada.
function probarCruceCIE10(filas) {
  var n = Number(filas) || 500;
  var hoja = libroProa().getSheetByName(CONFIG.HOJA_RESPUESTAS);
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(normalizarClave);
  var col = encabezados.indexOf(normalizarClave(CAMPOS.DIAGNOSTICO));
  var ultima = hoja.getLastRow(), desde = Math.max(2, ultima - n + 1);
  var tabla = obtenerPertinencia(), cuenta = { escrito: 0, descripcion: 0, texto: 0, '': 0 }, cruzados = {}, sinCodigo = {};
  var duracion = function(dx) { var s = sindromePara(dx, tabla); return s ? 'duración: ' + s.sindrome : 'sin duración de referencia'; };
  hoja.getRange(desde, col + 1, ultima - desde + 1, 1).getDisplayValues().forEach(function(f) {
    var dx = String(f[0]).replace(/\s+/g, ' ').trim();
    if (!dx) return;
    var r = resolverCIE10(dx);
    cuenta[r.via]++;
    var clave = normalizarTexto(dx);
    if (r.via === 'texto') cruzados[clave] = cruzados[clave] || { n: 0, linea: dx + ' → ' + formatearDiagnosticoCIE10(dx).replace(/ \(escrito: .*\)$/, '') + ' · ' + duracion(dx) };
    else if (!r.codigo) sinCodigo[clave] = sinCodigo[clave] || { n: 0, linea: dx + ' · ' + duracion(dx) };
    if (cruzados[clave]) cruzados[clave].n++;
    if (sinCodigo[clave]) sinCodigo[clave].n++;
  });
  var lista = function(o) {
    return Object.keys(o).map(function(k) { return o[k]; }).sort(function(a, b) { return b.n - a.n; })
      .map(function(x) { return '- ' + (x.n > 1 ? x.n + ' × ' : '') + x.linea; }).join('\n') || '- ninguno';
  };
  Logger.log('v' + VERSION_BOT + ' · Últimas %s solicitudes: %s con código escrito, %s con la descripción exacta de la pestaña, %s cruzadas por palabras, %s sin código.' +
    '\n\nCruzadas por palabras (revisar):\n%s\n\nSin código:\n%s', String(ultima - desde + 1), String(cuenta.escrito), String(cuenta.descripcion),
    String(cuenta.texto), String(cuenta['']), lista(cruzados), lista(sinCodigo));
}

function testCruceCIE10() {
  ['A419', 'N390', 'J189', 'K528', 'G06.0', 'J40', 'CODIGO_INEXISTENTE_XYZ'].forEach(function(dx) {
    Logger.log(dx + ' -> ' + formatearDiagnosticoCIE10(dx));
  });
}

function testConstruccionMensaje() {
  [['Daptomicina + meropenem (etiologico, con interconsulta)', eventoPruebaDaptomicina()],
   ['Ceftazidima/avibactam 750 mg, cambio, ajuste renal, sin interconsulta', eventoPruebaCeftazidimaAvibactam()],
   ['Pediatrico, caspofungina dosis unica, peso en gramos', eventoPruebaPediatrico()]].forEach(function(caso) {
    Logger.log('--- ' + caso[0] + ' ---');
    var coincidencias = filtrarAntimicrobianosRestringidos(caso[1]);
    Logger.log('Coincidencias: ' + JSON.stringify(coincidencias));
    Logger.log(construirMensajeDesdeEvento(caso[1], coincidencias));
  });
  Logger.log('--- Caso SIN antimicrobiano restringido (Ceftriaxona) ---');
  Logger.log('Coincidencias: ' + JSON.stringify(filtrarAntimicrobianosRestringidos(eventoPruebaSinRestringidos())) + ' (debe ser vacio, no se enviaria alerta)');
  Logger.log('--- Caso vancomicina sola (no dispara alerta propia) ---');
  var cv = filtrarAntimicrobianosRestringidos(eventoPruebaVancomicinaSola());
  Logger.log('Coincidencias: ' + JSON.stringify(cv) + ' -> debeAlertar: ' + debeAlertar(cv) + ' (debe ser false)');
}

// SI envia un mensaje real al grupo configurado. Confirmar antes GREENAPI_GROUP_CHATID (PRUEBA BOT).
function enviarEjemploAlGrupo() {
  notificarNuevaRespuesta(eventoPruebaDaptomicina());
}

// Envia SOLO a PRUEBA BOT (chatId fijo; no usa GREENAPI_GROUP_CHATID) el mensaje base del caso de
// ceftazidima/avibactam, para ver el encabezado destacado tal como llega a WhatsApp.
function enviarPruebaCeftazidimaAPruebaBot() {
  var e = eventoPruebaCeftazidimaAvibactam();
  var r = enviarAlertaWhatsApp(construirMensajeDesdeEvento(e, filtrarAntimicrobianosRestringidos(e)), { chatId: '120363412506101174@g.us' });
  Logger.log(JSON.stringify(r));
}