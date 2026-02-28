-- ============================================================================
-- Images Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla images para DataPrivacyService
-- ============================================================================

-- Crear tabla images
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
DO $$
DECLARE
  user_role_exists BOOLEAN;
BEGIN
  -- Verificar si la tabla profiles tiene la columna user_role antes de crear políticas de admin
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_role'
  ) INTO user_role_exists;

  -- Política para que los usuarios puedan ver sus propias imágenes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'users_can_view_own_images'
  ) THEN
    CREATE POLICY users_can_view_own_images ON public.images
    FOR SELECT
    USING (auth.uid() = profile_id);
  END IF;

  -- Política para que los usuarios puedan insertar sus propias imágenes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'users_can_insert_own_images'
  ) THEN
    CREATE POLICY users_can_insert_own_images ON public.images
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);
  END IF;

  -- Política para que los usuarios puedan actualizar sus propias imágenes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'users_can_update_own_images'
  ) THEN
    CREATE POLICY users_can_update_own_images ON public.images
    FOR UPDATE
    USING (auth.uid() = profile_id);
  END IF;

  -- Política para que los usuarios puedan eliminar sus propias imágenes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'users_can_delete_own_images'
  ) THEN
    CREATE POLICY users_can_delete_own_images ON public.images
    FOR DELETE
    USING (auth.uid() = profile_id);
  END IF;

  -- Política para ver imágenes públicas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'users_can_view_public_images'
  ) THEN
    CREATE POLICY users_can_view_public_images ON public.images
    FOR SELECT
    USING (is_public = true);
  END IF;

  -- Política para que los admins puedan ver todas las imágenes (solo si user_role existe)
  IF user_role_exists AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'images' AND policyname = 'admins_can_view_all_images'
  ) THEN
    CREATE POLICY admins_can_view_all_images ON public.images
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );
  END IF;

  RAISE NOTICE '✅ Políticas RLS para images creadas';
END $$;

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_images_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_images_updated_at
    BEFORE UPDATE ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION public.update_images_updated_at();
    
    RAISE NOTICE '✅ Trigger para updated_at en images creado';
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE public.images IS 'Imágenes de perfil y galería de usuarios';
COMMENT ON COLUMN public.images.profile_id IS 'ID del perfil del usuario';
COMMENT ON COLUMN public.images.url IS 'URL de la imagen';
COMMENT ON COLUMN public.images.is_public IS 'Indica si la imagen es pública';

-- Notificación final
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla images creada exitosamente';
END $$;
