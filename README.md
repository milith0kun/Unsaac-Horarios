# Sistema de Gestión de Horarios UNSAAC

## Descripción del Proyecto

Sistema web para la gestión y generación de horarios académicos de la Universidad Nacional de San Antonio Abad del Cusco (UNSAAC). Permite a docentes y estudiantes consultar, generar y gestionar horarios de cursos con detección automática de cruces horarios.

## 🎯 Objetivos

- **Extracción automatizada** de datos de horarios mediante web scraping
- **Gestión centralizada** de horarios en base de datos
- **Interfaz intuitiva** para selección de cursos
- **Generación automática** de horarios personalizados
- **Detección de conflictos** y cruces horarios
- **Visualización clara** de horarios semanales

## 🚀 Cómo Empezar - Plan de Web Scraping

### 📋 Análisis Previo y Reconocimiento

Antes de implementar cualquier código, necesitamos realizar un análisis exhaustivo de las fuentes de datos de UNSAAC:

#### 1. **Identificación de Fuentes de Datos**
- **Portal Académico Principal**: `https://www.unsaac.edu.pe/`
- **Sistema de Matrícula**: Identificar URLs específicas de cada facultad
- **Páginas de Facultades**: Analizar estructura de cada escuela profesional
- **Sistemas Internos**: Verificar si existen APIs públicas o endpoints accesibles

#### 2. **Reconocimiento de Estructura Web**
```
Tareas de Análisis:
├── Inspección manual de páginas objetivo
├── Identificación de patrones HTML/CSS
├── Análisis de JavaScript dinámico
├── Detección de sistemas de autenticación
├── Mapeo de rutas y endpoints
└── Identificación de limitaciones (CAPTCHA, rate limits)
```

#### 3. **Estrategia de Extracción por Fases**

**Fase 1: Reconocimiento Pasivo (1-2 días)**
- Navegación manual de portales UNSAAC
- Documentación de estructura de páginas
- Identificación de tablas de horarios
- Análisis de formularios de búsqueda
- Mapeo de URLs por facultad/escuela

**Fase 2: Análisis Técnico (2-3 días)**
- Inspección de código fuente HTML
- Identificación de selectores CSS/XPath
- Análisis de requests de red (DevTools)
- Detección de contenido dinámico (AJAX)
- Evaluación de medidas anti-scraping

**Fase 3: Prototipo de Extracción (3-4 días)**
- Desarrollo de scraper básico para una facultad
- Pruebas de extracción de datos
- Validación de información obtenida
- Optimización de selectores
- Implementación de manejo de errores

### 🎯 Metodología de Scraping

#### **Enfoque Gradual y Respetuoso**

1. **Análisis de robots.txt**
   - Verificar políticas de scraping permitidas
   - Respetar directivas de exclusión
   - Identificar crawl-delay recomendado

2. **Estrategia de Rate Limiting**
   ```
   Configuración Propuesta:
   ├── Delay entre requests: 2-5 segundos
   ├── Requests por minuto: máximo 10-15
   ├── Horarios de scraping: 2:00 AM - 5:00 AM
   ├── Rotación de User-Agents
   └── Implementación de backoff exponencial
   ```

3. **Manejo de Contenido Dinámico**
   - Uso de Puppeteer para JavaScript rendering
   - Espera de elementos específicos
   - Manejo de lazy loading
   - Captura de requests AJAX

#### **Estructura de Datos Objetivo**

```javascript
// Estructura esperada por curso
{
  codigo: "CS101",
  nombre: "Introducción a la Programación",
  creditos: 4,
  facultad: "Ingeniería",
  escuela: "Ingeniería Informática",
  docente: "Dr. Juan Pérez",
  horarios: [
    {
      dia: "Lunes",
      horaInicio: "08:00",
      horaFin: "10:00",
      aula: "Lab-101",
      tipo: "Teoría",
      grupo: "A"
    }
  ],
  semestre: "2024-I",
  requisitos: ["MAT101"],
  cupos: {
    total: 30,
    ocupados: 25,
    disponibles: 5
  }
}
```

### 🛠️ Herramientas y Tecnologías

#### **Stack de Scraping**
- **Puppeteer**: Navegación automatizada y rendering de JavaScript
- **Cheerio**: Parsing eficiente de HTML estático
- **Axios**: Requests HTTP optimizados
- **Playwright**: Alternativa robusta para sitios complejos
- **Proxy-chain**: Rotación de IPs si es necesario

#### **Almacenamiento y Procesamiento**
- **PostgreSQL**: Base de datos principal para horarios
- **Redis**: Cache temporal y queue de jobs
- **Bull Queue**: Gestión de trabajos de scraping
- **Winston**: Logging detallado de operaciones

#### **Monitoreo y Alertas**
- **Prometheus + Grafana**: Métricas de scraping
- **Sentry**: Tracking de errores
- **Nodemailer**: Notificaciones por email
- **Slack/Discord Webhooks**: Alertas en tiempo real

### 📊 Plan de Validación

#### **Verificación de Datos**
1. **Validación Cruzada**
   - Comparación con fuentes oficiales
   - Verificación manual de muestras aleatorias
   - Detección de inconsistencias

2. **Métricas de Calidad**
   ```
   KPIs de Scraping:
   ├── Tasa de éxito de extracción: >95%
   ├── Tiempo promedio por página: <10s
   ├── Datos únicos extraídos por día: >1000
   ├── Errores por cada 100 requests: <2
   └── Cobertura de facultades: 100%
   ```

3. **Detección de Cambios**
   - Monitoreo de estructura de páginas
   - Alertas por cambios en selectores
   - Versionado de configuraciones de scraping

### 🔄 Cronograma de Implementación

```
Semana 1: Análisis y Reconocimiento
├── Días 1-2: Exploración manual de portales
├── Días 3-4: Análisis técnico detallado
├── Días 5-7: Documentación de hallazgos

Semana 2: Desarrollo del Scraper
├── Días 1-3: Implementación de scraper básico
├── Días 4-5: Pruebas y refinamiento
├── Días 6-7: Integración con base de datos

Semana 3: Optimización y Escalabilidad
├── Días 1-3: Implementación de rate limiting
├── Días 4-5: Sistema de monitoreo
├── Días 6-7: Pruebas de carga y estabilidad
```

### ⚠️ Consideraciones Éticas y Legales

- **Respeto a términos de servicio** de UNSAAC
- **Minimización de carga** en servidores universitarios
- **Uso responsable** de datos extraídos
- **Cumplimiento de GDPR/LOPD** para datos personales
- **Transparencia** con la institución sobre el proyecto

### 🎯 Próximos Pasos

1. **Realizar reconocimiento manual** de portales UNSAAC
2. **Documentar estructura** de páginas objetivo
3. **Identificar patrones** de datos de horarios
4. **Evaluar complejidad técnica** de cada fuente
5. **Definir prioridades** de implementación por facultad

## 🏗️ Arquitectura del Sistema

### Frontend
- **React 18+** - Interfaz de usuario moderna y reactiva
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