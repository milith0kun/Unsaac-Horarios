import { PrismaClient } from '@prisma/client';

// Inicializar Prisma para Vercel
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('🔍 [VERCEL] Iniciando carga de datos iniciales...');
    
    // Obtener facultades con sus escuelas
    console.log('🔍 [VERCEL] Obteniendo facultades...');
    const facultades = await prisma.facultad.findMany({
      include: {
        escuelas: {
          include: {
            cursos: {
              include: {
                horarios: true
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    console.log(`✅ [VERCEL] Facultades obtenidas: ${facultades.length}`);
    
    // Obtener todas las escuelas
    console.log('🔍 [VERCEL] Obteniendo escuelas...');
    const escuelas = await prisma.escuela.findMany({
      include: {
        facultad: true,
        cursos: {
          include: {
            horarios: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    console.log(`✅ [VERCEL] Escuelas obtenidas: ${escuelas.length}`);
    
    // Obtener todos los cursos
    console.log('🔍 [VERCEL] Obteniendo cursos...');
    const cursos = await prisma.curso.findMany({
      include: {
        escuela: {
          include: {
            facultad: true
          }
        },
        horarios: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    console.log(`✅ [VERCEL] Cursos obtenidos: ${cursos.length}`);
    
    console.log('✅ [VERCEL] Todos los datos obtenidos correctamente, enviando respuesta...');
    
    res.status(200).json({
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
    console.error('❌ [VERCEL] Error en /api/datos-iniciales:', {
      message: error.message,
      stack: error.stack,
      name: error.constructor.name
    });
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Cerrar conexión de Prisma
    await prisma.$disconnect();
  }
}