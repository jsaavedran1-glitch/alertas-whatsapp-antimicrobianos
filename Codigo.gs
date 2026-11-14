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
  HOJA_CIE10: 'CIE10',
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
    ['CEFTAZIDIMA / AVIBACTAM', 30, 65, 940, 2500, 'SI', 'Ficha FDA Avycaz 2024: 2,5 g c/8 h; 1,25 g (DepCr 31-50); 0,94 g c/12-48 h (<=30); pediatria 62,5 mg/kg max 2,5 g. IDSA 2024: infusion 3 h'],
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
  SEGUIMIENTO_DIAS: 30,
  // Una orden continua el curso anterior del mismo antimicrobiano si empieza hasta N dias despues de su fin.
  SEGUIMIENTO_TOLERANCIA_DIAS: 2,
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
    ['ITU', 'N39,N10,N12,N30', 'INFECCION URINARIA,VIAS URINARIAS,SEPSIS URINARIA,UROSEPSIS,PIELONEFRITIS,IVU,ITU', 'Infección urinaria complicada / pielonefritis', 5, 7, 'hasta 10-14 d si hay absceso, obstrucción, prostatitis o respuesta lenta', 'IDSA 2025 ITU complicada; ACIN Infectio 2023'],
    ['BACTERIEMIA', 'A40,A41,A49,R57,R65', 'BACTEREMIA,BACTERIEMIA,SEPSIS,SEPTICEMIA,CHOQUE SEPTICO', 'Bacteriemia / sepsis', 7, 14, '7 d si hay control del foco y no es S. aureus ni Candida; S. aureus: mínimo 14 d desde el hemocultivo negativo (4-6 sem si es complicada)', 'BALANCE, NEJM 2025; Surviving Sepsis 2021'],
    ['NEUMONIA', 'J12,J13,J14,J15,J16,J17,J18,J22', 'NEUMONIA,BRONCONEUMONIA,NAC', 'Neumonía', 5, 7, 'comunitaria: 5 d con estabilidad clínica; nosocomial o asociada a ventilador: 7 d', 'ACIN NAC 2022; ATS/IDSA 2019; IDSA/ATS 2016'],
    ['EMPIEMA', 'J85,J86', 'EMPIEMA,ABSCESO PULMONAR', 'Empiema / absceso pulmonar', 14, 42, '2-3 semanas pueden bastar con drenaje y buena evolución (ensayo SLIM); más si la evolución es lenta', 'SLIM, ERJ Open Res 2023; BTS 2023'],
    ['INTRAABDOMINAL', 'K35,K36,K37,K57,K63,K65,K80,K81,K83', 'PERITONITIS,APENDICITIS,COLANGITIS,COLECISTITIS,INTRAABDOMINAL,DIVERTICULITIS', 'Infección intraabdominal', 4, 7, '4 d después de un control adecuado del foco; colangitis 4-7 d tras el drenaje', 'STOP-IT, NEJM 2015; SIS 2017; Tokyo 2018'],
    ['PIEL', 'L01,L02,L03,L08,A46', 'CELULITIS,ERISIPELA,PIEL Y TEJIDOS BLANDOS,TEJIDOS BLANDOS,ABSCESO CUTANEO', 'Infección de piel y tejidos blandos', 5, 7, 'extender solo si no hay mejoría; fascitis necrosante: hasta 48-72 h después del último desbridamiento', 'IDSA 2014 piel y tejidos blandos'],
    ['PIE_DIABETICO', '', 'PIE DIABETICO', 'Pie diabético', 7, 14, 'partes blandas 1-2 semanas; osteomielitis 6 semanas sin resección y hasta 3 tras amputación menor con margen positivo', 'IWGDF/IDSA 2023'],
    ['OSTEOMIELITIS', 'M86,M46', 'OSTEOMIELITIS,ESPONDILODISCITIS,DISCITIS', 'Osteomielitis / espondilodiscitis', 28, 42, '6 semanas; valorar paso a vía oral', 'IDSA 2015 vertebral; OVIVA, NEJM 2019'],
    ['ARTRITIS', 'M00', 'ARTRITIS SEPTICA', 'Artritis séptica', 14, 28, 'tras drenaje adecuado; las guías clásicas indican 4-6 semanas y menos de 4 se asoció a más recaídas en una cohorte', 'Gjika, Ann Rheum Dis 2019; referencia general'],
    ['PROTESIS', 'T84', 'PROTESIS ARTICULAR,PERIPROTESICA', 'Infección de prótesis articular', 42, 84, '6 semanas no fueron no inferiores a 12 (18,1 % frente a 9,4 % de infección persistente)', 'DATIPO, NEJM 2021'],
    ['ENDOCARDITIS', 'I33,I38,I39', 'ENDOCARDITIS', 'Endocarditis infecciosa', 14, 42, 'válvula nativa 2-6 semanas; válvula protésica 6 semanas o más, contadas desde el primer hemocultivo negativo', 'ESC 2023'],
    ['CATETER', 'T82', 'ASOCIADA A CATETER,INFECCION DE CATETER', 'Bacteriemia asociada a catéter', 5, 14, 'estafilococo coagulasa negativo 5-7 d con retiro del catéter; gramnegativos 7-14 d; S. aureus y Candida mínimo 14 d', 'IDSA 2009'],
    ['MENINGITIS', 'G00,G01,G03', 'MENINGITIS', 'Meningitis bacteriana', 7, 21, 'meningococo 5-7 d; neumococo 10-14 d; Listeria y bacilos gramnegativos 21 d', 'ESCMID 2016'],
    ['ABSCESO_CEREBRAL', 'G06,G07', 'ABSCESO CEREBRAL', 'Absceso cerebral', 42, 56, '6-8 semanas IV', 'ESCMID 2023'],
    ['CANDIDEMIA', 'B37', 'CANDIDEMIA,CANDIDIASIS INVASIVA,FUNGEMIA', 'Candidemia / candidiasis invasiva', 14, 21, '14 d contados desde el primer hemocultivo negativo, sin focos metastásicos', 'IDSA 2016; ACIN candidiasis'],
    ['CRIPTOCOCOSIS', 'B45', 'CRIPTOCOC,CRYPTOCOC', 'Criptococosis (inducción)', 1, 14, 'OMS 2022: dosis única de anfotericina B liposomal 10 mg/kg más 14 d de flucitosina y fluconazol', 'OMS 2022'],
    ['HISTOPLASMOSIS', 'B39', 'HISTOPLASM', 'Histoplasmosis (inducción con anfotericina)', 14, 14, 'anfotericina B liposomal 3 mg/kg por 2 semanas y luego itraconazol 12 meses', 'OPS/OMS 2020'],
    ['ASPERGILOSIS', 'B44', 'ASPERGIL', 'Aspergilosis invasiva', 42, 84, 'mínimo 6-12 semanas', 'IDSA 2016'],
    ['NEUTROPENIA', 'D70', 'NEUTROPENIA FEBRIL', 'Neutropenia febril', '', '', 'sin foco: se puede suspender tras 72 h o más de tratamiento si lleva 48 h afebril y estable, sin esperar la recuperación de neutrófilos; con foco, la duración del foco', 'ECIL-4'],
    ['ISO', 'T81', 'SITIO OPERATORIO,HERIDA QUIRURGICA,CONSECUTIVA A PROCEDIMIENTO', 'Infección del sitio operatorio', '', '', 'superficial: drenaje y 5-7 d si hay compromiso sistémico; órgano o espacio: según el foco', 'Referencia general (IDSA 2014)'],
    ['TUBERCULOSIS', 'A15,A16,A17,A18,A19', 'TUBERCULOSIS,TBC', 'Tuberculosis', '', '', 'esquema de meses: la duración no se evalúa aquí', 'Programa nacional de TB']
  ],
  // Reglas de espectro/indicacion. am: nombre contenido en el antimicrobiano; sindromes: claves de la tabla
  // de duracion; micro: expresion regular sobre el aislamiento (mayusculas, sin tildes); soloSiUnico: solo si
  // es el unico antimicrobiano de la solicitud; salvoCon: no avisar si la solicitud incluye ese antimicrobiano.
  REGLAS_ESPECTRO: [
    { am: 'DAPTOMICINA', sindromes: ['NEUMONIA', 'EMPIEMA'], mensaje: 'DAPTOMICINA no está indicada en neumonía: el surfactante pulmonar la inactiva (ficha técnica)' },
    { am: 'TYGECICLINA', sindromes: ['BACTERIEMIA', 'NEUMONIA', 'CATETER'], mensaje: 'TIGECICLINA: concentraciones séricas bajas y advertencia de mayor mortalidad (FDA); en bacteriemia o neumonía solo si no hay alternativa' },
    { am: 'ERTAPENEM', micro: 'PSEUDOMONA|ACINETOBACTER|ENTEROCOC', mensaje: 'ERTAPENEM no tiene actividad frente a Pseudomonas, Acinetobacter ni Enterococcus (ficha técnica)' },
    { am: 'AZTREONAM', micro: 'STAPH|ESTAF|STREPTO|ESTREPTO|ENTEROCOC|GRAM ?POSITIV|SAMR|MRSA', soloSiUnico: true, mensaje: 'AZTREONAM no tiene actividad frente a grampositivos: verificar cobertura' },
    { am: 'CASPOFUNGINA', micro: 'CRYPTOCOC|CRIPTOCOC|MUCOR|RHIZOPUS|HISTOPLASM', mensaje: 'CASPOFUNGINA no tiene actividad frente a Cryptococcus, mucorales ni Histoplasma' },
    { am: 'CASPOFUNGINA', sindromes: ['CRIPTOCOCOSIS', 'HISTOPLASMOSIS'], mensaje: 'CASPOFUNGINA no tiene actividad frente a Cryptococcus ni Histoplasma' },
    { am: 'CEFTAZIDIMA / AVIBACTAM', micro: 'NDM|METALO|MBL|\\bVIM\\b|\\bIMP\\b', salvoCon: 'AZTREONAM', mensaje: 'CEFTAZIDIMA/AVIBACTAM sola no cubre metalo-betalactamasas (NDM, VIM, IMP): asociar aztreonam (IDSA 2024)' },
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
    { am: 'ERTAPENEM', micro: 'E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|BLEE|ESBL', sindromes: ['INTRAABDOMINAL', 'ITU', 'PIE_DIABETICO'], reserva: 'infección intraabdominal, urinaria o de pie diabético por enterobacterias BLEE' },
    { am: 'AZTREONAM', micro: 'NDM|METALO|MBL|PSEUDOMONA|E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|BLEE|ESBL', sindromes: [], con: 'AVIBACTAM', reserva: 'gramnegativos en alergia grave a betalactámicos o, con ceftazidima/avibactam, metalo-betalactamasas' },
    { am: 'CEFTAZIDIMA / AVIBACTAM', micro: 'KPC|OXA|CARBAPENEM|SERINO|PSEUDOMONA', sindromes: [], reserva: 'enterobacterias con carbapenemasa (KPC, OXA-48) o Pseudomonas multirresistente documentadas' },
    { am: 'TYGECICLINA', micro: 'ACINETOBACTER|KPC|CARBAPENEM|SAMR|SARM|MRSA|VRE|ERV|BLEE', sindromes: ['INTRAABDOMINAL', 'PIEL'], reserva: 'infección intraabdominal o de piel por multirresistentes' },
    { am: 'DORIPENEM', micro: 'PSEUDOMONA|ACINETOBACTER|E\\.? ?COLI|ESCHERICHIA|ECHERICHIA|KLEBS|KLEPS|ENTEROBACTER|PROTEUS|SERRATIA|CITROBACTER|BLEE|ESBL', sindromes: ['INTRAABDOMINAL', 'ITU'], reserva: 'infección intraabdominal o urinaria complicada por gramnegativos' },
    { am: 'RIFAMPICINA', micro: 'TUBERC|MYCOBACT|MICOBACT|STAPH|ESTAF|SAMR|SARM|MRSA', sindromes: ['TUBERCULOSIS', 'PROTESIS', 'ENDOCARDITIS', 'OSTEOMIELITIS'], reserva: 'tuberculosis o, en combinación, estafilococo sobre material protésico' },
    { am: 'POLIMIXINA B', micro: 'ACINETOBACTER|PSEUDOMONA|KPC|NDM|METALO|CARBAPENEM|PANRESIST|XDR|MDR', sindromes: [], reserva: 'gramnegativos resistentes a carbapenémicos, como último recurso' }
  ],
  // Encabezado destacado arriba del mensaje cuando la solicitud trae alguno de estos antimicrobianos
  // (decision del referente PROA, 2026-11-07). Green-API no permite mencionar a todo el grupo (@todos),
  // asi que el aviso es visual. Cada par: [texto que debe contener el nombre, texto del encabezado].
  ENCABEZADOS_DESTACADOS: [['AVIBACTAM', 'CEFTAZIDIMA/AVIBACTAM']]
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

