-- Agregar columna slug a la tabla clubs
-- Esta columna es necesaria para el funcionamiento de AdminPartners.tsx

ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE NOT NULL DEFAULT '';

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clubs_slug ON public.clubs(slug);

-- Comentario sobre la columna
COMMENT ON COLUMN public.clubs.slug IS 'Slug único para el club, usado en URLs y referencias';
