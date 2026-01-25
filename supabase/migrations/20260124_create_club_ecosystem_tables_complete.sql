-- ============================================
-- Ecosistema de Clubes - Tablas SQL Completas
-- Ejecutar en SQL Editor de Supabase
-- Fase 1: Fundamentos de Base de Datos
-- ============================================

-- 1. Tabla wallet_balances
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

-- Índices wallet_balances
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_cmpx ON wallet_balances(cmpx_balance);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_gtk ON wallet_balances(gtk_balance);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_last_sync ON wallet_balances(last_sync);

-- RLS wallet_balances
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

-- Trigger wallet_balances
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

-- 2. Tabla reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_hash TEXT UNIQUE NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency TEXT DEFAULT 'usd' CHECK (currency IN ('usd', 'cmpx', 'gtk')),
  payment_method TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'cmpx', 'gtk')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'used', 'expired', 'cancelled')),
  access_type TEXT DEFAULT 'general' CHECK (access_type IN ('general', 'vip')),
  commission_amount DECIMAL(18, 2) DEFAULT 0,
  commission_paid BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id TEXT,
  check_in_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices reservations
CREATE INDEX IF NOT EXISTS idx_reservations_club_id ON reservations(club_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_qr_hash ON reservations(qr_hash);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at);

-- RLS reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Clubs can view their reservations" ON reservations;
CREATE POLICY "Clubs can view their reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE id = club_id
    )
  );

DROP POLICY IF EXISTS "System can insert reservations" ON reservations;
CREATE POLICY "System can insert reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update reservations" ON reservations;
CREATE POLICY "System can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  WITH CHECK (true);

-- Trigger reservations
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reservations_updated_at_trigger ON reservations;
CREATE TRIGGER update_reservations_updated_at_trigger
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

-- 3. Actualización de tabla clubs
-- Agregar campos para monetización y ranking
DO $$
BEGIN
  -- Agregar columnas si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'membership_tier'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'premium'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'bayesian_score'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN bayesian_score FLOAT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'total_reviews'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN total_reviews INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN average_rating FLOAT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'total_revenue_cmpx'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN total_revenue_cmpx DECIMAL(18, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'total_revenue_usd'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN total_revenue_usd DECIMAL(18, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN stripe_account_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'vibe_status'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN vibe_status TEXT DEFAULT 'unknown' CHECK (vibe_status IN ('unknown', 'hot', 'chill', 'packed', 'quiet'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'vibe_status_updated_at'
  ) THEN
    ALTER TABLE clubs
      ADD COLUMN vibe_status_updated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Índices clubs
CREATE INDEX IF NOT EXISTS idx_clubs_bayesian_score ON clubs(bayesian_score DESC);
CREATE INDEX IF NOT EXISTS idx_clubs_tier ON clubs(membership_tier);
CREATE INDEX IF NOT EXISTS idx_clubs_rating ON clubs(average_rating DESC);

-- 4. Tabla token_transactions
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'transfer', 'stake', 'unstake', 'reward')),
  amount DECIMAL(18, 2) NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('cmpx', 'gtk')),
  balance_after DECIMAL(18, 2) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices token_transactions
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_token_type ON token_transactions(token_type);

-- RLS token_transactions
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON token_transactions;
CREATE POLICY "Users can view own transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Tabla club_ratings
CREATE TABLE IF NOT EXISTS club_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Índices club_ratings
CREATE INDEX IF NOT EXISTS idx_club_ratings_club_id ON club_ratings(club_id);
CREATE INDEX IF NOT EXISTS idx_club_ratings_user_id ON club_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_club_ratings_rating ON club_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_club_ratings_created_at ON club_ratings(created_at);

-- RLS club_ratings
ALTER TABLE club_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all ratings" ON club_ratings;
CREATE POLICY "Users can view all ratings"
  ON club_ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create ratings" ON club_ratings;
CREATE POLICY "Authenticated users can create ratings"
  ON club_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON club_ratings;
CREATE POLICY "Users can update own ratings"
  ON club_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger club_ratings
CREATE OR REPLACE FUNCTION update_club_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating FLOAT;
  total_reviews INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT
      AVG(rating)::FLOAT,
      COUNT(*)
    INTO avg_rating, total_reviews
    FROM club_ratings
    WHERE club_id = NEW.club_id;

    UPDATE clubs
    SET
      average_rating = COALESCE(avg_rating, 0),
      total_reviews = total_reviews
    WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT
      AVG(rating)::FLOAT,
      COUNT(*)
    INTO avg_rating, total_reviews
    FROM club_ratings
    WHERE club_id = OLD.club_id;

    UPDATE clubs
    SET
      average_rating = COALESCE(avg_rating, 0),
      total_reviews = total_reviews
    WHERE id = OLD.club_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_club_rating_stats_trigger ON club_ratings;
CREATE TRIGGER update_club_rating_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON club_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_club_rating_stats();

-- 6. Tabla trust_contacts
CREATE TABLE IF NOT EXISTS trust_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices trust_contacts
CREATE INDEX IF NOT EXISTS idx_trust_contacts_user_id ON trust_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_contacts_priority ON trust_contacts(priority);

-- RLS trust_contacts
ALTER TABLE trust_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trust contacts" ON trust_contacts;
CREATE POLICY "Users can view own trust contacts"
  ON trust_contacts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trust contacts" ON trust_contacts;
CREATE POLICY "Users can insert own trust contacts"
  ON trust_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trust contacts" ON trust_contacts;
CREATE POLICY "Users can update own trust contacts"
  ON trust_contacts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trust contacts" ON trust_contacts;
CREATE POLICY "Users can delete own trust contacts"
  ON trust_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger trust_contacts
CREATE OR REPLACE FUNCTION update_trust_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trust_contacts_updated_at_trigger ON trust_contacts;
CREATE TRIGGER update_trust_contacts_updated_at_trigger
  BEFORE UPDATE ON trust_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_contacts_updated_at();

-- Comentarios
COMMENT ON TABLE wallet_balances IS 'Almacena balances de tokens CMPX y GTK para cada usuario';
COMMENT ON TABLE reservations IS 'Almacena reservas de usuarios a club con código QR para check-in';
COMMENT ON TABLE token_transactions IS 'Historial de todas las transacciones de tokens CMPX y GTK';
COMMENT ON TABLE club_ratings IS 'Calificaciones de usuarios a club (1-5 estrellas)';
COMMENT ON TABLE trust_contacts IS 'Contactos de confianza de usuarios para notificaciones Safe Arrival';
