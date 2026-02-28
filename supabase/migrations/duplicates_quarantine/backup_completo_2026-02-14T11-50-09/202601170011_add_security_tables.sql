-- Agregar columnas faltantes a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Crear tabla security_audit_log
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla security
CREATE TABLE IF NOT EXISTS security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT DEFAULT 'unknown',
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla security_audit_logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT DEFAULT 'security',
  details JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  risk_score NUMERIC DEFAULT 0.3
);

-- Crear índices para security_audit_log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- Crear índices para security
CREATE INDEX IF NOT EXISTS idx_security_user_id ON security(user_id);
CREATE INDEX IF NOT EXISTS idx_security_event_type ON security(event_type);
CREATE INDEX IF NOT EXISTS idx_security_created_at ON security(created_at);

-- Crear índices para security_audit_logs
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at);

-- Crear trigger para updated_at en profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Crear políticas RLS para security_audit_log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_can_view_own_security_audit_log"
  ON security_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Crear políticas RLS para security
ALTER TABLE security ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_can_view_own_security"
  ON security FOR SELECT
  USING (auth.uid() = user_id);

-- Crear políticas RLS para security_audit_logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_can_view_own_security_audit_logs"
  ON security_audit_logs FOR SELECT
  USING (auth.uid() = user_id);
