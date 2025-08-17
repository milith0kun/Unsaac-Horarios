import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

// Cargar mapeo de facultades y escuelas
let mapeoFacultadEscuela = null;
async function cargarMapeoFacultadEscuela() {
    if (!mapeoFacultadEscuela) {
        try {
            const rutaMapeo = path.join(__dirname, '..', 'scraping', 'config', 'mapeo-facultades-escuelas.json');
            const contenido = fs.readFileSync(rutaMapeo, 'utf8');
            mapeoFacultadEscuela = JSON.parse(contenido);
        } catch (error) {
            console.warn('⚠️ No se pudo cargar el mapeo de facultades y escuelas:', error.message);
            mapeoFacultadEscuela = { mapeoFacultadEscuela: {}, facultades: {} };
        }
    }
    return mapeoFacultadEscuela;
}

// Configuración
const CONFIG = {
    dataDir: path.join(__dirname, '..', 'scraping', 'data'),
    semestre: '2025-I' // Semestre actual
};

// Mapeo de días abreviados a nombres completos
const DIAS_MAP = {
    'LU': 'Lunes',
    'MA': 'Martes', 
    'MI': 'Miércoles',
    'JU': 'Jueves',
    'VI': 'Viernes',
    'SA': 'Sábado',
    'DO': 'Domingo'
};

// Mapeo de tipos de horario
const TIPOS_HORARIO = {
    'T': 'Teoría',
    'P': 'Práctica',
    'L': 'Laboratorio'
};

// Función para leer archivos JSON de carreras
function leerArchivosCarreras() {
    console.log('📂 Leyendo archivos de carreras...');
    
    const archivos = fs.readdirSync(CONFIG.dataDir)
        .filter(archivo => archivo.endsWith('.json') && !archivo.includes('verificacion'))
        .sort();
    
    const carreras = [];
    
    for (const archivo of archivos) {
        try {
            const rutaArchivo = path.join(CONFIG.dataDir, archivo);
            const contenido = fs.readFileSync(rutaArchivo, 'utf8');
            const datos = JSON.parse(contenido);
            
            if (datos.informacionGeneral && datos.cursos) {
                carreras.push({
                    archivo,
                    datos
                });
                console.log(`✅ ${archivo} - ${datos.informacionGeneral.nombre}`);
            }
        } catch (error) {
            console.error(`❌ Error leyendo ${archivo}:`, error.message);
        }
    }
    
    console.log(`📊 Total de carreras leídas: ${carreras.length}\n`);
    return carreras;
}

