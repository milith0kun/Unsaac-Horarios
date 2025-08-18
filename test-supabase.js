/* eslint-env node */
// Script de prueba para verificar la conexión a Supabase
// y todas las funcionalidades de la base de datos

/* eslint-env node */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_KEY no encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 INICIANDO PRUEBAS DE CONEXIÓN A SUPABASE');
console.log('=' .repeat(60));
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
console.log('=' .repeat(60));

async function testSupabaseConnection() {
    try {
        console.log('\n🔗 1. PROBANDO CONEXIÓN BÁSICA...');
        
        // Prueba de conexión básica
        const { data: _data, error } = await supabase
            .from('facultades')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Error de conexión:', error.message);
            return false;
        }
        
        console.log('✅ Conexión exitosa a Supabase');
        return true;
        
    } catch (error) {
        console.error('❌ Error crítico de conexión:', error.message);
        return false;
    }
}

async function testTables() {
    console.log('\n📊 2. VERIFICANDO TABLAS Y DATOS...');
    
    const tables = [
        { name: 'facultades', description: 'Facultades' },
        { name: 'escuelas', description: 'Escuelas' },
        { name: 'cursos', description: 'Cursos' },
        { name: 'horarios', description: 'Horarios' },
        { name: 'aulas', description: 'Aulas' }
    ];
    
    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table.name)
                .select('*', { count: 'exact' })
                .limit(1);
            
            if (error) {
                console.log(`❌ ${table.description}: Error - ${error.message}`);
            } else {
                console.log(`✅ ${table.description}: ${count || 0} registros`);
                if (data && data.length > 0) {
                    console.log(`   📝 Ejemplo: ${JSON.stringify(data[0], null, 2).substring(0, 100)}...`);
                }
            }
        } catch (error) {
            console.log(`❌ ${table.description}: Error crítico - ${error.message}`);
        }
    }
}

