// Script de debug para verificar cursos por escuela
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCursos() {
  try {
    console.log('=== DEBUG CURSOS ===');
    
    // Obtener todas las escuelas
    const { data: escuelas, error: errorEscuelas } = await supabase
      .from('escuelas')
      .select('id, nombre, facultad_id')
      .order('nombre')
      .limit(5);
    
    if (errorEscuelas) {
      console.error('Error obteniendo escuelas:', errorEscuelas);
      return;
    }
    
    console.log(`\nPrimeras 5 escuelas encontradas:`);
    escuelas.forEach(escuela => {
      console.log(`- ID: ${escuela.id}, Nombre: ${escuela.nombre}`);
    });
    
    // Para cada escuela, contar cursos
    for (const escuela of escuelas) {
      const { data: cursos, error: errorCursos } = await supabase
        .from('cursos')
        .select('id, codigo, nombre')
        .eq('escuela_id', escuela.id);
      
      if (errorCursos) {
        console.error(`Error obteniendo cursos para escuela ${escuela.id}:`, errorCursos);
        continue;
      }
      
      console.log(`\nEscuela: ${escuela.nombre} (ID: ${escuela.id})`);
      console.log(`Número de cursos: ${cursos?.length || 0}`);
      
      if (cursos && cursos.length > 0) {
        console.log('Primeros 3 cursos:');
        cursos.slice(0, 3).forEach(curso => {
          console.log(`  - ${curso.codigo}: ${curso.nombre}`);
        });
      }
    }
    
    // Verificar total de cursos en la base de datos
    const { count, error: errorCount } = await supabase
      .from('cursos')
      .select('*', { count: 'exact', head: true });
    
    if (errorCount) {
      console.error('Error contando cursos:', errorCount);
    } else {
      console.log(`\n=== RESUMEN ===`);
      console.log(`Total de cursos en la base de datos: ${count}`);
    }
    
  } catch (error) {
    console.error('Error en debug:', error);
  }
}

debugCursos();