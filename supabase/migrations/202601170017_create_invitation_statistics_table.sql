-- ============================================================================
-- Invitation Statistics Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla invitation_statistics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invitation_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_sent INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  total_pending INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_invitation_statistics_user_id ON public.invitation_statistics(user_id);

-- Habilitar RLS
ALTER TABLE public.invitation_statistics ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY users_can_view_own_invitation_statistics ON public.invitation_statistics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY users_can_insert_own_invitation_statistics ON public.invitation_statistics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_can_update_own_invitation_statistics ON public.invitation_statistics
FOR UPDATE
USING (auth.uid() = user_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_invitation_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invitation_statistics_updated_at
BEFORE UPDATE ON public.invitation_statistics
FOR EACH ROW
EXECUTE FUNCTION public.update_invitation_statistics_updated_at();

-- Comentarios
COMMENT ON TABLE public.invitation_statistics IS 'Estadísticas de invitaciones de usuarios';
