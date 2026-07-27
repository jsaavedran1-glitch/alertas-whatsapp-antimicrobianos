var CONFIG = {
  SPREADSHEET_ID: '1ZsjuygpRz1wPhCRxmL8LPLTNOo8kujGXplX8JRs6SZY',
  ANTIMICROBIANOS_RESTRINGIDOS: ['LINEZOLID', 'CEFTAZIDIMA / AVIBACTAM', 'ANFOTERICINA', 'AZTREONAM', 'ERTAPENEM']
};

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

function filtrarAntimicrobianosRestringidos(e) {
  var valores = (e && e.namedValues) ? e.namedValues : {};
  function campo(nombre) {
    return (valores[nombre] && valores[nombre][0]) ? valores[nombre][0] : '';
  }
  var slots = [
    { nombre: 'Nombre Antimicrobiano 1', dosis: 'Dosis en miligramos o UI AB1', frecuencia: 'Frecuencia AM 1 (En Horas)' },
    { nombre: 'Nombre Antimicrobiano 2', dosis: 'Dosis en miligramos o UI AM2', frecuencia: 'Frecuencia AM 2 (En horas)' },
    { nombre: 'Nombre Antimicrobiano 3', dosis: 'Dosis en miligramos o UI AM3', frecuencia: 'Frecuencia AM 3 (En horas)' }
  ];
  var coincidencias = [];
  slots.forEach(function(slot) {
    var nombreCrudo = campo(slot.nombre);
    if (!nombreCrudo) return;
    var nombre = nombreLimpio(nombreCrudo).toUpperCase();
    var esRestringido = CONFIG.ANTIMICROBIANOS_RESTRINGIDOS.some(function(restringido) {
      return nombre.indexOf(restringido) > -1;
    });
    if (esRestringido) {
      coincidencias.push({
        nombre: nombreLimpio(nombreCrudo),
        dosis: campo(slot.dosis) || '-',
        frecuencia: campo(slot.frecuencia) || '-'
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
  var emojiEspecialidad = String.fromCodePoint(0x1FA7A);
  var emojiServicio = String.fromCodePoint(0x1F3E5);
  var emojiInterconsulta = String.fromCodePoint(0x1F9EA);
  var emojiMedicamento = String.fromCodePoint(0x1F48A);

  var mensaje = emojiAlerta + ' NUEVO CASO PROA - ANTIMICROBIANO RESTRINGIDO ' + emojiAlerta + '\n\n' +
    emojiHistoria + ' Historia Clínica: ' + campo('Número de Historia Clínica') + '\n' +
    emojiEdad + ' Edad: ' + edadTexto + '\n' +
    emojiDiagnostico + ' Diagnóstico CIE10: ' + campo('Diagnóstico CIE10 para la cual se prescribe el antimicrobiano') + '\n' +
    emojiEspecialidad + ' Especialidad que prescribe: ' + campo('Especialidad que prescribe') + '\n' +
    emojiServicio + ' Servicio actual: ' + campo('Servicio actual') + '\n' +
    emojiInterconsulta + ' Interconsulta Infectología (Dinámica Gerencial): ' + campo('¿Solicitó interconsulta por infectología en Dinámica Gerencial?');

  coincidencias.forEach(function(am, idx) {
    mensaje += '\n\n' + emojiMedicamento + ' Antimicrobiano restringido ' + (idx + 1) + ': ' + am.nombre +
      '\n   Dosis: ' + am.dosis + ' mg/UI' +
      '\n   Frecuencia: cada ' + am.frecuencia + ' horas';
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
  var mensajeFirmado = '*' + firmaBot + '*' + '\n\n' + mensaje;
  var url = props.getProperty('GREENAPI_API_URL') + '/waInstance' + idInstance + '/sendMessage/' + apiToken;
  var payload = { chatId: chatId, message: mensajeFirmado };
  var options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
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
    'Especialidad que prescribe': ['Medicina Interna'],
    'Servicio actual': ['Unidad de Cuidado Crítico UCI C'],
    '¿Solicitó interconsulta por infectología en Dinámica Gerencial?': ['Sí'],
    'Nombre Antimicrobiano 1': ['LINEZOLID - UT-19907394-3'],
    'Dosis en miligramos o UI AB1': ['600'],
    'Frecuencia AM 1 (En Horas)': ['12'],
    'Nombre Antimicrobiano 2': [''],
    'Dosis en miligramos o UI AM2': [''],
    'Frecuencia AM 2 (En horas)': [''],
    'Nombre Antimicrobiano 3': [''],
    'Dosis en miligramos o UI AM3': [''],
    'Frecuencia AM 3 (En horas)': ['']
  } };
}

function eventoPruebaSinRestringidos() {
  return { namedValues: {
    'Número de Historia Clínica': ['11111111'],
    'Edad del paciente en años': [''],
    'Edad del paciente meses': ['8'],
    'Diagnóstico CIE10 para la cual se prescribe el antimicrobiano': ['J189 - Neumonía'],
    'Especialidad que prescribe': ['Pediatría'],
    'Servicio actual': ['Hospitalización Pediatría'],
    '¿Solicitó interconsulta por infectología en Dinámica Gerencial?': ['No'],
    'Nombre Antimicrobiano 1': ['CEFTRIAXONA - UT-19932457-2'],
    'Dosis en miligramos o UI AB1': ['1000'],
    'Frecuencia AM 1 (En Horas)': ['24'],
    'Nombre Antimicrobiano 2': [''],
    'Dosis en miligramos o UI AM2': [''],
    'Frecuencia AM 2 (En horas)': [''],
    'Nombre Antimicrobiano 3': [''],
    'Dosis en miligramos o UI AM3': [''],
    'Frecuencia AM 3 (En horas)': ['']
  } };
}

function testConstruccionMensaje() {
  Logger.log('--- Caso CON antimicrobiano restringido (Linezolid) ---');
  var e1 = eventoPruebaLinezolid();
  var coincidencias1 = filtrarAntimicrobianosRestringidos(e1);
  Logger.log('Coincidencias: ' + JSON.stringify(coincidencias1));
  Logger.log(construirMensajeDesdeEvento(e1, coincidencias1));

  Logger.log('--- Caso SIN antimicrobiano restringido (Ceftriaxona) ---');
  var e2 = eventoPruebaSinRestringidos();
  var coincidencias2 = filtrarAntimicrobianosRestringidos(e2);
  Logger.log('Coincidencias: ' + JSON.stringify(coincidencias2) + ' (debe ser vacio, no se enviaria alerta)');
}

function enviarEjemploAlGrupo() {
  notificarNuevaRespuesta(eventoPruebaLinezolid());
}
