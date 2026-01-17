-- ============================================================================
-- Security Tables Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tablas security y security_audit_logs
-- ============================================================================

-- Crear tabla security
CREATE TABLE IF NOT EXISTS public.security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address TEXT,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_security_user_id ON public.security(user_id);
CREATE INDEX IF NOT EXISTS idx_security_event_type ON public.security(event_type);
CREATE INDEX IF NOT EXISTS idx_security_created_at ON public.security(created_at);
CREATE INDEX IF NOT EXISTS idx_security_ip_address ON public.security(ip_address);

-- Habilitar RLS
ALTER TABLE public.security ENABLE ROW LEVEL SECURITY;

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

  -- Política para que los usuarios puedan ver sus propios eventos de seguridad
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'security' AND policyname = 'users_can_view_own_security_events'
  ) THEN
    CREATE POLICY users_can_view_own_security_events ON public.security
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los usuarios puedan insertar sus propios eventos de seguridad
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'security' AND policyname = 'users_can_insert_own_security_events'
  ) THEN
    CREATE POLICY users_can_insert_own_security_events ON public.security
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Política para que los admins puedan ver todos los eventos de seguridad (solo si user_role existe)
  IF user_role_exists AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'security' AND policyname = 'admins_can_view_all_security_events'
  ) THEN
    CREATE POLICY admins_can_view_all_security_events ON public.security
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );
  END IF;

  RAISE NOTICE '✅ Políticas RLS para security creadas';
END $$;

-- Crear tabla security_audit_logs
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON public.security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);

-- Crear índice para resource_type y resource_id solo si las columnas existen
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'security_audit_logs' 
    AND column_name IN ('resource_type', 'resource_id')
    GROUP BY table_name
    HAVING COUNT(*) = 2
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_security_audit_logs_resource ON public.security_audit_logs(resource_type, resource_id);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

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

  -- Política para que los usuarios puedan ver sus propios logs de auditoría
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'security_audit_logs' AND policyname = 'users_can_view_own_audit_logs'
  ) THEN
    CREATE POLICY users_can_view_own_audit_logs ON public.security_audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los admins puedan ver todos los logs de auditoría (solo si user_role existe)
  IF user_role_exists AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'security_audit_logs' AND policyname = 'admins_can_view_all_audit_logs'
  ) THEN
    CREATE POLICY admins_can_view_all_audit_logs ON public.security_audit_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );
  END IF;

  -- Política para insertar logs de auditoría (sistema)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'security_audit_logs' AND policyname = 'system_can_insert_audit_logs'
  ) THEN
    CREATE POLICY system_can_insert_audit_logs ON public.security_audit_logs
    FOR INSERT
    WITH CHECK (true);
  END IF;

  RAISE NOTICE '✅ Políticas RLS para security_audit_logs creadas';
END $$;

-- Crear trigger para updated_at automático en security
CREATE OR REPLACE FUNCTION public.update_security_updated_at()
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
    WHERE tgname = 'trigger_update_security_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_security_updated_at
    BEFORE UPDATE ON public.security
    FOR EACH ROW
    EXECUTE FUNCTION public.update_security_updated_at();
    
    RAISE NOTICE '✅ Trigger para updated_at en security creado';
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE public.security IS 'Eventos de seguridad de usuarios';
COMMENT ON TABLE public.security_audit_logs IS 'Logs de auditoría de seguridad';

-- Notificación final
DO $$
BEGIN
  RAISE NOTICE '✅ Tablas security y security_audit_logs creadas exitosamente';
END $$;
