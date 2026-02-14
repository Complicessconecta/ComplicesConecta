/*
 * Migración: Crear tabla couple_agreements para CouplePreNuptialAgreement
 * Fecha: 7 Diciembre 2025
 * Propósito: Almacenar acuerdos prenupciales digitales entre parejas
 */
CREATE TABLE IF NOT EXISTS couple_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL,
  partner_1_id UUID NOT NULL,
  partner_2_id UUID NOT NULL,
  
  -- Firmas digitales
  partner_1_signature BOOLEAN DEFAULT FALSE,
  partner_2_signature BOOLEAN DEFAULT FALSE,
  partner_1_ip VARCHAR(45),
  partner_2_ip VARCHAR(45),
  partner_1_signed_at TIMESTAMP WITH TIME ZONE,
  partner_2_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Estado del acuerdo
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'DISPUTED', 'DISSOLVED', 'FORFEITED')),
  signed_at TIMESTAMP WITH TIME ZONE,
  dispute_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Contenido legal
  agreement_hash VARCHAR(64) NOT NULL,
  death_clause_text TEXT,
  asset_disposition_clause TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Restricciones
  CONSTRAINT fk_couple_id FOREIGN KEY (couple_id) REFERENCES couple_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_partner_1 FOREIGN KEY (partner_1_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_partner_2 FOREIGN KEY (partner_2_id) REFERENCES profiles(id) ON DELETE CASCADE
);
-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_couple_agreements_couple_id ON couple_agreements(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_status ON couple_agreements(status);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_created_at ON couple_agreements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_dispute_deadline ON couple_agreements(dispute_deadline);
-- RLS: Row Level Security
ALTER TABLE couple_agreements ENABLE ROW LEVEL SECURITY;
-- Política: Los partners de una pareja pueden ver sus acuerdos
DROP POLICY IF EXISTS "couple_agreements_view_own" ON couple_agreements;
CREATE POLICY "couple_agreements_view_own" ON couple_agreements
  FOR SELECT
  USING (
    auth.uid() = partner_1_id 
    OR auth.uid() = partner_2_id
    OR EXISTS (
      SELECT 1 FROM couple_profiles 
      WHERE id = couple_id 
      AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
    )
  );
-- Política: Solo los partners pueden insertar acuerdos
DROP POLICY IF EXISTS "couple_agreements_insert" ON couple_agreements;
CREATE POLICY "couple_agreements_insert" ON couple_agreements
  FOR INSERT
  WITH CHECK (
    auth.uid() = partner_1_id 
    OR auth.uid() = partner_2_id
  );
-- Política: Solo los partners pueden actualizar sus propias firmas
DROP POLICY IF EXISTS "couple_agreements_update" ON couple_agreements;
CREATE POLICY "couple_agreements_update" ON couple_agreements
  FOR UPDATE
  USING (
    auth.uid() = partner_1_id 
    OR auth.uid() = partner_2_id
  )
  WITH CHECK (
    auth.uid() = partner_1_id 
    OR auth.uid() = partner_2_id
  );
-- Trigger: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_couple_agreements_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS couple_agreements_update_timestamp ON couple_agreements;
CREATE TRIGGER couple_agreements_update_timestamp
  BEFORE UPDATE ON couple_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_couple_agreements_timestamp();
-- Trigger: Cambiar estado a ACTIVE cuando ambos firman
CREATE OR REPLACE FUNCTION check_agreement_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_1_signature = TRUE AND NEW.partner_2_signature = TRUE THEN
    NEW.status = 'ACTIVE';
    NEW.signed_at = NOW();
    NEW.dispute_deadline = NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS agreement_complete_check ON couple_agreements;
CREATE TRIGGER agreement_complete_check
  BEFORE UPDATE ON couple_agreements
  FOR EACH ROW
  EXECUTE FUNCTION check_agreement_complete();
-- Tabla: couple_disputes
-- Descripción: Registra disputas y conflictos entre partners
CREATE TABLE IF NOT EXISTS couple_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES couple_agreements(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  
  -- Información de la disputa
  initiated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED')),
  
  -- Timeline
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Auditoría
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para couple_disputes
CREATE INDEX IF NOT EXISTS idx_couple_disputes_agreement_id ON couple_disputes(agreement_id);
CREATE INDEX IF NOT EXISTS idx_couple_disputes_couple_id ON couple_disputes(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_disputes_status ON couple_disputes(status);
-- RLS para couple_disputes
ALTER TABLE couple_disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "couple_disputes_view_own" ON couple_disputes;
CREATE POLICY "couple_disputes_view_own" ON couple_disputes
  FOR SELECT
  USING (
    auth.uid() = initiated_by
    OR EXISTS (
      SELECT 1 FROM couple_profiles 
      WHERE id = couple_id 
      AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
    )
  );
-- Tabla: frozen_assets
-- Descripción: Registra activos congelados durante disputas
CREATE TABLE IF NOT EXISTS frozen_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
  dispute_id UUID REFERENCES couple_disputes(id) ON DELETE SET NULL,
  
  -- Información de activos
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('CMPX_TOKEN', 'GTK_TOKEN', 'NFT', 'OTHER')),
  asset_id VARCHAR(255),
  amount DECIMAL(18, 8),
  
  -- Estado
  status VARCHAR(50) DEFAULT 'FROZEN' CHECK (status IN ('FROZEN', 'RELEASED', 'FORFEITED')),
  frozen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  
  -- Snapshot para evidencia
  asset_snapshot JSONB,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Agregar columnas faltantes a frozen_assets si no existen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'frozen_assets') THEN
        -- Agregar columna couple_id si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'frozen_assets' AND column_name = 'couple_id'
        ) THEN
            ALTER TABLE frozen_assets ADD COLUMN couple_id UUID REFERENCES couple_profiles(id) ON DELETE CASCADE;
        END IF;
        
        -- Agregar columna status si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'frozen_assets' AND column_name = 'status'
        ) THEN
            ALTER TABLE frozen_assets ADD COLUMN status TEXT DEFAULT 'FROZEN' CHECK (status IN ('FROZEN', 'UNFROZEN', 'TRANSFERRED'));
        END IF;
        
        -- Agregar columna asset_snapshot si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'frozen_assets' AND column_name = 'asset_snapshot'
        ) THEN
            ALTER TABLE frozen_assets ADD COLUMN asset_snapshot JSONB;
        END IF;
    END IF;
