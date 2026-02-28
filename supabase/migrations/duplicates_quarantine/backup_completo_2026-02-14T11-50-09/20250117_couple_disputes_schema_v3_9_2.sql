-- ============================================================================
-- ACTUALIZACIÓN DE SCHEMA - COUPLES DISPUTES Y TABLAS RELACIONADAS
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- ============================================================================

-- ============================================================================
-- TABLA: couple_disputes
-- ============================================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.couple_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    initiated_by UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proposed', 'resolved', 'rejected')),
    dispute_reason TEXT NOT NULL,
    frozen_assets_snapshot JSONB,
    proposed_winner_id UUID,
    proposed_at TIMESTAMP WITH TIME ZONE,
    winner_accepted_by UUID,
    accepted_at TIMESTAMP WITH TIME ZONE,
    couple_agreement_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Agregar columnas faltantes si no existen (IDEMPOTENTE)
ALTER TABLE public.couple_disputes 
    ADD COLUMN IF NOT EXISTS frozen_assets_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS proposed_winner_id UUID,
    ADD COLUMN IF NOT EXISTS proposed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS winner_accepted_by UUID,
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS couple_agreement_id UUID;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_couple_disputes_couple_id 
    ON public.couple_disputes(couple_id);

CREATE INDEX IF NOT EXISTS idx_couple_disputes_initiated_by 
    ON public.couple_disputes(initiated_by);

CREATE INDEX IF NOT EXISTS idx_couple_disputes_status 
    ON public.couple_disputes(status);

CREATE INDEX IF NOT EXISTS idx_couple_disputes_created_at 
    ON public.couple_disputes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_couple_disputes_proposed_winner_id 
    ON public.couple_disputes(proposed_winner_id) WHERE proposed_winner_id IS NOT NULL;

-- Crear foreign keys usando DO block para verificar existencia
DO $$
BEGIN
    -- fk_couple_disputes_couple_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_couple_disputes_couple_id'
    ) THEN
        ALTER TABLE public.couple_disputes
        ADD CONSTRAINT fk_couple_disputes_couple_id 
        FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;
    END IF;
    
    -- fk_couple_disputes_initiated_by
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_couple_disputes_initiated_by'
    ) THEN
        ALTER TABLE public.couple_disputes
        ADD CONSTRAINT fk_couple_disputes_initiated_by 
        FOREIGN KEY (initiated_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;
    
    -- fk_couple_disputes_proposed_winner_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_couple_disputes_proposed_winner_id'
    ) THEN
        ALTER TABLE public.couple_disputes
        ADD CONSTRAINT fk_couple_disputes_proposed_winner_id 
        FOREIGN KEY (proposed_winner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- fk_couple_disputes_winner_accepted_by
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_couple_disputes_winner_accepted_by'
    ) THEN
        ALTER TABLE public.couple_disputes
        ADD CONSTRAINT fk_couple_disputes_winner_accepted_by 
        FOREIGN KEY (winner_accepted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- fk_couple_disputes_couple_agreement_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_couple_disputes_couple_agreement_id'
    ) THEN
        ALTER TABLE public.couple_disputes
        ADD CONSTRAINT fk_couple_disputes_couple_agreement_id 
        FOREIGN KEY (couple_agreement_id) REFERENCES public.couple_agreements(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Habilitar RLS y crear políticas
ALTER TABLE public.couple_disputes ENABLE ROW LEVEL SECURITY;

-- Crear policies usando DO block para verificar existencia
DO $$
BEGIN
    -- Users can view their own disputes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couple_disputes' AND policyname = 'Users can view their own disputes'
    ) THEN
        CREATE POLICY "Users can view their own disputes"
        ON public.couple_disputes FOR SELECT
        USING (
            auth.uid() IN (
                SELECT user_id FROM public.couples WHERE id = couple_disputes.couple_id
            )
        );
    END IF;
    
    -- Users can create disputes for their couples
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couple_disputes' AND policyname = 'Users can create disputes for their couples'
    ) THEN
        CREATE POLICY "Users can create disputes for their couples"
        ON public.couple_disputes FOR INSERT
        WITH CHECK (
            auth.uid() IN (
                SELECT user_id FROM public.couples WHERE id = couple_disputes.couple_id
            )
        );
    END IF;
    
    -- Users can update their own disputes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'couple_disputes' AND policyname = 'Users can update their own disputes'
    ) THEN
        CREATE POLICY "Users can update their own disputes"
        ON public.couple_disputes FOR UPDATE
        USING (
            auth.uid() IN (
                SELECT user_id FROM public.couples WHERE id = couple_disputes.couple_id
            )
        );
    END IF;
