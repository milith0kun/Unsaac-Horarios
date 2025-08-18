import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApiService } from '../services/supabaseService';

/**
 * Custom hook optimizado para el manejo de datos de la API
 * Usa datos precargados para máximo rendimiento
 */
export function useApiData() {
  const [facultades, setFacultades] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [todosLosDatos, setTodosLosDatos] = useState({ facultades: [], escuelas: [], cursos: [] });
  const [datosInicializados, setDatosInicializados] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarDatosIniciales = useCallback(async () => {
    if (datosInicializados) {
      console.log('Datos ya inicializados, retornando:', todosLosDatos);
      return todosLosDatos;
    }
    
    try {
      console.log('Iniciando carga de datos iniciales...');
      setLoading(true);
      setError(null);
      
      const response = await ApiService.obtenerDatosIniciales();
      console.log('Respuesta de API recibida:', response);
      
      // Set all data in memory
      setTodosLosDatos(response.data);
      setFacultades(response.data.facultades);
      setDatosInicializados(true);
      
      console.log('Datos inicializados correctamente:', {
        facultades: response.data.facultades?.length || 0,
        escuelas: response.data.escuelas?.length || 0,
        cursos: response.data.cursos?.length || 0
      });
      
      return response;
      
    } catch (err) {
      const errorMessage = `Error cargando datos iniciales: ${err.message}`;
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [datosInicializados, todosLosDatos]);

  // Cargar todos los datos iniciales al inicializar (solo una vez)
  useEffect(() => {
    if (!datosInicializados) {
      cargarDatosIniciales();
    }
  }, [datosInicializados, cargarDatosIniciales]);

  const cargarFacultades = useCallback(async () => {
    // Si ya tenemos datos inicializados, usar esos
    if (datosInicializados && todosLosDatos.facultades.length > 0) {
      setFacultades(todosLosDatos.facultades);
      return todosLosDatos.facultades;
    }
    
    // Fallback: cargar datos iniciales si no están disponibles
    await cargarDatosIniciales();
    return todosLosDatos.facultades;
  }, [datosInicializados, todosLosDatos, cargarDatosIniciales]);

  const cargarEscuelasPorFacultad = useCallback(async (facultadId) => {
    try {
      console.log('Cargando escuelas para facultad ID:', facultadId);
      
      // Asegurar que los datos estén inicializados
      if (!datosInicializados) {
        console.log('Datos no inicializados, cargando...');
        await cargarDatosIniciales();
      }
      
      console.log('Total escuelas disponibles:', todosLosDatos.escuelas?.length || 0);
      console.log('Primeras 3 escuelas:', todosLosDatos.escuelas?.slice(0, 3));
      
      // Usar datos precargados (mucho más rápido)
      const escuelasFiltradas = todosLosDatos.escuelas.filter(escuela => {
        console.log(`Comparando escuela ${escuela.id}: facultadId=${escuela.facultadId} con ${facultadId}`);
        return escuela.facultadId === facultadId;
      });
      
      console.log('Escuelas filtradas encontradas:', escuelasFiltradas.length);
      console.log('Escuelas filtradas:', escuelasFiltradas);
      
      setEscuelas(escuelasFiltradas);
      setCursos([]); // Limpiar cursos cuando cambia la facultad
      
      return escuelasFiltradas;
    } catch (err) {
      console.error('Error cargando escuelas:', err);
      setError(`Error cargando escuelas: ${err.message}`);
      return [];
    }
  }, [datosInicializados, todosLosDatos, cargarDatosIniciales]);

  const cargarCursosPorEscuela = useCallback(async (escuelaId) => {
    try {
      // Cargando cursos para escuela
      
      // Asegurar que los datos estén inicializados
      if (!datosInicializados) {
        console.log('⏳ [useApiData] Datos no inicializados, cargando...');
        await cargarDatosIniciales();
      }
      
      console.log(`📊 [useApiData] Total cursos disponibles en memoria: ${todosLosDatos.cursos?.length || 0}`);
      
      // PROBLEMA DETECTADO: Usar datos precargados puede estar desactualizado
      // Vamos a hacer una llamada directa a la API para comparar
      console.log(`🔄 [useApiData] Haciendo llamada directa a API para escuela ${escuelaId}`);
      
      let cursosDirectosAPI = null;
      
      try {
        const response = await fetch(`/api/cursos/${escuelaId}`);
        cursosDirectosAPI = await response.json();
        console.log(`✅ [useApiData] API directa devolvió: ${cursosDirectosAPI.length} cursos`);
        
        // Convertir a camelCase para consistencia
        const cursosConvertidos = cursosDirectosAPI.map(curso => ({
          id: curso.id,
          codigo: curso.codigo,
          nombre: curso.nombre,
          creditos: curso.creditos,
          semestre: curso.semestre,
          requisitos: curso.requisitos,
          escuelaId: curso.escuela_id,
          createdAt: curso.created_at,
          updatedAt: curso.updated_at
        }));
        
        console.log(`🔄 [useApiData] Cursos convertidos: ${cursosConvertidos.length}`);
        setCursos(cursosConvertidos);
        return cursosConvertidos;
        
      } catch (apiError) {
        console.error('❌ [useApiData] Error en llamada directa a API:', apiError);
        // Fallback a datos precargados
      }
      
      // Fallback: Usar datos precargados
      const cursosFiltrados = todosLosDatos.cursos.filter(curso => {
        const coincide = curso.escuelaId === parseInt(escuelaId);
        return coincide;
      });
      
      console.log(`📉 [useApiData] FALLBACK - Cursos filtrados de memoria: ${cursosFiltrados.length}`);
      console.log(`⚠️ [useApiData] DISCREPANCIA DETECTADA: API=${cursosDirectosAPI?.length || 'error'} vs Memoria=${cursosFiltrados.length}`);
      
      setCursos(cursosFiltrados);
      return cursosFiltrados;
      
    } catch (err) {
      console.error('❌ [useApiData] Error cargando cursos:', err);
      setError(`Error cargando cursos: ${err.message}`);
      return [];
    }
  }, [datosInicializados, todosLosDatos, cargarDatosIniciales]);

  const buscarCursos = useCallback(async (texto, escuelaId = null) => {
    if (!texto || texto.trim().length < 2) {
      return [];
    }
    
    try {
      // Asegurar que los datos estén inicializados
      if (!datosInicializados) {
        await cargarDatosIniciales();
      }
      
      // Buscar en datos precargados (instantáneo)
      const textoLower = texto.toLowerCase();
      let cursosParaBuscar = todosLosDatos.cursos;
      
      // Filtrar por escuela si se especifica
      if (escuelaId) {
        cursosParaBuscar = cursosParaBuscar.filter(curso => curso.escuelaId === escuelaId);
      }
      
      // Buscar por código o nombre
      const resultados = cursosParaBuscar.filter(curso => 
        curso.codigo.toLowerCase().includes(textoLower) ||
        curso.nombre.toLowerCase().includes(textoLower)
      );
      
      return resultados;
    } catch (err) {
      console.error('Error buscando cursos:', err);
      setError(`Error buscando cursos: ${err.message}`);
      return [];
    }
  }, [datosInicializados, todosLosDatos, cargarDatosIniciales]);

  const obtenerCursosPorIds = useCallback(async (cursoIds) => {
    if (!cursoIds || cursoIds.length === 0) {
      return [];
    }
    
    try {
      // Asegurar que los datos estén inicializados
      if (!datosInicializados) {
        await cargarDatosIniciales();
      }
      
      // Usar datos precargados (instantáneo)
      const cursosEncontrados = todosLosDatos.cursos.filter(curso => 
        cursoIds.includes(curso.id)
      );
      
      return cursosEncontrados;
    } catch (err) {
      console.error('Error obteniendo cursos por IDs:', err);
      setError(`Error obteniendo cursos: ${err.message}`);
      return [];
    }
  }, [datosInicializados, todosLosDatos, cargarDatosIniciales]);

  const detectarConflictos = useCallback(async (cursoIds) => {
    if (!cursoIds || cursoIds.length < 2) {
      return [];
    }
    
    try {
      const conflictos = await ApiService.detectarConflictosHorarios(cursoIds);
      return conflictos;
    } catch (err) {
      console.error('Error detectando conflictos:', err);
      return [];
    }
  }, []);

  // Limpiar datos (forzar recarga)
  const limpiarDatos = useCallback(() => {
    setTodosLosDatos({ facultades: [], escuelas: [], cursos: [] });
    setFacultades([]);
    setEscuelas([]);
    setCursos([]);
    setDatosInicializados(false);
  }, []);

  // Datos memoizados para mejor rendimiento
  const facultadesMemo = useMemo(() => facultades, [facultades]);
  const escuelasMemo = useMemo(() => escuelas, [escuelas]);
  const cursosMemo = useMemo(() => cursos, [cursos]);

  return {
    // Estados
    facultades: facultadesMemo,
    escuelas: escuelasMemo,
    cursos: cursosMemo,
    todosLosDatos,
    datosInicializados,
    loading,
    error,
    
    // Funciones principales
    cargarDatosIniciales,
    cargarFacultades,
    cargarEscuelasPorFacultad,
    cargarCursosPorEscuela,
    buscarCursos,
    obtenerCursosPorIds,
    detectarConflictos,
    
    // Utilidades
    limpiarDatos
  };
}

export default useApiData;