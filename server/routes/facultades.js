import { Router } from 'express';
import { FacultadController } from '../controllers/facultadController.js';
import { validateId, asyncHandler } from '../middleware/validation.js';

const router = Router();

/**
 * @route GET /api/facultades
 * @desc Obtener todas las facultades
 * @access Public
 */
router.get('/', asyncHandler(FacultadController.obtenerTodas));

/**
 * @route GET /api/facultades/:id
 * @desc Obtener una facultad por ID
 * @access Public
 */
router.get('/:id', validateId('id'), asyncHandler(FacultadController.obtenerPorId));

/**
 * @route GET /api/facultades/:facultadId/escuelas
 * @desc Obtener escuelas de una facultad específica
 * @access Public
 */
router.get('/:facultadId/escuelas', validateId('facultadId'), asyncHandler(FacultadController.obtenerEscuelas));

export default router;