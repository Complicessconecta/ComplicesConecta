-- Crear tabla de reservas con QR para clubes
-- Fase 1: Fundamentos de Base de Datos

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

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_reservations_club_id ON reservations(club_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_qr_hash ON reservations(qr_hash);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at);

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clubs can view their reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs WHERE id = club_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  WITH CHECK (true);

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservations_updated_at_trigger
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

-- Comentario
COMMENT ON TABLE reservations IS 'Almacena reservas de usuarios a club con código QR para check-in';
COMMENT ON COLUMN reservations.qr_hash IS 'Hash único del código QR generado para la reserva';
COMMENT ON COLUMN reservations.access_type IS 'Tipo de acceso: general o VIP';
COMMENT ON COLUMN reservations.commission_amount IS 'Monto de comisión retenido por la plataforma (20% para Free, 0% para Premium)';
COMMENT ON COLUMN reservations.check_in_at IS 'Timestamp cuando el QR fue escaneado en la entrada';
