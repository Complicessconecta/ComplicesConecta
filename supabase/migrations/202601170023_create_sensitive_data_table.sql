-- ============================================================================
-- Sensitive Data Table Setup - Segregación de Datos
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla para segregación de datos sensibles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sensitive_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data_type TEXT NOT NULL, -- Tipo de dato: 'phone', 'address', 'ssn', 'world_id', 'biometric'
  sensitivity_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  encrypted_value TEXT NOT NULL, -- Valor encriptado
  encryption_key_id TEXT, -- ID de la clave de encriptación
  access_log JSONB DEFAULT '[]', -- Log de accesos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Fecha de expiración del dato
  is_active BOOLEAN DEFAULT TRUE
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_sensitive_data_user_id ON public.sensitive_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_data_type ON public.sensitive_data(data_type);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_sensitivity_level ON public.sensitive_data(sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_is_active ON public.sensitive_data(is_active);

-- Habilitar RLS
ALTER TABLE public.sensitive_data ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sensitive_data' AND policyname = 'users_can_view_own_sensitive_data'
  ) THEN
    CREATE POLICY users_can_view_own_sensitive_data ON public.sensitive_data
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sensitive_data' AND policyname = 'users_can_insert_own_sensitive_data'
  ) THEN
    CREATE POLICY users_can_insert_own_sensitive_data ON public.sensitive_data
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sensitive_data' AND policyname = 'users_can_update_own_sensitive_data'
  ) THEN
    CREATE POLICY users_can_update_own_sensitive_data ON public.sensitive_data
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  -- Políticas de admin - solo si existe la columna user_role en profiles
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_role'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'sensitive_data' AND policyname = 'admins_can_view_all_sensitive_data'
    ) THEN
      CREATE POLICY admins_can_view_all_sensitive_data ON public.sensitive_data
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND user_role = 'admin'::user_role
        )
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'sensitive_data' AND policyname = 'admins_can_update_all_sensitive_data'
    ) THEN
      CREATE POLICY admins_can_update_all_sensitive_data ON public.sensitive_data
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND user_role = 'admin'::user_role
        )
      );
    END IF;
  ELSE
    RAISE NOTICE 'Columna user_role no existe en profiles - skipping admin policies for sensitive_data';
  END IF;
END $$;

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_sensitive_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sensitive_data_updated_at
BEFORE UPDATE ON public.sensitive_data
FOR EACH ROW
EXECUTE FUNCTION public.update_sensitive_data_updated_at();

-- Comentarios
COMMENT ON TABLE public.sensitive_data IS 'Datos sensibles segregados por niveles de sensibilidad';
COMMENT ON COLUMN public.sensitive_data.sensitivity_level IS 'Nivel de sensibilidad: low, medium, high, critical';
COMMENT ON COLUMN public.sensitive_data.encrypted_value IS 'Valor encriptado del dato sensible';
COMMENT ON COLUMN public.sensitive_data.access_log IS 'Log de accesos al dato sensible';
