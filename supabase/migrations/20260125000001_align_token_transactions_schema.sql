-- Alinear schema de token_transactions con WalletService (ecosistema clubes)

ALTER TABLE public.token_transactions
  ADD COLUMN IF NOT EXISTS balance_after DECIMAL(18, 2),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS related_entity_type TEXT,
  ADD COLUMN IF NOT EXISTS related_entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_token_transactions_related_entity
  ON public.token_transactions(related_entity_type, related_entity_id);