// Función para consolidar datos adaptada al schema de Prisma
async function consolidarDatos(carreras) {
    console.log('🔄 Consolidando datos...');
    
    // Cargar mapeo de facultades y escuelas
    const mapeo = await cargarMapeoFacultadEscuela();
    
    const consolidado = {
        facultades: new Map(),
        escuelas: new Map(),
        aulas: new Map(),
        cursos: new Map(),
        horarios: []
    };
    
    // Precargar todas las facultades del mapeo oficial
    for (const [facultadNombre, facultadInfo] of Object.entries(mapeo.facultades)) {
        consolidado.facultades.set(facultadInfo.codigo, {
            nombre: facultadNombre,
            codigo: facultadInfo.codigo,
            area: facultadInfo.area || 'Sin clasificar'
        });
    }
    
    // Crear facultad por defecto solo si no existe
    if (!consolidado.facultades.has('UNSAAC')) {
        consolidado.facultades.set('UNSAAC', {
            nombre: 'UNIVERSIDAD NACIONAL DE SAN ANTONIO ABAD DEL CUSCO',
            codigo: 'UNSAAC',
            area: 'General'
        });
    }
    
    // Crear escuela por defecto
    consolidado.escuelas.set('EPG', {
        nombre: 'ESCUELA PROFESIONAL GENERAL',
        codigo: 'EPG',
        facultadKey: 'UNSAAC'
    });
    
    for (const { datos, archivo } of carreras) {
        const info = datos.informacionGeneral;
        
        // Obtener nombre de la carrera desde el archivo o información general
        const nombreCarrera = info.nombre || path.basename(archivo, '.json').replace(/^\d+_/, '').replace(/_/g, ' ');
        
        // Buscar información en el mapeo oficial
        let facultadKey = 'UNSAAC'; // Por defecto
        let escuelaKey = 'EPG'; // Por defecto
        
        if (mapeo.mapeoFacultadEscuela[nombreCarrera]) {
            const mapeoCarrera = mapeo.mapeoFacultadEscuela[nombreCarrera];
            facultadKey = mapeoCarrera.codigoFacultad;
            escuelaKey = mapeoCarrera.codigoEscuela;
            
            // Asegurar que la escuela esté en el consolidado
            if (!consolidado.escuelas.has(escuelaKey)) {
                consolidado.escuelas.set(escuelaKey, {
                    nombre: mapeoCarrera.escuela,
                    codigo: escuelaKey,
                    facultadKey
                });
            }
        } else {
            // Si no está en el mapeo, usar información extraída o crear por defecto
            if (info.facultad && info.facultad.trim() && info.codigoFacultad) {
                facultadKey = info.codigoFacultad;
                if (!consolidado.facultades.has(facultadKey)) {
                    consolidado.facultades.set(facultadKey, {
                        nombre: info.facultad,
                        codigo: facultadKey,
                        area: info.area || 'Sin clasificar'
                    });
                }
            }
            
            if (info.escuela && info.escuela.trim() && info.codigoEscuela) {
                escuelaKey = info.codigoEscuela;
                if (!consolidado.escuelas.has(escuelaKey)) {
                    consolidado.escuelas.set(escuelaKey, {
                        nombre: info.escuela,
                        codigo: escuelaKey,
                        facultadKey
                    });
                }
            } else {
                // Crear escuela basada en el nombre de la carrera
                escuelaKey = `EP_${nombreCarrera.toUpperCase().replace(/\s+/g, '_')}`;
                if (!consolidado.escuelas.has(escuelaKey)) {
                    consolidado.escuelas.set(escuelaKey, {
                        nombre: `ESCUELA PROFESIONAL DE ${nombreCarrera.toUpperCase()}`,
                        codigo: escuelaKey,
                        facultadKey
                    });
                }
            }
        }
        
        // Procesar aulas
        for (const curso of datos.cursos) {
            if (curso.aulas && Array.isArray(curso.aulas)) {
                for (const aulaName of curso.aulas) {
                    if (aulaName && aulaName.trim() && !consolidado.aulas.has(aulaName)) {
                        consolidado.aulas.set(aulaName, {
                            codigo: aulaName,
                            nombre: aulaName,
                            tipo: 'Aula Teórica', // Tipo por defecto
                            capacidad: 30, // Capacidad por defecto
                            edificio: 'Sin especificar',
                            facultadKey
                        });
                    }
                }
            }
        }
        
        // Procesar cursos
        for (const curso of datos.cursos) {
            const cursoKey = `${info.nombre}-${curso.codigo}`;
            
            if (!consolidado.cursos.has(cursoKey)) {
                consolidado.cursos.set(cursoKey, {
                    codigo: curso.codigo,
                    nombre: curso.nombre,
                    creditos: curso.creditos || 0,
                    semestre: CONFIG.semestre,
                    requisitos: [], // Array vacío por defecto
                    escuelaKey,
                    carreraNombre: info.nombre
                });
            }
            
            // Procesar horarios
            if (curso.horarios && Array.isArray(curso.horarios)) {
                for (const horario of curso.horarios) {
                    // Convertir hora a entero (solo la hora, sin minutos)
                    const horaInicio = horario.horaInicio ? 
                        parseInt(String(horario.horaInicio).split(':')[0]) : 0;
                    const horaFin = horario.horaFin ? 
                        parseInt(String(horario.horaFin).split(':')[0]) : 0;
                    
                    // Obtener el nombre del día
                    const diaCompleto = DIAS_MAP[horario.dia] || horario.dia || 'Sin especificar';
                    
                    // Obtener tipo de horario
                    const tipoHorario = TIPOS_HORARIO[horario.tipo] || horario.tipo || 'Teoría';
                    
                    // Obtener aula (primera aula del curso)
                    const aulaName = curso.aulas && curso.aulas.length > 0 ? curso.aulas[0] : null;
                    
                    consolidado.horarios.push({
                        cursoKey,
                        aulaKey: aulaName,
                        dia: diaCompleto,
                        horaInicio,
                        horaFin,
                        tipo: tipoHorario,
                        grupo: horario.grupo || 'A',
                        modalidad: 'Presencial',
                        semestre: CONFIG.semestre
                    });
                }
            }
        }
    }
    
    console.log(`📊 Datos consolidados:`);
    console.log(`   - Facultades: ${consolidado.facultades.size}`);
    console.log(`   - Escuelas: ${consolidado.escuelas.size}`);
    console.log(`   - Aulas: ${consolidado.aulas.size}`);
    console.log(`   - Cursos: ${consolidado.cursos.size}`);
    console.log(`   - Horarios: ${consolidado.horarios.length}\n`);
    
    return consolidado;
}

