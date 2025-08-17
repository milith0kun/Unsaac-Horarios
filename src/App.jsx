import React, { useState, useCallback } from 'react';
import './App.css'
import HorarioApp from './components/HorarioApp'
import FacultySchoolSelector from './components/FacultySchoolSelector'
import CourseSelector from './components/CourseSelector'
import { useApiData } from './hooks/useApiData'
import { useHorarios } from './hooks/usePrismaData'

const App = React.memo(() => {
  // API data management
  const {
    facultades,
    escuelas,
    cursos,
    loading,
    error,
    cargarEscuelasPorFacultad,
    cargarCursosPorEscuela
  } = useApiData();

  // Schedule management
  const {
    cursosSeleccionados,
    conflictos,
    agregarCurso,
    removerCurso,
    limpiarSeleccion
  } = useHorarios();

  // Local state for selectors
  const [selectedFacultad, setSelectedFacultad] = useState('');
  const [selectedEscuela, setSelectedEscuela] = useState('');

  // Event handlers
  const handleFacultadChange = useCallback(async (facultadId) => {
    setSelectedFacultad(facultadId);
    setSelectedEscuela('');
    if (facultadId) {
      await cargarEscuelasPorFacultad(parseInt(facultadId));
    }
    limpiarSeleccion();
  }, [cargarEscuelasPorFacultad, limpiarSeleccion]);

  const handleEscuelaChange = useCallback(async (escuelaId) => {
    setSelectedEscuela(escuelaId);
    if (escuelaId) {
      await cargarCursosPorEscuela(parseInt(escuelaId));
    }
    limpiarSeleccion();
  }, [cargarCursosPorEscuela, limpiarSeleccion]);

  const handleCourseToggle = useCallback((curso) => {
    // Extraer el ID del objeto curso o usar directamente si es un ID
    const courseId = typeof curso === 'object' ? curso.id : curso;
    const yaSeleccionado = cursosSeleccionados.some(c => c.id === courseId);
    
    // Ejecutar sin await para respuesta visual instantánea
    if (yaSeleccionado) {
      removerCurso(courseId);
    } else {
      agregarCurso(courseId);
    }
  }, [cursosSeleccionados, removerCurso, agregarCurso]);



  return (
    <div className="app">
      <header className="app-header">
        <h1>Sistema de Horarios UNSAAC</h1>
      </header>

      <div className="main-content">
        <div className="selectors-section">
          <FacultySchoolSelector
            facultades={facultades}
            escuelas={escuelas}
            selectedFacultad={selectedFacultad}
            selectedEscuela={selectedEscuela}
            onFacultadChange={handleFacultadChange}
            onEscuelaChange={handleEscuelaChange}
            loading={loading}
            error={error}
          />
        </div>

        <div className="horario-section">
          <h2>Horario de Clases</h2>
          <div className="schedule-board-container">
            <HorarioApp 
              cursosSeleccionados={cursosSeleccionados} 
              onRemoverCurso={removerCurso}
              onLimpiarSeleccion={limpiarSeleccion}
            />
          </div>
          
          {/* Course selector component */}
          {selectedEscuela && cursos && cursos.length > 0 && (
            <CourseSelector
              cursos={cursos}
              cursosSeleccionados={cursosSeleccionados}
              conflictos={conflictos}
              onCursoToggle={handleCourseToggle}
              onLimpiarSeleccion={limpiarSeleccion}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  )
});

App.displayName = 'App';

export default App;
