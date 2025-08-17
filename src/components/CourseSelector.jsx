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
  disabled = false,
  position = { x: 20, y: 100 },
  onPositionChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCursosList, setShowCursosList] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  
  const cursosSectionRef = useRef(null);

  // Filtrar cursos: excluir seleccionados y aplicar búsqueda
  const cursosFiltrados = useMemo(() => {
    if (!cursos || cursos.length === 0) {
      console.log('📊 [CourseSelector] No hay cursos disponibles');
      return [];
    }
    
    console.log(`📊 [CourseSelector] Total cursos recibidos: ${cursos.length}`);
    console.log(`📊 [CourseSelector] Cursos seleccionados: ${cursosSeleccionados.length}`);
    
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
    
    console.log(`🔍 [CourseSelector] Cursos disponibles (no seleccionados): ${filtrados.length}`);
    console.log(`🔎 [CourseSelector] Término de búsqueda: "${searchTerm}"`);
    
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
    const isDragHandle = e.target.closest('.drag-handle');
    const isLabel = e.target.tagName === 'LABEL' || e.target.closest('label');
    
    if (e.target.closest('.curso-item') || e.target.closest('.search-input') || 
        e.target.closest('.clear-search') || e.target.closest('input[type="checkbox"]')) {
      return;
    }
    
    if (!isDragHandle && !isLabel) {
      return;
    }
    
    if (isLabel) {
      e.stopPropagation();
    }
    
    e.preventDefault();
    setIsDragging(true);
    
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position.x, position.y]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    const minX = -300;
    const minY = -50;
    const maxX = window.innerWidth - 50;
    const maxY = window.innerHeight - 50;
    
    const newPosition = {
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    };
    
    onPositionChange?.(newPosition);
  }, [isDragging, dragOffset, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Funciones de arrastre para touch
  const handleTouchStart = useCallback((e) => {
    const target = e.target;
    const isDragHandle = target.closest('.drag-handle');
    const isLabel = target.tagName === 'LABEL' || target.closest('label');
    
    if (target.closest('.curso-item') || target.closest('.search-input') || 
        target.closest('.clear-search') || target.closest('input[type="checkbox"]')) {
      return;
    }
    
    if (!isDragHandle && !isLabel) {
      return;
    }
    
    const touch = e.touches[0];
    
    setTouchStartPos({
      x: touch.clientX,
      y: touch.clientY
    });
    
    setHasMoved(false);
    
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  }, [position.x, position.y]);

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
    
    const minX = -300;
    const minY = -50;
    const maxX = window.innerWidth - 50;
    const maxY = window.innerHeight - 50;
    
    const newPosition = {
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    };
    
    onPositionChange?.(newPosition);
  }, [isDragging, dragOffset, touchStartPos.x, touchStartPos.y, hasMoved, onPositionChange]);

  const handleTouchEnd = useCallback((e) => {
    if (!hasMoved) {
      // No hacer nada, dejar que el evento click natural funcione
    } else {
      try {
        if (e.cancelable) {
          e.preventDefault();
        }
      } catch {
         // Ignorar errores
       }
    }
    
    setIsDragging(false);
    setHasMoved(false);
  }, [hasMoved]);

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

  if (cursos.length === 0) {
    return null;
  }

  return (
    <div 
      ref={cursosSectionRef}
      className={`course-selector ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="drag-handle" title="Arrastra para mover">
        <span className="drag-icon">⋮⋮</span>
      </div>
      
      <label onClick={handleToggleList} className="course-selector-label">
        <div>
          <span>Cursos Disponibles {showCursosList ? '▼' : '▶'}</span>
          <div className="course-count">
            Mostrando {cursosFiltrados.length} de {cursos?.length || 0} cursos
          </div>
        </div>
        {cursosSeleccionados.length > 0 && (
          <span className="selected-count">({cursosSeleccionados.length})</span>
        )}
      </label>
      
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