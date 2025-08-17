# UNSAAC HORARIOS

## Descripción

Sistema web para la gestión y visualización de horarios académicos de la Universidad Nacional de San Antonio Abad del Cusco (UNSAAC). Permite a los estudiantes seleccionar cursos por facultad y escuela profesional, visualizar horarios en un tablero interactivo y detectar conflictos de horarios automáticamente.

## Características Principales

- ✅ **Selección Inteligente de Cursos**: Navegación por 18 facultades y 51 escuelas profesionales
- ✅ **Base de Datos Completa**: 4,028 cursos con 10,073 horarios disponibles
- ✅ **Visualización Interactiva**: Tablero de horarios con detección automática de conflictos
- ✅ **Optimización UX**: Los cursos seleccionados desaparecen de la lista disponible
- ✅ **Feedback Instantáneo**: Respuesta visual inmediata al seleccionar cursos
- ✅ **Detección de Conflictos**: Validación automática de solapamientos de horarios
- ✅ **Búsqueda Avanzada**: Filtrado de cursos por nombre y código

## Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Herramienta de construcción y desarrollo
- **Tailwind CSS** - Framework de estilos utilitarios
- **Hooks Personalizados** - Gestión de estado optimizada

### Backend
- **Express.js** - Framework de servidor (Serverless en Vercel)
- **Supabase** - Base de datos PostgreSQL en la nube
- **API RESTful** - Endpoints para facultades, escuelas y cursos

### Deployment
- **Vercel** - Hosting y deployment automático
- **GitHub** - Control de versiones

## Estructura del Proyecto

```
UNSAAC HORARIOS/
├── api/                    # Funciones serverless (Express.js)
├── src/
│   ├── components/         # Componentes React
│   ├── hooks/             # Hooks personalizados
│   ├── services/          # Servicios de API
│   └── utils/             # Utilidades y helpers
├── supabase/
│   └── migrations/        # Migraciones de base de datos
├── scraping/              # Scripts de extracción de datos
└── vercel.json            # Configuración de deployment
```

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o pnpm
- Cuenta de Supabase

### Configuración Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/unsaac-horarios.git
cd unsaac-horarios
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env` en la raíz:
```env
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_anon_key
```

4. **Ejecutar en desarrollo**
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo frontend
- `npm run server` - Inicia el servidor backend local
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run check` - Ejecuta verificaciones de código

## Base de Datos

### Estructura Principal
- **facultades** - 18 facultades de la UNSAAC
- **escuelas** - 51 escuelas profesionales
- **cursos** - 4,028 cursos académicos
- **horarios** - 10,073 horarios de clases

### Políticas de Seguridad (RLS)
- Acceso público de lectura para datos académicos
- Políticas configuradas para roles `anon` y `authenticated`

## API Endpoints

```
GET /api/facultades          # Obtener todas las facultades
GET /api/escuelas/:facultadId # Obtener escuelas por facultad
GET /api/cursos/:escuelaId    # Obtener cursos por escuela
GET /api/horarios/:cursoId    # Obtener horarios por curso
```

## Deployment

La aplicación está configurada para deployment automático en Vercel:

1. **Conectar repositorio** a Vercel
2. **Configurar variables de entorno** en Vercel Dashboard
3. **Deploy automático** en cada push a main

### URL de Producción
🌐 [https://horarios-unsaac.vercel.app](https://horarios-unsaac.vercel.app)

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

- **Proyecto**: Sistema de Horarios UNSAAC
- **Universidad**: Universidad Nacional de San Antonio Abad del Cusco
- **Año**: 2025

---

**Nota**: Este proyecto fue desarrollado para facilitar la gestión de horarios académicos en la UNSAAC y mejorar la experiencia de los estudiantes en la planificación de sus cursos.