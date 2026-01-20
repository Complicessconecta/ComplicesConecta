-- ============================================================================
-- Summary Requests Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla summary_requests para Chat Summary Service
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.summary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_summary_requests_user_id ON public.summary_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_summary_requests_chat_id ON public.summary_requests(chat_id);
CREATE INDEX IF NOT EXISTS idx_summary_requests_status ON public.summary_requests(status);

-- Habilitar RLS
ALTER TABLE public.summary_requests ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY users_can_view_own_summary_requests ON public.summary_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY users_can_insert_own_summary_requests ON public.summary_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_can_update_own_summary_requests ON public.summary_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_summary_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_summary_requests_updated_at
BEFORE UPDATE ON public.summary_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_summary_requests_updated_at();

-- Comentarios
COMMENT ON TABLE public.summary_requests IS 'Solicitudes de resumen de chat';
