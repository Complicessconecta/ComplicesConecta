-- Agregar columna couple_images a la tabla couple_profiles
-- Esta columna es necesaria para el funcionamiento de useCouplePhotos.ts

ALTER TABLE public.couple_profiles
ADD COLUMN IF NOT EXISTS couple_images JSONB DEFAULT '[]'::jsonb;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_couple_profiles_couple_images ON public.couple_profiles USING GIN (couple_images);

-- Comentario sobre la columna
COMMENT ON COLUMN public.couple_profiles.couple_images IS 'Array de imágenes del perfil de pareja';
