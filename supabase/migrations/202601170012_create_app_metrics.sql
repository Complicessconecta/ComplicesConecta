-- Crear tabla app_metrics para métricas de la aplicación
CREATE TABLE IF NOT EXISTS app_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
  tags JSONB DEFAULT '{}'::JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_app_metrics_user_id ON app_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_app_metrics_metric_name ON app_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_app_metrics_timestamp ON app_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_app_metrics_user_metric_timestamp ON app_metrics(user_id, metric_name, timestamp);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_app_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_app_metrics_updated_at
  BEFORE UPDATE ON app_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_app_metrics_updated_at();

-- Crear políticas RLS
ALTER TABLE app_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_app_metrics"
  ON app_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_app_metrics"
  ON app_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_app_metrics"
  ON app_metrics FOR UPDATE
  USING (auth.uid() = user_id);
