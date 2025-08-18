// Utilidades para exportar horarios a calendario y correo

/**
 * Genera un archivo ICS para calendario
 * @param {Array} cursos - Array de cursos para exportar
 * @returns {string} Contenido del archivo ICS
 */
export const generarArchivoICS = (cursos) => {
  try {
    let contenidoICS = 'BEGIN:VCALENDAR\r\n';
    contenidoICS += 'VERSION:2.0\r\n';
    contenidoICS += 'PRODID:-//UNSAAC//Horarios//ES\r\n';
    contenidoICS += 'CALSCALE:GREGORIAN\r\n';
    
    cursos.forEach((curso, index) => {
      if (curso.horarios && curso.horarios.length > 0) {
        curso.horarios.forEach((horario) => {
          contenidoICS += 'BEGIN:VEVENT\r\n';
          contenidoICS += `UID:${curso.id}-${horario.id}-${index}@unsaac.edu.pe\r\n`;
          contenidoICS += `SUMMARY:${curso.codigo} - ${curso.nombre}\r\n`;
          contenidoICS += `DESCRIPTION:Docente: ${horario.docente || 'No especificado'}\\nAula: ${horario.aula || 'No especificada'}\r\n`;
          contenidoICS += `LOCATION:${horario.aula || 'UNSAAC'}\r\n`;
          contenidoICS += 'RRULE:FREQ=WEEKLY;BYDAY=';
          
          // Mapear días
          const diasMap = {
            'lunes': 'MO',
            'martes': 'TU', 
            'miercoles': 'WE',
            'jueves': 'TH',
            'viernes': 'FR',
            'sabado': 'SA',
            'domingo': 'SU'
          };
          
          contenidoICS += diasMap[horario.dia?.toLowerCase()] || 'MO';
          contenidoICS += '\r\n';
          contenidoICS += 'END:VEVENT\r\n';
        });
      }
    });
    
    contenidoICS += 'END:VCALENDAR\r\n';
    return contenidoICS;
  } catch (error) {
    console.error('Error generando archivo ICS:', error);
    return '';
  }
};

/**
 * Descarga un archivo ICS
 * @param {string} contenido - Contenido del archivo ICS
 * @param {string} nombreArchivo - Nombre del archivo
 */
export const descargarArchivoICS = (contenido, nombreArchivo) => {
  try {
    const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error descargando archivo ICS:', error);
    return false;
  }
};

/**
 * Envía horario por correo
 * @param {Array} cursos - Array de cursos para enviar
 */
export const enviarPorCorreo = (cursos) => {
  try {
    let asunto = 'Mi Horario UNSAAC';
    let cuerpo = 'Hola,\n\nTe comparto mi horario de clases:\n\n';
    
    cursos.forEach((curso) => {
      cuerpo += `📚 ${curso.codigo} - ${curso.nombre}\n`;
      if (curso.horarios && curso.horarios.length > 0) {
        curso.horarios.forEach((horario) => {
          cuerpo += `   • ${horario.dia}: ${horario.hora_inicio} - ${horario.hora_fin}`;
          if (horario.aula) cuerpo += ` (${horario.aula})`;
          if (horario.docente) cuerpo += ` - ${horario.docente}`;
          cuerpo += '\n';
        });
      }
      cuerpo += '\n';
    });
    
    cuerpo += 'Saludos!';
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.open(mailtoLink, '_blank');
    return true;
  } catch (error) {
    console.error('Error enviando por correo:', error);
    return false;
  }
};

/**
 * Exporta horario completo (calendario + correo)
 * @param {Array} cursos - Array de cursos para exportar
 * @returns {boolean} Éxito de la operación
 */
export const exportarHorarioCompleto = (cursos) => {
  try {
    // Generar y descargar archivo ICS
    const contenidoICS = generarArchivoICS(cursos);
    const nombreArchivo = `horario_unsaac_${new Date().toISOString().split('T')[0]}.ics`;
    const descargaExitosa = descargarArchivoICS(contenidoICS, nombreArchivo);
    
    // Abrir cliente de correo
    const correoExitoso = enviarPorCorreo(cursos);
    
    return descargaExitosa && correoExitoso;
  } catch (error) {
    console.error('Error en exportación completa:', error);
    return false;
  }
};