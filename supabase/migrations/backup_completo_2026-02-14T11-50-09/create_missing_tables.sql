-- Crear tablas y columnas faltantes para CómplicesConecta
-- Ejecutar: docker exec -i supabase_db_conecta-social-comunidad-main psql -U postgres -d postgres -f supabase/migrations/create_missing_tables.sql

-- 1. Tabla moderator_sessions
CREATE TABLE IF NOT EXISTS moderator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  reports_reviewed INTEGER NOT NULL DEFAULT 0,
  actions_taken INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes para moderator_sessions
CREATE INDEX IF NOT EXISTS idx_moderator_sessions_moderator_id ON moderator_sessions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderator_sessions_is_active ON moderator_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_moderator_sessions_session_start ON moderator_sessions(session_start DESC);

-- 2. Tabla user_device_tokens
CREATE TABLE IF NOT EXISTS user_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  provider TEXT NOT NULL DEFAULT 'onesignal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Indexes para user_device_tokens
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_is_active ON user_device_tokens(is_active);

-- 3. Tabla stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  content_url TEXT,
  location TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  views_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes para stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_is_public ON stories(is_public);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- 4. Tabla invitation_statistics
CREATE TABLE IF NOT EXISTS invitation_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_invitations INTEGER NOT NULL DEFAULT 0,
  pending_invitations INTEGER NOT NULL DEFAULT 0,
  accepted_invitations INTEGER NOT NULL DEFAULT 0,
  declined_invitations INTEGER NOT NULL DEFAULT 0,
  expired_invitations INTEGER NOT NULL DEFAULT 0,
  acceptance_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes para invitation_statistics
CREATE INDEX IF NOT EXISTS idx_invitation_statistics_user_id ON invitation_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_statistics_period ON invitation_statistics(period_start, period_end);

-- 5. Tabla user_token_balances
CREATE TABLE IF NOT EXISTS user_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cmpx_balance DECIMAL(18,8) NOT NULL DEFAULT 0,
  gtk_balance DECIMAL(18,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes para user_token_balances
CREATE INDEX IF NOT EXISTS idx_user_token_balances_user_id ON user_token_balances(user_id);

-- 6. Tabla token_transactions
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  balance_after DECIMAL(18,8) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes para token_transactions
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_token_type ON token_transactions(token_type);

-- 7. Agregar columnas type y status a invitations
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Habilitar RLS para todas las tablas nuevas
ALTER TABLE moderator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar según necesidades de seguridad)
-- moderator_sessions
CREATE POLICY "Users can view their own moderator sessions" ON moderator_sessions
  FOR SELECT USING (auth.uid() = moderator_id);

CREATE POLICY "Users can insert their own moderator sessions" ON moderator_sessions
  FOR INSERT WITH CHECK (auth.uid() = moderator_id);

CREATE POLICY "Users can update their own moderator sessions" ON moderator_sessions
  FOR UPDATE USING (auth.uid() = moderator_id);

-- user_device_tokens
CREATE POLICY "Users can view their own device tokens" ON user_device_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device tokens" ON user_device_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens" ON user_device_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device tokens" ON user_device_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- stories
CREATE POLICY "Users can view public stories" ON stories
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- invitation_statistics
CREATE POLICY "Users can view their own invitation statistics" ON invitation_statistics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invitation statistics" ON invitation_statistics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invitation statistics" ON invitation_statistics
  FOR UPDATE USING (auth.uid() = user_id);

-- user_token_balances
CREATE POLICY "Users can view their own token balances" ON user_token_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token balances" ON user_token_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own token balances" ON user_token_balances
  FOR UPDATE USING (auth.uid() = user_id);

-- token_transactions
CREATE POLICY "Users can view their own token transactions" ON token_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token transactions" ON token_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
