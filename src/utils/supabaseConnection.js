// Función de verificación de conexión a Supabase
// Este archivo contiene utilidades para verificar y diagnosticar la conexión con Supabase

import { supabase } from '../lib/supabase.js';

/**
 * Verificar la conexión básica a Supabase
 * @returns {Promise<Object>} Resultado de la verificación
 */
export const verifySupabaseConnection = async () => {
  console.log('🔄 Iniciando verificación de conexión a Supabase...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
    config: {
      url: import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada'
    },
    tests: {
      basicConnection: { status: 'pending', message: '', duration: 0 },
      authentication: { status: 'pending', message: '', duration: 0 },
      database: { status: 'pending', message: '', duration: 0 },
      realtime: { status: 'pending', message: '', duration: 0 }
    },
    overall: { status: 'pending', message: '' }
  };

  try {
    // ==================== TEST 1: Conexión Básica ====================
    console.log('🧪 Test 1: Verificando conexión básica...');
    const startTime1 = performance.now();
    
    try {
      // Verificar que las variables de entorno estén configuradas
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configuradas');
      }
      
      // Verificar que el cliente de Supabase esté inicializado
      if (!supabase) {
        throw new Error('Cliente de Supabase no inicializado');
      }
      
      results.tests.basicConnection = {
        status: 'success',
        message: 'Cliente de Supabase inicializado correctamente',
        duration: performance.now() - startTime1
      };
      console.log('✅ Test 1: Conexión básica exitosa');
      
    } catch (error) {
      results.tests.basicConnection = {
        status: 'error',
        message: error.message,
        duration: performance.now() - startTime1
      };
      console.error('❌ Test 1: Error en conexión básica:', error.message);
    }

    // ==================== TEST 2: Autenticación ====================
    console.log('🧪 Test 2: Verificando sistema de autenticación...');
    const startTime2 = performance.now();
    
    try {
      // Obtener sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      const authMessage = session && user 
        ? `Usuario autenticado: ${user.email}` 
        : 'Sistema de autenticación disponible (sin usuario activo)';
      
      results.tests.authentication = {
        status: 'success',
        message: authMessage,
        duration: performance.now() - startTime2,
        user: user ? { id: user.id, email: user.email } : null,
        session: session ? { expires_at: session.expires_at } : null
      };
      console.log('✅ Test 2: Autenticación verificada');
      
    } catch (error) {
      results.tests.authentication = {
        status: 'error',
        message: `Error en autenticación: ${error.message}`,
        duration: performance.now() - startTime2
      };
      console.error('❌ Test 2: Error en autenticación:', error.message);
    }

    // ==================== TEST 3: Base de Datos ====================
    console.log('🧪 Test 3: Verificando acceso a base de datos...');
    const startTime3 = performance.now();
    
    try {
      // Intentar una consulta simple a la tabla posts
      const { error, count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        // Si la tabla no existe, es un error esperado
        if (error.code === 'PGRST116' || error.message.includes('relation "posts" does not exist')) {
          results.tests.database = {
            status: 'warning',
            message: 'Conexión a BD exitosa, pero tabla "posts" no existe. Crear tabla según documentación.',
            duration: performance.now() - startTime3
          };
          console.log('⚠️ Test 3: BD conectada, tabla posts no existe');
        } else {
          throw error;
        }
      } else {
        results.tests.database = {
          status: 'success',
          message: `Acceso a BD exitoso. Tabla "posts" tiene ${count || 0} registros.`,
          duration: performance.now() - startTime3,
          postsCount: count || 0
        };
        console.log('✅ Test 3: Base de datos accesible');
      }
      
    } catch (error) {
      results.tests.database = {
        status: 'error',
        message: `Error en BD: ${error.message}`,
        duration: performance.now() - startTime3
      };
      console.error('❌ Test 3: Error en base de datos:', error.message);
    }

    // ==================== TEST 4: Realtime ====================
    console.log('🧪 Test 4: Verificando capacidades de tiempo real...');
    const startTime4 = performance.now();
    
    try {
      // Verificar que el canal de realtime esté disponible
      const channel = supabase.channel('test-connection');
      
      if (!channel) {
        throw new Error('No se pudo crear canal de realtime');
      }
      
      // Suscribirse brevemente para verificar funcionalidad
      channel
        .on('presence', { event: 'sync' }, () => {
          console.log('📡 Realtime sync detectado');
        })
        .subscribe((status) => {
          console.log('📡 Estado de suscripción realtime:', status);
        });
      
      // Esperar un momento y luego desuscribirse
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await supabase.removeChannel(channel);
      
      results.tests.realtime = {
        status: 'success',
        message: 'Capacidades de tiempo real disponibles',
        duration: performance.now() - startTime4
      };
      console.log('✅ Test 4: Realtime verificado');
      
    } catch (error) {
      results.tests.realtime = {
        status: 'error',
        message: `Error en realtime: ${error.message}`,
        duration: performance.now() - startTime4
      };
      console.error('❌ Test 4: Error en realtime:', error.message);
    }

    // ==================== EVALUACIÓN GENERAL ====================
    const testResults = Object.values(results.tests);
    const successCount = testResults.filter(test => test.status === 'success').length;
    const warningCount = testResults.filter(test => test.status === 'warning').length;
    const errorCount = testResults.filter(test => test.status === 'error').length;
    
    if (errorCount === 0) {
      results.overall = {
        status: 'success',
        message: `Todas las verificaciones exitosas (${successCount} éxitos, ${warningCount} advertencias)`
      };
    } else if (successCount >= 2) {
      results.overall = {
        status: 'partial',
        message: `Conexión parcial (${successCount} éxitos, ${warningCount} advertencias, ${errorCount} errores)`
      };
    } else {
      results.overall = {
        status: 'error',
        message: `Conexión fallida (${errorCount} errores críticos)`
      };
    }
    
  } catch (error) {
    console.error('❌ Error general en verificación:', error);
    results.overall = {
      status: 'error',
      message: `Error general: ${error.message}`
    };
  }
  
  // Mostrar resumen en consola
  console.log('\n📊 RESUMEN DE VERIFICACIÓN DE SUPABASE:');
  console.log('==========================================');
  console.log(`🕐 Timestamp: ${results.timestamp}`);
  console.log(`🌍 Entorno: ${results.environment}`);
  console.log(`🔗 URL configurada: ${results.config.url}`);
  console.log(`🔑 ANON_KEY configurada: ${results.config.anonKey}`);
  console.log('\n🧪 RESULTADOS DE TESTS:');
  
  Object.entries(results.tests).forEach(([testName, result]) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${testName}: ${result.message} (${result.duration.toFixed(2)}ms)`);
  });
  
  console.log(`\n🎯 ESTADO GENERAL: ${results.overall.status.toUpperCase()}`);
  console.log(`📝 ${results.overall.message}`);
  console.log('==========================================\n');
  
  return results;
};

/**
 * Verificar configuración de variables de entorno
 * @returns {Object} Estado de las variables de entorno
 */
export const checkEnvironmentVariables = () => {
  console.log('🔍 Verificando variables de entorno...');
  
  const envVars = {
    VITE_SUPABASE_URL: {
      value: import.meta.env.VITE_SUPABASE_URL,
      configured: !!import.meta.env.VITE_SUPABASE_URL,
      valid: import.meta.env.VITE_SUPABASE_URL?.startsWith('https://') || false
    },
    VITE_SUPABASE_ANON_KEY: {
      value: import.meta.env.VITE_SUPABASE_ANON_KEY ? '***CONFIGURADA***' : undefined,
      configured: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      valid: import.meta.env.VITE_SUPABASE_ANON_KEY?.length > 100 || false
    }
  };
  
  const allConfigured = Object.values(envVars).every(env => env.configured);
  const allValid = Object.values(envVars).every(env => env.valid);
  
  console.log('📋 Estado de variables de entorno:');
  Object.entries(envVars).forEach(([key, env]) => {
    const status = env.configured && env.valid ? '✅' : env.configured ? '⚠️' : '❌';
    console.log(`${status} ${key}: ${env.configured ? 'Configurada' : 'No configurada'}${env.configured && !env.valid ? ' (formato inválido)' : ''}`);
  });
  
  return {
    variables: envVars,
    allConfigured,
    allValid,
    status: allConfigured && allValid ? 'success' : allConfigured ? 'warning' : 'error'
  };
};

/**
 * Función de diagnóstico completo
 * @returns {Promise<Object>} Diagnóstico completo del sistema
 */
export const runFullDiagnostic = async () => {
  console.log('🚀 Iniciando diagnóstico completo de Supabase...');
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: checkEnvironmentVariables(),
    connection: await verifySupabaseConnection(),
    recommendations: []
  };
  
  // Generar recomendaciones basadas en los resultados
  if (!diagnostic.environment.allConfigured) {
    diagnostic.recommendations.push('⚠️ Configurar todas las variables de entorno requeridas en .env.local');
  }
  
  if (diagnostic.connection.tests.database.status === 'warning') {
    diagnostic.recommendations.push('📝 Crear tabla "posts" en Supabase según la documentación en postsCRUD.js');
  }
  
  if (diagnostic.connection.tests.authentication.status === 'error') {
    diagnostic.recommendations.push('🔐 Verificar configuración de autenticación en Supabase Dashboard');
  }
  
  if (diagnostic.connection.overall.status === 'error') {
    diagnostic.recommendations.push('🔧 Revisar configuración de Supabase y credenciales');
  }
  
  if (diagnostic.recommendations.length === 0) {
    diagnostic.recommendations.push('🎉 ¡Todo configurado correctamente! Supabase está listo para usar.');
  }
  
  console.log('\n💡 RECOMENDACIONES:');
  diagnostic.recommendations.forEach(rec => console.log(rec));
  
  return diagnostic;
};

// Exportar funciones principales
export default {
  verifySupabaseConnection,
  checkEnvironmentVariables,
  runFullDiagnostic
};