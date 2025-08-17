import express from 'express';
import cors from 'cors';
import database from '../server/config/database.js';
import apiRoutes from '../server/routes/index.js';
import { errorHandler, notFoundHandler } from '../server/middleware/errorHandler.js';
import { sanitizeInput } from '../server/middleware/validation.js';

const app = express();

// Configuración de middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

// Conectar a la base de datos para cada request en Vercel
let isConnected = false;

const connectToDatabase = async () => {
  if (!isConnected) {
    try {
      await database.connect();
      isConnected = true;
      console.log('✅ Conectado a la base de datos');
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error);
      throw error;
    }
  }
};

// Middleware para conectar a la base de datos
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }
});

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

export default app;