END $$;
-- Índices para frozen_assets
CREATE INDEX IF NOT EXISTS idx_frozen_assets_couple_id ON frozen_assets(couple_id);
CREATE INDEX IF NOT EXISTS idx_frozen_assets_dispute_id ON frozen_assets(dispute_id);
CREATE INDEX IF NOT EXISTS idx_frozen_assets_status ON frozen_assets(status);
-- RLS para frozen_assets
ALTER TABLE frozen_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "frozen_assets_view_own" ON frozen_assets;
CREATE POLICY "frozen_assets_view_own" ON frozen_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couple_profiles 
      WHERE id = couple_id 
      AND (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
    )
  );
-- Comentarios de documentación
COMMENT ON TABLE couple_agreements IS 'Almacena acuerdos prenupciales digitales entre parejas con cláusula de muerte súbita (30 días)';
COMMENT ON TABLE couple_disputes IS 'Registra disputas y conflictos entre partners de una pareja';
COMMENT ON TABLE frozen_assets IS 'Registra activos congelados (tokens, NFTs) durante disputas';
COMMENT ON COLUMN couple_agreements.agreement_hash IS 'Hash SHA-256 del contenido del acuerdo para integridad';
COMMENT ON COLUMN couple_agreements.dispute_deadline IS 'Fecha límite para resolver disputas (30 días después de firmar)';
COMMENT ON COLUMN couple_agreements.death_clause_text IS 'Texto de la cláusula de muerte súbita';
COMMENT ON COLUMN frozen_assets.asset_snapshot IS 'Snapshot JSONB del estado del activo en el momento de congelamiento';
