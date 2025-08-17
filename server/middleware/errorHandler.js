/**
 * Middleware para manejo centralizado de errores
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Error de validación de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflicto de datos',
      message: 'Ya existe un registro con estos datos únicos',
      details: err.meta
    });
  }

  // Error de registro no encontrado en Prisma
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro no encontrado',
      message: 'El registro solicitado no existe',
      details: err.meta
    });
  }

  // Error de conexión a la base de datos
  if (err.code === 'P1001') {
    return res.status(503).json({
      error: 'Error de conexión',
      message: 'No se puede conectar a la base de datos'
    });
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'El formato del JSON enviado es incorrecto'
    });
  }

  // Error de validación personalizado
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message,
      details: err.details || null
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Error interno del servidor' : 'Error en la solicitud',
    message: process.env.NODE_ENV === 'production' && statusCode >= 500 
      ? 'Ha ocurrido un error inesperado' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para manejar rutas no encontradas
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.method} ${req.url} no existe`,
    availableRoutes: {
      facultades: '/api/facultades',
      escuelas: '/api/escuelas',
      cursos: '/api/cursos',
      horarios: '/api/horarios',
      estadisticas: '/api/estadisticas'
    }
  });
};

/**
 * Crear error personalizado
 */
export class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export default { errorHandler, notFoundHandler, ValidationError };