function obtenerAntimicrobianosRestringidos() {
  try {
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_ANTIMICROBIANOS_RESTRINGIDOS);
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
  var respaldo = CONFIG.RANGOS_DOSIS_RESPALDO.map(filaARegla).filter(Boolean);
  try {
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_RANGOS_DOSIS);
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
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
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
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var hoja = ss.getSheetByName(CONFIG.HOJA_RANGOS_DOSIS) || ss.insertSheet(CONFIG.HOJA_RANGOS_DOSIS);
  hoja.clearContents();
  escribirRangosDosis(hoja);
  Logger.log('Pestana ' + CONFIG.HOJA_RANGOS_DOSIS + ' reescrita con ' + CONFIG.RANGOS_DOSIS_RESPALDO.length + ' antimicrobianos.');
}

function escribirRangosDosis(hoja) {
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
  // IA_PROA.gs: con la revision por IA activa, el caso sale en dos mensajes (base + revision citada).
  // Sin ANTHROPIC_API_KEY, con IA_PROA_MODO = NO o sin el archivo IA_PROA.gs sigue el flujo de siempre.
  if (coincidencias.length > 0 && typeof notificarConRevisionIa_ === 'function' && notificarConRevisionIa_(e, coincidencias)) return;
  if (!debeAlertar(coincidencias)) {
    if (coincidencias.length > 0) registrarRevision(e, coincidencias, { enviado: false });
    return;
  }
  var mensaje = construirMensajeDesdeEvento(e, coincidencias);
  var envio = enviarAlertaWhatsApp(mensaje);
  registrarRevision(e, coincidencias, { enviado: !!(envio && envio.ok), destino: 'PRODUCCION' });
}

