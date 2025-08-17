# Configuración de Variables de Entorno en Vercel

## 🚨 Error Actual
Si estás viendo el error `Error de conexión a la base de datos` o `HTTP error! status: 500`, es porque las variables de entorno no están configuradas en Vercel.

## 📋 Variables Requeridas

Para que la aplicación funcione correctamente en Vercel, necesitas configurar estas variables:

```
DATABASE_URL=postgresql://postgres.filhwrhdoauwzafucrmb:edmil1997281qA@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.filhwrhdoauwzafucrmb:edmil1997281qA@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

## 🔧 Pasos para Configurar en Vercel

### 1. Acceder al Dashboard de Vercel
- Ve a [vercel.com](https://vercel.com)
- Inicia sesión en tu cuenta
- Busca tu proyecto "horarios-unsaac-174449-2618"

### 2. Navegar a Configuración
- Haz clic en tu proyecto
- Ve a la pestaña **"Settings"** (Configuración)
- En el menú lateral, selecciona **"Environment Variables"**

### 3. Agregar Variables de Entorno

#### Variable 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres.filhwrhdoauwzafucrmb:edmil1997281qA@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Environments**: Selecciona **Production**, **Preview**, y **Development**
- Haz clic en **"Add"**

#### Variable 2: DIRECT_URL
- **Name**: `DIRECT_URL`
- **Value**: `postgresql://postgres.filhwrhdoauwzafucrmb:edmil1997281qA@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
- **Environments**: Selecciona **Production**, **Preview**, y **Development**
- Haz clic en **"Add"**

### 4. Redesplegar la Aplicación

Después de agregar las variables:

1. Ve a la pestaña **"Deployments"**
2. Busca el deployment más reciente
3. Haz clic en los **tres puntos (...)** al lado del deployment
4. Selecciona **"Redeploy"**
5. Confirma el redespliegue

## ✅ Verificación

Una vez completado el redespliegue:

1. Espera 2-3 minutos para que se complete
2. Visita tu aplicación: `https://horarios-unsaac-174449-2618-edmils-projects.vercel.app`
3. Verifica que ya no aparezcan errores 500
4. Confirma que los datos iniciales se cargan correctamente

## 🔍 Solución de Problemas

### Si sigues viendo errores:

1. **Verifica que las variables estén guardadas**:
   - Ve a Settings > Environment Variables
   - Confirma que ambas variables aparezcan en la lista

2. **Revisa los logs de deployment**:
   - Ve a la pestaña "Functions"
   - Busca errores en los logs de las funciones API

3. **Fuerza un nuevo deployment**:
   - Haz un pequeño cambio en el código (ej: agregar un espacio)
   - Haz commit y push al repositorio
   - Vercel automáticamente creará un nuevo deployment

## 📞 Contacto

Si necesitas ayuda adicional:
- Revisa la documentación de Vercel sobre variables de entorno
- Verifica que las credenciales de Supabase sean correctas
- Asegúrate de que el proyecto de Supabase esté activo

---

**Nota**: Estas credenciales son específicas para este proyecto. No las compartas públicamente y mantenlas seguras.