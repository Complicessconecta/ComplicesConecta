-- ============================================================================
-- User Themes Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla user_themes
-- ============================================================================

-- Crear tabla user_themes
CREATE TABLE IF NOT EXISTS public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme_name TEXT DEFAULT 'default',
  bg_url TEXT,
  primary_color TEXT DEFAULT '#8b5cf6',
  secondary_color TEXT DEFAULT '#6366f1',
  text_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON public.user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_themes_theme_name ON public.user_themes(theme_name);

-- Habilitar RLS
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DO $$
BEGIN
  -- Política para que los usuarios puedan ver sus propios temas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_themes' AND policyname = 'users_can_view_own_themes'
  ) THEN
    CREATE POLICY users_can_view_own_themes ON public.user_themes
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los usuarios puedan insertar sus propios temas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_themes' AND policyname = 'users_can_insert_own_themes'
  ) THEN
    CREATE POLICY users_can_insert_own_themes ON public.user_themes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Política para que los usuarios puedan actualizar sus propios temas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_themes' AND policyname = 'users_can_update_own_themes'
  ) THEN
    CREATE POLICY users_can_update_own_themes ON public.user_themes
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los admins puedan ver todos los temas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_themes' AND policyname = 'admins_can_view_all_themes'
  ) THEN
    CREATE POLICY admins_can_view_all_themes ON public.user_themes
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );
  END IF;

  RAISE NOTICE '✅ Políticas RLS para user_themes creadas';
END $$;

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_user_themes_updated_at()
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
    WHERE tgname = 'trigger_update_user_themes_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_user_themes_updated_at
    BEFORE UPDATE ON public.user_themes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_themes_updated_at();
    
    RAISE NOTICE '✅ Trigger para updated_at en user_themes creado';
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE public.user_themes IS 'Temas personalizados de usuarios';
COMMENT ON COLUMN public.user_themes.user_id IS 'ID del usuario';
COMMENT ON COLUMN public.user_themes.theme_name IS 'Nombre del tema';
COMMENT ON COLUMN public.user_themes.bg_url IS 'URL de imagen de fondo';
COMMENT ON COLUMN public.user_themes.primary_color IS 'Color primario del tema';
COMMENT ON COLUMN public.user_themes.secondary_color IS 'Color secundario del tema';
COMMENT ON COLUMN public.user_themes.text_color IS 'Color de texto del tema';

RAISE NOTICE '✅ Tabla user_themes creada exitosamente';