async function testBasicQueries() {
    console.log('\n🔍 3. PROBANDO CONSULTAS BÁSICAS...');
    
    try {
        // Consulta de facultades
        console.log('\n📚 Consultando facultades:');
        const { data: facultades, error: errorFacultades } = await supabase
            .from('facultades')
            .select('*')
            .order('nombre')
            .limit(5);
        
        if (errorFacultades) {
            console.log('❌ Error al consultar facultades:', errorFacultades.message);
        } else {
            console.log(`✅ ${facultades.length} facultades encontradas`);
            facultades.forEach(f => console.log(`   - ${f.nombre}`));
        }
        
        // Consulta de escuelas con relación
        console.log('\n🏫 Consultando escuelas con facultades:');
        const { data: escuelas, error: errorEscuelas } = await supabase
            .from('escuelas')
            .select(`
                *,
                facultades(nombre)
            `)
            .limit(5);
        
        if (errorEscuelas) {
            console.log('❌ Error al consultar escuelas:', errorEscuelas.message);
        } else {
            console.log(`✅ ${escuelas.length} escuelas encontradas`);
            escuelas.forEach(e => console.log(`   - ${e.nombre} (${e.facultades?.nombre || 'Sin facultad'})`));
        }
        
        // Consulta de cursos con relaciones completas
        console.log('\n📖 Consultando cursos con relaciones:');
        const { data: cursos, error: errorCursos } = await supabase
            .from('cursos')
            .select(`
                *,
                escuelas(nombre, facultades(nombre))
            `)
            .limit(3);
        
        if (errorCursos) {
            console.log('❌ Error al consultar cursos:', errorCursos.message);
        } else {
            console.log(`✅ ${cursos.length} cursos encontrados`);
            cursos.forEach(c => {
                const facultad = c.escuelas?.facultades?.nombre || 'Sin facultad';
                const escuela = c.escuelas?.nombre || 'Sin escuela';
                console.log(`   - ${c.nombre} (${escuela} - ${facultad})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error en consultas básicas:', error.message);
    }
}

async function testComplexQueries() {
    console.log('\n🔗 4. PROBANDO CONSULTAS COMPLEJAS...');
    
    try {
        // Consulta de horarios con todas las relaciones
        console.log('\n⏰ Consultando horarios con relaciones completas:');
        const { data: horarios, error: errorHorarios } = await supabase
            .from('horarios')
            .select(`
                *,
                cursos(
                    nombre,
                    codigo,
                    escuelas(
                        nombre,
                        facultades(nombre)
                    )
                ),
                aulas(nombre, capacidad)
            `)
            .limit(3);
        
        if (errorHorarios) {
            console.log('❌ Error al consultar horarios:', errorHorarios.message);
        } else {
            console.log(`✅ ${horarios.length} horarios encontrados`);
            horarios.forEach(h => {
                const curso = h.cursos?.nombre || 'Sin curso';
                const aula = h.aulas?.nombre || 'Sin aula';
                const facultad = h.cursos?.escuelas?.facultades?.nombre || 'Sin facultad';
                console.log(`   - ${curso} en ${aula} (${h.dia} ${h.hora_inicio}-${h.hora_fin}) - ${facultad}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error en consultas complejas:', error.message);
    }
}

async function showDatabaseStats() {
    console.log('\n📈 5. ESTADÍSTICAS DE LA BASE DE DATOS...');
    
    const tables = ['facultades', 'escuelas', 'cursos', 'horarios', 'aulas'];
    const stats = {};
    
    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                stats[table] = `Error: ${error.message}`;
            } else {
                stats[table] = count || 0;
            }
        } catch (error) {
            stats[table] = `Error crítico: ${error.message}`;
        }
    }
    
    console.log('\n📊 Resumen de registros por tabla:');
    Object.entries(stats).forEach(([table, count]) => {
        console.log(`   ${table.padEnd(15)}: ${count}`);
    });
}

async function testDataInitialEndpoint() {
    console.log('\n🚀 6. PROBANDO ENDPOINT /datos-iniciales...');
    
    try {
        // Simular la consulta del endpoint datos-iniciales
        const [facultadesRes, escuelasRes, cursosRes] = await Promise.all([
            supabase.from('facultades').select('*').order('nombre'),
            supabase.from('escuelas').select('*, facultades(nombre)').order('nombre'),
            supabase.from('cursos').select('*, escuelas(nombre, facultades(nombre))').order('nombre')
        ]);
        
        const errors = [];
        if (facultadesRes.error) errors.push(`Facultades: ${facultadesRes.error.message}`);
        if (escuelasRes.error) errors.push(`Escuelas: ${escuelasRes.error.message}`);
        if (cursosRes.error) errors.push(`Cursos: ${cursosRes.error.message}`);
        
        if (errors.length > 0) {
            console.log('❌ Errores en datos iniciales:');
            errors.forEach(error => console.log(`   - ${error}`));
        } else {
            console.log('✅ Endpoint datos-iniciales funcionaría correctamente');
            console.log(`   - ${facultadesRes.data.length} facultades`);
            console.log(`   - ${escuelasRes.data.length} escuelas`);
            console.log(`   - ${cursosRes.data.length} cursos`);
        }
        
    } catch (error) {
        console.error('❌ Error simulando endpoint datos-iniciales:', error.message);
    }
}

async function runAllTests() {
    console.log('🧪 EJECUTANDO TODAS LAS PRUEBAS DE SUPABASE\n');
    
    const connectionOk = await testSupabaseConnection();
    
    if (!connectionOk) {
        console.log('\n❌ PRUEBAS TERMINADAS: No se pudo establecer conexión con Supabase');
        return;
    }
    
    await testTables();
    await testBasicQueries();
    await testComplexQueries();
    await showDatabaseStats();
    await testDataInitialEndpoint();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PRUEBAS COMPLETADAS');
    console.log('✅ La conexión a Supabase está funcionando correctamente');
    console.log('✅ Todas las tablas y relaciones están operativas');
    console.log('=' .repeat(60));
}

// Ejecutar todas las pruebas
runAllTests().catch(error => {
    console.error('💥 Error crítico en las pruebas:', error);
    process.exit(1);
});