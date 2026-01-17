-- Crear tabla media para almacenar archivos multimedia
-- Esta tabla es necesaria para el funcionamiento de EnhancedGallery.tsx

CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  title TEXT,
  description TEXT,
  is_private BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_media_profile_id ON public.media(profile_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media(type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at DESC);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.media IS 'Archivos multimedia de los usuarios';
COMMENT ON COLUMN public.media.profile_id IS 'ID del perfil del usuario';
COMMENT ON COLUMN public.media.url IS 'URL del archivo multimedia';
COMMENT ON COLUMN public.media.type IS 'Tipo de archivo (image, video, audio)';
COMMENT ON COLUMN public.media.is_private IS 'Indica si el archivo es privado';
COMMENT ON COLUMN public.media.is_verified IS 'Indica si el archivo fue verificado';
COMMENT ON COLUMN public.media.metadata IS 'Metadatos adicionales del archivo';

-- Habilitar RLS
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver sus propios archivos multimedia"
  ON public.media FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Usuarios pueden crear sus propios archivos multimedia"
  ON public.media FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus propios archivos multimedia"
  ON public.media FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus propios archivos multimedia"
  ON public.media FOR DELETE
  USING (profile_id = auth.uid());
