-- Crear tabla worldid_rewards para almacenar recompensas de WorldID
-- Esta tabla es necesaria para el funcionamiento de useWorldID.ts

CREATE TABLE IF NOT EXISTS public.worldid_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('badge', 'token', 'feature', 'discount')),
  reward_value TEXT NOT NULL,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_worldid_rewards_user_id ON public.worldid_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_worldid_rewards_reward_type ON public.worldid_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_worldid_rewards_is_claimed ON public.worldid_rewards(is_claimed);
CREATE INDEX IF NOT EXISTS idx_worldid_rewards_expires_at ON public.worldid_rewards(expires_at);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.worldid_rewards IS 'Recompensas de WorldID para los usuarios';
COMMENT ON COLUMN public.worldid_rewards.user_id IS 'ID del usuario';
COMMENT ON COLUMN public.worldid_rewards.reward_type IS 'Tipo de recompensa (badge, token, feature, discount)';
COMMENT ON COLUMN public.worldid_rewards.reward_value IS 'Valor de la recompensa';
COMMENT ON COLUMN public.worldid_rewards.is_claimed IS 'Indica si la recompensa fue reclamada';
COMMENT ON COLUMN public.worldid_rewards.claimed_at IS 'Fecha y hora de reclamación';
COMMENT ON COLUMN public.worldid_rewards.expires_at IS 'Fecha y hora de expiración';
COMMENT ON COLUMN public.worldid_rewards.metadata IS 'Metadatos adicionales de la recompensa';

-- Habilitar RLS
ALTER TABLE public.worldid_rewards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver sus propias recompensas"
  ON public.worldid_rewards FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden crear sus propias recompensas"
  ON public.worldid_rewards FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus propias recompensas"
  ON public.worldid_rewards FOR UPDATE
  USING (user_id = auth.uid());
