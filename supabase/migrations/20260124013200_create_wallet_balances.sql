-- Crear tabla de balances de billetera para tokens CMPX y GTK
-- Fase 1: Fundamentos de Base de Datos

CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cmpx_balance DECIMAL(18, 2) DEFAULT 0,
  gtk_balance DECIMAL(18, 2) DEFAULT 0,
  cmpx_locked DECIMAL(18, 2) DEFAULT 0,
  gtk_locked DECIMAL(18, 2) DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_cmpx ON wallet_balances(cmpx_balance);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_gtk ON wallet_balances(gtk_balance);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_last_sync ON wallet_balances(last_sync);

-- RLS: Solo el usuario puede ver su propio balance
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON wallet_balances;
CREATE POLICY "Users can view own wallet"
  ON wallet_balances FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet" ON wallet_balances;
CREATE POLICY "Users can update own wallet"
  ON wallet_balances FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update wallet" ON wallet_balances;
CREATE POLICY "System can update wallet"
  ON wallet_balances FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_wallet_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wallet_balances_updated_at_trigger ON wallet_balances;
CREATE TRIGGER update_wallet_balances_updated_at_trigger
  BEFORE UPDATE ON wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balances_updated_at();

-- Comentario
COMMENT ON TABLE wallet_balances IS 'Almacena balances de tokens CMPX y GTK para cada usuario';
COMMENT ON COLUMN wallet_balances.cmpx_balance IS 'Balance de tokens CMPX (consumo interno)';
COMMENT ON COLUMN wallet_balances.gtk_balance IS 'Balance de tokens GTK (blockchain)';
COMMENT ON COLUMN wallet_balances.cmpx_locked IS 'Tokens CMPX bloqueados en transacciones pendientes';
COMMENT ON COLUMN wallet_balances.gtk_locked IS 'Tokens GTK bloqueados en staking';
