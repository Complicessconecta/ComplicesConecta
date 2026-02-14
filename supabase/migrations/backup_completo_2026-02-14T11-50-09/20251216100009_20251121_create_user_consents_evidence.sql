-- =====================================================
-- MIGRACIÓN: Sistema de Consentimiento Dinámico + Protocolo de Divorcio Digital
-- Versión: v3.7.2 - Legal Tech Implementation
-- Fecha: 21 Noviembre 2025
-- Propósito: Evidencia legal + Protección de activos digitales
-- =====================================================

-- 1. TABLA DE CONSENTIMIENTOS POR CAPAS
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Identificación del documento/consentimiento
    document_path TEXT NOT NULL, -- ej: 'docs/legal/TERMS_OF_SERVICE.md'
    consent_type TEXT NOT NULL, -- 'TERMS', 'PRIVACY', 'LEY_OLIMPIA', 'WALLET_RISK', 'COUPLE_AGREEMENT'
    
    -- Evidencia legal
    ip_address INET NOT NULL,
    user_agent TEXT,
    consent_text_hash TEXT NOT NULL, -- Hash del texto exacto que aceptó
    
    -- Timestamps críticos
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = permanente
    
    -- Estado
    is_active BOOLEAN NOT NULL DEFAULT true,
    revoked_at TIMESTAMPTZ,
    
    -- Metadatos
    version TEXT NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 2. TABLA DE ACUERDOS PRENUPCIALES DIGITALES
CREATE TABLE IF NOT EXISTS couple_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
    
    -- Firmas duales requeridas
    partner_1_id UUID NOT NULL REFERENCES profiles(id),
    partner_2_id UUID NOT NULL REFERENCES profiles(id),
    partner_1_signature BOOLEAN NOT NULL DEFAULT false,
    partner_2_signature BOOLEAN NOT NULL DEFAULT false,
    
    -- Evidencia legal de cada firma
    partner_1_ip INET,
    partner_2_ip INET,
    partner_1_signed_at TIMESTAMPTZ,
    partner_2_signed_at TIMESTAMPTZ,
    
    -- Cláusulas de protección de activos
    asset_disposition_clause TEXT NOT NULL DEFAULT 'ADMIN_FORFEIT' 
        CHECK (asset_disposition_clause IN ('SPLIT_50_50', 'ADMIN_FORFEIT', 'CUSTOM')),
    
    -- Texto de la cláusula de muerte súbita
    death_clause_text TEXT NOT NULL DEFAULT 
        'En caso de disolución de la cuenta de pareja por conflicto no resuelto en 30 días, los activos digitales (Tokens/NFTs) no reclamados serán transferidos a la plataforma por concepto de "Gastos Administrativos de Cancelación" y la cuenta será eliminada.',
    
    -- Estados del acuerdo
    status TEXT NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'ACTIVE', 'DISPUTED', 'DISSOLVED', 'FORFEITED')),
    
    -- Fechas críticas para disputas
    signed_at TIMESTAMPTZ, -- Cuando ambos firmaron
    dispute_started_at TIMESTAMPTZ,
    dispute_deadline TIMESTAMPTZ, -- signed_at + 30 días
    
    -- Hash del acuerdo completo para evidencia
    agreement_hash TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 3. TABLA DE DISPUTAS Y RESOLUCIONES
CREATE TABLE IF NOT EXISTS couple_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_agreement_id UUID NOT NULL REFERENCES couple_agreements(id) ON DELETE CASCADE,
    
    -- Quién inició la disputa
    initiated_by UUID NOT NULL REFERENCES profiles(id),
    dispute_reason TEXT NOT NULL,
    
    -- Activos en disputa
    tokens_in_dispute JSONB, -- {cmpx: 1000, gtk: 500}
    nfts_in_dispute JSONB,   -- [nft_id1, nft_id2]
    
    -- Resolución
    resolution_type TEXT CHECK (resolution_type IN ('AGREEMENT', 'ADMIN_FORFEIT', 'MANUAL')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id), -- NULL = sistema automático
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 4. ÍNDICES PARA PERFORMANCE Y CONSULTAS LEGALES
CREATE INDEX IF NOT EXISTS idx_user_consents_user_type 
    ON user_consents(user_id, consent_type) 
    WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_consents_document 
    ON user_consents(document_path, consented_at DESC);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_status 
    ON couple_agreements(status, dispute_deadline) 
    WHERE status IN ('ACTIVE', 'DISPUTED');
CREATE INDEX IF NOT EXISTS idx_couple_agreements_partners 
    ON couple_agreements(partner_1_id, partner_2_id);
CREATE INDEX IF NOT EXISTS idx_couple_disputes_deadline 
    ON couple_disputes(created_at) 
    WHERE resolution_type IS NULL;
-- 5. TRIGGERS PARA AUTOMATIZACIÓN LEGAL

