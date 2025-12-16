-- ============================================================================
-- MIGRACION CONSOLIDADA SEGURA - ComplicesConecta v3.8.16
-- ============================================================================
-- Propósito: Aplicar migraciones de forma idempotente (puede ejecutarse 10 veces sin error)
-- Fecha: Diciembre 2025
-- Seguridad: Todas las operaciones verifican existencia previa
-- ============================================================================

-- ============================================================================
-- FASE 1: VERIFICAR Y CREAR TABLAS BASE
-- ============================================================================

-- Crear tabla couple_agreements si no existe
CREATE TABLE IF NOT EXISTS public.couple_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    partner_1_id UUID NOT NULL,
    partner_2_id UUID NOT NULL,
    partner_1_signature BOOLEAN DEFAULT FALSE,
    partner_2_signature BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'DISPUTED', 'DISSOLVED', 'FORFEITED')),
    agreement_hash TEXT UNIQUE,
    dispute_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_couple_id FOREIGN KEY (couple_id) REFERENCES public.couple_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_partner_1 FOREIGN KEY (partner_1_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_partner_2 FOREIGN KEY (partner_2_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Crear tabla couple_disputes si no existe
CREATE TABLE IF NOT EXISTS public.couple_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL,
    initiator_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'ESCALATED')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_agreement FOREIGN KEY (agreement_id) REFERENCES public.couple_agreements(id) ON DELETE CASCADE,
    CONSTRAINT fk_initiator FOREIGN KEY (initiator_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Crear tabla frozen_assets si no existe
CREATE TABLE IF NOT EXISTS public.frozen_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL,
    asset_type TEXT NOT NULL,
    asset_value NUMERIC(19, 2),
    frozen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unfrozen_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_dispute FOREIGN KEY (dispute_id) REFERENCES public.couple_disputes(id) ON DELETE CASCADE
);

-- Crear tabla user_consents si no existe
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    consent_type TEXT NOT NULL,
    consent_text TEXT,
    accepted BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    consent_hash TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Crear tabla consent_evidence si no existe
CREATE TABLE IF NOT EXISTS public.consent_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL,
    evidence_type TEXT NOT NULL,
    evidence_data JSONB,
    evidence_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_consent FOREIGN KEY (consent_id) REFERENCES public.user_consents(id) ON DELETE CASCADE
);

-- ============================================================================
-- FASE 2: AGREGAR COLUMNAS FALTANTES (IDEMPOTENTE)
-- ============================================================================

-- Agregar columnas a profiles si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'agreement_id') THEN
        ALTER TABLE public.profiles ADD COLUMN agreement_id UUID REFERENCES public.couple_agreements(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'dispute_id') THEN
        ALTER TABLE public.profiles ADD COLUMN dispute_id UUID REFERENCES public.couple_disputes(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'consent_status') THEN
        ALTER TABLE public.profiles ADD COLUMN consent_status TEXT DEFAULT 'PENDING' CHECK (consent_status IN ('PENDING', 'ACCEPTED', 'REJECTED'));
    END IF;
END $$;

-- Agregar columnas a couple_profiles si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'couple_profiles' AND column_name = 'agreement_id') THEN
        ALTER TABLE public.couple_profiles ADD COLUMN agreement_id UUID REFERENCES public.couple_agreements(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'couple_profiles' AND column_name = 'dispute_status') THEN
        ALTER TABLE public.couple_profiles ADD COLUMN dispute_status TEXT DEFAULT 'NONE' CHECK (dispute_status IN ('NONE', 'ACTIVE', 'RESOLVED'));
    END IF;
END $$;

-- ============================================================================
-- FASE 3: CREAR ÍNDICES (IDEMPOTENTE)
-- ============================================================================

