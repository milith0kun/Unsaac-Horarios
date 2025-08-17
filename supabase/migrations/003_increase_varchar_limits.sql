-- Aumentar límites de VARCHAR para campos que pueden contener texto largo

-- Aumentar límite para nombres de escuelas
ALTER TABLE public.escuelas 
ALTER COLUMN nombre TYPE VARCHAR(200);

-- Aumentar límite para códigos de escuelas por si acaso
ALTER TABLE public.escuelas 
ALTER COLUMN codigo TYPE VARCHAR(100);

-- Aumentar límite para director
ALTER TABLE public.escuelas 
ALTER COLUMN director TYPE VARCHAR(200);

-- Aumentar límite para modalidad
ALTER TABLE public.escuelas 
ALTER COLUMN modalidad TYPE VARCHAR(100);

-- Aumentar límites para facultades también
ALTER TABLE public.facultades 
ALTER COLUMN nombre TYPE VARCHAR(200);

ALTER TABLE public.facultades 
ALTER COLUMN codigo TYPE VARCHAR(100);

-- Aumentar límites para aulas
ALTER TABLE public.aulas 
ALTER COLUMN nombre TYPE VARCHAR(200);

ALTER TABLE public.aulas 
ALTER COLUMN codigo TYPE VARCHAR(100);

ALTER TABLE public.aulas 
ALTER COLUMN tipo TYPE VARCHAR(100);

ALTER TABLE public.aulas 
ALTER COLUMN edificio TYPE VARCHAR(100);

ALTER TABLE public.aulas 
ALTER COLUMN estado TYPE VARCHAR(100);

ALTER TABLE public.aulas 
ALTER COLUMN responsable TYPE VARCHAR(200);

-- Aumentar límites para cursos
ALTER TABLE public.cursos 
ALTER COLUMN nombre TYPE VARCHAR(200);

ALTER TABLE public.cursos 
ALTER COLUMN codigo TYPE VARCHAR(100);

-- Aumentar límites para horarios
ALTER TABLE public.horarios 
ALTER COLUMN dia TYPE VARCHAR(50);

ALTER TABLE public.horarios 
ALTER COLUMN tipo TYPE VARCHAR(100);

ALTER TABLE public.horarios 
ALTER COLUMN grupo TYPE VARCHAR(100);

ALTER TABLE public.horarios 
ALTER COLUMN docente TYPE VARCHAR(200);

ALTER TABLE public.horarios 
ALTER COLUMN modalidad TYPE VARCHAR(100);

ALTER TABLE public.horarios 
ALTER COLUMN ciclo TYPE VARCHAR(100);