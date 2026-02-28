-- Crear tabla security_logs para almacenar logs de seguridad
-- Esta tabla es necesaria para el funcionamiento de tests de seguridad

CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.security_logs IS 'Logs de eventos de seguridad';
COMMENT ON COLUMN public.security_logs.user_id IS 'ID del usuario relacionado';
COMMENT ON COLUMN public.security_logs.event_type IS 'Tipo de evento';
COMMENT ON COLUMN public.security_logs.event_name IS 'Nombre del evento';
COMMENT ON COLUMN public.security_logs.severity IS 'Severidad del evento (info, warning, error, critical)';
COMMENT ON COLUMN public.security_logs.details IS 'Detalles adicionales del evento';
COMMENT ON COLUMN public.security_logs.ip_address IS 'Dirección IP del usuario';
COMMENT ON COLUMN public.security_logs.user_agent IS 'User agent del navegador';
COMMENT ON COLUMN public.security_logs.created_at IS 'Fecha y hora del evento';

-- Habilitar RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver sus propios logs de seguridad"
  ON public.security_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sistema puede crear logs de seguridad"
  ON public.security_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema puede ver todos los logs de seguridad"
  ON public.security_logs FOR SELECT
  USING (true);