END $$;

-- ============================================================================
-- TABLA: user_stripe_customers (si no existe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    email TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stripe_customers_user_id 
    ON public.user_stripe_customers(user_id);

CREATE INDEX IF NOT EXISTS idx_user_stripe_customers_stripe_customer_id 
    ON public.user_stripe_customers(stripe_customer_id);

-- Crear foreign key usando DO block para verificar existencia
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_user_stripe_customers_user_id'
    ) THEN
        ALTER TABLE public.user_stripe_customers
        ADD CONSTRAINT fk_user_stripe_customers_user_id 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.user_stripe_customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_stripe_customers' AND policyname = 'Users can view their own stripe customer'
    ) THEN
        CREATE POLICY "Users can view their own stripe customer"
        ON public.user_stripe_customers FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_stripe_customers' AND policyname = 'Users can insert their own stripe customer'
    ) THEN
        CREATE POLICY "Users can insert their own stripe customer"
        ON public.user_stripe_customers FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================================================
-- TABLA: stripe_webhook_events (si no existe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id 
    ON public.stripe_webhook_events(event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type 
    ON public.stripe_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed 
    ON public.stripe_webhook_events(processed);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created_at 
    ON public.stripe_webhook_events(created_at DESC);

-- ============================================================================
-- TABLA: stripe_product_mapping (si no existe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_product_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    stripe_product_id TEXT NOT NULL,
    price_id TEXT,
    product_name TEXT NOT NULL,
    price_amount INTEGER,
    price_currency TEXT NOT NULL DEFAULT 'mxn',
    cmpx_tokens INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_product_mapping_product_id 
    ON public.stripe_product_mapping(product_id);

CREATE INDEX IF NOT EXISTS idx_stripe_product_mapping_stripe_product_id 
    ON public.stripe_product_mapping(stripe_product_id);

CREATE INDEX IF NOT EXISTS idx_stripe_product_mapping_is_active 
    ON public.stripe_product_mapping(is_active);

-- ============================================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para updated_at si no existen
DROP TRIGGER IF EXISTS update_couple_disputes_updated_at ON public.couple_disputes;
CREATE TRIGGER update_couple_disputes_updated_at
    BEFORE UPDATE ON public.couple_disputes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stripe_customers_updated_at ON public.user_stripe_customers;
CREATE TRIGGER update_user_stripe_customers_updated_at
    BEFORE UPDATE ON public.user_stripe_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_product_mapping_updated_at ON public.stripe_product_mapping;
CREATE TRIGGER update_stripe_product_mapping_updated_at
    BEFORE UPDATE ON public.stripe_product_mapping
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE public.couple_disputes IS 'Tabla para gestionar disputas y disoluciones de parejas - v3.9.2';
COMMENT ON COLUMN public.couple_disputes.frozen_assets_snapshot IS 'Snapshot JSON de activos congelados (NFTs, tokens, etc.)';
COMMENT ON COLUMN public.couple_disputes.proposed_winner_id IS 'ID del usuario propuesto como ganador de la disputa';
COMMENT ON COLUMN public.couple_disputes.proposed_at IS 'Fecha de la propuesta de resolución';
COMMENT ON COLUMN public.couple_disputes.winner_accepted_by IS 'ID del usuario que acepta la propuesta';
COMMENT ON COLUMN public.couple_disputes.accepted_at IS 'Fecha de aceptación de la propuesta';

COMMENT ON TABLE public.user_stripe_customers IS 'Mapeo de usuarios a clientes de Stripe';
COMMENT ON TABLE public.stripe_webhook_events IS 'Eventos webhook recibidos de Stripe';
COMMENT ON TABLE public.stripe_product_mapping IS 'Mapeo de productos Stripe a tokens CMPX';
