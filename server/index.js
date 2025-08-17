import express from 'express';
import cors from 'cors';
import database from './config/database.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sanitizeInput } from './middleware/validation.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

// Rutas del API
app.use('/api', apiRoutes);

// Middleware de manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Función para iniciar el servidor
async function startServer() {
  try {
    // Conectar a la base de datos
    await database.connect();
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log('📋 Endpoints disponibles:');
      console.log('  - GET  /api/health - Estado del servidor');
      console.log('  - GET  /api/facultades - Todas las facultades');
      console.log('  - GET  /api/escuelas - Todas las escuelas');
      console.log('  - GET  /api/cursos - Todos los cursos');
      console.log('  - GET  /api/cursos/search?q=texto - Buscar cursos');
      console.log('  - POST /api/cursos/batch - Cursos por lotes');
      console.log('  - POST /api/horarios/conflictos - Detectar conflictos');
      console.log('  - GET  /api/estadisticas - Estadísticas del sistema');
      console.log('\n✨ API refactorizada y optimizada');
      console.log('🔄 Servidor manteniéndose activo...');
    });
    
    // Mantener el proceso vivo
    server.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🔌 Cerrando servidor...');
  try {
    await database.disconnect();
    console.log('✅ Servidor cerrado correctamente. Adiós!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cerrando el servidor:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔌 Señal SIGTERM recibida, cerrando servidor...');
  try {
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cerrando el servidor:', error);
    process.exit(1);
  }
});

// Para Vercel: exportar la app directamente
// En desarrollo local, iniciar el servidor
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  startServer().catch(console.error);
}

// Para Vercel: conectar a la base de datos en cada request
if (process.env.VERCEL) {
  // Conectar a la base de datos para Vercel
  database.connect().catch(console.error);
}

export default app;