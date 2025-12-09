/*
 * Migración: Corregir índices duplicados
 * Fecha: 7 Diciembre 2025
 * Propósito: Agregar IF NOT EXISTS a todos los índices para evitar conflictos
 * Nota: Esta migración es idempotente y puede ejecutarse múltiples veces sin error
 */

-- Índices para couple_agreements (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couple_agreements') THEN
    CREATE INDEX IF NOT EXISTS idx_couple_agreements_couple_id ON couple_agreements(couple_id);
    CREATE INDEX IF NOT EXISTS idx_couple_agreements_status ON couple_agreements(status);
    CREATE INDEX IF NOT EXISTS idx_couple_agreements_created_at ON couple_agreements(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_couple_agreements_dispute_deadline ON couple_agreements(dispute_deadline);
  END IF;
END $$;

-- Índices para couple_disputes (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couple_disputes') THEN
    CREATE INDEX IF NOT EXISTS idx_couple_disputes_agreement_id ON couple_disputes(agreement_id);
    CREATE INDEX IF NOT EXISTS idx_couple_disputes_couple_id ON couple_disputes(couple_id);
    CREATE INDEX IF NOT EXISTS idx_couple_disputes_status ON couple_disputes(status);
  END IF;
END $$;

-- Índices para frozen_assets (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'frozen_assets') THEN
    CREATE INDEX IF NOT EXISTS idx_frozen_assets_couple_id ON frozen_assets(couple_id);
    CREATE INDEX IF NOT EXISTS idx_frozen_assets_dispute_id ON frozen_assets(dispute_id);
    CREATE INDEX IF NOT EXISTS idx_frozen_assets_status ON frozen_assets(status);
  END IF;
END $$;

-- Índices para user_consents (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
    CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON user_consents(consent_type);
    CREATE INDEX IF NOT EXISTS idx_user_consents_status ON user_consents(status);
    CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON user_consents(created_at DESC);
  END IF;
END $$;

-- Índices para consent_evidence (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consent_evidence') THEN
    CREATE INDEX IF NOT EXISTS idx_consent_evidence_consent_id ON consent_evidence(consent_id);
    CREATE INDEX IF NOT EXISTS idx_consent_evidence_type ON consent_evidence(evidence_type);
  END IF;
END $$;
