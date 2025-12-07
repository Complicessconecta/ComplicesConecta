-- Migración: Agregar columnas faltantes a tablas existentes
-- Fecha: 7 Diciembre 2025
-- Propósito: Corregir estructura de tablas si faltan columnas

-- Agregar columnas faltantes a couple_disputes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couple_disputes') THEN
    -- Agregar agreement_id si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_disputes' AND column_name = 'agreement_id'
    ) THEN
      ALTER TABLE couple_disputes 
      ADD COLUMN agreement_id UUID REFERENCES couple_agreements(id) ON DELETE CASCADE;
      
      CREATE INDEX IF NOT EXISTS idx_couple_disputes_agreement_id ON couple_disputes(agreement_id);
    END IF;
    
    -- Agregar couple_id si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_disputes' AND column_name = 'couple_id'
    ) THEN
      ALTER TABLE couple_disputes 
      ADD COLUMN couple_id UUID REFERENCES couple_profiles(id) ON DELETE CASCADE;
      
      CREATE INDEX IF NOT EXISTS idx_couple_disputes_couple_id ON couple_disputes(couple_id);
    END IF;
  END IF;
END $$;

-- Agregar columna dispute_id a frozen_assets si no existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'frozen_assets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'frozen_assets' AND column_name = 'dispute_id'
    ) THEN
      ALTER TABLE frozen_assets 
      ADD COLUMN dispute_id UUID REFERENCES couple_disputes(id) ON DELETE SET NULL;
      
      -- Crear índice si no existe
      CREATE INDEX IF NOT EXISTS idx_frozen_assets_dispute_id ON frozen_assets(dispute_id);
    END IF;
  END IF;
END $$;

-- Verificar que todas las columnas necesarias existen en couple_agreements
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couple_agreements') THEN
    -- Agregar columnas faltantes si es necesario
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_agreements' AND column_name = 'agreement_hash'
    ) THEN
      ALTER TABLE couple_agreements 
      ADD COLUMN agreement_hash VARCHAR(64) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_agreements' AND column_name = 'death_clause_text'
    ) THEN
      ALTER TABLE couple_agreements 
      ADD COLUMN death_clause_text TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_agreements' AND column_name = 'asset_disposition_clause'
    ) THEN
      ALTER TABLE couple_agreements 
      ADD COLUMN asset_disposition_clause TEXT;
    END IF;
  END IF;
END $$;

-- Verificar que todas las columnas necesarias existen en user_consents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_consents' AND column_name = 'consent_hash'
    ) THEN
      ALTER TABLE user_consents 
      ADD COLUMN consent_hash VARCHAR(64) NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;
