-- Crear tabla de historial de transacciones de tokens
-- Fase 1: Fundamentos de Base de Datos

CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'transfer', 'stake', 'unstake', 'reward')),
  amount DECIMAL(18, 2) NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('cmpx', 'gtk')),
  balance_after DECIMAL(18, 2) NOT NULL,
  description TEXT,
  metadata JSONB,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_token_type ON token_transactions(token_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_related_entity ON token_transactions(related_entity_type, related_entity_id);

-- RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Comentario
COMMENT ON TABLE token_transactions IS 'Historial de todas las transacciones de tokens CMPX y GTK';
COMMENT ON COLUMN token_transactions.transaction_type IS 'Tipo de transacción: earn, spend, transfer, stake, unstake, reward';
COMMENT ON COLUMN token_transactions.balance_after IS 'Balance del usuario después de la transacción';
COMMENT ON COLUMN token_transactions.related_entity_type IS 'Tipo de entidad relacionada: reservation, club, referral, etc.';
