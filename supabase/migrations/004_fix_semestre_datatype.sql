-- Cambiar el tipo de dato del campo semestre de INTEGER a VARCHAR
-- para permitir valores como '2025-I', '2024-II', etc.

-- Cambiar semestre en tabla cursos
ALTER TABLE public.cursos 
ALTER COLUMN semestre TYPE VARCHAR(20);

-- Cambiar semestre en tabla horarios
ALTER TABLE public.horarios 
ALTER COLUMN semestre TYPE VARCHAR(20);