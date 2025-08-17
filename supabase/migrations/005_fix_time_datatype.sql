-- Cambiar el tipo de dato de los campos hora_inicio y hora_fin
-- de TIME a VARCHAR para permitir valores como '13', '14', etc.

-- Cambiar hora_inicio y hora_fin en tabla horarios
ALTER TABLE public.horarios 
ALTER COLUMN hora_inicio TYPE VARCHAR(20);

ALTER TABLE public.horarios 
ALTER COLUMN hora_fin TYPE VARCHAR(20);