import { Router } from 'express';
import { CursoController } from '../controllers/cursoController.js';
import { validateId, validateIdsArray, validateSearchQuery, validateJsonContentType, asyncHandler } from '../middleware/validation.js';

const router = Router();

/**
 * @route GET /api/cursos
 * @desc Obtener todos los cursos
 * @access Public
 */
router.get('/', asyncHandler(CursoController.obtenerTodos));

/**
 * @route GET /api/cursos/search
 * @desc Buscar cursos por término de búsqueda
 * @access Public
 */
router.get('/search', validateSearchQuery, asyncHandler(CursoController.buscar));

/**
 * @route POST /api/cursos/batch
 * @desc Obtener cursos por lotes (array de IDs)
 * @access Public
 */
router.post('/batch', 
  validateJsonContentType,
  validateIdsArray('ids'),
  asyncHandler(CursoController.obtenerPorLotes)
);

/**
 * @route GET /api/cursos/:id
 * @desc Obtener un curso por ID
 * @access Public
 */
router.get('/:id', validateId('id'), asyncHandler(CursoController.obtenerPorId));

export default router;