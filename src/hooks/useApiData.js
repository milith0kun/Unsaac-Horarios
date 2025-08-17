import { useState, useEffect, useCallback, useMemo } from 'react';
import { ApiService } from '../services/prismaService';

/**
 * Custom hook optimizado para el manejo de datos de la API
 * Separa la lógica de datos de la lógica de horarios
 */
export function useApiData() {
  const [facultades, setFacultades] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [todosLosDatos, setTodosLosDatos] = useState({ facultades: [], escuelas: [], cursos: [] });
  const [datosInicializados, setDatosInicializados] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState(new Map());

  // Cache key generator
  const generateCacheKey = useCallback((type, params = {}) => {
    return `${type}_${JSON.stringify(params)}`;
  }, []);

  // Generic request handler with caching
  const handleRequest = useCallback(async (requestFn, cacheKey, setter) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        if (setter) setter(cachedData);
        return cachedData;
      }
      
      const data = await requestFn();
      
      // Update cache
      setCache(prev => new Map(prev).set(cacheKey, data));
      
      if (setter) setter(data);
      return data;
      
    } catch (err) {
      const errorMessage = `Error en la petición: ${err.message}`;
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  // Cargar todos los datos iniciales al inicializar
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = useCallback(async () => {
    const cacheKey = generateCacheKey('datos-iniciales');
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        setTodosLosDatos(cachedData.data);
        setFacultades(cachedData.data.facultades);
        setDatosInicializados(true);
        return cachedData;
      }
      
      const response = await ApiService.obtenerDatosIniciales();
      
      // Update cache
      setCache(prev => new Map(prev).set(cacheKey, response));
      
      // Set all data
      setTodosLosDatos(response.data);
      setFacultades(response.data.facultades);
      setDatosInicializados(true);
      
      return response;
      
    } catch (err) {
      const errorMessage = `Error cargando datos iniciales: ${err.message}`;
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cache, generateCacheKey]);

  const cargarFacultades = useCallback(async () => {
    const cacheKey = generateCacheKey('facultades');
    return await handleRequest(
      () => ApiService.obtenerFacultades(),
      cacheKey,
      setFacultades
    );
  }, [handleRequest, generateCacheKey]);

  const cargarEscuelasPorFacultad = useCallback(async (facultadId) => {
    try {
      // Si los datos ya están inicializados, usar los datos precargados
      if (datosInicializados && todosLosDatos.escuelas.length > 0) {
        const escuelasFiltradas = todosLosDatos.escuelas.filter(escuela => escuela.facultadId === facultadId);
        setEscuelas(escuelasFiltradas);
        setCursos([]); // Limpiar cursos cuando cambia la facultad
        return escuelasFiltradas;
      }
      
      // Fallback: hacer consulta individual si no hay datos precargados
      const cacheKey = generateCacheKey('escuelas', { facultadId });
      const escuelas = await handleRequest(
        () => ApiService.obtenerEscuelas(),
        cacheKey
      );
      
      // Filtrar escuelas por facultad
      const escuelasFiltradas = escuelas.filter(escuela => escuela.facultadId === facultadId);
      setEscuelas(escuelasFiltradas);
      setCursos([]); // Limpiar cursos cuando cambia la facultad
      
      return escuelasFiltradas;
    } catch (err) {
      console.error('Error cargando escuelas:', err);
      setError(`Error cargando escuelas: ${err.message}`);
      return [];
    }
  }, [datosInicializados, todosLosDatos, handleRequest, generateCacheKey]);

  const cargarCursosPorEscuela = useCallback(async (escuelaId) => {
    try {
      // Si los datos ya están inicializados, usar los datos precargados
      if (datosInicializados && todosLosDatos.cursos.length > 0) {
        const cursosFiltrados = todosLosDatos.cursos.filter(curso => curso.escuelaId === escuelaId);
        setCursos(cursosFiltrados);
        return cursosFiltrados;
      }
      
      // Fallback: hacer consulta individual si no hay datos precargados
      const cacheKey = generateCacheKey('cursos', { escuelaId });
      const cursos = await handleRequest(
        () => ApiService.obtenerCursos(),
        cacheKey
      );
      
      // Filtrar cursos por escuela
      const cursosFiltrados = cursos.filter(curso => curso.escuelaId === escuelaId);
      setCursos(cursosFiltrados);
      
      return cursosFiltrados;
    } catch (err) {
      console.error('Error cargando cursos:', err);
      setError(`Error cargando cursos: ${err.message}`);
      return [];
    }
  }, [datosInicializados, todosLosDatos, handleRequest, generateCacheKey]);

  const buscarCursos = useCallback(async (texto, escuelaId = null) => {
    if (!texto || texto.trim().length < 2) {
      return [];
    }
    
    try {
      // Si los datos ya están inicializados, buscar en los datos precargados
      if (datosInicializados && todosLosDatos.cursos.length > 0) {
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
      }
      
      // Fallback: hacer consulta al servidor si no hay datos precargados
      const cacheKey = generateCacheKey('buscar', { texto, escuelaId });
      return await handleRequest(
        () => ApiService.buscarCursos(texto),
        cacheKey
      );
    } catch (err) {
      console.error('Error buscando cursos:', err);
      setError(`Error buscando cursos: ${err.message}`);
      return [];
    }
  }, [datosInicializados, todosLosDatos, handleRequest, generateCacheKey]);

  const obtenerCursosPorIds = useCallback(async (cursoIds) => {
    if (!cursoIds || cursoIds.length === 0) {
      return [];
    }
    
    try {
      // Optimización: respuesta inmediata con datos precargados
      if (datosInicializados && todosLosDatos.cursos.length > 0) {
        const cursosEncontrados = todosLosDatos.cursos.filter(curso => 
          cursoIds.includes(curso.id)
        );
        // Si encontramos todos los cursos solicitados, devolver inmediatamente
        if (cursosEncontrados.length === cursoIds.length) {
          return cursosEncontrados;
        }
      }
      
      // Check cache first para IDs específicos
      const cacheKey = generateCacheKey('cursosPorIds', { cursoIds: cursoIds.sort() });
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }
      
      // Optimización: consulta en lotes más pequeños para mejor rendimiento
      const BATCH_SIZE = 10;
      if (cursoIds.length > BATCH_SIZE) {
        const batches = [];
        for (let i = 0; i < cursoIds.length; i += BATCH_SIZE) {
          batches.push(cursoIds.slice(i, i + BATCH_SIZE));
        }
        
        const resultados = await Promise.all(
          batches.map(batch => ApiService.obtenerCursosPorIds(batch))
        );
        
        const cursosCompletos = resultados.flat();
        
        // Update cache
        setCache(prev => new Map(prev).set(cacheKey, cursosCompletos));
        
        return cursosCompletos;
      }
      
      // Consulta normal para lotes pequeños usando handleRequest
      return await handleRequest(
        () => ApiService.obtenerCursosPorIds(cursoIds),
        cacheKey
      );
    } catch (err) {
      console.error('Error obteniendo cursos por IDs:', err);
      setError(`Error obteniendo cursos: ${err.message}`);
      return [];
    }
  }, [datosInicializados, todosLosDatos, handleRequest, generateCacheKey, cache]);

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

  // Limpiar cache específico
  const limpiarCache = useCallback((pattern = null) => {
    if (pattern) {
      const newCache = new Map();
      for (const [key, value] of cache.entries()) {
        if (!key.includes(pattern)) {
          newCache.set(key, value);
        }
      }
      setCache(newCache);
    } else {
      setCache(new Map());
    }
  }, [cache]);

  // Estadísticas de cache
  const estadisticasCache = useMemo(() => {
    return {
      tamaño: cache.size,
      claves: Array.from(cache.keys())
    };
  }, [cache]);

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
    estadisticasCache,
    
    // Funciones principales
    cargarDatosIniciales,
    cargarFacultades,
    cargarEscuelasPorFacultad,
    cargarCursosPorEscuela,
    buscarCursos,
    obtenerCursosPorIds,
    detectarConflictos,
    
    // Utilidades
    limpiarCache
  };
}

export default useApiData;