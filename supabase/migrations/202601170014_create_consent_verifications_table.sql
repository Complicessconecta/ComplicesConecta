-- ============================================================================
-- Consent Verifications Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla consent_verifications para ConsentVerificationService
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consent_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_id1 UUID NOT NULL,
  user_id2 UUID NOT NULL,
  consent_score INTEGER DEFAULT 50,
  confidence NUMERIC DEFAULT 0.5,
  status TEXT DEFAULT 'insufficient_data',
  reasoning TEXT,
  message_count INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT FALSE,
  pause_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_consent_verifications_chat_id ON public.consent_verifications(chat_id);
CREATE INDEX IF NOT EXISTS idx_consent_verifications_user_id ON public.consent_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_verifications_user_id1 ON public.consent_verifications(user_id1);
CREATE INDEX IF NOT EXISTS idx_consent_verifications_user_id2 ON public.consent_verifications(user_id2);

-- Habilitar RLS
ALTER TABLE public.consent_verifications ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY users_can_view_own_consent_verifications ON public.consent_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY users_can_insert_own_consent_verifications ON public.consent_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_can_update_own_consent_verifications ON public.consent_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_consent_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consent_verifications_updated_at
BEFORE UPDATE ON public.consent_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_consent_verifications_updated_at();

-- Comentarios
COMMENT ON TABLE public.consent_verifications IS 'Verificaciones de consentimiento para chats';
