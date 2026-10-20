var CONFIG = {
  SPREADSHEET_ID: '1ZsjuygpRz1wPhCRxmL8LPLTNOo8kujGXplX8JRs6SZY',
  HOJA_ANTIMICROBIANOS_RESTRINGIDOS: 'ANTIMICROBIANOS_RESTRINGIDOS',
  ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO: ['LINEZOLID', 'CEFTAZIDIMA / AVIBACTAM', 'ANFOTERICINA', 'AZTREONAM', 'ERTAPENEM', 'VANCOMICINA', 'CASPOFUNGINA', 'ANFOTERICINA B LIPOSOMAL', 'TYGECICLINA', 'DORIPENEM', 'RIFAMPICINA', 'POLIMIXINA B', 'DAPTOMICINA'],
  HOJA_CIE10: 'CIE10'
};

/* ===========================================================================
   Lista de antimicrobianos restringidos: se lee de la hoja
   'ANTIMICROBIANOS_RESTRINGIDOS' en la matriz (columna A, desde fila 2).
   Si la hoja no existe o falla la lectura, se usa CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO
   para que las alertas nunca dejen de funcionar por este motivo.
   =============================================================================== */
function obtenerAntimicrobianosRestringidos() {
  try {
    var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_ANTIMICROBIANOS_RESTRINGIDOS);
    if (!hoja) {
      Logger.log('No se encontro la hoja "' + CONFIG.HOJA_ANTIMICROBIANOS_RESTRINGIDOS + '", se usa la lista de respaldo.');
      return CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO;
    }
    var ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) {
      Logger.log('La hoja de antimicrobianos restringidos esta vacia, se usa la lista de respaldo.');
      return CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO;
    }
    var valores = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
    var lista = valores
      .map(function(fila) { return String(fila[0] || '').trim().toUpperCase(); })
      .filter(function(v) { return v; });
    return lista.length ? lista : CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO;
  } catch (err) {
    Logger.log('Error leyendo la hoja de antimicrobianos restringidos, se usa la lista de respaldo: ' + err);
    return CONFIG.ANTIMICROBIANOS_RESTRINGIDOS_RESPALDO;
  }
}

function notificarNuevaRespuesta(e) {
  var coincidencias = filtrarAntimicrobianosRestringidos(e);
  if (coincidencias.length === 0) {
    return;
  }
  var mensaje = construirMensajeDesdeEvento(e, coincidencias);
  enviarAlertaWhatsApp(mensaje);
}

function nombreLimpio(valor) {
  if (!valor) return '-';
  return String(valor).split(' - UT-')[0].trim();
}

function extraerCodigoCIE10(diagnosticoCrudo) {
  if (!diagnosticoCrudo) return '';
  var primerToken = String(diagnosticoCrudo).trim().split(/\s+/)[0];
  return primerToken.replace(/[^A-Za-z0-9]+$/, '').toUpperCase();
}

function obtenerMapaCIE10() {
  var hoja = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.HOJA_CIE10);
  if (!hoja) return {};
  var ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return {};
  var datos = hoja.getRange(2, 1, ultimaFila - 1, 2).getValues();
  var mapa = {};
  datos.forEach(function(fila) {
    var codigo = String(fila[0] || '').trim().toUpperCase();
    var descripcion = String(fila[1] || '').trim();
    if (codigo) mapa[codigo] = descripcion;
  });
  return mapa;
}

function formatearDiagnosticoCIE10(diagnosticoCrudo, mapaCIE10Opt) {
  if (!diagnosticoCrudo || diagnosticoCrudo === '-') return diagnosticoCrudo || '-';
  var codigo = extraerCodigoCIE10(diagnosticoCrudo);
  if (!codigo) return diagnosticoCrudo;
  var mapa = mapaCIE10Opt || obtenerMapaCIE10();
  var descripcion = mapa[codigo];
  return descripcion ? (codigo + ' - ' + descripcion) : diagnosticoCrudo;
}

