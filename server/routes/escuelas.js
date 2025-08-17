import { Router } from 'express';
import { EscuelaController } from '../controllers/escuelaController.js';
import { validateId, asyncHandler } from '../middleware/validation.js';

const router = Router();

/**
 * @route GET /api/escuelas
 * @desc Obtener todas las escuelas
 * @access Public
 */
router.get('/', asyncHandler(EscuelaController.obtenerTodas));

/**
 * @route GET /api/escuelas/:id
 * @desc Obtener una escuela por ID
 * @access Public
 */
router.get('/:id', validateId('id'), asyncHandler(EscuelaController.obtenerPorId));

/**
 * @route GET /api/escuelas/:escuelaId/cursos
 * @desc Obtener cursos de una escuela específica
 * @access Public
 */
router.get('/:escuelaId/cursos', validateId('escuelaId'), asyncHandler(EscuelaController.obtenerCursos));

export default router;