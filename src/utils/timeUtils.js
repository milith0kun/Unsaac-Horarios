/**
 * Utilidades para manejo de tiempo en el sistema de horarios
 */

/**
 * Convierte una hora a minutos para facilitar comparaciones
 * @param {string|number} hora - Hora en formato HH:MM, H:MM o número
 * @returns {number} - Minutos desde las 00:00
 */
export const convertirAMinutos = (hora) => {
  if (typeof hora === 'number') {
    return hora * 60;
  }
  if (typeof hora === 'string') {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0);
  }
  return 0;
};

/**
 * Normaliza una hora a formato HH:MM
 * @param {string|number} hora - Hora en cualquier formato
 * @returns {string} - Hora en formato HH:MM
 */
export const normalizarHora = (hora) => {
  if (!hora && hora !== 0) return hora;
  
  // Si es un número, convertir a formato HH:00
  if (typeof hora === 'number') {
    return hora.toString().padStart(2, '0') + ':00';
  }
  
  // Si ya está en formato HH:MM, devolverlo tal como está
  if (/^\d{2}:\d{2}$/.test(hora)) {
    return hora;
  }
  
  // Si está en formato HH:MM:SS, convertir a HH:MM
  if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) {
    return hora.substring(0, 5);
  }
  
  // Si está en formato H:MM, agregar cero inicial
  if (/^\d{1}:\d{2}$/.test(hora)) {
    return '0' + hora;
  }
  
  // Si es string numérico, convertir a número y luego a formato
  if (/^\d+$/.test(hora)) {
    const num = parseInt(hora);
    return num.toString().padStart(2, '0') + ':00';
  }
  
  console.warn('⚠️ Formato de hora no reconocido:', hora);
  return hora;
};

/**
 * Verifica si dos rangos de tiempo se solapan
 * @param {string} inicio1 - Hora de inicio del primer rango (HH:MM)
 * @param {string} fin1 - Hora de fin del primer rango (HH:MM)
 * @param {string} inicio2 - Hora de inicio del segundo rango (HH:MM)
 * @param {string} fin2 - Hora de fin del segundo rango (HH:MM)
 * @returns {boolean} - True si hay solapamiento
 */
export const verificarSolapamiento = (inicio1, fin1, inicio2, fin2) => {
  const inicio1Min = convertirAMinutos(inicio1);
  const fin1Min = convertirAMinutos(fin1);
  const inicio2Min = convertirAMinutos(inicio2);
  const fin2Min = convertirAMinutos(fin2);
  
  return inicio1Min < fin2Min && fin1Min > inicio2Min;
};