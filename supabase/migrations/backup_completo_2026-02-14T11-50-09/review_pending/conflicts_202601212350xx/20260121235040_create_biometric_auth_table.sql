-- Tabla para autenticación biométrica
-- Fecha: 21 de Enero, 2026
-- Proyecto: ComplicesConetca v3.9.2

CREATE TABLE IF NOT EXISTS public.biometric_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  biometric_data TEXT NOT NULL,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_biometric_auth_user_id ON public.biometric_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_auth_device_fingerprint ON public.biometric_auth(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_biometric_auth_created_at ON public.biometric_auth(created_at DESC);

-- RLS Policies
ALTER TABLE public.biometric_auth ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'biometric_auth'
      AND policyname = 'Users can see their own biometric data'
  ) THEN
    CREATE POLICY "Users can see their own biometric data"
      ON public.biometric_auth FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'biometric_auth'
      AND policyname = 'Users can create biometric data'
  ) THEN
    CREATE POLICY "Users can create biometric data"
      ON public.biometric_auth FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