function nombreLimpio(valor) {
  if (!valor) return '-';
  return String(valor).split(' - UT-')[0].trim();
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
  var directo = extraerCodigoCIE10(diagnosticoCrudo);
  if (directo) return directo;
  var texto = normalizarTexto(diagnosticoCrudo);
  if (!texto || texto === '-') return '';
  var tokens = texto.split(/[^A-Z0-9]+/);
  for (var i = 0; i < tokens.length; i++) {
    if (/^[A-Z]\d{2}[0-9X]?$/.test(tokens[i]) && buscarDescripcionCIE10(tokens[i])) return tokens[i];
  }
  return codigoCIE10PorDescripcion(texto);
}

function codigoCIE10PorDescripcion(texto) {
  if (texto.length < 8) return '';
  var cache = null, clave = 'CIE10D:' + texto.slice(0, 200);
  try { cache = CacheService.getScriptCache(); var enCache = cache.get(clave); if (enCache !== null) return enCache; } catch (err) { cache = null; }
  var codigo = '';
  try {
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_CIE10);
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
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_CIE10);
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

function formatearDiagnosticoCIE10(diagnosticoCrudo) {
  if (!diagnosticoCrudo || diagnosticoCrudo === '-') return diagnosticoCrudo || '-';
  var codigo = codigoCIE10Resuelto(diagnosticoCrudo);
  if (!codigo) return diagnosticoCrudo;
  var descripcion = buscarDescripcionCIE10(codigo);
  if (!descripcion) return diagnosticoCrudo;
  var mostrado = (codigo.length === 3) ? codigo + 'X' : codigo;
  return mostrado + ' - ' + descripcion;
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

function frecuenciaTexto(valor) {
  var s = String(valor || '').trim();
  if (!s || s === '-') return '-';
  var m = s.match(/^(?:cada\s+)?(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)?\.?$/i);
  if (m) return 'cada ' + m[1].replace('.', ',') + ' horas';
  return s;
}

function fechaFin(dias) {
  var n = numeroONulo(dias);
  if (n === null || n <= 0) return '';
  var fin = new Date(Date.now() + Math.round(n) * 24 * 3600 * 1000);
  return Utilities.formatDate(fin, 'America/Bogota', 'dd/MM/yyyy');
}

function diasTexto(valor) {
  var s = String(valor || '').trim();
  if (!s || s === '-') return '-';
  var n = numeroONulo(s);
  if (n === null) return s;
  var fin = fechaFin(n);
  return formatoNumero(n, 0) + (n === 1 ? ' día' : ' días') + (fin ? ' · hasta ' + fin : '');
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

function lineaEsquema(am) {
  var dosisNum = numeroONulo(am.dosis);
  var dosis = (dosisNum !== null) ? formatoNumero(dosisNum, 2) + ' mg' : am.dosis;
  if (am.mgKg !== null && am.mgKg !== undefined) dosis += ' (' + formatoNumero(am.mgKg, 1) + ' mg/kg)';
  return dosis + ' · ' + am.via + ' · ' + frecuenciaTexto(am.frecuencia);
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
  if (amplios.length) {
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
  var respaldo = CONFIG.PERTINENCIA_RESPALDO.map(filaAPertinencia).filter(Boolean);
  try {
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_PERTINENCIA);
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
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  if (ss.getSheetByName(CONFIG.HOJA_PERTINENCIA)) {
    Logger.log('La pestana ' + CONFIG.HOJA_PERTINENCIA + ' ya existe; no se modifica.');
    return;
  }
  escribirPertinencia(ss.insertSheet(CONFIG.HOJA_PERTINENCIA));
  Logger.log('Pestana ' + CONFIG.HOJA_PERTINENCIA + ' creada con ' + CONFIG.PERTINENCIA_RESPALDO.length + ' sindromes. Debe revisarla el comite PROA.');
}

// Reemplaza la pestana por la tabla del codigo (borra lo editado a mano en ella).
function reescribirHojaPertinencia() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var hoja = ss.getSheetByName(CONFIG.HOJA_PERTINENCIA) || ss.insertSheet(CONFIG.HOJA_PERTINENCIA);
  hoja.clearContents();
  escribirPertinencia(hoja);
}

function escribirPertinencia(hoja) {
  var enc = ['clave', 'cie10_prefijos', 'palabras_clave', 'sindrome', 'dias_min', 'dias_max', 'nota', 'fuente'];
  hoja.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold');
  hoja.setFrozenRows(1);
  hoja.getRange(2, 1, CONFIG.PERTINENCIA_RESPALDO.length, enc.length).setValues(CONFIG.PERTINENCIA_RESPALDO);
}

// Sindrome del diagnostico: por prefijo CIE10 (el mas largo) y, si no, por palabra clave (la mas larga).
function sindromePara(diagnosticoCrudo, tabla) {
  var codigo = codigoCIE10Resuelto(diagnosticoCrudo);
  var mejor = null, largo = 0;
  if (codigo) {
    tabla.forEach(function(f) {
      f.prefijos.forEach(function(p) {
        if (codigo.indexOf(p) === 0 && p.length > largo) { mejor = f; largo = p.length; }
      });
    });
    if (mejor) return mejor;
  }
  var texto = ' ' + normalizarTexto(diagnosticoCrudo) + ' ';
  tabla.forEach(function(f) {
    f.palabras.forEach(function(p) {
      // palabras de hasta 4 letras (ITU, IVU, TBC) deben ir como palabra completa
      var hay = (p.length <= 4) ? texto.indexOf(' ' + p + ' ') > -1 : texto.indexOf(p) > -1;
      if (hay && p.length > largo) { mejor = f; largo = p.length; }
    });
  });
  return mejor;
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
  var micro = normalizarTexto(microorganismo);
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
  if (fallo) return { nivel: 2, texto: ETIQUETA_NIVEL[2] + ' · ' + fallo };

  var ind = null;
  CONFIG.INDICACIONES.forEach(function(i) { if (!ind && nombre.indexOf(i.am) > -1) ind = i; });
  if (!ind) return null;
  if (tipoIndicacion === 'Profiláctico') return { nivel: 1, texto: ETIQUETA_NIVEL[1] + ' · antimicrobiano restringido usado en profilaxis; reservado para ' + ind.reserva };
  if (ind.con && nombres.some(function(n) { return n.indexOf(ind.con) > -1; })) return { nivel: 0, texto: ETIQUETA_NIVEL[0] + ' · combinación dentro de su indicación (' + ind.reserva + ')' };
  var cultivos = normalizarTexto(contexto && contexto.cultivos);
  if (esAntifungico(nombre) && /CANDIDA|LEVADURA/.test(micro) && /URO|ORINA/.test(cultivos) && !/HEMO|SANGRE/.test(cultivos)) {
    return { nivel: 1, texto: ETIQUETA_NIVEL[1] + ' · Candida solo en urocultivo suele ser colonización; convendría confirmar infección, tomar hemocultivos y retirar o cambiar la sonda (IDSA 2016; CDC)' };
  }
  if (!sinAislamiento(microorganismo)) {
    if ((new RegExp(ind.micro)).test(micro)) return { nivel: 0, texto: ETIQUETA_NIVEL[0] + ' · el aislamiento registrado está dentro de su indicación' };
    return { nivel: 1, texto: ETIQUETA_NIVEL[1] + ' · el aislamiento registrado no está entre los que justifican su uso; reservado para ' + ind.reserva };
  }
  if (sindrome && ind.sindromes.indexOf(sindrome.clave) > -1) {
    return { nivel: 0, texto: ETIQUETA_NIVEL[0] + ' para el foco · sin aislamiento, se sugiere revaluar con cultivos' };
  }
  return { nivel: 1, texto: ETIQUETA_NIVEL[1] + ' · sin aislamiento ni foco que lo sustente; reservado para ' + ind.reserva };
}

// Lineas de pertinencia del mensaje: veredicto global, tratamiento y dias. esquemas: todos los
// antimicrobianos de la solicitud. Semaforo: verde pertinente, amarillo verificar, rojo intervenir.
function evaluarPertinencia(diagnosticoCrudo, tipoIndicacion, microorganismo, esquemas) {
  return analisisPertinencia(diagnosticoCrudo, tipoIndicacion, microorganismo, esquemas).lineas;
}

// { lineas, nivel (-1 sin criterio, 0 pertinente, 1 verificar, 2 intervenir), espectroRojo (una regla de
// espectro descarta algun antimicrobiano) }. IA_PROA.gs lo usa como referencia y como piso del veredicto.
function analisisPertinencia(diagnosticoCrudo, tipoIndicacion, microorganismo, esquemas, contexto) {
  var vacio = { lineas: [], nivel: -1, espectroRojo: false, encabezadoDias: '', rojos: [] };
  if (!CONFIG.PERTINENCIA_ACTIVA) return vacio;
  var E = function(cp) { return String.fromCodePoint(cp); };
  var color = [E(0x1F7E2), E(0x1F7E1), E(0x1F534)];
  var sindrome = sindromePara(diagnosticoCrudo, obtenerPertinencia());
  var peor = -1, tratamiento = [], dias = [], espectroRojo = false, rojos = [];
  var neutro = E(0x26AA);
  var sinValorar = function(am, n) { dias.push(neutro + ' ' + am.nombre + ' ' + formatoNumero(n, 0) + ' d: ' + TEXTO_DIAS_SIN_VALORAR); };
  // Con seguimiento (am.diasAcumulados), la duracion que se compara es la del curso completo.
  var etiquetaDias = function(am, n) {
    return am.nombre + ' ' + formatoNumero(n, 0) + ' d' + (am.diasAcumulados > n ? ' (' + formatoNumero(am.diasAcumulados, 0) + ' d acumulados desde ' + am.inicioCurso + ')' : '');
  };
  var marcar = function(lista, nivel, texto) { lista.push(color[nivel] + ' ' + texto); if (nivel > peor) peor = nivel; };

  esquemas.forEach(function(am) {
    var v = veredictoTratamiento(am, esquemas, sindrome, tipoIndicacion, microorganismo, contexto);
    if (v) { marcar(tratamiento, v.nivel, am.nombre + ': ' + v.texto); if (v.nivel === 2) { espectroRojo = true; rojos.push(am.nombre); } }
  });
  if (tipoIndicacion === 'Etiológico' && sinAislamiento(microorganismo)) {
    marcar(tratamiento, 1, 'Indicación etiológica sin microorganismo registrado: se sugiere verificar');
  }

  var conDias = esquemas.filter(function(am) { var n = numeroONulo(am.dias); return n !== null && n > 0; });
  var encabezadoDias = '';
  if (tipoIndicacion === 'Profiláctico') {
    encabezadoDias = 'Días · profilaxis quirúrgica: máximo 24 h (OMS 2018; CDC 2017)';
    conDias.forEach(function(am) {
      var n = numeroONulo(am.dias);
      if (rojos.indexOf(am.nombre) > -1) { sinValorar(am, n); return; }
      if (n > 1) marcar(dias, 2, am.nombre + ' ' + formatoNumero(n, 0) + ' d: supera las 24 h de la profilaxis; se sugiere revaluar');
      else marcar(dias, 0, am.nombre + ' ' + formatoNumero(n, 0) + ' d: dentro de la referencia');
    });
  } else if (sindrome && sindrome.max !== null) {
    var rango = (sindrome.min !== null && sindrome.min !== sindrome.max) ? formatoNumero(sindrome.min, 0) + '-' + formatoNumero(sindrome.max, 0) : formatoNumero(sindrome.max, 0);
    encabezadoDias = 'Días · ' + sindrome.sindrome + ': referencia ' + rango + ' d (' + sindrome.fuente + ')';
    conDias.forEach(function(am) {
      var n = numeroONulo(am.dias);
      if (rojos.indexOf(am.nombre) > -1) { sinValorar(am, n); return; }
      if (esAntifungico(am.nombre) && CONFIG.SINDROMES_FUNGICOS.indexOf(sindrome.clave) === -1) {
        dias.push(neutro + ' ' + etiquetaDias(am, n) + ': la referencia de este foco es bacteriana y no aplica al antifúngico');
        return;
      }
      var total = am.diasAcumulados > n ? am.diasAcumulados : n;
      if (total > sindrome.max) {
        // el doble de la referencia o mas: rojo
        marcar(dias, total >= 2 * sindrome.max ? 2 : 1, etiquetaDias(am, n) + ': supera la referencia; se sugiere revaluar la duración' + (sindrome.nota ? ' · ' + sindrome.nota : ''));
      } else {
        marcar(dias, 0, etiquetaDias(am, n) + ': dentro de la referencia');
      }
    });
  } else if (sindrome && sindrome.nota) {
    encabezadoDias = 'Días · ' + sindrome.sindrome + ': ' + sindrome.nota + ' (' + sindrome.fuente + ')';
  }

  if (peor < 0 && !encabezadoDias) return vacio;
  var titulo = ETIQUETA_NIVEL[Math.max(peor, 0)];
  var lineas = [color[Math.max(peor, 0)] + ' *Pertinencia PROA: ' + titulo + '*'];
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

// Solicitudes previas de la misma historia clinica en los ultimos CONFIG.SEGUIMIENTO_DIAS dias.
// Devuelve { previas, lineas, porAm: { nombre: { inicio, transcurridos, proyectado } } }. Se calcula una vez
// por evento (queda en e._seguimiento). Solo lee la matriz; si algo falla, devuelve el seguimiento vacio.
function seguimientoPaciente(e) {
  if (e && e._seguimiento) return e._seguimiento;
  var res = { previas: 0, lineas: [], porAm: {} };
  if (e) e._seguimiento = res;
  if (!CONFIG.SEGUIMIENTO_ACTIVO || !e) return res;
  try {
    var valores = e.namedValues || {};
    var hc = String(campoDelEvento(valores, CAMPOS.HC) || '').replace(/\s+/g, '');
    if (!hc || hc === '-' || /^0+$/.test(hc)) return res;
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_RESPUESTAS);
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
    var previas = [];
    celdas.slice(-40).forEach(function(celda) {
      var f = celda.getRow();
      if (f === filaActual) return;
      var fila = hoja.getRange(f, 1, 1, columnas).getValues()[0];
      var fecha = fechaDe(fila[0]);
      if (!fecha || fecha.getTime() >= ahora.getTime() - 1000 || fecha.getTime() < desde) return;
      SLOTS.forEach(function(slot) {
        var cn = col(slot.nombre);
        var nombre = cn < 0 ? '' : nombreLimpio(fila[cn]);
        if (!nombre || nombre === '-') return;
        var leer = function(clave) { var c = col(slot[clave]); return c < 0 ? '' : String(fila[c] === null || fila[c] === undefined ? '' : fila[c]).trim(); };
        previas.push({ fecha: fecha, nombre: nombre, dias: numeroONulo(leer('dias')), dosis: leer('dosis'), frecuencia: leer('frecuencia') });
      });
    });
    if (previas.length === 0) return res;
    previas.sort(function(a, b) { return b.fecha.getTime() - a.fecha.getTime(); });
    var solicitudes = {};
    previas.forEach(function(p) { solicitudes[p.fecha.getTime()] = true; });
    res.previas = Object.keys(solicitudes).length;

    var E = function(cp) { return String.fromCodePoint(cp); };
    var actuales = leerSlots(e);
    var detalle = [];
    actuales.forEach(function(am) {
      var mismas = previas.filter(function(p) { return p.nombre === am.nombre; });
      if (mismas.length === 0) return;
      var horas = (ahora.getTime() - mismas[0].fecha.getTime()) / 3600000;
      if (horas < 12) {
        detalle.push('   ' + E(0x26A0) + E(0xFE0F) + ' ' + am.nombre + ': también solicitado hace ' + (horas < 1 ? 'menos de 1 h' : formatoNumero(Math.round(horas), 0) + ' h') +
          ' (' + (mismas[0].dosis || '-') + ' mg cada ' + (mismas[0].frecuencia || '-') + ' h' + (mismas[0].dias ? ', ' + formatoNumero(mismas[0].dias, 0) + ' d' : '') + '); posible solicitud repetida');
      }
      // Curso continuo: cada orden anterior que termina (con tolerancia) cuando empieza la siguiente.
      var inicio = ahora.getTime();
      for (var i = 0; i < mismas.length; i++) {
        var fin = mismas[i].fecha.getTime() + ((mismas[i].dias || 1) + CONFIG.SEGUIMIENTO_TOLERANCIA_DIAS) * dia;
        if (fin >= inicio) inicio = mismas[i].fecha.getTime(); else break;
      }
      var transcurridos = Math.round((ahora.getTime() - inicio) / dia);
      var n = numeroONulo(am.dias);
      var proyectado = transcurridos + ((n !== null && n > 0) ? n : 0);
      res.porAm[am.nombre] = { inicio: fechaCorta(new Date(inicio)), transcurridos: transcurridos, proyectado: proyectado };
      if (transcurridos >= 1) {
        detalle.push('   ' + am.nombre + ': en curso desde ' + fechaCorta(new Date(inicio)) + ' (' + formatoNumero(transcurridos, 0) + ' d)' +
          ((n !== null && n > 0) ? '; con esta orden completaría ' + formatoNumero(proyectado, 0) + ' d' : ''));
      }
    });
    var nombresActuales = actuales.map(function(am) { return am.nombre; });
    var otros = [], vistos = {};
    previas.forEach(function(p) {
      if (nombresActuales.indexOf(p.nombre) > -1 || vistos[p.nombre]) return;
      vistos[p.nombre] = true;
      otros.push(p.nombre + ' (' + fechaCorta(p.fecha) + (p.dias ? ', ' + formatoNumero(p.dias, 0) + ' d' : '') + ')');
    });
    if (otros.length) detalle.push('   Otros antimicrobianos previos: ' + otros.slice(0, 4).join('; '));
    res.lineas = [E(0x1F501) + ' Seguimiento: ' + res.previas + (res.previas === 1 ? ' solicitud previa' : ' solicitudes previas') + ' en ' +
      CONFIG.SEGUIMIENTO_DIAS + ' días (última ' + fechaCorta(previas[0].fecha) + ')'].concat(detalle);
  } catch (err) {
    Logger.log('Seguimiento por paciente no disponible: ' + err);
  }
  return res;
}

var ENCABEZADOS_REGISTRO = ['Fecha de registro', 'Marca temporal de la solicitud', 'Historia clínica', 'Servicio', 'Especialidad', 'Diagnóstico',
  'Microorganismo', 'Tipo de indicación', 'Antimicrobianos restringidos', 'Acompañantes', 'Semáforo tablas', 'Semáforo final', 'Fuente del análisis',
  'Detalle', 'Solicitudes previas (30 d)', 'Enviado al grupo', 'Destino', 'Modelo', 'Tokens de entrada', 'Tokens de salida', 'Costo aproximado USD'];

// Una fila por solicitud con antimicrobiano restringido en la pestana CONFIG.HOJA_REGISTRO (la crea si no
// existe). datos: { tablas, revision, detalle, enviado, destino, costo }. Nunca interrumpe el flujo.
function registrarRevision(e, coincidencias, datos) {
  if (!CONFIG.REGISTRO_ACTIVO) return;
  try {
    datos = datos || {};
    var valores = (e && e.namedValues) ? e.namedValues : {};
    var c = function(nombre) { return campoDelEvento(valores, nombre) || ''; };
    var libro = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var hoja = libro.getSheetByName(CONFIG.HOJA_REGISTRO);
    if (!hoja) { hoja = libro.insertSheet(CONFIG.HOJA_REGISTRO); hoja.appendRow(ENCABEZADOS_REGISTRO); }
    var semaforo = ['VERDE', 'AMARILLO', 'ROJO'];
    var tablas = datos.tablas || analisisPertinenciaDesdeEvento(e, coincidencias);
    var rev = datos.revision || null;
    var nivelFinal = rev ? ['pertinente', 'verificar', 'intervenir'].indexOf(rev.veredicto) : tablas.nivel;
    hoja.appendRow([new Date(), c('Marca temporal'), c(CAMPOS.HC), c(CAMPOS.SERVICIO), c(CAMPOS.ESPECIALIDAD),
      formatearDiagnosticoCIE10(c(CAMPOS.DIAGNOSTICO)), c(CAMPOS.MICROORGANISMO), tipoIndicacionTexto(c(CAMPOS.TIPO_INDICACION)),
      coincidencias.map(function(am) { return am.nombre + ' ' + am.dias + ' d'; }).join('; '),
      acompanantesNoRestringidos(e).map(function(am) { return am.nombre + ' ' + am.dias + ' d'; }).join('; '),
      tablas.nivel < 0 ? 'SIN CRITERIO' : semaforo[tablas.nivel], nivelFinal < 0 ? 'SIN CRITERIO' : semaforo[nivelFinal], rev ? 'IA' : 'TABLAS',
      String(datos.detalle || tablas.lineas.join(' | ')).replace(/[*_]/g, '').slice(0, 1500), seguimientoPaciente(e).previas,
      datos.enviado ? 'SI' : 'NO', datos.destino || '', rev ? rev.modelo : '', rev ? rev.entrada : '', rev ? rev.salida : '', datos.costo || '']);
  } catch (err) {
    Logger.log('No se pudo registrar la revision: ' + err);
  }
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

// Lineas de pertinencia (duracion de referencia, profilaxis, espectro) de una solicitud.
function pertinenciaDesdeEvento(e, coincidenciasOpt) {
  var coincidencias = coincidenciasOpt || filtrarAntimicrobianosRestringidos(e);
  return analisisPertinenciaDesdeEvento(e, coincidencias).lineas;
}

function analisisPertinenciaDesdeEvento(e, coincidenciasOpt) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  var coincidencias = coincidenciasOpt || filtrarAntimicrobianosRestringidos(e);
  var micro = campoDelEvento(valores, CAMPOS.MICROORGANISMO);
  var esquemas = coincidencias.concat(acompanantesNoRestringidos(e));
  var seg = seguimientoPaciente(e);
  esquemas.forEach(function(am) {
    var curso = seg.porAm[am.nombre];
    if (curso && curso.transcurridos >= 1) { am.diasAcumulados = curso.proyectado; am.inicioCurso = curso.inicio; }
  });
  return analisisPertinencia(campoDelEvento(valores, CAMPOS.DIAGNOSTICO), tipoIndicacionTexto(campoDelEvento(valores, CAMPOS.TIPO_INDICACION)),
    micro === '-' ? '' : micro, esquemas, { cultivos: campoDelEvento(valores, CAMPOS.CULTIVOS) });
}

// Lineas de encabezado destacado (CONFIG.ENCABEZADOS_DESTACADOS) segun los antimicrobianos de la solicitud.
function encabezadosDestacados(esquemas) {
  var alerta = String.fromCodePoint(0x1F6A8);
  return (CONFIG.ENCABEZADOS_DESTACADOS || []).filter(function(par) {
    return esquemas.some(function(am) { return String(am.nombre || '').toUpperCase().indexOf(par[0]) > -1; });
  }).map(function(par) { return '*' + alerta + par[1] + alerta + '*'; });
}

// sinSugerencia (IA_PROA.gs): sin la linea de sugerencia PROA, que va en el mensaje de revision.
function construirMensajeDesdeEvento(e, coincidenciasOpt, sinSugerencia) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  function campo(clave) {
    var v = campoDelEvento(valores, CAMPOS[clave]);
    return v ? v : '-';
  }
  var coincidencias = coincidenciasOpt || filtrarAntimicrobianosRestringidos(e);
  var acompanantes = acompanantesNoRestringidos(e);
  var reglas = obtenerRangosDosis();
  var pesoKg = pesoKgDesde(campo('PESO_KG'), campo('PESO_G'));

  var E = function(cp) { return String.fromCodePoint(cp); };
  var emojiAlerta = E(0x1F6A8), emojiHistoria = E(0x1F4C4), emojiEdad = E(0x1F382), emojiPeso = E(0x2696) + E(0xFE0F),
      emojiServicio = E(0x1F3E5), emojiEspecialidad = E(0x1FA7A), emojiDiagnostico = E(0x1F4CB),
      emojiMicro = E(0x1F9A0), emojiIndicacion = E(0x1F9EB), emojiInterconsulta = E(0x1F9EA),
      emojiRenal = E(0x1F4A7), emojiMedicamento = E(0x1F48A), emojiMas = E(0x2795),
      emojiAdvertencia = E(0x26A0) + E(0xFE0F), emojiCambio = E(0x1F504), emojiIdea = E(0x1F4A1);

  var edad = edadTexto(campo('EDAD_ANIOS'), campo('EDAD_MESES'), campo('EDAD_DIAS'));
  var pesoTexto = (pesoKg !== null) ? formatoNumero(pesoKg, 2) + ' kg' : '-';
  var cama = campo('CAMA');
  var interconsulta = campo('INTERCONSULTA');
  var indicacion = String(campo('INDICACION')).toUpperCase();
  var tipoIndicacion = tipoIndicacionTexto(campo('TIPO_INDICACION'));

  var lineas = [
    emojiAlerta + ' NUEVO CASO PROA - ANTIMICROBIANO RESTRINGIDO ' + emojiAlerta,
    '',
    emojiHistoria + ' Historia Clínica: ' + campo('HC'),
    emojiEdad + ' Edad: ' + edad + ' · ' + emojiPeso + ' Peso: ' + pesoTexto,
    emojiServicio + ' Servicio: ' + campo('SERVICIO') + (cama !== '-' ? ' · Cama: ' + cama : ''),
    emojiEspecialidad + ' Especialidad que prescribe: ' + campo('ESPECIALIDAD'),
    emojiDiagnostico + ' Diagnóstico CIE10: ' + formatearDiagnosticoCIE10(campo('DIAGNOSTICO')),
    emojiMicro + ' Microorganismo aislado: ' + campo('MICROORGANISMO'),
    emojiIndicacion + ' Indicación: ' + tipoIndicacion +
      ' · Cultivos: ' + campo('CULTIVOS') + ' · Origen: ' + campo('ORIGEN')
  ];
  var destacados = encabezadosDestacados(coincidencias.concat(acompanantes));
  if (destacados.length) lineas = destacados.concat([''], lineas);
  if (indicacion === 'CAMBIO') {
    lineas.push(emojiCambio + ' Cambio de antimicrobiano: ' + capitalizar(campo('RAZON_CAMBIO')));
  }
  if (esSi(interconsulta)) {
    lineas.push(emojiInterconsulta + ' Interconsulta Infectología (Dinámica Gerencial): Sí');
  } else {
    lineas.push(emojiAdvertencia + ' Sin interconsulta a Infectología');
  }
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
    lineas.push(emojiRenal + ' ' + extras.join(' · '));
  }

  coincidencias.forEach(function(am, idx) {
    var ev = evaluarDosis(am.nombre, am.dosis, pesoKg, reglas);
    am.mgKg = ev.mgKg;
    lineas.push('', emojiMedicamento + ' Antimicrobiano restringido ' + (idx + 1) + ': ' + am.nombre,
      '   Dosis: ' + lineaEsquema(am),
      '   Días ordenados: ' + diasTexto(am.dias));
    if (ev.revisar) {
      lineas.push('   ' + emojiAdvertencia + ' Dosis fuera del rango de referencia (' + ev.referencia + '): revisar');
    }
    var avisoDosis = avisoDosisEspecifico(am, pesoKg, coincidencias.concat(acompanantes));
    if (avisoDosis) lineas.push('   ' + emojiAdvertencia + ' ' + avisoDosis);
  });

  acompanantes.forEach(function(am) {
    am.mgKg = (pesoKg !== null && numeroONulo(am.dosis) !== null) ? numeroONulo(am.dosis) / pesoKg : null;
    lineas.push('', emojiMas + ' Acompañante: ' + am.nombre + ' · ' + lineaEsquema(am) + ' · ' + diasTexto(am.dias));
  });

  var seguimiento = seguimientoPaciente(e).lineas;
  if (seguimiento.length) lineas.push('');
  seguimiento.forEach(function(l) { lineas.push(l); });

  // Con sinSugerencia (flujo de dos mensajes, IA_PROA.gs) la pertinencia va en el mensaje de revision.
  var pertinencia = sinSugerencia ? [] : pertinenciaDesdeEvento(e, coincidencias);
  if (pertinencia.length) lineas.push('');
  pertinencia.forEach(function(l) { lineas.push(l); });

  var avisos = advertenciasCoherencia(pesoKg, campo('EDAD_ANIOS'), campo('EDAD_MESES'), coincidencias.concat(acompanantes));
  var sugerencia = sinSugerencia ? '' : sugerenciaPROA(tipoIndicacion, coincidencias, acompanantes);
  if (avisos.length || sugerencia) lineas.push('');
  avisos.forEach(function(av) { lineas.push(emojiAdvertencia + ' ' + av); });
  if (sugerencia) lineas.push(emojiIdea + ' ' + sugerencia);

  return lineas.join('\n');
}

/* =====================================================================
   Envio (solo al grupo configurado)
   ===================================================================== */
// opciones (IA_PROA.gs): chatId (otro grupo, p. ej. PRUEBA BOT), quotedMessageId (responde citando un
// mensaje del mismo chat) y sinFirma (sin la firma de arriba ni el pie). Devuelve { ok, idMessage }.
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
  var pieBot = '_Ecosistema de Vigilancia Digital del Servicio Farmacéutico HDV · Desarrollado por el QF Juan Pablo Saavedra_';
  var mensajeFirmado = opciones.sinFirma ? mensaje : '*' + firmaBot + '*' + '\n\n' + mensaje + '\n\n' + pieBot;
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

function crearTriggerFormSubmit() {
  var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  ScriptApp.newTrigger('notificarNuevaRespuesta')
    .forSpreadsheet(hoja)
    .onFormSubmit()
    .create();
}

/* =====================================================================
   Verificacion de encabezados (solo lectura, no envia nada).
   Lee la fila 1 de la hoja de respuestas y comprueba que cada pregunta
   usada por el mensaje se encuentre con campoDelEvento().
   ===================================================================== */
function verificarEncabezados() {
  var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_RESPUESTAS);
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