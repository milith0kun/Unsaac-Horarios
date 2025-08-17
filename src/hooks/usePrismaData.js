import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/prismaService';

/**
 * Hook personalizado para manejar datos de la base de datos usando Prisma
 */
export function usePrismaData() {
  const [facultades, setFacultades] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar facultades al inicializar
  useEffect(() => {
    cargarFacultades();
  }, []);

  const cargarFacultades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const facultades = await ApiService.obtenerFacultades();
       setFacultades(facultades);
    } catch (err) {
      setError('Error cargando facultades: ' + err.message);
      console.error('Error cargando facultades:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarEscuelasPorFacultad = useCallback(async (facultadId) => {
    try {
      setLoading(true);
      setError(null);
      const escuelas = await ApiService.obtenerEscuelasPorFacultad(facultadId);
       setEscuelas(escuelas);
      setCursos([]); // Limpiar cursos cuando cambia la facultad
    } catch (err) {
      setError('Error cargando escuelas: ' + err.message);
      console.error('Error cargando escuelas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCursosPorEscuela = useCallback(async (escuelaId) => {
    try {
      setLoading(true);
      setError(null);
      const cursos = await ApiService.obtenerCursosPorEscuela(escuelaId);
       setCursos(cursos);
    } catch (err) {
      setError('Error cargando cursos: ' + err.message);
      console.error('Error cargando cursos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarCursos = useCallback(async (texto, escuelaId = null) => {
    try {
      setLoading(true);
      setError(null);
      const resultados = await ApiService.buscarCursos(texto, escuelaId);
      return resultados;
    } catch (err) {
      setError('Error buscando cursos: ' + err.message);
      console.error('Error buscando cursos:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerCursosPorIds = useCallback(async (cursoIds) => {
    try {
      setLoading(true);
      setError(null);
      const cursos = await ApiService.obtenerCursosPorIds(cursoIds);
       return cursos;
    } catch (err) {
      setError('Error obteniendo cursos: ' + err.message);
      console.error('Error obteniendo cursos:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const detectarConflictos = useCallback(async (cursoIds) => {
    try {
      const conflictos = await ApiService.detectarConflictosHorarios(cursoIds);
      return conflictos;
    } catch (err) {
      console.error('Error detectando conflictos:', err);
      return [];
    }
  }, []);

  return {
    // Estados
    facultades,
    escuelas,
    cursos,
    loading,
    error,
    
    // Funciones
    cargarFacultades,
    cargarEscuelasPorFacultad,
    cargarCursosPorEscuela,
    buscarCursos,
    obtenerCursosPorIds,
    detectarConflictos
  };
}

/**
 * Hook específico para manejar la selección de cursos y horarios
 */
export function useHorarios() {
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);
  const [conflictos, setConflictos] = useState([]);
  const [loading, setLoading] = useState(false);

  const agregarCurso = useCallback(async (cursoId) => {
    try {
      // Verificar si ya está seleccionado (optimización temprana)
      if (cursosSeleccionados.find(c => c.id === cursoId)) {
        return;
      }
      
      setLoading(true);
      
      // Obtener datos completos del curso
      const cursosData = await ApiService.obtenerCursosPorIds([cursoId]);

      if (cursosData.length === 0) {
        setLoading(false);
        return;
      }
      
      const nuevoCurso = cursosData[0];
      const nuevaSeleccion = [...cursosSeleccionados, nuevoCurso];

      // Actualizar estado inmediatamente para respuesta visual instantánea
      setCursosSeleccionados(nuevaSeleccion);
      setLoading(false);
      
      // Detectar conflictos en segundo plano (no bloquea la UI)
      ApiService.detectarConflictosHorarios(
        nuevaSeleccion.map(c => c.id)
      ).then(nuevosConflictos => {
        setConflictos(nuevosConflictos);
      }).catch(error => {
        console.error('Error detectando conflictos:', error);
        setConflictos([]);
      });
      
    } catch (error) {
      console.error('Error agregando curso:', error);
      setLoading(false);
    }
  }, [cursosSeleccionados]);

  const removerCurso = useCallback(async (cursoId) => {
    try {
      const nuevaSeleccion = cursosSeleccionados.filter(c => c.id !== cursoId);
      
      // Actualizar estado inmediatamente para respuesta visual instantánea
      setCursosSeleccionados(nuevaSeleccion);
      
      // Recalcular conflictos en segundo plano (no bloquea la UI)
      if (nuevaSeleccion.length > 1) {
        ApiService.detectarConflictosHorarios(
          nuevaSeleccion.map(c => c.id)
        ).then(nuevosConflictos => {
          setConflictos(nuevosConflictos);
        }).catch(error => {
          console.error('Error detectando conflictos:', error);
          setConflictos([]);
        });
      } else {
        setConflictos([]);
      }
      
    } catch (error) {
      console.error('Error removiendo curso:', error);
    }
  }, [cursosSeleccionados]);

  const limpiarSeleccion = useCallback(() => {
    setCursosSeleccionados([]);
    setConflictos([]);
  }, []);

  return {
    cursosSeleccionados: cursosSeleccionados || [],
    conflictos: conflictos || [],
    loading,
    agregarCurso,
    removerCurso,
    limpiarSeleccion
  };
}

export default usePrismaData;