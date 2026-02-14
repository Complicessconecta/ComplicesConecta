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

-- Tolerancia a drift: si la tabla ya existía con esquema distinto, asegurar columnas opcionales.
ALTER TABLE token_transactions
  ADD COLUMN IF NOT EXISTS related_entity_type TEXT,
  ADD COLUMN IF NOT EXISTS related_entity_id UUID;

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_token_type ON token_transactions(token_type);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'token_transactions'
      AND column_name = 'related_entity_type'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'token_transactions'
      AND column_name = 'related_entity_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_token_transactions_related_entity ON token_transactions(related_entity_type, related_entity_id)';
  END IF;
END $$;

-- RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON token_transactions;
CREATE POLICY "Users can view own transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Comentario
COMMENT ON TABLE token_transactions IS 'Historial de todas las transacciones de tokens CMPX y GTK';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'token_transactions'
      AND column_name = 'transaction_type'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN token_transactions.transaction_type IS ''Tipo de transacción: earn, spend, transfer, stake, unstake, reward''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'token_transactions'
      AND column_name = 'balance_after'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN token_transactions.balance_after IS ''Balance del usuario después de la transacción''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'token_transactions'
      AND column_name = 'related_entity_type'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN token_transactions.related_entity_type IS ''Tipo de entidad relacionada: reservation, club, referral, etc.''';
  END IF;
END $$;
