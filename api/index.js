import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Función para convertir snake_case a camelCase
function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      converted[camelKey] = toCamelCase(value);
    }
    return converted;
  }
  
  return obj;
}

// Endpoint para obtener todas las facultades
app.get('/api/facultades', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('facultades')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al obtener facultades:', error);
      return res.status(500).json({ error: 'Error al obtener facultades' });
    }

    res.json(toCamelCase(data));
  } catch (err) {
    console.error('Error interno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener escuelas por facultad
app.get('/api/escuelas/:facultadId', async (req, res) => {
  try {
    const { facultadId } = req.params;
    
    const { data, error } = await supabase
      .from('escuelas')
      .select('*')
      .eq('facultad_id', facultadId)
      .order('nombre');

    if (error) {
      console.error('Error al obtener escuelas:', error);
      return res.status(500).json({ error: 'Error al obtener escuelas' });
    }

    res.json(toCamelCase(data));
  } catch (err) {
    console.error('Error interno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener cursos por escuela
app.get('/api/cursos/:escuelaId', async (req, res) => {
  try {
    const { escuelaId } = req.params;
    console.log(`🔍 [DEBUG] Solicitando cursos para escuela ID: ${escuelaId}`);
    
    const { data: cursos, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('escuela_id', escuelaId);
    
    if (error) {
      console.error('❌ [ERROR] Error al obtener cursos:', error);
      return res.status(500).json({ error: 'Error al obtener cursos' });
    }
    
    console.log(`✅ [DEBUG] Cursos cargados desde BD para escuela ${escuelaId}: ${cursos.length}`);
    console.log(`📊 [DEBUG] Primeros 3 cursos:`, cursos.slice(0, 3).map(c => ({id: c.id, codigo: c.codigo, nombre: c.nombre})));
    console.log(`📤 [DEBUG] Enviando ${cursos.length} cursos al frontend`);
    
    res.json(cursos);
  } catch (error) {
    console.error('❌ [ERROR] Error en endpoint cursos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener horarios por curso
app.get('/api/horarios/:cursoId', async (req, res) => {
  try {
    const { cursoId } = req.params;
    
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('curso_id', cursoId)
      .order('dia', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      console.error('Error al obtener horarios:', error);
      return res.status(500).json({ error: 'Error al obtener horarios' });
    }

    res.json(toCamelCase(data));
  } catch (err) {
    console.error('Error interno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener datos iniciales
app.get('/api/datos-iniciales', async (req, res) => {
  try {
    // Obtener todas las facultades
    const { data: facultades, error: errorFacultades } = await supabase
      .from('facultades')
      .select('*')
      .order('nombre');

    if (errorFacultades) {
      console.error('Error al obtener facultades:', errorFacultades);
      return res.status(500).json({ error: 'Error al obtener facultades' });
    }

    // Obtener todas las escuelas
    const { data: escuelas, error: errorEscuelas } = await supabase
      .from('escuelas')
      .select('*')
      .order('nombre');

    if (errorEscuelas) {
      console.error('Error al obtener escuelas:', errorEscuelas);
      return res.status(500).json({ error: 'Error al obtener escuelas' });
    }

    // Obtener todos los cursos
    const { data: cursos, error: errorCursos } = await supabase
      .from('cursos')
      .select('*')
      .order('nombre');

    if (errorCursos) {
      console.error('Error al obtener cursos:', errorCursos);
      return res.status(500).json({ error: 'Error al obtener cursos' });
    }

    console.log(`API DATOS INICIALES: Cargados ${cursos?.length || 0} cursos en total`);
    console.log(`API DATOS INICIALES: Cargadas ${facultades?.length || 0} facultades`);
    console.log(`API DATOS INICIALES: Cargadas ${escuelas?.length || 0} escuelas`);

    const datosIniciales = {
      facultades: toCamelCase(facultades),
      escuelas: toCamelCase(escuelas),
      cursos: toCamelCase(cursos)
    };

    res.json({ success: true, data: datosIniciales });
  } catch (err) {
    console.error('Error interno:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener cursos por IDs específicos
app.post('/api/cursos-por-ids', async (req, res) => {
  try {
    const { cursoIds } = req.body;
    
    console.log('🔍 API - cursos-por-ids recibido:', { cursoIds, tipo: typeof cursoIds, esArray: Array.isArray(cursoIds) });
    
    if (!cursoIds || !Array.isArray(cursoIds) || cursoIds.length === 0) {
      console.log('❌ API - cursoIds inválido');
      return res.status(400).json({ error: 'Se requiere un array de IDs de cursos' });
    }

    const { data: cursos, error } = await supabase
      .from('cursos')
      .select('*')
      .in('id', cursoIds);
    
    if (error) {
      console.error('❌ API - Error en consulta Supabase:', error);
      throw error;
    }

    console.log('✅ API - Cursos encontrados:', { cantidad: cursos?.length || 0, ids: cursos?.map(c => c.id) });

    // Convertir a camelCase
    const cursosFormateados = cursos.map(curso => ({
      id: curso.id,
      codigo: curso.codigo,
      nombre: curso.nombre,
      creditos: curso.creditos,
      semestre: curso.semestre,
      facultad: curso.facultad,
      escuela: curso.escuela,
      ciclo: curso.ciclo,
      tipo: curso.tipo,
      modalidad: curso.modalidad
    }));

    res.json(cursosFormateados);
  } catch (error) {
    console.error('❌ API - Error al obtener cursos por IDs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener estadísticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('*');
    
    if (cursosError) throw cursosError;

    const { data: horarios, error: horariosError } = await supabase
      .from('horarios')
      .select('*');
    
    if (horariosError) throw horariosError;

    const estadisticas = {
      totalCursos: cursos.length,
      totalHorarios: horarios.length,
      facultades: [...new Set(cursos.map(c => c.facultad))].length,
      escuelas: [...new Set(cursos.map(c => c.escuela))].length
    };

    res.json(estadisticas);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente', timestamp: new Date().toISOString() });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Para Vercel (serverless)
export default app;