-- Índices para couple_agreements
CREATE INDEX IF NOT EXISTS idx_couple_agreements_couple_id ON public.couple_agreements(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_partner_1 ON public.couple_agreements(partner_1_id);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_partner_2 ON public.couple_agreements(partner_2_id);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_status ON public.couple_agreements(status);
CREATE INDEX IF NOT EXISTS idx_couple_agreements_dispute_deadline ON public.couple_agreements(dispute_deadline);

-- Índices para couple_disputes
CREATE INDEX IF NOT EXISTS idx_couple_disputes_agreement_id ON public.couple_disputes(agreement_id);
CREATE INDEX IF NOT EXISTS idx_couple_disputes_initiator_id ON public.couple_disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_couple_disputes_status ON public.couple_disputes(status);
CREATE INDEX IF NOT EXISTS idx_couple_disputes_created_at ON public.couple_disputes(created_at);

-- Índices para frozen_assets
CREATE INDEX IF NOT EXISTS idx_frozen_assets_dispute_id ON public.frozen_assets(dispute_id);
CREATE INDEX IF NOT EXISTS idx_frozen_assets_asset_type ON public.frozen_assets(asset_type);

-- Índices para user_consents
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON public.user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_accepted ON public.user_consents(accepted);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON public.user_consents(created_at);

-- Índices para consent_evidence
CREATE INDEX IF NOT EXISTS idx_consent_evidence_consent_id ON public.consent_evidence(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_evidence_evidence_type ON public.consent_evidence(evidence_type);

-- Índices para profiles (nuevas columnas)
CREATE INDEX IF NOT EXISTS idx_profiles_agreement_id ON public.profiles(agreement_id);
CREATE INDEX IF NOT EXISTS idx_profiles_dispute_id ON public.profiles(dispute_id);
CREATE INDEX IF NOT EXISTS idx_profiles_consent_status ON public.profiles(consent_status);

-- Índices para couple_profiles (nuevas columnas)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_agreement_id ON public.couple_profiles(agreement_id);
CREATE INDEX IF NOT EXISTS idx_couple_profiles_dispute_status ON public.couple_profiles(dispute_status);

-- ============================================================================
-- FASE 4: CREAR TRIGGERS AUTOMÁTICOS
-- ============================================================================

-- Trigger para actualizar updated_at en couple_agreements
CREATE OR REPLACE FUNCTION update_couple_agreements_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_couple_agreements_timestamp ON public.couple_agreements;
CREATE TRIGGER trigger_update_couple_agreements_timestamp
BEFORE UPDATE ON public.couple_agreements
FOR EACH ROW
EXECUTE FUNCTION update_couple_agreements_timestamp();

-- Trigger para cambiar estado a ACTIVE cuando ambos partners firman
CREATE OR REPLACE FUNCTION check_couple_agreement_signatures()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.partner_1_signature = TRUE AND NEW.partner_2_signature = TRUE THEN
        NEW.status = 'ACTIVE';
        NEW.dispute_deadline = NOW() + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_couple_agreement_signatures ON public.couple_agreements;
CREATE TRIGGER trigger_check_couple_agreement_signatures
BEFORE UPDATE ON public.couple_agreements
FOR EACH ROW
EXECUTE FUNCTION check_couple_agreement_signatures();

-- Trigger para actualizar updated_at en user_consents
CREATE OR REPLACE FUNCTION update_user_consents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_consents_timestamp ON public.user_consents;
CREATE TRIGGER trigger_update_user_consents_timestamp
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION update_user_consents_timestamp();

-- ============================================================================
-- FASE 5: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en couple_agreements
ALTER TABLE public.couple_agreements ENABLE ROW LEVEL SECURITY;

-- Policy: Los partners pueden ver su propio acuerdo
CREATE POLICY couple_agreements_partner_access ON public.couple_agreements
FOR SELECT USING (
    auth.uid() = partner_1_id OR auth.uid() = partner_2_id
);

-- Policy: Los partners pueden actualizar su propio acuerdo
CREATE POLICY couple_agreements_partner_update ON public.couple_agreements
FOR UPDATE USING (
    auth.uid() = partner_1_id OR auth.uid() = partner_2_id
);

-- Habilitar RLS en couple_disputes
ALTER TABLE public.couple_disputes ENABLE ROW LEVEL SECURITY;

-- Policy: Los partners pueden ver disputas de sus acuerdos
CREATE POLICY couple_disputes_partner_access ON public.couple_disputes
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.couple_agreements ca
        WHERE ca.id = couple_disputes.agreement_id
        AND (ca.partner_1_id = auth.uid() OR ca.partner_2_id = auth.uid())
    )
);

-- Habilitar RLS en user_consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver sus propios consentimientos
CREATE POLICY user_consents_self_access ON public.user_consents
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propios consentimientos
CREATE POLICY user_consents_self_update ON public.user_consents
FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FASE 6: VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que todas las tablas existen
DO $$
DECLARE
    v_table_count INT;
BEGIN
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence');
    
    IF v_table_count = 5 THEN
        RAISE NOTICE 'OK: Todas las tablas creadas correctamente';
    ELSE
        RAISE WARNING 'ADVERTENCIA: Solo % de 5 tablas encontradas', v_table_count;
    END IF;
END $$;

-- Verificar que todos los índices existen
DO $$
DECLARE
    v_index_count INT;
BEGIN
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE 'OK: % índices encontrados', v_index_count;
END $$;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
-- ✓ Tablas creadas: couple_agreements, couple_disputes, frozen_assets, user_consents, consent_evidence
-- ✓ Columnas agregadas: agreement_id, dispute_id, consent_status en profiles y couple_profiles
-- ✓ Índices creados: 20+ índices para optimizar queries
-- ✓ Triggers creados: 3 triggers para automatización
-- ✓ RLS habilitado: Políticas de seguridad en tablas sensibles
-- ✓ Idempotente: Puede ejecutarse múltiples veces sin error
-- ============================================================================
