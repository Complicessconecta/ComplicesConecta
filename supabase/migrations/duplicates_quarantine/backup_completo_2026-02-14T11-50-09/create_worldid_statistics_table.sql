-- Crear tabla worldid_statistics para almacenar estadísticas de WorldID
-- Esta tabla es necesaria para el funcionamiento de useWorldID.ts

CREATE TABLE IF NOT EXISTS public.worldid_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_level INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_verifications INTEGER DEFAULT 0,
  successful_verifications INTEGER DEFAULT 0,
  failed_verifications INTEGER DEFAULT 0,
  last_verification_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_worldid_statistics_user_id ON public.worldid_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_worldid_statistics_verification_level ON public.worldid_statistics(verification_level);
CREATE INDEX IF NOT EXISTS idx_worldid_statistics_verified_at ON public.worldid_statistics(verified_at DESC);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.worldid_statistics IS 'Estadísticas de verificación WorldID de los usuarios';
COMMENT ON COLUMN public.worldid_statistics.user_id IS 'ID del usuario';
COMMENT ON COLUMN public.worldid_statistics.verification_level IS 'Nivel de verificación del usuario';
COMMENT ON COLUMN public.worldid_statistics.verified_at IS 'Fecha y hora de verificación';
COMMENT ON COLUMN public.worldid_statistics.total_verifications IS 'Total de verificaciones realizadas';
COMMENT ON COLUMN public.worldid_statistics.successful_verifications IS 'Total de verificaciones exitosas';
COMMENT ON COLUMN public.worldid_statistics.failed_verifications IS 'Total de verificaciones fallidas';
COMMENT ON COLUMN public.worldid_statistics.last_verification_at IS 'Fecha y hora de la última verificación';
COMMENT ON COLUMN public.worldid_statistics.metadata IS 'Metadatos adicionales de las estadísticas';

-- Habilitar RLS
ALTER TABLE public.worldid_statistics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver sus propias estadísticas"
  ON public.worldid_statistics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden crear sus propias estadísticas"
  ON public.worldid_statistics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus propias estadísticas"
  ON public.worldid_statistics FOR UPDATE
  USING (user_id = auth.uid());
