/**
 * Servicio para interactuar con la API backend Express
 */

// Detectar automáticamente la URL base según el entorno
const getApiBaseUrl = () => {
  // Si estamos en el navegador
  if (typeof window !== 'undefined') {
    // En desarrollo (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    // En producción, usar la misma URL del frontend pero con /api
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  
  // Fallback para entornos sin window (SSR, etc.)
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export class ApiService {
  /**
   * Determinar la URL base de la API según el entorno
   */
  static getApiBaseUrl() {
    // En desarrollo, usar el servidor local
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3001/api';
    }
    // En producción, usar la URL actual
    return '/api';
  }

  /**
   * Realizar petición HTTP optimizada
   */
  static async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
    
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal,
        ...options
      };

      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - La consulta tardó demasiado');
      }
      console.error(`Error en petición a ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todos los datos iniciales (facultades, escuelas, cursos) en una sola consulta
   * Para mantener compatibilidad, simulamos la estructura anterior
   */
  static async obtenerDatosIniciales() {
    try {
      // Obtener todos los datos desde el endpoint de datos iniciales
      const response = await this.request('/datos-iniciales');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            facultades: response.data.facultades || [],
            escuelas: response.data.escuelas || [],
            cursos: response.data.cursos || []
          }
        };
      }
      
      // Fallback: cargar datos por separado
      const facultades = await this.obtenerFacultades();
      const escuelas = await this.obtenerTodasEscuelas();
      const cursos = await this.obtenerTodosCursos();

      return {
        success: true,
        data: {
          facultades,
          escuelas,
          cursos
        }
      };
    } catch (error) {
      console.error('Error obteniendo datos iniciales:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las facultades
   */
  static async obtenerFacultades() {
    return await this.request('/facultades');
  }

  /**
   * Obtener todas las escuelas (para datos iniciales)
   */
  static async obtenerTodasEscuelas() {
    try {
      const response = await this.request('/datos-iniciales');
      if (response.success && response.data) {
        return response.data.escuelas.map(escuela => ({
          ...escuela,
          facultadId: escuela.facultadId // Ya viene en camelCase desde la API
        }));
      }
      return [];
    } catch (error) {
      console.error('Error al obtener todas las escuelas:', error);
      return [];
    }
  }

  /**
   * Obtener todos los cursos (para datos iniciales)
   */
  static async obtenerTodosCursos() {
    try {
      const response = await this.request('/datos-iniciales');
      if (response.success && response.data) {
        return response.data.cursos.map(curso => ({
          ...curso,
          escuelaId: curso.escuelaId // Ya viene en camelCase desde la API
        }));
      }
      return [];
    } catch (error) {
      console.error('Error al obtener todos los cursos:', error);
      return [];
    }
  }

  /**
   * Obtener escuelas por facultad
   */
  static async obtenerEscuelas(facultadId = null) {
    if (facultadId) {
      return await this.request(`/escuelas/${facultadId}`);
    }
    return await this.obtenerTodasEscuelas();
  }

  /**
   * Obtener cursos por escuela
   */
  static async obtenerCursos(escuelaId = null) {
    if (escuelaId) {
      return await this.request(`/cursos/${escuelaId}`);
    }
    return await this.obtenerTodosCursos();
  }

  /**
   * Obtener horarios por curso
   */
  static async obtenerHorarios(cursoId) {
    return await this.request(`/horarios/${cursoId}`);
  }

  /**
   * Obtener cursos específicos por IDs
   */
  static async obtenerCursosPorIds(cursoIds) {
    // Para mantener compatibilidad, buscar en todos los cursos
    const todosCursos = await this.obtenerTodosCursos();
    return todosCursos.filter(curso => cursoIds.includes(curso.id));
  }

  /**
   * Buscar cursos por texto
   */
  static async buscarCursos(texto) {
    // Implementar búsqueda local en todos los cursos
    const todosCursos = await this.obtenerTodosCursos();
    const textoLower = texto.toLowerCase();
    
    return todosCursos.filter(curso => 
      curso.codigo?.toLowerCase().includes(textoLower) ||
      curso.nombre?.toLowerCase().includes(textoLower)
    );
  }

  /**
   * Detectar conflictos de horarios
   */
  static async detectarConflictosHorarios(cursoIds) {
    // Obtener horarios de todos los cursos
    const conflictos = [];
    
    for (let i = 0; i < cursoIds.length; i++) {
      for (let j = i + 1; j < cursoIds.length; j++) {
        try {
          const [horarios1, horarios2] = await Promise.all([
            this.obtenerHorarios(cursoIds[i]),
            this.obtenerHorarios(cursoIds[j])
          ]);
          
          // Verificar conflictos entre horarios
          for (const h1 of horarios1) {
            for (const h2 of horarios2) {
              if (h1.dia === h2.dia) {
                // Verificar solapamiento de horarios
                const inicio1 = new Date(`1970-01-01T${h1.hora_inicio}`);
                const fin1 = new Date(`1970-01-01T${h1.hora_fin}`);
                const inicio2 = new Date(`1970-01-01T${h2.hora_inicio}`);
                const fin2 = new Date(`1970-01-01T${h2.hora_fin}`);
                
                if ((inicio1 < fin2 && fin1 > inicio2)) {
                  conflictos.push({
                    curso1: cursoIds[i],
                    curso2: cursoIds[j],
                    dia: h1.dia,
                    horario1: `${h1.hora_inicio}-${h1.hora_fin}`,
                    horario2: `${h2.hora_inicio}-${h2.hora_fin}`
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error verificando conflictos entre cursos ${cursoIds[i]} y ${cursoIds[j]}:`, error);
        }
      }
    }
    
    return conflictos;
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  static async obtenerEstadisticas() {
    try {
      const [facultades, escuelas, cursos] = await Promise.all([
        this.obtenerFacultades(),
        this.obtenerTodasEscuelas(),
        this.obtenerTodosCursos()
      ]);
      
      return {
        facultades: facultades.length,
        escuelas: escuelas.length,
        cursos: cursos.length
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { facultades: 0, escuelas: 0, cursos: 0 };
    }
  }

  /**
   * Probar conexión con el servidor
   */
  static async probarConexion() {
    return await this.request('/test');
  }
}

export default ApiService;