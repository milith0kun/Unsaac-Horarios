import database from '../config/database.js';

/**
 * Controlador para manejar operaciones relacionadas con cursos
 */
export class CursoController {
  /**
   * Obtener todos los cursos
   */
  static async obtenerTodos(req, res) {
    try {
      const cursos = await CursoController.obtenerTodosLosCursos();
      res.json(cursos);
    } catch (error) {
      console.error('Error obteniendo cursos:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los cursos'
      });
    }
  }

  /**
   * Obtener todos los cursos (método interno para consultas unificadas)
   */
  static async obtenerTodosLosCursos() {
    const prisma = database.getPrisma();
    
    return await prisma.curso.findMany({
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
  }

  /**
   * Obtener un curso por ID
   */
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const prisma = database.getPrisma();
      
      const curso = await prisma.curso.findUnique({
        where: { id: parseInt(id) },
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
      
      if (!curso) {
        return res.status(404).json({ 
          error: 'Curso no encontrado',
          message: `No existe un curso con ID ${id}`
        });
      }
      
      res.json(curso);
    } catch (error) {
      console.error('Error obteniendo curso por ID:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el curso'
      });
    }
  }

  /**
   * Buscar cursos por término de búsqueda
   */
  static async buscar(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Parámetro de búsqueda requerido',
          message: 'Debe proporcionar un término de búsqueda (q)'
        });
      }
      
      const prisma = database.getPrisma();
      const searchTerm = q.trim();
      
      const cursos = await prisma.curso.findMany({
        where: {
          OR: [
            { codigo: { contains: searchTerm, mode: 'insensitive' } },
            { nombre: { contains: searchTerm, mode: 'insensitive' } },
            { semestre: { contains: searchTerm, mode: 'insensitive' } },
            { escuela: { nombre: { contains: searchTerm, mode: 'insensitive' } } },
            { escuela: { facultad: { nombre: { contains: searchTerm, mode: 'insensitive' } } } }
          ]
        },
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
        },
        orderBy: { codigo: 'asc' }
      });
      
      res.json({
        query: searchTerm,
        total: cursos.length,
        cursos
      });
    } catch (error) {
      console.error('Error buscando cursos:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo realizar la búsqueda'
      });
    }
  }

  /**
   * Obtener cursos por lotes (batch)
   */
  static async obtenerPorLotes(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
          error: 'IDs requeridos',
          message: 'Debe proporcionar un array de IDs de cursos'
        });
      }
      
      // Validar que todos los IDs sean números
      const validIds = ids.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
      
      if (validIds.length === 0) {
        return res.status(400).json({ 
          error: 'IDs inválidos',
          message: 'Todos los IDs deben ser números válidos'
        });
      }
      
      const prisma = database.getPrisma();
      
      const cursos = await prisma.curso.findMany({
        where: {
          id: { in: validIds }
        },
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
        },
        orderBy: { codigo: 'asc' }
      });
      
      res.json({
        requested: validIds.length,
        found: cursos.length,
        cursos
      });
    } catch (error) {
      console.error('Error obteniendo cursos por lotes:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los cursos'
      });
    }
  }
}

export default CursoController;