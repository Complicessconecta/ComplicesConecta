-- Agregar columna user_id a la tabla gallery_unlocks
-- Esta columna es necesaria para el funcionamiento de ImageGallery.tsx

ALTER TABLE public.gallery_unlocks
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_user_id ON public.gallery_unlocks(user_id);

-- Comentario sobre la columna
COMMENT ON COLUMN public.gallery_unlocks.user_id IS 'ID del usuario que desbloqueó la galería';
