# UNSAAC Horarios

Sistema web para la gestión de horarios académicos de la Universidad Nacional de San Antonio Abad del Cusco (UNSAAC).

## Características

- Consulta de horarios por facultad y escuela
- Generación de horarios personalizados
- Detección automática de cruces horarios
- Exportación a PDF
- Interfaz responsive

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/milith0kun/Unsaac-Horarios.git
cd Unsaac-Horarios
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
# Edita .env con tus credenciales de base de datos
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Inicia el servidor backend:
```bash
npm run server
```

## Tecnologías

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Base de datos**: PostgreSQL (Supabase)
- **Scraping**: Puppeteer, Cheerio

## Despliegue

El proyecto está configurado para desplegarse en Vercel. Asegúrate de configurar las variables de entorno `DATABASE_URL` y `DIRECT_URL` en el panel de Vercel.

## Licencia

MIT
- **TypeScript** - Tipado estático para mayor robustez
- **Tailwind CSS** - Diseño responsive y moderno
- **React Router** - Navegación SPA
- **Zustand/Redux Toolkit** - Gestión de estado global
- **React Query** - Manejo de estado del servidor
- **Chart.js/Recharts** - Visualización de horarios

### Backend
- **Node.js + Express** - Servidor API REST
- **TypeScript** - Consistencia de tipos en todo el stack
- **Prisma ORM** - Gestión de base de datos
- **JWT** - Autenticación y autorización
- **Helmet + CORS** - Seguridad de API

### Web Scraping
- **Puppeteer** - Automatización de navegador para scraping
- **Cheerio** - Parsing de HTML
- **Cron Jobs** - Actualización automática de datos
- **Rate Limiting** - Control de frecuencia de requests

### Base de Datos
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y sesiones
- **Backup automático** - Respaldo de datos críticos

## 📊 Modelo de Datos

### Entidades Principales

```sql
-- Docentes
Teachers {
  id: UUID
  name: String
  email: String
  department: String
  created_at: DateTime
}

-- Cursos
Courses {
  id: UUID
  code: String
  name: String
  credits: Integer
  department: String
  semester: Integer
  created_at: DateTime
}

-- Horarios
Schedules {
  id: UUID
  course_id: UUID
  teacher_id: UUID
  day_of_week: Integer
  start_time: Time
  end_time: Time
  classroom: String
  group: String
  semester: String
  created_at: DateTime
}

-- Usuarios
Users {
  id: UUID
  username: String
  email: String
  role: Enum(student, teacher, admin)
  created_at: DateTime
}

-- Horarios Personalizados
UserSchedules {
  id: UUID
  user_id: UUID
  name: String
  schedules: JSON
  created_at: DateTime
}
```

## 🔧 Funcionalidades

### Para Estudiantes
- ✅ Búsqueda de cursos por código, nombre o docente
- ✅ Selección múltiple de cursos
- ✅ Generación automática de horarios
- ✅ Detección de cruces horarios
- ✅ Exportación de horarios (PDF, imagen)
- ✅ Guardado de horarios favoritos

### Para Docentes
- ✅ Visualización de horarios asignados
- ✅ Gestión de disponibilidad
- ✅ Reportes de carga académica

### Para Administradores
- ✅ Gestión de cursos y docentes
- ✅ Configuración de scraping
- ✅ Monitoreo del sistema
- ✅ Respaldos de base de datos

## 🚀 Tecnologías de Scraping

### Estrategia de Extracción
1. **Puppeteer** para navegación automatizada
2. **Análisis de patrones** en páginas web de UNSAAC
3. **Extracción de datos** de tablas HTML
4. **Validación y limpieza** de datos
5. **Almacenamiento estructurado** en base de datos

### Fuentes de Datos
- Portal académico UNSAAC
- Sistemas de matrícula
- Páginas de facultades
- APIs públicas (si están disponibles)

## 📱 Interfaz de Usuario

