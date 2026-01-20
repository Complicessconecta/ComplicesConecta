-- Crear tabla two_factor_auth para autenticación de dos factores
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('2fa_app', 'sms', 'email')),
  secret TEXT,
  backup_codes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT two_factor_auth_user_id_key UNIQUE (user_id)
);

-- Crear índices
CREATE INDEX idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX idx_two_factor_auth_enabled ON two_factor_auth(is_enabled);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_two_factor_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_two_factor_auth_updated_at
  BEFORE UPDATE ON two_factor_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_two_factor_auth_updated_at();

-- Crear políticas RLS
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_2fa"
  ON two_factor_auth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_2fa"
  ON two_factor_auth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_2fa"
  ON two_factor_auth FOR UPDATE
  USING (auth.uid() = user_id);
