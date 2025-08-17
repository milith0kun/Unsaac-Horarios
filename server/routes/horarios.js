import { Router } from 'express';
import { HorarioController } from '../controllers/horarioController.js';
import { validateIdsArray, validateDia, validateJsonContentType, asyncHandler } from '../middleware/validation.js';

const router = Router();

/**
 * @route POST /api/horarios/conflictos
 * @desc Detectar conflictos de horarios entre cursos
 * @access Public
 */
router.post('/conflictos',
  validateJsonContentType,
  validateIdsArray('cursoIds'),
  asyncHandler(HorarioController.detectarConflictos)
);

/**
 * @route GET /api/horarios/dia/:dia
 * @desc Obtener horarios por día de la semana
 * @access Public
 */
router.get('/dia/:dia', validateDia, asyncHandler(HorarioController.obtenerPorDia));

/**
 * @route GET /api/estadisticas
 * @desc Obtener estadísticas generales del sistema
 * @access Public
 */
router.get('/estadisticas', asyncHandler(HorarioController.obtenerEstadisticas));

export default router;