function filtrarAntimicrobianosRestringidos(e) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  function campo(nombre) {
    return (valores[nombre] && valores[nombre][0]) ? valores[nombre][0] : '';
  }
  var slots = [
    { nombre: 'Nombre Antimicrobiano 1', dosis: 'Dosis en miligramos o UI AB1', via: 'Vía de adminsitración de  AM1', frecuencia: 'Frecuencia AM 1 (En Horas)', dias: 'Días ordenados AM1' },
    { nombre: 'Nombre Antimicrobiano 2', dosis: 'Dosis en miligramos o UI AM2', via: 'Vía de adminsitración de  AM2', frecuencia: 'Frecuencia AM 2 (En horas)', dias: 'Días ordenados AM2' },
    { nombre: 'Nombre Antimicrobiano 3', dosis: 'Dosis en miligramos o UI AM3', via: 'Vía de adminsitración de  AM3', frecuencia: 'Frecuencia AM 3 (En horas)', dias: 'Días ordenados AM 3' }
  ];
  var coincidencias = [];
  var listaRestringidos = obtenerAntimicrobianosRestringidos();
  slots.forEach(function(slot) {
    var nombreCrudo = campo(slot.nombre);
    if (!nombreCrudo) return;
    var nombre = nombreLimpio(nombreCrudo).toUpperCase();
    var esRestringido = listaRestringidos.some(function(restringido) {
      return nombre.indexOf(restringido) > -1;
    });
    if (esRestringido) {
      coincidencias.push({
        nombre: nombreLimpio(nombreCrudo),
        dosis: campo(slot.dosis) || '-',
        via: campo(slot.via) || '-',
        frecuencia: campo(slot.frecuencia) || '-',
        dias: campo(slot.dias) || '-'
      });
    }
  });
  return coincidencias;
}

function construirMensajeDesdeEvento(e, coincidenciasOpt) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  function campo(nombre) {
    return (valores[nombre] && valores[nombre][0]) ? valores[nombre][0] : '-';
  }
  var coincidencias = coincidenciasOpt || filtrarAntimicrobianosRestringidos(e);

  var edadAnios = campo('Edad del paciente en años');
  var edadMeses = campo('Edad del paciente meses');
  var edadTexto;
  if (edadAnios !== '-' && edadAnios !== '') {
    edadTexto = edadAnios + ' años';
  } else if (edadMeses !== '-' && edadMeses !== '') {
    edadTexto = edadMeses + ' meses';
  } else {
    edadTexto = '-';
  }

  var emojiAlerta = String.fromCodePoint(0x1F6A8);
  var emojiHistoria = String.fromCodePoint(0x1F4C4);
  var emojiEdad = String.fromCodePoint(0x1F382);
  var emojiDiagnostico = String.fromCodePoint(0x1F4CB);
  var emojiMicroorganismo = String.fromCodePoint(0x1F9A0);
  var emojiEspecialidad = String.fromCodePoint(0x1FA7A);
  var emojiServicio = String.fromCodePoint(0x1F3E5);
  var emojiInterconsulta = String.fromCodePoint(0x1F9EA);
  var emojiMedicamento = String.fromCodePoint(0x1F48A);

  var mensaje = emojiAlerta + ' NUEVO CASO PROA - ANTIMICROBIANO RESTRINGIDO ' + emojiAlerta + '\n\n' +
    emojiHistoria + ' Historia Clínica: ' + campo('Número de Historia Clínica') + '\n' +
    emojiEdad + ' Edad: ' + edadTexto + '\n' +
    emojiDiagnostico + ' Diagnóstico CIE10: ' + formatearDiagnosticoCIE10(campo('Diagnóstico CIE10 para la cual se prescribe el antimicrobiano')) + '\n' +
    emojiMicroorganismo + ' Microorganismo aislado: ' + campo('Microorganismo aislado') + '\n' +
    emojiEspecialidad + ' Especialidad que prescribe: ' + campo('Especialidad que prescribe') + '\n' +
    emojiServicio + ' Servicio actual: ' + campo('Servicio actual') + '\n' +
    emojiInterconsulta + ' Interconsulta Infectología (Dinámica Gerencial): ' + campo('¿Solicitó interconsulta por infectología en Dinámica Gerencial?');

  coincidencias.forEach(function(am, idx) {
    mensaje += '\n\n' + emojiMedicamento + ' Antimicrobiano restringido ' + (idx + 1) + ': ' + am.nombre +
      '\n   Dosis: ' + am.dosis + ' mg/UI' +
      '\n   Vía de administración: ' + am.via +
      '\n   Frecuencia: cada ' + am.frecuencia + ' horas' +
      '\n   Días ordenados: ' + am.dias;
  });

  return mensaje;
}

