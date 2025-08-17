import React, { memo, useCallback, useMemo } from 'react';
import './FacultySchoolSelector.css';

/**
 * Componente optimizado para la selección de facultades y escuelas
 * Separado del componente principal para mejor reutilización
 */
const FacultySchoolSelector = memo(({ 
  facultades = [],
  escuelas = [],
  selectedFacultad,
  selectedEscuela,
  onFacultadChange,
  onEscuelaChange,
  loading = false,
  error = null,
  disabled = false
}) => {
  
  const handleFacultadChange = useCallback((e) => {
    const value = e.target.value;
    onFacultadChange?.(value);
  }, [onFacultadChange]);

  const handleEscuelaChange = useCallback((e) => {
    const value = e.target.value;
    onEscuelaChange?.(value);
  }, [onEscuelaChange]);

  // Memoizar las opciones para evitar re-renders innecesarios
  const facultadOptions = useMemo(() => 
    facultades.map(facultad => (
      <option key={facultad.id} value={facultad.id}>
        {facultad.nombre}
      </option>
    )), [facultades]
  );

  const escuelaOptions = useMemo(() => 
    escuelas.map(escuela => (
      <option key={escuela.id} value={escuela.id}>
        {escuela.nombre}
      </option>
    )), [escuelas]
  );

  return (
    <div className="faculty-school-selector">
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      <div className="selector-group">
        <label htmlFor="facultad-select" className="selector-label">
          Facultad:
        </label>
        <div className="selector-wrapper">
          <select 
            id="facultad-select"
            value={selectedFacultad} 
            onChange={handleFacultadChange}
            disabled={disabled || loading}
            className={`selector ${loading ? 'loading' : ''}`}
            aria-label="Seleccionar facultad"
          >
            <option value="">Seleccionar Facultad</option>
            {facultadOptions}
          </select>
          {loading && <div className="loading-spinner"></div>}
        </div>
      </div>

      {selectedFacultad && (
        <div className="selector-group">
          <label htmlFor="escuela-select" className="selector-label">
            Escuela Profesional:
          </label>
          <div className="selector-wrapper">
            <select 
              id="escuela-select"
              value={selectedEscuela} 
              onChange={handleEscuelaChange}
              disabled={disabled || loading || !selectedFacultad}
              className={`selector ${loading ? 'loading' : ''}`}
              aria-label="Seleccionar escuela profesional"
            >
              <option value="">Seleccionar Escuela</option>
              {escuelaOptions}
            </select>
            {loading && <div className="loading-spinner"></div>}
          </div>
          
          {escuelas.length === 0 && selectedFacultad && !loading && (
            <div className="no-data-message">
              <span className="info-icon">ℹ️</span>
              <span>No se encontraron escuelas para esta facultad</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

FacultySchoolSelector.displayName = 'FacultySchoolSelector';

export default FacultySchoolSelector;