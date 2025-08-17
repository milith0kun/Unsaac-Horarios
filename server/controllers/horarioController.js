import database from '../config/database.js';

/**
 * Controlador para manejar operaciones relacionadas con horarios
 */
export class HorarioController {
  /**
   * Detectar conflictos de horarios
   */
  static async detectarConflictos(req, res) {
    try {
      const { cursoIds } = req.body;
      
      if (!Array.isArray(cursoIds) || cursoIds.length === 0) {
        return res.status(400).json({ 
          error: 'IDs de cursos requeridos',
          message: 'Debe proporcionar un array de IDs de cursos'
        });
      }
      
      const prisma = database.getPrisma();
      
      // Obtener todos los horarios de los cursos seleccionados
      const horarios = await prisma.horario.findMany({
        where: {
          cursoId: { in: cursoIds.map(id => parseInt(id)) }
        },
        include: {
          curso: {
            select: {
              id: true,
              codigo: true,
              nombre: true
            }
          },
          aula: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: [
          { dia: 'asc' },
          { horaInicio: 'asc' }
        ]
      });
      
      // Detectar conflictos
      const conflictos = [];
      
      for (let i = 0; i < horarios.length; i++) {
        for (let j = i + 1; j < horarios.length; j++) {
          const horario1 = horarios[i];
          const horario2 = horarios[j];
          
          // Verificar si son el mismo día y hay solapamiento de tiempo
          if (horario1.dia === horario2.dia && horario1.cursoId !== horario2.cursoId) {
            // Convertir horas a formato comparable (asegurar formato HH:MM)
            const formatTime = (time) => {
              if (!time) return '00:00';
              const timeStr = time.toString();
              if (timeStr.includes(':')) return timeStr;
              // Si es solo números, asumir formato HHMM
              if (timeStr.length === 4) {
                return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
              }
              return timeStr;
            };
            
            const inicio1Str = formatTime(horario1.horaInicio);
            const fin1Str = formatTime(horario1.horaFin);
            const inicio2Str = formatTime(horario2.horaInicio);
            const fin2Str = formatTime(horario2.horaFin);
            
            const inicio1 = new Date(`1970-01-01T${inicio1Str}:00`);
            const fin1 = new Date(`1970-01-01T${fin1Str}:00`);
            const inicio2 = new Date(`1970-01-01T${inicio2Str}:00`);
            const fin2 = new Date(`1970-01-01T${fin2Str}:00`);
            
            // Verificar solapamiento
            if (inicio1 < fin2 && inicio2 < fin1) {
              conflictos.push({
                tipo: 'conflicto_horario',
                dia: horario1.dia,
                curso1: {
                  id: horario1.curso.id,
                  codigo: horario1.curso.codigo,
                  nombre: horario1.curso.nombre,
                  horario: `${inicio1Str} - ${fin1Str}`,
                  aula: horario1.aula?.nombre || 'Sin aula'
                },
                curso2: {
                  id: horario2.curso.id,
                  codigo: horario2.curso.codigo,
                  nombre: horario2.curso.nombre,
                  horario: `${inicio2Str} - ${fin2Str}`,
                  aula: horario2.aula?.nombre || 'Sin aula'
                }
              });
            }
          }
        }
      }
      
      res.json({
        cursosAnalizados: cursoIds.length,
        horariosEncontrados: horarios.length,
        conflictosDetectados: conflictos.length,
        conflictos
      });
    } catch (error) {
      console.error('Error detectando conflictos:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron detectar los conflictos'
      });
    }
  }

  /**
   * Obtener estadísticas generales
   */
  static async obtenerEstadisticas(req, res) {
    try {
      const prisma = database.getPrisma();
      
      const [facultades, escuelas, cursos, horarios, aulas] = await Promise.all([
        prisma.facultad.count(),
        prisma.escuela.count(),
        prisma.curso.count(),
        prisma.horario.count(),
        prisma.aula.count()
      ]);
      
      // Estadísticas adicionales
      const cursosConHorarios = await prisma.curso.count({
        where: {
          horarios: {
            some: {}
          }
        }
      });
      
      const cursosConDocente = await prisma.curso.count({
        where: {
          docente: {
            not: null,
            not: ''
          }
        }
      });
      
      res.json({
        facultades,
        escuelas,
        cursos,
        horarios,
        aulas,
        cursosConHorarios,
        cursosConDocente,
        porcentajeCursosConHorarios: cursos > 0 ? Math.round((cursosConHorarios / cursos) * 100) : 0,
        porcentajeCursosConDocente: cursos > 0 ? Math.round((cursosConDocente / cursos) * 100) : 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las estadísticas'
      });
    }
  }

  /**
   * Obtener horarios por día
   */
  static async obtenerPorDia(req, res) {
    try {
      const { dia } = req.params;
      
      if (!dia) {
        return res.status(400).json({ 
          error: 'Día requerido',
          message: 'Debe especificar un día de la semana'
        });
      }
      
      const prisma = database.getPrisma();
      
      const horarios = await prisma.horario.findMany({
        where: {
          dia: dia.toUpperCase()
        },
        include: {
          curso: {
            include: {
              escuela: {
                include: {
                  facultad: true
                }
              }
            }
          },
          aula: true
        },
        orderBy: [
          { horaInicio: 'asc' },
          { curso: { codigo: 'asc' } }
        ]
      });
      
      res.json({
        dia: dia.toUpperCase(),
        total: horarios.length,
        horarios
      });
    } catch (error) {
      console.error('Error obteniendo horarios por día:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los horarios'
      });
    }
  }
}

export default HorarioController;