-- ============================================================================
-- Permanent Bans Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla permanent_bans
-- ============================================================================

-- Crear tabla permanent_bans
CREATE TABLE IF NOT EXISTS public.permanent_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combined_hash TEXT NOT NULL UNIQUE,
  user_id UUID,
  ban_reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  banned_by UUID,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID,
  lift_reason TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_permanent_bans_combined_hash ON public.permanent_bans(combined_hash);
CREATE INDEX IF NOT EXISTS idx_permanent_bans_user_id ON public.permanent_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_permanent_bans_banned_at ON public.permanent_bans(banned_at);

-- Crear índice para lifted_at solo si la columna existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'permanent_bans' 
    AND column_name = 'lifted_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_permanent_bans_lifted_at ON public.permanent_bans(lifted_at);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.permanent_bans ENABLE ROW LEVEL SECURITY;

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

  -- Política para que los usuarios puedan ver sus propios baneos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'permanent_bans' AND policyname = 'users_can_view_own_bans'
  ) THEN
    CREATE POLICY users_can_view_own_bans ON public.permanent_bans
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Política para que los admins puedan ver todos los baneos (solo si user_role existe)
  IF user_role_exists AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'permanent_bans' AND policyname = 'admins_can_view_all_bans'
  ) THEN
    CREATE POLICY admins_can_view_all_bans ON public.permanent_bans
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );
  END IF;

  -- Política para que los admins puedan insertar baneos (solo si user_role existe)
  IF user_role_exists AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'permanent_bans' AND policyname = 'admins_can_insert_bans'
  ) THEN
    CREATE POLICY admins_can_insert_bans ON public.permanent_bans
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );
  END IF;

  -- Política para que los admins puedan actualizar baneos (solo si user_role existe)
  IF user_role_exists AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'permanent_bans' AND policyname = 'admins_can_update_bans'
  ) THEN
    CREATE POLICY admins_can_update_bans ON public.permanent_bans
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND user_role = 'admin'
      )
    );
  END IF;

  RAISE NOTICE '✅ Políticas RLS para permanent_bans creadas';
END $$;

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_permanent_bans_updated_at()
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
    WHERE tgname = 'trigger_update_permanent_bans_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_permanent_bans_updated_at
    BEFORE UPDATE ON public.permanent_bans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_permanent_bans_updated_at();
    
    RAISE NOTICE '✅ Trigger para updated_at en permanent_bans creado';
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE public.permanent_bans IS 'Baneos permanentes de usuarios por huella digital';

-- Notificación final
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla permanent_bans creada exitosamente';
END $$;