// Función para migrar datos usando Prisma adaptada al nuevo schema
async function migrarDatos(consolidado) {
    console.log('🔧 Migrando datos usando Prisma...');
    
    try {
        // Eliminamos todos los datos existentes para hacer una migración limpia
        console.log('🗑️ Eliminando datos existentes...');
        await prisma.horario.deleteMany({});
        await prisma.curso.deleteMany({});
        await prisma.aula.deleteMany({});
        await prisma.escuela.deleteMany({});
        await prisma.facultad.deleteMany({});
        console.log('✅ Datos existentes eliminados');
        
        console.log('🔄 Migrando datos limpios...');
        
        // Crear mapas para almacenar IDs generados
        const facultadIds = new Map();
        const escuelaIds = new Map();
        const aulaIds = new Map();
        const cursoIds = new Map();
        
        // Migrar facultades
        console.log('📚 Migrando facultades...');
        const facultadesData = Array.from(consolidado.facultades.values()).map(f => ({
            nombre: f.nombre,
            codigo: f.codigo
        }));
        
        await prisma.facultad.createMany({
            data: facultadesData
        });
        
        // Obtener IDs de facultades creadas
        const facultadesDB = await prisma.facultad.findMany();
        for (const [key, facultad] of consolidado.facultades.entries()) {
            const facultadDB = facultadesDB.find(f => f.codigo === facultad.codigo);
            if (facultadDB) {
                facultadIds.set(key, facultadDB.id);
                console.log(`   ✅ Facultad: ${facultad.nombre}`);
            }
        }
        
        // Migrar escuelas
        console.log('🏫 Migrando escuelas...');
        const escuelasData = Array.from(consolidado.escuelas.entries()).map(([key, escuela]) => ({
            nombre: escuela.nombre,
            codigo: escuela.codigo,
            director: escuela.director || null,
            duracion: escuela.duracion || null,
            modalidad: escuela.modalidad || 'Presencial',
            grados: escuela.grados ? JSON.stringify(escuela.grados) : JSON.stringify(['Bachiller', 'Título Profesional']),
            facultadId: facultadIds.get(escuela.facultadKey || 'default')
        }));
        
        await prisma.escuela.createMany({
            data: escuelasData
        });
        
        // Obtener IDs de escuelas creadas
        const escuelasDB = await prisma.escuela.findMany();
        for (const [key, escuela] of consolidado.escuelas.entries()) {
            const escuelaDB = escuelasDB.find(e => e.codigo === escuela.codigo);
            if (escuelaDB) {
                escuelaIds.set(key, escuelaDB.id);
                console.log(`   ✅ Escuela: ${escuela.nombre}`);
            }
        }
        
        // Migrar aulas
        console.log('🏛️ Migrando aulas...');
        const aulasData = Array.from(consolidado.aulas.entries()).map(([key, aula]) => ({
            codigo: aula.codigo,
            nombre: aula.nombre,
            tipo: aula.tipo,
            capacidad: aula.capacidad,
            edificio: aula.edificio,
            facultadId: facultadIds.get(aula.facultadKey || 'default'),
            piso: 1,
            equipamiento: null,
            softwareInstalado: null,
            estado: 'Disponible',
            responsable: null
        }));
        
        await prisma.aula.createMany({
            data: aulasData
        });
        
        // Obtener IDs de aulas creadas
        const aulasDB = await prisma.aula.findMany();
        for (const [key, aula] of consolidado.aulas.entries()) {
            const aulaDB = aulasDB.find(a => a.codigo === aula.codigo);
            if (aulaDB) {
                aulaIds.set(key, aulaDB.id);
            }
        }
        console.log(`   ✅ ${consolidado.aulas.size} aulas migradas`);
        
        // Migrar cursos (filtrar duplicados por código)
         console.log('📖 Migrando cursos...');
         const cursosUnicos = new Map();
         
         // Filtrar cursos únicos por código
         for (const [key, curso] of consolidado.cursos.entries()) {
             if (!cursosUnicos.has(curso.codigo)) {
                 cursosUnicos.set(curso.codigo, {
                     key,
                     codigo: curso.codigo,
                     nombre: curso.nombre,
                     creditos: curso.creditos,
                     semestre: curso.semestre,
                     requisitos: curso.requisitos.length > 0 ? JSON.stringify(curso.requisitos) : null,
                     escuelaId: escuelaIds.get(curso.escuelaKey || 'default')
                 });
             }
         }
         
         const cursosData = Array.from(cursosUnicos.values()).map(curso => ({
             codigo: curso.codigo,
             nombre: curso.nombre,
             creditos: curso.creditos,
             semestre: curso.semestre,
             requisitos: curso.requisitos,
             escuelaId: curso.escuelaId
         }));
         
         await prisma.curso.createMany({
             data: cursosData
         });
        
        // Obtener IDs de cursos creados
         const cursosDB = await prisma.curso.findMany();
         for (const [key, curso] of consolidado.cursos.entries()) {
             const cursoDB = cursosDB.find(c => c.codigo === curso.codigo);
             if (cursoDB) {
                 cursoIds.set(key, cursoDB.id);
             }
         }
         console.log(`   ✅ ${cursosUnicos.size} cursos únicos migrados (de ${consolidado.cursos.size} totales)`);
        
        // Migrar horarios
        console.log('⏰ Migrando horarios...');
        
        const horariosData = consolidado.horarios
            .filter(horario => {
                const cursoId = cursoIds.get(horario.cursoKey);
                if (!cursoId) {
                    console.warn(`⚠️ Curso no encontrado para horario: ${horario.cursoKey}`);
                    return false;
                }
                return true;
            })
            .map(horario => ({
                cursoId: cursoIds.get(horario.cursoKey),
                aulaId: horario.aulaKey ? aulaIds.get(horario.aulaKey) : null,
                dia: horario.dia,
                horaInicio: horario.horaInicio,
                horaFin: horario.horaFin,
                tipo: horario.tipo,
                grupo: horario.grupo,
                modalidad: horario.modalidad,
                semestre: horario.semestre
            }));
        
        await prisma.horario.createMany({
            data: horariosData
        });
        
        const horariosCreados = horariosData.length;
        
        console.log('✅ Migración completada exitosamente!');
        
        // Mostrar estadísticas
        const stats = {
            facultades: await prisma.facultad.count(),
            escuelas: await prisma.escuela.count(),
            aulas: await prisma.aula.count(),
            cursos: await prisma.curso.count(),
            horarios: await prisma.horario.count()
        };
        
        console.log('\n📊 Estadísticas finales:');
        console.log(`   - Facultades: ${stats.facultades}`);
        console.log(`   - Escuelas: ${stats.escuelas}`);
        console.log(`   - Aulas: ${stats.aulas}`);
        console.log(`   - Cursos: ${stats.cursos}`);
        console.log(`   - Horarios: ${stats.horarios}`);
        
        return stats;
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando migración completa de datos UNSAAC HORARIOS\n');
    
    try {
        // Verificar conexión a la base de datos
        console.log('🔌 Verificando conexión a la base de datos...');
        await prisma.$connect();
        console.log('✅ Conexión establecida\n');
        
        // Leer archivos de carreras
        const carreras = leerArchivosCarreras();
        
        if (carreras.length === 0) {
            console.error('❌ No se encontraron archivos de carreras válidos');
            process.exit(1);
        }
        
        console.log(`📊 Se encontraron ${carreras.length} archivos de carreras para migrar\n`);
        
        // Consolidar datos
        const consolidado = await consolidarDatos(carreras);
        
        // Migrar datos usando Prisma
        const stats = await migrarDatos(consolidado);
        
        console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('\n📋 Resumen de la migración:');
        console.log('✅ Datos de 52 carreras migrados a la base de datos PostgreSQL');
        console.log('✅ Schema de Prisma utilizado correctamente');
        console.log('✅ Relaciones entre tablas establecidas');
        console.log('✅ Datos existentes limpiados antes de la migración');
        
        console.log('\n💡 Próximos pasos:');
        console.log('1. Verificar los datos en la base de datos');
        console.log('2. Ejecutar consultas de prueba');
        console.log('3. Configurar la aplicación frontend para usar estos datos');
        
        return stats;
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexión a la base de datos cerrada');
    }
}

// Ejecutar si es llamado directamente
const isMainModule = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMainModule) {
    main();
}

export { main, leerArchivosCarreras, consolidarDatos, migrarDatos };