/**
 * Configuración del cliente de Supabase para React + Vite
 * 
 * Este archivo configura la conexión con Supabase usando las variables de entorno
 * definidas en .env.local para desarrollo y en Vercel para producción.
 * 
 * IMPORTANTE:
 * - En desarrollo: Las variables se cargan desde .env.local
 * - En producción (Vercel): Las variables deben configurarse en el panel de Vercel
 * - El prefijo VITE_ es necesario para que Vite exponga las variables al cliente
 */

import { createClient } from '@supabase/supabase-js'

// Obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL no está configurada. ' +
    'Asegúrate de tener el archivo .env.local en desarrollo o ' +
    'configurar las variables de entorno en Vercel para producción.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY no está configurada. ' +
    'Asegúrate de tener el archivo .env.local en desarrollo o ' +
    'configurar las variables de entorno en Vercel para producción.'
  )
}

// Crear y configurar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuración de autenticación
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

/**
 * Función para verificar la conexión con Supabase
 * Útil para debugging y verificación de configuración
 * 
 * @returns {Promise<{connected: boolean, error?: string}>}
 */
export const verifySupabaseConnection = async () => {
  try {
    console.log('🔍 Verificando conexión con Supabase...')
    console.log('📍 URL:', supabaseUrl)
    console.log('🔑 Anon Key configurada:', supabaseAnonKey ? 'Sí' : 'No')
    
    // Intentar hacer una consulta simple para verificar la conexión
    const { error } = await supabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 significa que la tabla no existe, pero la conexión funciona
      console.error('❌ Error de conexión:', error.message)
      return { connected: false, error: error.message }
    }
    
    console.log('✅ Conexión con Supabase exitosa')
    return { connected: true }
  } catch (error) {
    console.error('❌ Error al verificar conexión:', error.message)
    return { connected: false, error: error.message }
  }
}

// Exportar por defecto el cliente
export default supabase