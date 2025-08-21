import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import './CourseSelector.css';

/**
 * Componente optimizado para la búsqueda y selección de cursos
 * Incluye funcionalidad de arrastre y búsqueda optimizada
 */
const CourseSelector = memo(({ 
  cursos = [],
  cursosSeleccionados = [],
  conflictos = [],
  onCursoToggle,
  onLimpiarSeleccion,
  loading = false,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCursosList, setShowCursosList] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [internalPosition, setInternalPosition] = useState({ x: 20, y: 100 });
  
  // Ref para optimización de animaciones
  const animationFrameRef = useRef(null);
  const lastPositionRef = useRef(internalPosition);
  const resizeTimeoutRef = useRef(null);

  // Estado para detectar si estamos en modo flotante (pantallas grandes)
  const [isFloatingMode, setIsFloatingMode] = useState(() => window.innerWidth >= 1025);
  
  // Efecto para detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const newIsFloatingMode = window.innerWidth >= 1025;
      setIsFloatingMode(newIsFloatingMode);
      
      // Si cambiamos a modo no flotante, resetear posición
      if (!newIsFloatingMode && isDragging) {
        setIsDragging(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDragging]);

  // Función para calcular límites de pantalla (reutilizable)
  const calculateScreenLimits = useCallback(() => {
    const screenWidth = window.innerWidth || 1024; // Fallback por seguridad
    const screenHeight = window.innerHeight || 768; // Fallback por seguridad
    const componentWidth = 320;
    
    let minX, maxX;
    
    if (screenWidth >= 1200) {
      minX = -componentWidth + 50;
      maxX = screenWidth - 50;
    } else if (screenWidth >= 768) {
      minX = -componentWidth + 80;
      maxX = screenWidth - 80;
    } else {
      minX = -componentWidth + 120;
      maxX = screenWidth - 40;
    }
    
    return {
      minX,
      maxX,
      minY: 0,
      maxY: screenHeight - 40
    };
  }, []);

  // Memoizar límites de pantalla para evitar cálculos repetitivos
  const screenLimits = useMemo(() => calculateScreenLimits(), [calculateScreenLimits]);

  // Función optimizada para actualizar posición con requestAnimationFrame
  const updatePositionSmooth = useCallback((newX, newY) => {
    if (!isFloatingMode) return; // Solo funcionar en modo flotante
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      try {
        const { minX, maxX, minY, maxY } = screenLimits;
        
        const newPosition = {
          x: Math.max(minX, Math.min(newX, maxX)),
          y: Math.max(minY, Math.min(newY, maxY))
        };
        
        // Actualizar posición interna si realmente cambió
        if (newPosition.x !== lastPositionRef.current.x || newPosition.y !== lastPositionRef.current.y) {
          lastPositionRef.current = newPosition;
          setInternalPosition(newPosition);
        }
      } catch (error) {
        console.warn('Error updating position:', error);
      }
    });
  }, [screenLimits, isFloatingMode]);
  const cursosSectionRef = useRef(null);

  // Filtrar cursos: excluir seleccionados y aplicar búsqueda
  const cursosFiltrados = useMemo(() => {
    if (cursos.length === 0) {
      return [];
    }
    
    // Crear Set de IDs de cursos seleccionados para búsqueda rápida
    const idsSeleccionados = new Set(cursosSeleccionados.map(curso => 
      typeof curso === 'object' ? curso.id : curso
    ));
    
    const filtrados = cursos.filter(curso => {
      // Excluir cursos ya seleccionados
      const cursoId = typeof curso === 'object' ? curso.id : curso;
      if (idsSeleccionados.has(cursoId)) {
        return false;
      }
      
      // Filtrar por término de búsqueda
      if (!searchTerm) return true;
      const termino = searchTerm.toLowerCase();
      return curso.codigo?.toLowerCase().includes(termino) || 
             curso.nombre?.toLowerCase().includes(termino);
    });
    
    return filtrados;
  }, [cursos, searchTerm, cursosSeleccionados]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Mostrar lista inmediatamente si hay contenido o cursos seleccionados
    setShowCursosList(value.length > 0 || cursosSeleccionados.length > 0);
  }, [cursosSeleccionados.length]);

  const handleCourseToggle = useCallback((curso) => {
    // Feedback visual inmediato: agregar clase de transición
    const courseElement = document.querySelector(`[data-course-id="${curso.id}"]`);
    if (courseElement) {
      courseElement.classList.add('course-selecting');
      setTimeout(() => {
        courseElement.classList.remove('course-selecting');
      }, 300);
    }
    
    // Ejecutar inmediatamente para respuesta visual instantánea
    onCursoToggle?.(curso);
  }, [onCursoToggle]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setShowCursosList(false);
  }, []);

  const handleToggleList = useCallback(() => {
    setShowCursosList(!showCursosList);
  }, [showCursosList]);

  // Funciones de arrastre para mouse
  const handleMouseDown = useCallback((e) => {
    if (!isFloatingMode) return; // Solo funcionar en modo flotante
    
    // Verificar si el elemento es arrastrable
    const isDragHandle = e.target.closest('.drag-handle');
    const isHeader = e.target.closest('.course-selector-header');
    
    // Evitar arrastre en elementos interactivos
    if (e.target.closest('.curso-item') || e.target.closest('.search-input') || 
        e.target.closest('.clear-search') || e.target.closest('input[type="checkbox"]') ||
        e.target.closest('button')) {
      return;
    }
    
    // Solo permitir arrastre desde el handle o header
    if (!isDragHandle && !isHeader) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    setDragOffset({
      x: e.clientX - internalPosition.x,
      y: e.clientY - internalPosition.y
    });
  }, [internalPosition.x, internalPosition.y, isFloatingMode]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Usar la función optimizada para actualizar posición
    updatePositionSmooth(newX, newY);
  }, [isDragging, dragOffset, updatePositionSmooth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Limpiar cualquier animación pendiente
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Funciones de arrastre para touch
  const handleTouchStart = useCallback((e) => {
    if (!isFloatingMode) return; // Solo funcionar en modo flotante
    
    const target = e.target;
    const isDragHandle = target.closest('.drag-handle');
    const isHeader = target.closest('.course-selector-header');
    
    // Evitar arrastre en elementos interactivos
    if (target.closest('.curso-item') || target.closest('.search-input') || 
        target.closest('.clear-search') || target.closest('input[type="checkbox"]') ||
        target.closest('button')) {
      return;
    }
    
    // Solo permitir arrastre desde el handle o header
    if (!isDragHandle && !isHeader) {
      return;
    }
    
    const touch = e.touches[0];
    
    setTouchStartPos({
      x: touch.clientX,
      y: touch.clientY
    });
    
    setHasMoved(false);
    
    setDragOffset({
      x: touch.clientX - internalPosition.x,
      y: touch.clientY - internalPosition.y
    });
  }, [internalPosition.x, internalPosition.y, isFloatingMode]);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    const threshold = 5;
    
    if ((deltaX > threshold || deltaY > threshold) && !hasMoved) {
      setHasMoved(true);
      setIsDragging(true);
      
      try {
        if (e.cancelable) {
          e.preventDefault();
        }
      } catch {
         // Ignorar errores
       }
    }
    
    if (!isDragging && !hasMoved) return;
    
    try {
      if (e.cancelable) {
        e.preventDefault();
      }
    } catch {
         // Ignorar errores
       }
    
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    // Usar la función optimizada para actualizar posición
    updatePositionSmooth(newX, newY);
  }, [isDragging, hasMoved, dragOffset, touchStartPos, updatePositionSmooth]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setHasMoved(false);
    // Limpiar cualquier animación pendiente
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Efectos para eventos de arrastre
  useEffect(() => {
    const element = cursosSectionRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Efecto para ajustar posición en cambios de tamaño de pantalla (solo en modo flotante)
  useEffect(() => {
    if (!isFloatingMode) return;
    
    const handleResize = () => {
      // Throttling para mejorar rendimiento
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = setTimeout(() => {
        try {
          // Usar la función compartida para calcular límites
          const { minX, maxX, minY, maxY } = calculateScreenLimits();
          
          // Ajustar posición actual si está fuera de los nuevos límites
          const adjustedPosition = {
            x: Math.max(minX, Math.min(internalPosition.x, maxX)),
            y: Math.max(minY, Math.min(internalPosition.y, maxY))
          };
          
          // Solo actualizar si la posición cambió
          if (adjustedPosition.x !== internalPosition.x || adjustedPosition.y !== internalPosition.y) {
            setInternalPosition(adjustedPosition);
          }
        } catch (error) {
          console.warn('Error handling resize:', error);
        }
      }, 100); // Throttle de 100ms
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [internalPosition, isFloatingMode, calculateScreenLimits]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('selectstart', (e) => e.preventDefault());
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('selectstart', (e) => e.preventDefault());
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Limpiar animaciones al desmontar el componente
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (cursos.length === 0) {
    return null;
  }

  return (
    <div 
      ref={cursosSectionRef}
      className={`course-selector ${isDragging ? 'dragging' : ''}`}
      style={isFloatingMode ? {
        left: `${internalPosition.x}px`,
        top: `${internalPosition.y}px`,
        right: 'auto'
      } : {}}
      onMouseDown={handleMouseDown}
    >
      <div className="drag-handle" title="Arrastra para mover">
        <span className="drag-icon">⋮⋮</span>
      </div>
      
      <div onClick={handleToggleList} className="course-selector-header">
        <div>
          <span>Cursos Disponibles {showCursosList ? '▼' : '▶'}</span>
          <div className="course-count">
            Mostrando {cursosFiltrados.length} de {cursos?.length || 0} cursos
          </div>
        </div>
        {cursosSeleccionados.length > 0 && (
          <span className="selected-count">({cursosSeleccionados.length})</span>
        )}
      </div>
      
      {loading && (
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <span>Cargando cursos...</span>
        </div>
      )}
      
      {/* Buscador de cursos */}
      <div className={`search-container ${showCursosList ? 'show' : ''}`}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por código o nombre del curso..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
            onFocus={() => setShowCursosList(true)}
            disabled={disabled}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={handleClearSearch}
              title="Limpiar búsqueda"
              disabled={disabled}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de cursos */}
      <div className={`cursos-list ${showCursosList ? 'show' : ''}`}>
        {cursosFiltrados.length === 0 ? (
          <div className="no-results">
            {searchTerm ? 
              'No se encontraron cursos que coincidan con la búsqueda.' :
              'No hay cursos disponibles para seleccionar.'
            }
          </div>
        ) : (
          cursosFiltrados.map(curso => (
            <div 
              key={curso.id}
              data-course-id={curso.id}
              className={`curso-item ${cursosSeleccionados.some(c => c.id === curso.id) ? 'selected' : ''}`}
              onClick={() => handleCourseToggle(curso)}
            >
              <div className="curso-info">
                <div className="curso-codigo">{curso.codigo}</div>
                <div className="curso-nombre">{curso.nombre}</div>
                <div className="curso-creditos">{curso.creditos} créditos</div>
                {curso.semestre && (
                  <div className="curso-semestre">Semestre: {curso.semestre}</div>
                )}
              </div>
              <div className="curso-checkbox">
                {loading ? (
                  <div className="checkbox-loading">⏳</div>
                ) : (
                  <input
                    type="checkbox"
                    checked={cursosSeleccionados.some(c => c.id === curso.id)}
                    onChange={() => handleCourseToggle(curso)}
                    disabled={loading || disabled}
                    aria-label={`Seleccionar curso ${curso.codigo}`}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Información de conflictos */}
      {conflictos.length > 0 && showCursosList && (
        <div className="conflictos-warning">
          <span className="warning-icon">⚠️</span>
          <span>Se detectaron {conflictos.length} conflicto(s) de horario</span>
        </div>
      )}
      
      {/* Botón para limpiar selección */}
      {cursosSeleccionados.length > 0 && (
        <div className="actions-container">
          <button 
            className="clear-selection-btn"
            onClick={onLimpiarSeleccion}
            disabled={disabled || loading}
            title="Limpiar toda la selección"
          >
            🗑️ Limpiar Todo
          </button>
        </div>
      )}
    </div>
  );
});

CourseSelector.displayName = 'CourseSelector';

export default CourseSelector;