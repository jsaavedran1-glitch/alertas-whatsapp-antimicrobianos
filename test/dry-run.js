// test/dry-run.js
//
// Reconstruye la logica de filtrarAntimicrobianosRestringidos() y
// construirMensajeDesdeEvento() de Codigo.gs en Node.js puro,
// sin PropertiesService ni UrlFetchApp, para verificar el filtro y el
// formato del mensaje SIN tocar el proyecto de Apps Script ni enviar nada real.
//
// Uso: node test/dry-run.js

const ANTIMICROBIANOS_RESTRINGIDOS = ['LINEZOLID', 'CEFTAZIDIMA / AVIBACTAM', 'ANFOTERICINA', 'AZTREONAM', 'ERTAPENEM', 'VANCOMICINA', 'CASPOFUNGINA', 'ANFOTERICINA B LIPOSOMAL', 'TYGECICLINA', 'DORIPENEM', 'RIFAMPICINA', 'POLIMIXINA B', 'DAPTOMICINA'];

function nombreLimpio(valor) {
  if (!valor) return '-';
  return String(valor).split(' - UT-')[0].trim();
}

function filtrarAntimicrobianosRestringidos(e) {
  const valores = (e && e.namedValues) ? e.namedValues : {};
  function campo(nombre) {
    return (valores[nombre] && valores[nombre][0]) ? valores[nombre][0] : '';
  }
  const slots = [
    { nombre: 'Nombre Antimicrobiano 1', dosis: 'Dosis en miligramos o UI AB1', frecuencia: 'Frecuencia AM 1 (En Horas)' },
    { nombre: 'Nombre Antimicrobiano 2', dosis: 'Dosis en miligramos o UI AM2', frecuencia: 'Frecuencia AM 2 (En horas)' },
    { nombre: 'Nombre Antimicrobiano 3', dosis: 'Dosis en miligramos o UI AM3', frecuencia: 'Frecuencia AM 3 (En horas)' }
  ];
  const coincidencias = [];
  slots.forEach(function (slot) {
    const nombreCrudo = campo(slot.nombre);
    if (!nombreCrudo) return;
    const nombre = nombreLimpio(nombreCrudo).toUpperCase();
    const esRestringido = ANTIMICROBIANOS_RESTRINGIDOS.some(function (restringido) {
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
  const valores = (e && e.namedValues) ? e.namedValues : {};
  function campo(nombre) {
    return (valores[nombre] && valores[nombre][0]) ? valores[nombre][0] : '-';
  }
  const coincidencias = coincidenciasOpt || filtrarAntimicrobianosRestringidos(e);

  const edadAnios = campo('Edad del paciente en años');
  const edadMeses = campo('Edad del paciente meses');
  let edadTexto;
  if (edadAnios !== '-' && edadAnios !== '') {
    edadTexto = edadAnios + ' años';
  } else if (edadMeses !== '-' && edadMeses !== '') {
    edadTexto = edadMeses + ' meses';
  } else {
    edadTexto = '-';
  }

  const emojiAlerta = String.fromCodePoint(0x1F6A8);
  const emojiHistoria = String.fromCodePoint(0x1F4C4);
  const emojiEdad = String.fromCodePoint(0x1F382);
  const emojiDiagnostico = String.fromCodePoint(0x1F4CB);
  const emojiEspecialidad = String.fromCodePoint(0x1FA7A);
  const emojiServicio = String.fromCodePoint(0x1F3E5);
  const emojiInterconsulta = String.fromCodePoint(0x1F9EA);
  const emojiMedicamento = String.fromCodePoint(0x1F48A);

  let mensaje = emojiAlerta + ' NUEVO CASO PROA - ANTIMICROBIANO RESTRINGIDO ' + emojiAlerta + '\n\n' +
    emojiHistoria + ' Historia Clínica: ' + campo('Número de Historia Clínica') + '\n' +
    emojiEdad + ' Edad: ' + edadTexto + '\n' +
    emojiDiagnostico + ' Diagnóstico CIE10: ' + campo('Diagnóstico CIE10 para la cual se prescribe el antimicrobiano') + '\n' +
    emojiEspecialidad + ' Especialidad que prescribe: ' + campo('Especialidad que prescribe') + '\n' +
    emojiServicio + ' Servicio actual: ' + campo('Servicio actual') + '\n' +
    emojiInterconsulta + ' Interconsulta Infectología (Dinámica Gerencial): ' + campo('¿Solicitó interconsulta por infectología en Dinámica Gerencial?');

  coincidencias.forEach(function (am, idx) {
    mensaje += '\n\n' + emojiMedicamento + ' Antimicrobiano restringido ' + (idx + 1) + ': ' + am.nombre +
      '\n   Dosis: ' + am.dosis + ' mg/UI' +
      '\n   Frecuencia: cada ' + am.frecuencia + ' horas';
  });

  return mensaje;
}

function eventoPruebaLinezolid() {
  return {
    namedValues: {
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
    }
  };
}

function eventoPruebaSinRestringidos() {
  return {
    namedValues: {
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
    }
  };
}

function main() {
  console.log('=== Dry run: caso CON antimicrobiano restringido (Linezolid) ===\n');
  const e1 = eventoPruebaLinezolid();
  const coincidencias1 = filtrarAntimicrobianosRestringidos(e1);
  console.log('Coincidencias:', JSON.stringify(coincidencias1));
  console.log(construirMensajeDesdeEvento(e1, coincidencias1));

  console.log('\n\n=== Dry run: caso SIN antimicrobiano restringido (Ceftriaxona) ===\n');
  const e2 = eventoPruebaSinRestringidos();
  const coincidencias2 = filtrarAntimicrobianosRestringidos(e2);
  console.log('Coincidencias:', JSON.stringify(coincidencias2), '(debe ser vacio, no se enviaria alerta)');

  console.log('\n\nOK: filtro y construccion de mensaje verificados sin llamar ninguna API externa.');
}

main();
