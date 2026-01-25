-- Crear tabla de contactos de confianza para Safe Arrival
-- Fase 1: Fundamentos de Base de Datos

CREATE TABLE IF NOT EXISTS trust_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_trust_contacts_user_id ON trust_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_contacts_priority ON trust_contacts(priority);

-- RLS
ALTER TABLE trust_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trust contacts"
  ON trust_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trust contacts"
  ON trust_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trust contacts"
  ON trust_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trust contacts"
  ON trust_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_trust_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_contacts_updated_at_trigger
  BEFORE UPDATE ON trust_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_contacts_updated_at();

-- Comentario
COMMENT ON TABLE trust_contacts IS 'Contactos de confianza de usuarios para notificaciones Safe Arrival';
COMMENT ON COLUMN trust_contacts.priority IS 'Prioridad de contacto: 1 (alta), 2 (media), 3 (baja)';
COMMENT ON COLUMN trust_contacts.relationship IS 'Relación con el usuario: amigo, familiar, pareja, etc.';
