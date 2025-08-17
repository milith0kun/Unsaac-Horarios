import { ValidationError } from './errorHandler.js';

/**
 * Middleware para validar que un parámetro ID sea un número válido
 */
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      throw new ValidationError(`Parámetro ${paramName} es requerido`);
    }
    
    const numericId = parseInt(id);
    
    if (isNaN(numericId) || numericId <= 0) {
      throw new ValidationError(`El parámetro ${paramName} debe ser un número entero positivo`);
    }
    
    req.params[paramName] = numericId;
    next();
  };
};

/**
 * Middleware para validar array de IDs en el body
 */
export const validateIdsArray = (fieldName = 'ids') => {
  return (req, res, next) => {
    const ids = req.body[fieldName];
    
    if (!Array.isArray(ids)) {
      throw new ValidationError(`El campo ${fieldName} debe ser un array`);
    }
    
    if (ids.length === 0) {
      throw new ValidationError(`El array ${fieldName} no puede estar vacío`);
    }
    
    if (ids.length > 100) {
      throw new ValidationError(`El array ${fieldName} no puede tener más de 100 elementos`);
    }
    
    const validIds = ids.filter(id => !isNaN(parseInt(id)) && parseInt(id) > 0);
    
    if (validIds.length === 0) {
      throw new ValidationError(`El array ${fieldName} debe contener al menos un ID válido`);
    }
    
    req.body[fieldName] = validIds.map(id => parseInt(id));
    next();
  };
};

/**
 * Middleware para validar parámetros de búsqueda
 */
export const validateSearchQuery = (req, res, next) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    throw new ValidationError('El parámetro de búsqueda "q" es requerido y debe ser una cadena de texto');
  }
  
  const trimmedQuery = q.trim();
  
  if (trimmedQuery.length === 0) {
    throw new ValidationError('El parámetro de búsqueda no puede estar vacío');
  }
  
  if (trimmedQuery.length < 2) {
    throw new ValidationError('El parámetro de búsqueda debe tener al menos 2 caracteres');
  }
  
  if (trimmedQuery.length > 100) {
    throw new ValidationError('El parámetro de búsqueda no puede tener más de 100 caracteres');
  }
  
  req.query.q = trimmedQuery;
  next();
};

/**
 * Middleware para validar días de la semana
 */
export const validateDia = (req, res, next) => {
  const { dia } = req.params;
  
  if (!dia) {
    throw new ValidationError('El parámetro "dia" es requerido');
  }
  
  const diasValidos = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
  const diaUpperCase = dia.toUpperCase();
  
  if (!diasValidos.includes(diaUpperCase)) {
    throw new ValidationError(
      `El día "${dia}" no es válido. Días válidos: ${diasValidos.join(', ')}`,
      { diasValidos }
    );
  }
  
  req.params.dia = diaUpperCase;
  next();
};

/**
 * Middleware para validar Content-Type JSON
 */
export const validateJsonContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new ValidationError('Content-Type debe ser application/json');
    }
  }
  
  next();
};

/**
 * Middleware para sanitizar entrada de texto
 */
export const sanitizeInput = (req, res, next) => {
  // Sanitizar query parameters
  if (req.query.q) {
    req.query.q = req.query.q.trim().replace(/[<>"'&]/g, '');
  }
  
  // Sanitizar parámetros de ruta que sean strings
  Object.keys(req.params).forEach(key => {
    if (typeof req.params[key] === 'string' && isNaN(req.params[key])) {
      req.params[key] = req.params[key].trim().replace(/[<>"'&]/g, '');
    }
  });
  
  next();
};

/**
 * Wrapper para manejar errores en middlewares async
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  validateId,
  validateIdsArray,
  validateSearchQuery,
  validateDia,
  validateJsonContentType,
  sanitizeInput,
  asyncHandler
};