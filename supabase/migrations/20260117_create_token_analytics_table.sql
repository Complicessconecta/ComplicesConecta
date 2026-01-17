-- ============================================================================
-- Token Analytics Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla token_analytics para TokenAnalyticsService
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.token_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_cmpx_supply NUMERIC NOT NULL,
  total_gtk_supply NUMERIC NOT NULL,
  circulating_cmpx NUMERIC NOT NULL,
  circulating_gtk NUMERIC NOT NULL,
  transaction_count INTEGER NOT NULL,
  transaction_volume_cmpx NUMERIC NOT NULL,
  transaction_volume_gtk NUMERIC NOT NULL,
  total_staked_cmpx NUMERIC NOT NULL,
  active_stakers INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_token_analytics_period_type ON public.token_analytics(period_type);
CREATE INDEX IF NOT EXISTS idx_token_analytics_period_start ON public.token_analytics(period_start);
CREATE INDEX IF NOT EXISTS idx_token_analytics_period_end ON public.token_analytics(period_end);

-- Habilitar RLS
ALTER TABLE public.token_analytics ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY anyone_can_view_token_analytics ON public.token_analytics
FOR SELECT
USING (true);

CREATE POLICY authenticated_users_can_insert_token_analytics ON public.token_analytics
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY authenticated_users_can_update_token_analytics ON public.token_analytics
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_token_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_analytics_updated_at
BEFORE UPDATE ON public.token_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_token_analytics_updated_at();

-- Comentarios
COMMENT ON TABLE public.token_analytics IS 'Analítica de tokens CMPX/GTK';
