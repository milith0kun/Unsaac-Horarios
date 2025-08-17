import database from '../config/database.js';

/**
 * Controlador para manejar operaciones relacionadas con escuelas
 */
export class EscuelaController {
  /**
   * Obtener todas las escuelas
   */
  static async obtenerTodas(req, res) {
    try {
      const escuelas = await EscuelaController.obtenerTodasLasEscuelas();
      res.json(escuelas);
    } catch (error) {
      console.error('Error obteniendo escuelas:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las escuelas'
      });
    }
  }

  /**
   * Obtener todas las escuelas (método interno para consultas unificadas)
   */
  static async obtenerTodasLasEscuelas() {
    const prisma = database.getPrisma();
    
    return await prisma.escuela.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        facultad: true
      }
    });
  }

  /**
   * Obtener una escuela por ID
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const prisma = database.getPrisma();
      
      const escuela = await prisma.escuela.findUnique({
        where: { id: parseInt(id) },
        include: {
          facultad: true
        }
      });
      
      if (!escuela) {
        return res.status(404).json({ 
          error: 'Escuela no encontrada',
          message: `No existe una escuela con ID ${id}`
        });
      }
      
      res.json(escuela);
    } catch (error) {
      console.error('Error obteniendo escuela por ID:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la escuela'
      });
    }
  }

  /**
   * Obtener cursos de una escuela
   */
  static async obtenerCursos(req, res) {
    try {
      const { escuelaId } = req.params;
      const prisma = database.getPrisma();
      
      // Verificar que la escuela existe
      const escuela = await prisma.escuela.findUnique({
        where: { id: parseInt(escuelaId) }
      });
      
      if (!escuela) {
        return res.status(404).json({ 
          error: 'Escuela no encontrada',
          message: `No existe una escuela con ID ${escuelaId}`
        });
      }
      
      const cursos = await prisma.curso.findMany({
        where: { escuelaId: parseInt(escuelaId) },
        orderBy: { codigo: 'asc' },
        include: {
          escuela: {
            include: {
              facultad: true
            }
          },
          horarios: {
            include: {
              aula: true
            },
            orderBy: [
              { dia: 'asc' },
              { horaInicio: 'asc' }
            ]
          }
        }
      });
      
      res.json(cursos);
    } catch (error) {
      console.error('Error obteniendo cursos:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los cursos'
      });
    }
  }
}

export default EscuelaController;