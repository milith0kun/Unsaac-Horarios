-- Crear tabla facultades
CREATE TABLE IF NOT EXISTS public.facultades (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla escuelas
CREATE TABLE IF NOT EXISTS public.escuelas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    director VARCHAR(255),
    duracion INTEGER,
    modalidad VARCHAR(100),
    grados TEXT,
    facultad_id BIGINT REFERENCES public.facultades(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla aulas
CREATE TABLE IF NOT EXISTS public.aulas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    capacidad INTEGER,
    edificio VARCHAR(100),
    facultad_id BIGINT REFERENCES public.facultades(id) ON DELETE CASCADE,
    piso INTEGER,
    equipamiento TEXT,
    software_instalado TEXT,
    estado VARCHAR(50) DEFAULT 'Disponible',
    responsable VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla cursos
CREATE TABLE IF NOT EXISTS public.cursos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    creditos INTEGER,
    semestre INTEGER,
    requisitos TEXT,
    escuela_id BIGINT REFERENCES public.escuelas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla horarios
CREATE TABLE IF NOT EXISTS public.horarios (
    id BIGSERIAL PRIMARY KEY,
    curso_id BIGINT REFERENCES public.cursos(id) ON DELETE CASCADE,
    aula_id BIGINT REFERENCES public.aulas(id) ON DELETE CASCADE,
    dia VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tipo VARCHAR(50),
    grupo VARCHAR(50),
    docente VARCHAR(255),
    modalidad VARCHAR(100),
    semestre INTEGER,
    ciclo VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_escuelas_facultad_id ON public.escuelas(facultad_id);
CREATE INDEX IF NOT EXISTS idx_aulas_facultad_id ON public.aulas(facultad_id);
CREATE INDEX IF NOT EXISTS idx_cursos_escuela_id ON public.cursos(escuela_id);
CREATE INDEX IF NOT EXISTS idx_horarios_curso_id ON public.horarios(curso_id);
CREATE INDEX IF NOT EXISTS idx_horarios_aula_id ON public.horarios(aula_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia ON public.horarios(dia);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.facultades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escuelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para permitir acceso público de lectura
CREATE POLICY "Allow public read access" ON public.facultades FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.escuelas FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.aulas FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.cursos FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.horarios FOR SELECT USING (true);

-- Crear políticas RLS para permitir inserción/actualización/eliminación para usuarios autenticados
CREATE POLICY "Allow authenticated users full access" ON public.facultades FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.escuelas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.aulas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.cursos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.horarios FOR ALL USING (auth.role() = 'authenticated');

-- Otorgar permisos a los roles anon y authenticated
GRANT SELECT ON public.facultades TO anon;
GRANT SELECT ON public.escuelas TO anon;
GRANT SELECT ON public.aulas TO anon;
GRANT SELECT ON public.cursos TO anon;
GRANT SELECT ON public.horarios TO anon;

GRANT ALL PRIVILEGES ON public.facultades TO authenticated;
GRANT ALL PRIVILEGES ON public.escuelas TO authenticated;
GRANT ALL PRIVILEGES ON public.aulas TO authenticated;
GRANT ALL PRIVILEGES ON public.cursos TO authenticated;
GRANT ALL PRIVILEGES ON public.horarios TO authenticated;

-- Otorgar permisos en las secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;