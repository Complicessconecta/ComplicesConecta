-- ============================================================================
-- Two Factor Auth Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla two_factor_auth
-- ============================================================================

-- Crear tabla two_factor_auth
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  method TEXT NOT NULL, -- '2fa_app', 'sms', 'email'
  secret TEXT, -- Secret para TOTP (base32)
  backup_codes TEXT[], -- Códigos de respaldo
  is_enabled BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON public.two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_method ON public.two_factor_auth(method);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_is_enabled ON public.two_factor_auth(is_enabled);

-- Habilitar RLS
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DO $$
BEGIN
  -- Política para que los usuarios puedan ver sus propios datos 2FA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'two_factor_auth' AND policyname = 'users_can_view_own_2fa'
  ) THEN
    CREATE POLICY users_can_view_own_2fa ON public.two_factor_auth
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los usuarios puedan insertar sus propios datos 2FA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'two_factor_auth' AND policyname = 'users_can_insert_own_2fa'
  ) THEN
    CREATE POLICY users_can_insert_own_2fa ON public.two_factor_auth
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Política para que los usuarios puedan actualizar sus propios datos 2FA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'two_factor_auth' AND policyname = 'users_can_update_own_2fa'
  ) THEN
    CREATE POLICY users_can_update_own_2fa ON public.two_factor_auth
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los admins puedan ver todos los datos 2FA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'two_factor_auth' AND policyname = 'admins_can_view_all_2fa'
  ) THEN
    CREATE POLICY admins_can_view_all_2fa ON public.two_factor_auth
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
  END IF;

  RAISE NOTICE '✅ Políticas RLS para two_factor_auth creadas';
END $$;

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_two_factor_auth_updated_at()
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
    WHERE tgname = 'trigger_update_two_factor_auth_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_two_factor_auth_updated_at
    BEFORE UPDATE ON public.two_factor_auth
    FOR EACH ROW
    EXECUTE FUNCTION public.update_two_factor_auth_updated_at();
    
    RAISE NOTICE '✅ Trigger para updated_at en two_factor_auth creado';
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE public.two_factor_auth IS 'Configuración de autenticación de dos factores de usuarios';

DO $$
BEGIN
  RAISE NOTICE '✅ Tabla two_factor_auth creada exitosamente';
END $$;
