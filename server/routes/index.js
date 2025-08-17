import { Router } from 'express';
import facultadesRoutes from './facultades.js';
import escuelasRoutes from './escuelas.js';
import cursosRoutes from './cursos.js';
import horariosRoutes from './horarios.js';

const router = Router();

// Rutas principales
router.use('/facultades', facultadesRoutes);
router.use('/escuelas', escuelasRoutes);
router.use('/cursos', cursosRoutes);
router.use('/horarios', horariosRoutes);

// Ruta de estadísticas directa
router.get('/estadisticas', async (req, res, next) => {
  const { HorarioController } = await import('../controllers/horarioController.js');
  return HorarioController.obtenerEstadisticas(req, res, next);
});

// Ruta unificada para cargar todos los datos iniciales
router.get('/datos-iniciales', async (req, res, next) => {
  try {
    console.log('🔍 [DEBUG] Iniciando carga de datos iniciales...');
    
    // Verificar conexión a la base de datos
    const { default: database } = await import('../config/database.js');
    console.log('🔍 [DEBUG] Verificando conexión a la base de datos...');
    
    try {
      const prisma = database.getPrisma();
      console.log('🔍 [DEBUG] Prisma obtenido correctamente');
    } catch (dbError) {
      console.error('❌ [DEBUG] Error obteniendo Prisma:', dbError.message);
      // Intentar reconectar
      console.log('🔄 [DEBUG] Intentando reconectar a la base de datos...');
      await database.connect();
      console.log('✅ [DEBUG] Reconexión exitosa');
    }
    
    console.log('🔍 [DEBUG] Importando controladores...');
    const { FacultadController } = await import('../controllers/facultadController.js');
    const { EscuelaController } = await import('../controllers/escuelaController.js');
    const { CursoController } = await import('../controllers/cursoController.js');
    console.log('✅ [DEBUG] Controladores importados correctamente');
    
    console.log('🔍 [DEBUG] Obteniendo facultades...');
    const facultades = await FacultadController.obtenerTodasLasFacultades();
    console.log(`✅ [DEBUG] Facultades obtenidas: ${facultades.length}`);
    
    console.log('🔍 [DEBUG] Obteniendo escuelas...');
    const escuelas = await EscuelaController.obtenerTodasLasEscuelas();
    console.log(`✅ [DEBUG] Escuelas obtenidas: ${escuelas.length}`);
    
    console.log('🔍 [DEBUG] Obteniendo cursos...');
    const cursos = await CursoController.obtenerTodosLosCursos();
    console.log(`✅ [DEBUG] Cursos obtenidos: ${cursos.length}`);
    
    console.log('✅ [DEBUG] Todos los datos obtenidos correctamente, enviando respuesta...');
    
    res.json({
      success: true,
      data: {
        facultades,
        escuelas,
        cursos
      },
      timestamp: new Date().toISOString(),
      totalFacultades: facultades.length,
      totalEscuelas: escuelas.length,
      totalCursos: cursos.length
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error en /datos-iniciales:', {
      message: error.message,
      stack: error.stack,
      name: error.constructor.name
    });
    next(error);
  }
});

// Ruta de salud del API
router.get('/health', async (req, res) => {
  try {
    const { default: database } = await import('../config/database.js');
    const healthCheck = await database.healthCheck();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: healthCheck,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Ruta de información del API
router.get('/', (req, res) => {
  res.json({
    name: 'UNSAAC Horarios API',
    version: '2.0.0',
    description: 'API para gestión de horarios académicos de la UNSAAC',
    endpoints: {
      facultades: '/api/facultades',
      escuelas: '/api/escuelas',
      cursos: '/api/cursos',
      horarios: '/api/horarios',
      estadisticas: '/api/estadisticas',
      health: '/api/health'
    },
    features: [
      'Gestión de facultades y escuelas',
      'Búsqueda de cursos',
      'Detección de conflictos de horarios',
      'Estadísticas del sistema',
      'Operaciones por lotes'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;