-- ============================================================================
-- MFA (Multi-Factor Authentication) Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla mfa_settings para autenticación de dos factores
-- ============================================================================

-- Crear tabla mfa_settings
CREATE TABLE IF NOT EXISTS public.mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_mfa_settings_user_id ON public.mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_enabled ON public.mfa_settings(enabled);

-- Habilitar RLS
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DO $$
BEGIN
  -- Política para que los usuarios puedan ver sus propios settings de MFA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'mfa_settings' AND policyname = 'users_can_view_own_mfa_settings'
  ) THEN
    CREATE POLICY users_can_view_own_mfa_settings ON public.mfa_settings
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los usuarios puedan insertar sus propios settings de MFA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'mfa_settings' AND policyname = 'users_can_insert_own_mfa_settings'
  ) THEN
    CREATE POLICY users_can_insert_own_mfa_settings ON public.mfa_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Política para que los usuarios puedan actualizar sus propios settings de MFA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'mfa_settings' AND policyname = 'users_can_update_own_mfa_settings'
  ) THEN
    CREATE POLICY users_can_update_own_mfa_settings ON public.mfa_settings
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los usuarios puedan eliminar sus propios settings de MFA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'mfa_settings' AND policyname = 'users_can_delete_own_mfa_settings'
  ) THEN
    CREATE POLICY users_can_delete_own_mfa_settings ON public.mfa_settings
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;

  RAISE NOTICE '✅ Políticas RLS para mfa_settings creadas';
END $$;

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_mfa_settings_updated_at()
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
    WHERE tgname = 'trigger_update_mfa_settings_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_mfa_settings_updated_at
    BEFORE UPDATE ON public.mfa_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_mfa_settings_updated_at();
    
    RAISE NOTICE '✅ Trigger para updated_at en mfa_settings creado';
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE public.mfa_settings IS 'Configuración de autenticación de dos factores (MFA) para usuarios';
COMMENT ON COLUMN public.mfa_settings.user_id IS 'ID del usuario al que pertene la configuración MFA';
COMMENT ON COLUMN public.mfa_settings.secret IS 'Secreto TOTP para generar códigos de autenticación';
COMMENT ON COLUMN public.mfa_settings.backup_codes IS 'Códigos de recuperación de un solo uso';
COMMENT ON COLUMN public.mfa_settings.enabled IS 'Indica si MFA está habilitado para el usuario';
COMMENT ON COLUMN public.mfa_settings.verified_at IS 'Fecha en que se verificó el código MFA por primera vez';
