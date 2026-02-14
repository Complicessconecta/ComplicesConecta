-- Crear tabla gallery_unlocks para almacenar desbloqueos de galería
-- Esta tabla es necesaria para el funcionamiento de ImageGallery.tsx

CREATE TABLE IF NOT EXISTS public.gallery_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT CHECK (reason IN ('match', 'premium', 'admin', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_profile_id ON public.gallery_unlocks(profile_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_target_profile_id ON public.gallery_unlocks(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_unlocked_at ON public.gallery_unlocks(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_is_active ON public.gallery_unlocks(is_active);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.gallery_unlocks IS 'Desbloqueos de galería entre usuarios';
COMMENT ON COLUMN public.gallery_unlocks.profile_id IS 'ID del perfil que desbloqueó la galería';
COMMENT ON COLUMN public.gallery_unlocks.target_profile_id IS 'ID del perfil cuya galería fue desbloqueada';
COMMENT ON COLUMN public.gallery_unlocks.unlocked_at IS 'Fecha y hora del desbloqueo';
COMMENT ON COLUMN public.gallery_unlocks.reason IS 'Razón del desbloqueo (match, premium, admin, other)';
COMMENT ON COLUMN public.gallery_unlocks.is_active IS 'Indica si el desbloqueo está activo';
COMMENT ON COLUMN public.gallery_unlocks.expires_at IS 'Fecha y hora de expiración del desbloqueo';
COMMENT ON COLUMN public.gallery_unlocks.metadata IS 'Metadatos adicionales del desbloqueo';

-- Habilitar RLS
ALTER TABLE public.gallery_unlocks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver sus desbloqueos de galería"
  ON public.gallery_unlocks FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Usuarios pueden ver desbloqueos de su galería"
  ON public.gallery_unlocks FOR SELECT
  USING (target_profile_id = auth.uid());

CREATE POLICY "Usuarios pueden crear desbloqueos de galería"
  ON public.gallery_unlocks FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus desbloqueos de galería"
  ON public.gallery_unlocks FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus desbloqueos de galería"
  ON public.gallery_unlocks FOR DELETE
  USING (profile_id = auth.uid());
