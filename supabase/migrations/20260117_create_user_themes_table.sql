-- ============================================================================
-- User Themes Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla user_themes
-- ============================================================================

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
CREATE POLICY users_can_view_own_themes ON public.user_themes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY users_can_insert_own_themes ON public.user_themes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_can_update_own_themes ON public.user_themes
FOR UPDATE
USING (auth.uid() = user_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_user_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_themes_updated_at
BEFORE UPDATE ON public.user_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_user_themes_updated_at();

-- Comentarios
COMMENT ON TABLE public.user_themes IS 'Temas personalizados de usuarios';
