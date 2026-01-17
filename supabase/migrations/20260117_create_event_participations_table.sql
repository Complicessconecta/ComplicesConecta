-- ============================================================================
-- Event Participations Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla event_participations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  participated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cmpx_rewarded INTEGER DEFAULT 0,
  co2_saved NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_event_participations_event_id ON public.event_participations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participations_user_id ON public.event_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participations_participated_at ON public.event_participations(participated_at);

-- Habilitar RLS
ALTER TABLE public.event_participations ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY users_can_view_own_participations ON public.event_participations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY users_can_insert_own_participations ON public.event_participations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_can_update_own_participations ON public.event_participations
FOR UPDATE
USING (auth.uid() = user_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_event_participations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_participations_updated_at
BEFORE UPDATE ON public.event_participations
FOR EACH ROW
EXECUTE FUNCTION public.update_event_participations_updated_at();

-- Comentarios
COMMENT ON TABLE public.event_participations IS 'Participaciones de usuarios en eventos';
