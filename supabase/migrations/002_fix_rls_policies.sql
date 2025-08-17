-- Actualizar políticas RLS para permitir inserción de datos desde scripts

-- Eliminar políticas existentes restrictivas
DROP POLICY IF EXISTS "Allow public read access" ON public.facultades;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.facultades;
DROP POLICY IF EXISTS "Allow public read access" ON public.escuelas;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.escuelas;
DROP POLICY IF EXISTS "Allow public read access" ON public.aulas;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.aulas;
DROP POLICY IF EXISTS "Allow public read access" ON public.cursos;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.cursos;
DROP POLICY IF EXISTS "Allow public read access" ON public.horarios;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.horarios;

-- Crear políticas más permisivas para permitir operaciones de migración

-- Facultades
CREATE POLICY "Allow all operations for anon" ON public.facultades
    FOR ALL USING (true) WITH CHECK (true);

-- Escuelas
CREATE POLICY "Allow all operations for anon" ON public.escuelas
    FOR ALL USING (true) WITH CHECK (true);

-- Aulas
CREATE POLICY "Allow all operations for anon" ON public.aulas
    FOR ALL USING (true) WITH CHECK (true);

-- Cursos
CREATE POLICY "Allow all operations for anon" ON public.cursos
    FOR ALL USING (true) WITH CHECK (true);

-- Horarios
CREATE POLICY "Allow all operations for anon" ON public.horarios
    FOR ALL USING (true) WITH CHECK (true);

-- Asegurar que los roles tengan los permisos necesarios
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;