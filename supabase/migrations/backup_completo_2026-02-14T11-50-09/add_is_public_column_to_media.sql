-- Agregar columna is_public a la tabla media
-- Esta columna es necesaria para el funcionamiento de EnhancedGallery.tsx

ALTER TABLE public.media
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_media_is_public ON public.media(is_public);

-- Comentario sobre la columna
COMMENT ON COLUMN public.media.is_public IS 'Indica si el archivo es público';
