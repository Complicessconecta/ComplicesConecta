-- Agregar columnas faltantes a tabla stories para compatibilidad con código existente
-- Fecha: 14 de Enero, 2026

-- Agregar columnas para compatibilidad con postsService.ts
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'image',
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_stories_views_count ON public.stories(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_location ON public.stories(location) WHERE location IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.stories.description IS 'Descripción del story (compatibilidad con código existente)';
COMMENT ON COLUMN public.stories.content_type IS 'Tipo de contenido (compatibilidad con código existente)';
COMMENT ON COLUMN public.stories.media_urls IS 'Array de URLs de media (compatibilidad con código existente)';
COMMENT ON COLUMN public.stories.location IS 'Ubicación del story (compatibilidad con código existente)';
COMMENT ON COLUMN public.stories.views_count IS 'Contador de vistas del story (compatibilidad con código existente)';
COMMENT ON COLUMN public.stories.updated_at IS 'Fecha de última actualización (compatibilidad con código existente)';
