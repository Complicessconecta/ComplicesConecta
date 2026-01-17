-- ============================================================================
-- User Suspensions Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla user_suspensions para ModeratorDashboard
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  suspended_by UUID NOT NULL,
  reason TEXT NOT NULL,
  suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID,
  lift_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_id ON public.user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_suspended_by ON public.user_suspensions(suspended_by);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_suspended_at ON public.user_suspensions(suspended_at);

-- Habilitar RLS
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY moderators_can_view_user_suspensions ON public.user_suspensions
FOR SELECT
USING (true);

CREATE POLICY authenticated_users_can_insert_user_suspensions ON public.user_suspensions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY authenticated_users_can_update_user_suspensions ON public.user_suspensions
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_user_suspensions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_suspensions_updated_at
BEFORE UPDATE ON public.user_suspensions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_suspensions_updated_at();

-- Comentarios
COMMENT ON TABLE public.user_suspensions IS 'Suspensiones de usuarios';
