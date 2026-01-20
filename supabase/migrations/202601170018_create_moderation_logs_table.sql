-- ============================================================================
-- Moderation Logs Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla moderation_logs para ModeratorDashboard
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON public.moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_type ON public.moderation_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_id ON public.moderation_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON public.moderation_logs(created_at);

-- Habilitar RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY moderators_can_view_moderation_logs ON public.moderation_logs
FOR SELECT
USING (true);

CREATE POLICY authenticated_users_can_insert_moderation_logs ON public.moderation_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Comentarios
COMMENT ON TABLE public.moderation_logs IS 'Logs de acciones de moderación';