-- Trigger: Auto-completar acuerdo cuando ambos firman
CREATE OR REPLACE FUNCTION complete_couple_agreement()
RETURNS TRIGGER AS $$
BEGIN
    -- Si ambos partners han firmado, activar el acuerdo
    IF NEW.partner_1_signature = true AND NEW.partner_2_signature = true THEN
        NEW.status = 'ACTIVE';
        NEW.signed_at = NOW();
        NEW.dispute_deadline = NOW() + INTERVAL '30 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_complete_couple_agreement
    BEFORE UPDATE ON couple_agreements
    FOR EACH ROW
    EXECUTE FUNCTION complete_couple_agreement();
-- Trigger: Auto-forfeit después de 30 días de disputa
CREATE OR REPLACE FUNCTION auto_forfeit_expired_disputes()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la disputa expiró sin resolución, aplicar forfeit automático
    IF NEW.dispute_deadline < NOW() AND OLD.status = 'DISPUTED' THEN
        NEW.status = 'FORFEITED';
        
        -- Crear registro de disputa resuelta automáticamente
        INSERT INTO couple_disputes (
            couple_agreement_id,
            initiated_by,
            dispute_reason,
            resolution_type,
            resolved_at
        ) VALUES (
            NEW.id,
            NEW.partner_1_id, -- Arbitrario, fue resolución automática
            'Auto-forfeit por expiración de plazo (30 días)',
            'ADMIN_FORFEIT',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_auto_forfeit_disputes
    BEFORE UPDATE ON couple_agreements
    FOR EACH ROW
    EXECUTE FUNCTION auto_forfeit_expired_disputes();
-- 6. FUNCIONES DE UTILIDAD LEGAL

-- Función: Obtener consentimientos activos de un usuario
CREATE OR REPLACE FUNCTION get_user_active_consents(p_user_id UUID)
RETURNS TABLE (
    consent_type TEXT,
    document_path TEXT,
    consented_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.consent_type,
        uc.document_path,
        uc.consented_at,
        uc.expires_at
    FROM user_consents uc
    WHERE uc.user_id = p_user_id 
      AND uc.is_active = true
      AND (uc.expires_at IS NULL OR uc.expires_at > NOW())
    ORDER BY uc.consented_at DESC;
END;
$$ LANGUAGE plpgsql;
-- Función: Verificar si una pareja tiene acuerdo activo
CREATE OR REPLACE FUNCTION has_active_couple_agreement(p_couple_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    agreement_exists BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM couple_agreements 
        WHERE couple_id = p_couple_id 
          AND status = 'ACTIVE'
          AND partner_1_signature = true 
          AND partner_2_signature = true
    ) INTO agreement_exists;
    
    RETURN agreement_exists;
END;
$$ LANGUAGE plpgsql;
-- 7. POLÍTICAS RLS PARA SEGURIDAD

-- RLS para user_consents: Solo el usuario puede ver sus consentimientos
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consents" ON user_consents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
-- RLS para couple_agreements: Solo los partners pueden ver sus acuerdos
ALTER TABLE couple_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners can view own agreements" ON couple_agreements
    FOR SELECT USING (
        auth.uid() = partner_1_id OR 
        auth.uid() = partner_2_id
    );
CREATE POLICY "Partners can update own agreements" ON couple_agreements
    FOR UPDATE USING (
        auth.uid() = partner_1_id OR 
        auth.uid() = partner_2_id
    );
-- RLS para couple_disputes: Solo partners involucrados
ALTER TABLE couple_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners can view own disputes" ON couple_disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM couple_agreements ca 
            WHERE ca.id = couple_agreement_id 
              AND (ca.partner_1_id = auth.uid() OR ca.partner_2_id = auth.uid())
        )
    );
-- 8. COMENTARIOS PARA DOCUMENTACIÓN LEGAL
COMMENT ON TABLE user_consents IS 'Registro de consentimientos informados por capas con evidencia legal (IP, timestamp, hash)';
COMMENT ON TABLE couple_agreements IS 'Acuerdos prenupciales digitales con cláusula de muerte súbita para protección de activos';
COMMENT ON TABLE couple_disputes IS 'Registro de disputas entre parejas con resolución automática después de 30 días';
COMMENT ON COLUMN couple_agreements.death_clause_text IS 'Cláusula de muerte súbita: activos no reclamados en 30 días se transfieren a la plataforma';
COMMENT ON COLUMN couple_agreements.asset_disposition_clause IS 'ADMIN_FORFEIT = activos a la plataforma, SPLIT_50_50 = división equitativa';
COMMENT ON COLUMN couple_agreements.dispute_deadline IS 'Fecha límite para resolver disputa antes de forfeit automático';
-- =====================================================
-- FIN DE MIGRACIÓN - SISTEMA LEGAL IMPLEMENTADO
-- =====================================================;
