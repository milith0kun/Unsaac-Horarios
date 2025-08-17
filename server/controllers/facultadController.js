import database from '../config/database.js';

/**
 * Controlador para manejar operaciones relacionadas con facultades
 */
export class FacultadController {
  /**
   * Obtener todas las facultades
   */
  static async obtenerTodas(req, res) {
    try {
      const facultades = await FacultadController.obtenerTodasLasFacultades();
      res.json(facultades);
    } catch (error) {
      console.error('Error obteniendo facultades:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las facultades'
      });
    }
  }

  /**
   * Obtener todas las facultades (método interno para consultas unificadas)
   */
  static async obtenerTodasLasFacultades() {
    const prisma = database.getPrisma();
    
    return await prisma.facultad.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        escuelas: {
          orderBy: { nombre: 'asc' }
        }
      }
    });
  }

  /**
   * Obtener una facultad por ID
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const prisma = database.getPrisma();
      
      const facultad = await prisma.facultad.findUnique({
        where: { id: parseInt(id) },
        include: {
          escuelas: {
            orderBy: { nombre: 'asc' }
          }
        }
      });
      
      if (!facultad) {
        return res.status(404).json({ 
          error: 'Facultad no encontrada',
          message: `No existe una facultad con ID ${id}`
        });
      }
      
      res.json(facultad);
    } catch (error) {
      console.error('Error obteniendo facultad por ID:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la facultad'
      });
    }
  }

  /**
   * Obtener escuelas de una facultad
   */
  static async obtenerEscuelas(req, res) {
    try {
      const { facultadId } = req.params;
      const prisma = database.getPrisma();
      
      // Verificar que la facultad existe
      const facultad = await prisma.facultad.findUnique({
        where: { id: parseInt(facultadId) }
      });
      
      if (!facultad) {
        return res.status(404).json({ 
          error: 'Facultad no encontrada',
          message: `No existe una facultad con ID ${facultadId}`
        });
      }
      
      const escuelas = await prisma.escuela.findMany({
        where: { facultadId: parseInt(facultadId) },
        orderBy: { nombre: 'asc' },
        include: {
          facultad: true
        }
      });
      
      res.json(escuelas);
    } catch (error) {
      console.error('Error obteniendo escuelas:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las escuelas'
      });
    }
  }
}

export default FacultadController;