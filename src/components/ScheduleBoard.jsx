import React, { useCallback, useMemo } from 'react';
import './ScheduleBoard.css';
// import { convertirAMinutos } from '../utils/timeUtils'; // No utilizado
import { verificarSolapamiento } from '../utils/timeUtils';

// const convertirAMinutos = (hora) => {
//   const [horas, minutos] = hora.split(':').map(Number);
//   return horas * 60 + minutos;
// };

// const isEmpty = (obj) => {
//   return Object.keys(obj).length === 0;
// };

// Configuración estática del tablero
const BOARD_CONFIG = {
  DIAS: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  HORAS: [
    '07:00-08:00',
    '08:00-09:00',
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
    '17:00-18:00',
    '18:00-19:00',
    '19:00-20:00',
    '20:00-21:00',
    '21:00-22:00'
  ]
};

// Componente para la celda esquina
const CornerCell = React.memo(() => (
  <div className="celda-esquina">Hora</div>
));

// Componente para encabezados de días
const DayHeader = React.memo(({ dia }) => (
  <div className="encabezado-dia">{dia}</div>
));

// Componente para encabezados de horas
const HourHeader = React.memo(({ hora }) => (
  <div className="encabezado-hora">{hora}</div>
));

// Componente para mostrar información del curso
const CourseInfo = React.memo(({ curso }) => (
  <div className="curso-celda">
    <div className="curso-codigo">{curso.codigo}</div>
    <div className="curso-nombre">{curso.nombre}</div>
    {curso.aula && (
      <div className="curso-aula">{curso.aula}</div>
    )}
  </div>
));

// Componente para mostrar información de conflicto
const ConflictInfo = React.memo(({ cursos }) => (
  <div className="conflict-info">
    {cursos.map((curso, index) => (
      <div key={curso.id || index} className="conflict-course">
        <div className="conflict-code">{curso.codigo}</div>
      </div>
    ))}
  </div>
));

// Componente para celdas individuales del horario
const ScheduleCell = React.memo(({ dia, hora, cursos = [], onCellClick }) => {
  const handleClick = () => {
    if (onCellClick) {
      onCellClick(dia, hora, cursos);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Eventos táctiles para dispositivos móviles
  const handleTouchStart = (e) => {
    // Marcar que se inició un toque
    e.currentTarget.dataset.touchStarted = 'true';
  };

  const handleTouchEnd = (e) => {
    // Solo ejecutar si se inició el toque en este elemento
    if (e.currentTarget.dataset.touchStarted === 'true') {
      e.preventDefault();
      handleClick();
      // Limpiar el marcador
      delete e.currentTarget.dataset.touchStarted;
    }
  };

  const handleTouchCancel = (e) => {
    // Limpiar el marcador si se cancela el toque
    delete e.currentTarget.dataset.touchStarted;
  };

  // Función para obtener la clase de color basada en el código del curso
  const getColorClass = (curso) => {
    if (!curso?.codigo) return '';
    // Usar el hash del código del curso para asignar un color consistente
    const hash = curso.codigo.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(hash) % 24; // 24 colores disponibles en CSS
    return `hor${colorIndex}`;
  };

  const hasConflict = cursos.length > 1;
  // const isEmpty = cursos.length === 0;
  const singleCourse = cursos.length === 1;

  return (
    <div 
      className={`celda-horario ${
        hasConflict ? 'has-conflict' : 
        singleCourse ? getColorClass(cursos[0]) : 
        'libre'
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Celda ${dia} ${hora} ${
        hasConflict ? `conflicto entre ${cursos.length} cursos` :
        singleCourse ? `ocupada por ${cursos[0].nombre}` : 
        'libre'
      }`}
    >
      {hasConflict && <ConflictInfo cursos={cursos} />}
      {singleCourse && <CourseInfo curso={cursos[0]} />}
    </div>
  );
});

// Componente para una fila completa del horario
const ScheduleRow = React.memo(({ hora, cursos, onCellClick }) => {
  // Memoizar el cálculo de cursos por celda para mejor rendimiento
  const cursosEnCeldas = useMemo(() => {
    const resultado = {};
    
    BOARD_CONFIG.DIAS.forEach(dia => {
      const cursosEncontrados = cursos.filter(curso => {
        if (!curso.horarios) return false;
        
        return curso.horarios.some(horario => {
          const diaCoincide = horario.dia === dia;
          
          // Verificar si la hora de la celda está dentro del rango del horario del curso
          if (!diaCoincide) return false;
          
          // Extraer horas de inicio y fin de la celda (ej: "08:00-09:00")
          const [horaInicioCelda, horaFinCelda] = hora.split('-');
          
          // Usar horaInicio y horaFin normalizados del horario del curso
          const horaInicioCurso = horario.horaInicio;
          const horaFinCurso = horario.horaFin;
          
          // Verificar si hay solapamiento usando la función utilitaria
          return verificarSolapamiento(
            horaInicioCelda,
            horaFinCelda,
            horaInicioCurso,
            horaFinCurso
          );
        });
      });
      
      resultado[dia] = cursosEncontrados;
    });
    
    return resultado;
  }, [cursos, hora]);
  
  const getCursoEnCelda = useCallback((dia) => {
    return cursosEnCeldas[dia] || [];
  }, [cursosEnCeldas]);

  return (
      <React.Fragment>
        <HourHeader hora={hora} />
        {BOARD_CONFIG.DIAS.map(dia => {
          const cursosEnCelda = getCursoEnCelda(dia);
          return (
            <ScheduleCell 
              key={`${dia}-${hora}`}
              dia={dia}
              hora={hora}
              cursos={cursosEnCelda}
              onCellClick={onCellClick}
            />
          );
        })}
      </React.Fragment>
    );
});

// Componente para los encabezados de días
const DayHeaders = React.memo(() => (
  <React.Fragment>
    <CornerCell />
    {BOARD_CONFIG.DIAS.map(dia => (
      <DayHeader key={dia} dia={dia} />
    ))}
  </React.Fragment>
));

// Componente para todas las filas de horarios
const ScheduleRows = React.memo(({ cursos, onCellClick }) => (
  <React.Fragment>
    {BOARD_CONFIG.HORAS.map(hora => (
      <ScheduleRow 
        key={hora}
        hora={hora}
        cursos={cursos}
        onCellClick={onCellClick}
      />
    ))}
  </React.Fragment>
));

// Componente principal del tablero de horarios
const ScheduleBoard = React.memo(({ cursos = [], onCellClick, className = '' }) => {
  // Memoizar los cursos para evitar re-renders innecesarios
  const memoizedCursos = useMemo(() => cursos, [cursos]);
  
  // Solo mostrar log en desarrollo para mejor rendimiento
  if (import.meta.env.DEV) {
    console.log('🎯 ScheduleBoard recibió', cursos.length, 'cursos:', cursos.map(c => c.codigo));
  }
  
  return (
    <div className={`schedule-board ${className}`}>
      <div className="schedule-container">
        <div className="schedule-grid">
          <DayHeaders />
          <ScheduleRows cursos={memoizedCursos} onCellClick={onCellClick} />
        </div>
      </div>
    </div>
  );
});

ScheduleBoard.displayName = 'ScheduleBoard';

export default ScheduleBoard;