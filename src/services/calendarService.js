/**
 * Servicio para generar archivos de calendario y envío por correo
 */

/**
 * Genera un archivo ICS (iCalendar) compatible con Google Calendar
 * @param {Array} cursos - Array de cursos con horarios
 * @returns {string} - Contenido del archivo ICS
 */
export const generarArchivoICS = (cursos) => {
  const ahora = new Date();
  const timestamp = ahora.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UNSAAC Horarios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Horario UNSAAC',
    'X-WR-TIMEZONE:America/Lima',
    'X-WR-CALDESC:Horario de cursos UNSAAC'
  ];

  // Mapeo de días de la semana
  const diasSemana = {
    'LU': 'MO',
    'MA': 'TU', 
    'MI': 'WE',
    'JU': 'TH',
    'VI': 'FR',
    'SA': 'SA',
    'DO': 'SU'
  };

  cursos.forEach((curso) => {
    if (curso.horarios && curso.horarios.length > 0) {
      curso.horarios.forEach((horario, horarioIndex) => {
        const uid = `curso-${curso.id}-${horarioIndex}-${timestamp}@unsaac.edu.pe`;
        
        // Convertir hora a formato de 24 horas
        const horaInicio = convertirHora24(horario.horaInicio);
        const horaFin = convertirHora24(horario.horaFin);
        
        // Generar fechas de inicio y fin del semestre (ejemplo)
        const fechaInicioSemestre = new Date(2025, 2, 17); // 17 de marzo 2025
        const fechaFinSemestre = new Date(2025, 6, 18); // 18 de julio 2025
        
        const dtstart = formatearFechaICS(fechaInicioSemestre, horaInicio);
        const dtend = formatearFechaICS(fechaInicioSemestre, horaFin);
        const until = formatearFechaICS(fechaFinSemestre, '23:59');
        
        // Convertir día a formato RFC
        const diaRFC = diasSemana[horario.dia?.toUpperCase()];
        const diasRFC = diaRFC || '';
        
        if (diasRFC) {
          icsContent.push(
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTART:${dtstart}`,
            `DTEND:${dtend}`,
            `RRULE:FREQ=WEEKLY;BYDAY=${diasRFC};UNTIL=${until}`,
            `SUMMARY:${curso.nombre}`,
            `DESCRIPTION:Código: ${curso.codigo}\nDocente: ${curso.docente || 'No especificado'}\nAula: ${horario.aula || 'No especificada'}`,
            `LOCATION:${horario.aula || 'UNSAAC'}`,
            `CREATED:${timestamp}`,
            `LAST-MODIFIED:${timestamp}`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE',
            'END:VEVENT'
          );
        }
      });
    }
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
};

/**
 * Convierte hora en formato 12h a 24h
 * @param {string} hora - Hora en formato "HH:MM AM/PM"
 * @returns {string} - Hora en formato "HH:MM"
 */
const convertirHora24 = (hora) => {
  if (!hora) return '00:00';
  
  const match = hora.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return hora;
  
  let [, horas, minutos, periodo] = match;
  horas = parseInt(horas);
  
  if (periodo.toUpperCase() === 'PM' && horas !== 12) {
    horas += 12;
  } else if (periodo.toUpperCase() === 'AM' && horas === 12) {
    horas = 0;
  }
  
  return `${horas.toString().padStart(2, '0')}:${minutos}`;
};

/**
 * Formatea fecha y hora para formato ICS
 * @param {Date} fecha - Fecha base
 * @param {string} hora - Hora en formato "HH:MM"
 * @returns {string} - Fecha en formato ICS
 */
const formatearFechaICS = (fecha, hora) => {
  const [horas, minutos] = hora.split(':');
  const fechaHora = new Date(fecha);
  fechaHora.setHours(parseInt(horas), parseInt(minutos), 0, 0);
  
  return fechaHora.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Descarga el archivo ICS
 * @param {string} contenidoICS - Contenido del archivo ICS
 * @param {string} nombreArchivo - Nombre del archivo
 */
export const descargarArchivoICS = (contenidoICS, nombreArchivo = 'horario_unsaac.ics') => {
  const blob = new Blob([contenidoICS], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
};

/**
 * Genera un enlace mailto para enviar el horario por correo
 * @param {Array} cursos - Array de cursos
 * @param {string} contenidoICS - Contenido del archivo ICS (opcional)
 * @returns {string} - URL mailto
 */
export const generarEnlaceCorreo = (cursos, contenidoICS = null) => {
  const asunto = encodeURIComponent('Mi Horario UNSAAC');
  
  let cuerpo = 'Hola,\n\nTe comparto mi horario de cursos UNSAAC:\n\n';
  
  cursos.forEach(curso => {
    cuerpo += `📚 ${curso.nombre} (${curso.codigo})\n`;
    if (curso.docente) cuerpo += `   Docente: ${curso.docente}\n`;
    
    if (curso.horarios && curso.horarios.length > 0) {
      curso.horarios.forEach(horario => {
        cuerpo += `   📅 ${horario.dia} de ${horario.horaInicio} a ${horario.horaFin}`;
        if (horario.aula) cuerpo += ` - Aula: ${horario.aula}`;
        cuerpo += '\n';
      });
    }
    cuerpo += '\n';
  });
  
  cuerpo += 'Generado con la aplicación de Horarios UNSAAC.\n\n';
  
  if (contenidoICS) {
    cuerpo += 'Nota: También puedes importar este horario a Google Calendar descargando el archivo .ics adjunto.';
  }
  
  const cuerpoEncoded = encodeURIComponent(cuerpo);
  
  return `mailto:?subject=${asunto}&body=${cuerpoEncoded}`;
};

/**
 * Abre el cliente de correo con el horario
 * @param {Array} cursos - Array de cursos
 */
export const enviarPorCorreo = (cursos) => {
  const enlaceCorreo = generarEnlaceCorreo(cursos);
  window.open(enlaceCorreo, '_blank');
};

/**
 * Genera y descarga tanto el archivo ICS como abre el correo
 * @param {Array} cursos - Array de cursos
 */
export const exportarHorarioCompleto = (cursos) => {
  try {
    // Generar archivo ICS
    const contenidoICS = generarArchivoICS(cursos);
    const nombreArchivo = `horario_unsaac_${new Date().toISOString().split('T')[0]}.ics`;
    
    // Descargar archivo ICS
    descargarArchivoICS(contenidoICS, nombreArchivo);
    
    // Abrir correo
    setTimeout(() => {
      enviarPorCorreo(cursos);
    }, 1000); // Pequeño delay para que se complete la descarga
    
    return true;
  } catch (error) {
    console.error('Error al exportar horario completo:', error);
    return false;
  }
};