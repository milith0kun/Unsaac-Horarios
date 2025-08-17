/**
 * Servicio para interactuar con la API backend
 */

// Detectar automáticamente la URL base según el entorno
const getApiBaseUrl = () => {
  // Si estamos en el navegador
  if (typeof window !== 'undefined') {
    // En desarrollo (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    // En producción, usar la misma URL del frontend pero con /api
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  
  // Fallback para entornos sin window (SSR, etc.)
  return process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

export class ApiService {
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
   */
  static async obtenerDatosIniciales() {
    return await this.request('/datos-iniciales');
  }

  /**
   * Obtener todas las facultades
   */
  static async obtenerFacultades() {
    return await this.request('/facultades');
  }

  /**
   * Obtener todas las escuelas
   */
  static async obtenerEscuelas() {
    return await this.request('/escuelas');
  }

  /**
   * Obtener todos los cursos
   */
  static async obtenerCursos() {
    return await this.request('/cursos');
  }

  /**
   * Obtener cursos específicos por IDs
   */
  static async obtenerCursosPorIds(cursoIds) {
    const result = await this.request('/cursos/batch', {
      method: 'POST',
      body: JSON.stringify({ ids: cursoIds })
    });

    return result.cursos || result;
  }

  /**
   * Buscar cursos por texto
   */
  static async buscarCursos(texto) {
    const params = new URLSearchParams({ q: texto });
    return await this.request(`/cursos/search?${params}`);
  }

  /**
   * Detectar conflictos de horarios
   */
  static async detectarConflictosHorarios(cursoIds) {
    return await this.request('/horarios/conflictos', {
      method: 'POST',
      body: JSON.stringify({ cursoIds })
    });
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  static async obtenerEstadisticas() {
    return await this.request('/estadisticas');
  }
}

export default ApiService;