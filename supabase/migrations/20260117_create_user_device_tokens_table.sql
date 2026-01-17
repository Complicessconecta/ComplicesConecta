-- ============================================================================
-- User Device Tokens Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla user_device_tokens para OneSignal
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_token TEXT NOT NULL,
  device_type TEXT,
  device_os TEXT,
  device_model TEXT,
  app_version TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON public.user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_device_token ON public.user_device_tokens(device_token);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_is_active ON public.user_device_tokens(is_active);

-- Habilitar RLS
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY users_can_view_own_device_tokens ON public.user_device_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY users_can_insert_own_device_tokens ON public.user_device_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_can_update_own_device_tokens ON public.user_device_tokens
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY users_can_delete_own_device_tokens ON public.user_device_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_user_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_device_tokens_updated_at
BEFORE UPDATE ON public.user_device_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_user_device_tokens_updated_at();

-- Comentarios
COMMENT ON TABLE public.user_device_tokens IS 'Tokens de dispositivo para OneSignal';
