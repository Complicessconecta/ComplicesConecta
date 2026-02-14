/*
 * Migración: Crear tabla user_consents para ConsentGuard
 * Fecha: 7 Diciembre 2025
 * Propósito: Registrar consentimientos informados con evidencia legal
 */
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Información del consentimiento
  consent_type VARCHAR(100) NOT NULL,
  consent_version VARCHAR(20) DEFAULT '1.0',
  description TEXT,
  
  -- Evidencia legal
  consent_hash VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Estado
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  revoked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_status ON user_consents(status);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON user_consents(created_at DESC);
-- RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_consents_view_own" ON user_consents
  FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "user_consents_insert_own" ON user_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_consents_update_own" ON user_consents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_consents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER user_consents_update_timestamp
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_consents_timestamp();
-- Tabla: consent_evidence
-- Descripción: Almacena evidencia detallada de consentimientos
CREATE TABLE IF NOT EXISTS consent_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID NOT NULL REFERENCES user_consents(id) ON DELETE CASCADE,
  
  -- Evidencia
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('SCREENSHOT', 'SIGNATURE', 'TIMESTAMP', 'IP_LOG', 'DEVICE_INFO')),
  evidence_data JSONB,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_consent_evidence_consent_id ON consent_evidence(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_evidence_type ON consent_evidence(evidence_type);
-- RLS
ALTER TABLE consent_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_evidence_view_own" ON consent_evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_consents 
      WHERE id = consent_id 
      AND user_id = auth.uid()
    )
  );
-- Comentarios
COMMENT ON TABLE user_consents IS 'Almacena consentimientos informados con evidencia legal completa (IP, timestamp, hash)';
COMMENT ON TABLE consent_evidence IS 'Almacena evidencia detallada de consentimientos para cumplimiento legal';
COMMENT ON COLUMN user_consents.consent_hash IS 'Hash SHA-256 del contenido del consentimiento';
COMMENT ON COLUMN user_consents.ip_address IS 'IP del usuario al momento del consentimiento';
COMMENT ON COLUMN consent_evidence.evidence_data IS 'Datos JSONB de la evidencia (screenshot, firma, etc.)';
