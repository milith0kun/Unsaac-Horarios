import { useCallback, useMemo } from 'react';
import { normalizarHora as normalizarHoraUtil } from '../utils/timeUtils';

/**
 * Custom hook optimizado para el manejo de horarios y conflictos
 * Separa la lógica de horarios de la lógica de datos generales
 */
export function useScheduleManager(cursosSeleccionados = []) {

  // Usar la función de normalización de horas compartida
  const normalizarHora = useCallback(normalizarHoraUtil, []);

  // Función para mapear días de la base de datos al formato del tablero
  const mapearDia = useCallback((dia) => {
    if (!dia) return dia;
    
    const mapaDias = {
      // Formatos abreviados (como vienen de los JSON)
      'LU': 'Lunes',
      'MA': 'Martes',
      'MI': 'Miércoles',
      'JU': 'Jueves',
      'VI': 'Viernes',
      'SA': 'Sábado',
      // Formatos en mayúsculas
      'LUNES': 'Lunes',
      'MARTES': 'Martes', 
      'MIERCOLES': 'Miércoles',
      'MIÉRCOLES': 'Miércoles',
      'JUEVES': 'Jueves',
      'VIERNES': 'Viernes',
      'SABADO': 'Sábado',
      'SÁBADO': 'Sábado',
      // Formatos en minúsculas
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'miércoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'sábado': 'Sábado',
      // Formatos con primera letra mayúscula (como vienen de la BD)
      'Lunes': 'Lunes',
      'Martes': 'Martes',
      'Miercoles': 'Miércoles',
      'Miércoles': 'Miércoles',
      'Jueves': 'Jueves',
      'Viernes': 'Viernes',
      'Sabado': 'Sábado',
      'Sábado': 'Sábado'
    };
    
    const diaTransformado = mapaDias[dia] || dia;
    
    if (!mapaDias[dia]) {
      console.warn('⚠️ Día no reconocido:', dia);
    }
    
    return diaTransformado;
  }, []);

  // Procesar cursos con horarios optimizado usando useMemo
  const cursosConHorariosNormalizados = useMemo(() => {
    return cursosSeleccionados.map(curso => {
      const horariosTransformados = curso.horarios?.map(horario => {
        const horaInicio = normalizarHora(horario.horaInicio);
        const horaFin = normalizarHora(horario.horaFin);
        const diaTransformado = mapearDia(horario.dia);
        const horaFormateada = `${horaInicio}-${horaFin}`;
        
        return {
          ...horario,
          dia: diaTransformado,
          hora: horaFormateada,
          horaInicio,
          horaFin,
          aula: horario.aula?.codigo || horario.aula
        };
      }) || [];
      
      return {
        ...curso,
        horarios: horariosTransformados
      };
    });
  }, [cursosSeleccionados, normalizarHora, mapearDia]);



  // Función agregarCurso removida - el manejo de estado se hace en el componente padre

  // Funciones removidas - el manejo de estado se hace en el componente padre

  return {
    // Estados
    cursosConHorarios: cursosConHorariosNormalizados,
    
    // Utilidades
    normalizarHora,
    mapearDia
  };
}

export default useScheduleManager;