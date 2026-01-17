-- ============================================================================
-- Images Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla images
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_images_profile_id ON public.images(profile_id);
CREATE INDEX IF NOT EXISTS idx_images_is_public ON public.images(is_public);

-- Habilitar RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY users_can_view_own_images ON public.images
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY users_can_insert_own_images ON public.images
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY users_can_update_own_images ON public.images
FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY users_can_delete_own_images ON public.images
FOR DELETE
USING (auth.uid() = profile_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_images_updated_at
BEFORE UPDATE ON public.images
FOR EACH ROW
EXECUTE FUNCTION public.update_images_updated_at();

-- Comentarios
COMMENT ON TABLE public.images IS 'Imágenes de perfil y galería de usuarios';