### Páginas Principales
- **Dashboard** - Resumen de horarios y estadísticas
- **Búsqueda de Cursos** - Filtros avanzados y resultados
- **Generador de Horarios** - Selección y configuración
- **Mis Horarios** - Gestión de horarios guardados
- **Perfil** - Configuración de usuario

### Componentes Clave
- **Calendario Semanal** - Visualización de horarios
- **Selector de Cursos** - Interfaz de selección múltiple
- **Detector de Conflictos** - Alertas visuales
- **Exportador** - Opciones de descarga

## 🛠️ Instalación y Configuración

### Prerrequisitos
```bash
# Node.js 18+
# PostgreSQL 14+
# Redis 6+
# Git
```

### Variables de Entorno

#### Variables Requeridas
El proyecto requiere las siguientes variables de entorno para funcionar correctamente:

```env
# Base de datos PostgreSQL (Supabase)
# URL de conexión principal con pooling para aplicaciones
DATABASE_URL="postgresql://postgres.username:password@host:6543/postgres?pgbouncer=true"

# URL de conexión directa para migraciones y operaciones que requieren conexión directa
DIRECT_URL="postgresql://postgres.username:password@host:5432/postgres"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Scraping
SCRAPING_INTERVAL="0 2 * * *"  # Diario a las 2 AM
SCRAPING_TIMEOUT=30000

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

#### Configuración Local
1. Copia el archivo `.env.example` como `.env` en la raíz del proyecto
2. Reemplaza los valores de ejemplo con tus credenciales reales
3. Asegúrate de que todas las variables requeridas estén configuradas

#### Configuración en Vercel
Para desplegar en Vercel, debes configurar las variables de entorno en el panel de Vercel:

1. **Accede a tu proyecto en Vercel Dashboard**
2. **Navega a Settings > Environment Variables**
3. **Agrega las siguientes variables:**
   - `DATABASE_URL`: URL de conexión a PostgreSQL con pooling
   - `DIRECT_URL`: URL de conexión directa a PostgreSQL
4. **Selecciona todos los entornos** (Production, Preview, Development)
5. **Guarda los cambios** y redespliega el proyecto

> ⚠️ **Importante**: Sin estas variables configuradas en Vercel, la aplicación mostrará errores 500 al intentar conectarse a la base de datos.

#### Obtener Credenciales de Supabase
1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > Database
3. Copia la "Connection string" para `DATABASE_URL` (con pooling)
4. Copia la "Direct connection" para `DIRECT_URL`
5. Asegúrate de reemplazar `[YOUR-PASSWORD]` con tu contraseña real

## 📈 Roadmap

### Fase 1 - MVP (4-6 semanas)
- [x] Configuración del proyecto
- [ ] Diseño de base de datos
- [ ] API básica (CRUD)
- [ ] Scraping inicial
- [ ] Frontend básico
- [ ] Generación simple de horarios

### Fase 2 - Funcionalidades Avanzadas (4-6 semanas)
- [ ] Detección de cruces
- [ ] Exportación de horarios
- [ ] Sistema de usuarios
- [ ] Dashboard administrativo
- [ ] Optimización de rendimiento

### Fase 3 - Mejoras y Escalabilidad (2-4 semanas)
- [ ] Notificaciones en tiempo real
- [ ] API móvil
- [ ] Análisis de datos
- [ ] Integración con sistemas UNSAAC

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo de Desarrollo

- **Frontend Developer** - React, TypeScript, UI/UX
- **Backend Developer** - Node.js, PostgreSQL, APIs
- **Scraping Specialist** - Puppeteer, Data Extraction
- **DevOps Engineer** - Deployment, Monitoring

## 📞 Contacto

Para preguntas o sugerencias sobre el proyecto:
- Email: desarrollo@unsaac-horarios.com
- Issues: [GitHub Issues](https://github.com/unsaac/horarios/issues)

---

**Desarrollado con ❤️ para la comunidad UNSAAC**