function enviarAlertaWhatsApp(mensaje) {
  var props = PropertiesService.getScriptProperties();
  var idInstance = props.getProperty('GREENAPI_ID_INSTANCE');
  var apiToken = props.getProperty('GREENAPI_API_TOKEN');
  var chatId = props.getProperty('GREENAPI_GROUP_CHATID');
  if (!idInstance || !apiToken || !chatId) {
    Logger.log('Faltan credenciales de Green-API en Propiedades del script.');
    return;
  }
  var firmaBot = props.getProperty('GREENAPI_BOT_LABEL') || 'Bot PROA Antimicrobianos HDV';
  var pieBot = '_Bot dise\u00f1ado por el QF Juan Pablo Saavedra \u00b7 Servicio Farmac\u00e9utico HDV_';
  var mensajeFirmado = '*' + firmaBot + '*' + '\n\n' + mensaje + '\n\n' + pieBot;
  var url = props.getProperty('GREENAPI_API_URL') + '/waInstance' + idInstance + '/sendMessage/' + apiToken;
  var payload = { chatId: chatId, message: mensajeFirmado };
  var options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true };
  try {
    var response = UrlFetchApp.fetch(url, options);
    var codigoRespuesta = response.getResponseCode();
    if (codigoRespuesta < 200 || codigoRespuesta >= 300) {
      Logger.log('Green-API respondio con error HTTP ' + codigoRespuesta + ': ' + response.getContentText());
    } else {
      Logger.log(response.getContentText());
    }
  } catch (err) {
    Logger.log('Error al enviar alerta por WhatsApp (Green-API): ' + err);
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

function eventoPruebaLinezolid() {
  return { namedValues: {
    'Número de Historia Clínica': ['99999999'],
    'Edad del paciente en años': ['54'],
    'Edad del paciente meses': [''],
    'Diagnóstico CIE10 para la cual se prescribe el antimicrobiano': ['A419 - Sepsis, no especificada'],
    'Microorganismo aislado': ['Staphylococcus aureus resistente a meticilina'],
    'Especialidad que prescribe': ['Medicina Interna'],
    'Servicio actual': ['Unidad de Cuidado Crítico UCI C'],
    '¿Solicitó interconsulta por infectología en Dinámica Gerencial?': ['Sí'],
    'Nombre Antimicrobiano 1': ['LINEZOLID - UT-19907394-3'],
    'Dosis en miligramos o UI AB1': ['600'],
    'Vía de adminsitración de  AM1': ['Intravenoso'],
    'Frecuencia AM 1 (En Horas)': ['12'],
    'Días ordenados AM1': ['14'],
    'Nombre Antimicrobiano 2': [''],
    'Dosis en miligramos o UI AM2': [''],
    'Vía de adminsitración de  AM2': [''],
    'Frecuencia AM 2 (En horas)': [''],
    'Días ordenados AM2': [''],
    'Nombre Antimicrobiano 3': [''],
    'Dosis en miligramos o UI AM3': [''],
    'Vía de adminsitración de  AM3': [''],
    'Frecuencia AM 3 (En horas)': [''],
    'Días ordenados AM 3': ['']
  } };
}

function eventoPruebaVancomicina() {
  return { namedValues: {
    'Número de Historia Clínica': ['88888888'],
    'Edad del paciente en años': ['63'],
    'Edad del paciente meses': [''],
    'Diagnóstico CIE10 para la cual se prescribe el antimicrobiano': ['N390 - Infección de vías urinarias, sitio no especificado'],
    'Microorganismo aislado': ['Enterococcus faecium resistente a vancomicina (screening previo)'],
    'Especialidad que prescribe': ['Medicina Interna'],
    'Servicio actual': ['Unidad de Cuidado Crítico UCI B'],
    '¿Solicitó interconsulta por infectología en Dinámica Gerencial?': ['Sí'],
    'Nombre Antimicrobiano 1': ['VANCOMICINA - UT-19993853-1'],
    'Dosis en miligramos o UI AB1': ['1000'],
    'Vía de adminsitración de  AM1': ['Intravenoso'],
    'Frecuencia AM 1 (En Horas)': ['12'],
    'Días ordenados AM1': ['14'],
    'Nombre Antimicrobiano 2': [''],
    'Dosis en miligramos o UI AM2': [''],
    'Vía de adminsitración de  AM2': [''],
    'Frecuencia AM 2 (En horas)': [''],
    'Días ordenados AM2': [''],
    'Nombre Antimicrobiano 3': [''],
    'Dosis en miligramos o UI AM3': [''],
    'Vía de adminsitración de  AM3': [''],
    'Frecuencia AM 3 (En horas)': [''],
    'Días ordenados AM 3': ['']
  } };
}

function eventoPruebaSinRestringidos() {
  return { namedValues: {
    'Número de Historia Clínica': ['11111111'],
    'Edad del paciente en años': [''],
    'Edad del paciente meses': ['8'],
    'Diagnóstico CIE10 para la cual se prescribe el antimicrobiano': ['J189 - Neumonía'],
    'Microorganismo aislado': ['Ninguno'],
    'Especialidad que prescribe': ['Pediatría'],
    'Servicio actual': ['Hospitalización Pediatría'],
    '¿Solicitó interconsulta por infectología en Dinámica Gerencial?': ['No'],
    'Nombre Antimicrobiano 1': ['CEFTRIAXONA - UT-19932457-2'],
    'Dosis en miligramos o UI AB1': ['1000'],
    'Vía de adminsitración de  AM1': ['Intravenoso'],
    'Frecuencia AM 1 (En Horas)': ['24'],
    'Días ordenados AM1': ['7'],
    'Nombre Antimicrobiano 2': [''],
    'Dosis en miligramos o UI AM2': [''],
    'Vía de adminsitración de  AM2': [''],
    'Frecuencia AM 2 (En horas)': [''],
    'Días ordenados AM2': [''],
    'Nombre Antimicrobiano 3': [''],
    'Dosis en miligramos o UI AM3': [''],
    'Vía de adminsitración de  AM3': [''],
    'Frecuencia AM 3 (En horas)': [''],
    'Días ordenados AM 3': ['']
  } };
}

function testCruceCIE10() {
  var mapa = obtenerMapaCIE10();
  Logger.log('Total codigos CIE10 cargados desde la hoja "' + CONFIG.HOJA_CIE10 + '": ' + Object.keys(mapa).length);
  ['A419', 'N390', 'J189', 'K528', 'CODIGO_INEXISTENTE_XYZ'].forEach(function(codigo) {
    Logger.log(codigo + ' -> ' + (mapa[codigo] || '(no encontrado en catalogo)'));
  });
  Logger.log('formatearDiagnosticoCIE10("A419 - Sepsis, no especificada"): ' + formatearDiagnosticoCIE10('A419 - Sepsis, no especificada', mapa));
  Logger.log('formatearDiagnosticoCIE10("A419"): ' + formatearDiagnosticoCIE10('A419', mapa));
  Logger.log('formatearDiagnosticoCIE10("A419 septicemia"): ' + formatearDiagnosticoCIE10('A419 septicemia', mapa));
}

function testConstruccionMensaje() {
  Logger.log('--- Caso CON antimicrobiano restringido (Linezolid) ---');
  var e1 = eventoPruebaLinezolid();
  var coincidencias1 = filtrarAntimicrobianosRestringidos(e1);
  Logger.log('Coincidencias: ' + JSON.stringify(coincidencias1));
  Logger.log(construirMensajeDesdeEvento(e1, coincidencias1));

  Logger.log('--- Caso CON antimicrobiano restringido (Vancomicina) ---');
  var e3 = eventoPruebaVancomicina();
  var coincidencias3 = filtrarAntimicrobianosRestringidos(e3);
  Logger.log('Coincidencias: ' + JSON.stringify(coincidencias3));
  Logger.log(construirMensajeDesdeEvento(e3, coincidencias3));

  Logger.log('--- Caso SIN antimicrobiano restringido (Ceftriaxona) ---');
  var e2 = eventoPruebaSinRestringidos();
  var coincidencias2 = filtrarAntimicrobianosRestringidos(e2);
  Logger.log('Coincidencias: ' + JSON.stringify(coincidencias2) + ' (debe ser vacio, no se enviaria alerta)');
}

function enviarEjemploAlGrupo() {
  notificarNuevaRespuesta(eventoPruebaLinezolid());
}
