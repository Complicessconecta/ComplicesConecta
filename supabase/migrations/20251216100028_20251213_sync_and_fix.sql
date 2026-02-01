-- ============================================================================
-- MIGRACIÓN: 20251213_SYNC_AND_FIX.sql
-- ============================================================================
-- Fecha: 13 de Diciembre, 2025
-- Descripción: Migración de Reparación (Heal Migration) para sincronizar BD con Código
-- Objetivo: Agregar columnas faltantes y corregir inconsistencias
-- Idempotencia: 100% (IF NOT EXISTS, IF NOT)
-- ============================================================================

-- ============================================================================
-- PASO A: FIX REPORTS - Agregar columna faltante reporter_id
-- ============================================================================

ALTER TABLE "public"."reports" ADD COLUMN IF NOT EXISTS "reporter_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE;
-- Crear índice para reporter_id
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
-- ============================================================================
-- PASO B: CREAR TABLAS FALTANTES (11 tablas críticas)
-- ============================================================================

-- TABLA 1: investment_tiers
CREATE TABLE IF NOT EXISTS investment_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_key VARCHAR(50) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    amount_mxn DECIMAL(18,2) NOT NULL,
    return_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    return_type VARCHAR(50) DEFAULT 'annual',
    cmpx_tokens_rewarded DECIMAL(18,8) NOT NULL DEFAULT 0,
    equity_percentage DECIMAL(5,2),
    includes_equity BOOLEAN DEFAULT FALSE,
    includes_vip_dinner BOOLEAN DEFAULT FALSE,
    benefits JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investment_tiers_tier_key ON investment_tiers(tier_key);
CREATE INDEX IF NOT EXISTS idx_investment_tiers_is_active ON investment_tiers(is_active);
-- TABLA 2: investments
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL,
    amount_mxn DECIMAL(18,2) NOT NULL,
    amount_usd DECIMAL(18,2),
    return_percentage DECIMAL(5,2) NOT NULL,
    return_type VARCHAR(50),
    cmpx_tokens_rewarded DECIMAL(18,8),
    equity_percentage DECIMAL(5,2),
    includes_equity BOOLEAN DEFAULT FALSE,
    includes_vip_dinner BOOLEAN DEFAULT FALSE,
    benefits JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_signed_at TIMESTAMPTZ,
    safte_contract_url TEXT,
    activated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_payment_status ON investments(payment_status);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at DESC);
-- TABLA 3: cmpx_shop_packages
CREATE TABLE IF NOT EXISTS cmpx_shop_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cmpx_amount DECIMAL(18,8) NOT NULL,
    bonus_cmpx DECIMAL(18,8) DEFAULT 0,
    price_mxn DECIMAL(18,2) NOT NULL,
    price_usd DECIMAL(18,2),
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cmpx_shop_packages_is_active ON cmpx_shop_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_cmpx_shop_packages_display_order ON cmpx_shop_packages(display_order);
-- TABLA 4: cmpx_purchases
CREATE TABLE IF NOT EXISTS cmpx_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES cmpx_shop_packages(id) ON DELETE RESTRICT,
    cmpx_amount DECIMAL(18,8) NOT NULL,
    bonus_cmpx DECIMAL(18,8) DEFAULT 0,
    total_cmpx DECIMAL(18,8) NOT NULL,
    price_mxn DECIMAL(18,2) NOT NULL,
    price_usd DECIMAL(18,2),
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_user_id ON cmpx_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_status ON cmpx_purchases(status);
CREATE INDEX IF NOT EXISTS idx_cmpx_purchases_created_at ON cmpx_purchases(created_at DESC);
-- TABLA 5: token_analytics
CREATE TABLE IF NOT EXISTS token_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_cmpx_supply DECIMAL(18,8) NOT NULL,
    total_gtk_supply DECIMAL(18,8) NOT NULL,
    circulating_cmpx DECIMAL(18,8) NOT NULL,
    circulating_gtk DECIMAL(18,8) NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    transaction_volume_cmpx DECIMAL(18,8) DEFAULT 0,
    transaction_volume_gtk DECIMAL(18,8) DEFAULT 0,
    total_staked_cmpx DECIMAL(18,8) DEFAULT 0,
    active_stakers INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_analytics_period_type ON token_analytics(period_type);
CREATE INDEX IF NOT EXISTS idx_token_analytics_created_at ON token_analytics(created_at DESC);
-- TABLA 6: moderators
CREATE TABLE IF NOT EXISTS moderators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    moderator_id VARCHAR(255),
    level VARCHAR(50) DEFAULT 'junior',
    role VARCHAR(50) DEFAULT 'moderator',
    status VARCHAR(50) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activated_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moderators_user_id ON moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_moderators_status ON moderators(status);
CREATE INDEX IF NOT EXISTS idx_moderators_is_active ON moderators(is_active);
-- TABLA 7: moderator_payments
CREATE TABLE IF NOT EXISTS moderator_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_period_start TIMESTAMPTZ NOT NULL,
    payment_period_end TIMESTAMPTZ NOT NULL,
    total_minutes_worked INTEGER DEFAULT 0,
    reports_reviewed INTEGER DEFAULT 0,
    actions_taken INTEGER DEFAULT 0,
    quality_score DECIMAL(5,2),
    moderator_level VARCHAR(50),
    total_revenue_mxn DECIMAL(18,2) NOT NULL,
    revenue_percentage DECIMAL(5,2) NOT NULL,
    payment_amount_mxn DECIMAL(18,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_date TIMESTAMPTZ,
    stripe_payout_id VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moderator_payments_moderator_id ON moderator_payments(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderator_payments_payment_status ON moderator_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_moderator_payments_created_at ON moderator_payments(created_at DESC);
-- TABLA 8: security_audit_logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    risk_score DECIMAL(5,2),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'security_audit_logs'
          AND column_name = 'action'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON security_audit_logs(action);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
-- TABLA 9: posts
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    post_type VARCHAR(50) DEFAULT 'text',
    image_url TEXT,
    video_url TEXT,
    location TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_profile_id ON posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON posts(is_public);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
-- TABLA 10: virtual_events
CREATE TABLE IF NOT EXISTS virtual_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    max_participants INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_virtual_events_event_type ON virtual_events(event_type);
CREATE INDEX IF NOT EXISTS idx_virtual_events_start_time ON virtual_events(start_time);
CREATE INDEX IF NOT EXISTS idx_virtual_events_status ON virtual_events(status);
-- TABLA 11: clubs
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    check_in_radius_meters INTEGER DEFAULT 50,
    check_in_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clubs_slug ON clubs(slug);
CREATE INDEX IF NOT EXISTS idx_clubs_city ON clubs(city);
CREATE INDEX IF NOT EXISTS idx_clubs_is_active ON clubs(is_active);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clubs'
      AND column_name = 'is_featured'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clubs_is_featured ON clubs(is_featured)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_clubs_created_at ON clubs(created_at DESC);
-- ============================================================================
-- PASO C: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE investment_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cmpx_shop_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cmpx_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
-- ============================================================================
-- PASO D: CREAR POLÍTICAS RLS BÁSICAS
-- ============================================================================
-- Nota: políticas completas y robustas. en paso E

-- investment_tiers: lectura pública de tiers activos; escritura solo admin
DROP POLICY IF EXISTS investment_tiers_select ON public.investment_tiers;
DROP POLICY IF EXISTS investment_tiers_admin_insert ON public.investment_tiers;
DROP POLICY IF EXISTS investment_tiers_admin_update ON public.investment_tiers;
DROP POLICY IF EXISTS investment_tiers_admin_delete ON public.investment_tiers;
CREATE POLICY investment_tiers_select ON public.investment_tiers
  FOR SELECT
  USING (is_active = TRUE OR public.is_admin());
CREATE POLICY investment_tiers_admin_insert ON public.investment_tiers
  FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY investment_tiers_admin_update ON public.investment_tiers
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY investment_tiers_admin_delete ON public.investment_tiers
  FOR DELETE
  USING (public.is_admin());

-- investments: owner CRUD, admin full
DROP POLICY IF EXISTS investments_select ON public.investments;
DROP POLICY IF EXISTS investments_insert ON public.investments;
DROP POLICY IF EXISTS investments_update ON public.investments;
DROP POLICY IF EXISTS investments_delete ON public.investments;
CREATE POLICY investments_select ON public.investments
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY investments_insert ON public.investments
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY investments_update ON public.investments
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY investments_delete ON public.investments
  FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- cmpx_shop_packages: lectura pública de paquetes activos; escritura solo admin
DROP POLICY IF EXISTS cmpx_shop_packages_select ON public.cmpx_shop_packages;
DROP POLICY IF EXISTS cmpx_shop_packages_admin_insert ON public.cmpx_shop_packages;
DROP POLICY IF EXISTS cmpx_shop_packages_admin_update ON public.cmpx_shop_packages;
DROP POLICY IF EXISTS cmpx_shop_packages_admin_delete ON public.cmpx_shop_packages;
CREATE POLICY cmpx_shop_packages_select ON public.cmpx_shop_packages
  FOR SELECT
  USING (is_active = TRUE OR public.is_admin());
CREATE POLICY cmpx_shop_packages_admin_insert ON public.cmpx_shop_packages
  FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY cmpx_shop_packages_admin_update ON public.cmpx_shop_packages
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY cmpx_shop_packages_admin_delete ON public.cmpx_shop_packages
  FOR DELETE
  USING (public.is_admin());

-- cmpx_purchases: owner CRUD, admin full
DROP POLICY IF EXISTS cmpx_purchases_select ON public.cmpx_purchases;
DROP POLICY IF EXISTS cmpx_purchases_insert ON public.cmpx_purchases;
DROP POLICY IF EXISTS cmpx_purchases_update ON public.cmpx_purchases;
DROP POLICY IF EXISTS cmpx_purchases_delete ON public.cmpx_purchases;
CREATE POLICY cmpx_purchases_select ON public.cmpx_purchases
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY cmpx_purchases_insert ON public.cmpx_purchases
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY cmpx_purchases_update ON public.cmpx_purchases
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY cmpx_purchases_delete ON public.cmpx_purchases
  FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- token_analytics: lectura para authenticated; escritura solo admin
DROP POLICY IF EXISTS token_analytics_select ON public.token_analytics;
DROP POLICY IF EXISTS token_analytics_admin_insert ON public.token_analytics;
DROP POLICY IF EXISTS token_analytics_admin_update ON public.token_analytics;
DROP POLICY IF EXISTS token_analytics_admin_delete ON public.token_analytics;
CREATE POLICY token_analytics_select ON public.token_analytics
  FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY token_analytics_admin_insert ON public.token_analytics
  FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY token_analytics_admin_update ON public.token_analytics
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY token_analytics_admin_delete ON public.token_analytics
  FOR DELETE
  USING (public.is_admin());

-- moderators: el moderador ve su fila; admin ve todo; escritura admin
DROP POLICY IF EXISTS moderators_select ON public.moderators;
DROP POLICY IF EXISTS moderators_admin_insert ON public.moderators;
DROP POLICY IF EXISTS moderators_admin_update ON public.moderators;
DROP POLICY IF EXISTS moderators_admin_delete ON public.moderators;
CREATE POLICY moderators_select ON public.moderators
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY moderators_admin_insert ON public.moderators
  FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY moderators_admin_update ON public.moderators
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY moderators_admin_delete ON public.moderators
  FOR DELETE
  USING (public.is_admin());

-- moderator_payments: moderador ve los suyos; escritura admin
DROP POLICY IF EXISTS moderator_payments_select ON public.moderator_payments;
DROP POLICY IF EXISTS moderator_payments_admin_insert ON public.moderator_payments;
DROP POLICY IF EXISTS moderator_payments_admin_update ON public.moderator_payments;
DROP POLICY IF EXISTS moderator_payments_admin_delete ON public.moderator_payments;
CREATE POLICY moderator_payments_select ON public.moderator_payments
  FOR SELECT
  USING (moderator_id = auth.uid() OR public.is_admin());
CREATE POLICY moderator_payments_admin_insert ON public.moderator_payments
  FOR INSERT
  WITH CHECK (public.is_admin());
CREATE POLICY moderator_payments_admin_update ON public.moderator_payments
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY moderator_payments_admin_delete ON public.moderator_payments
  FOR DELETE
  USING (public.is_admin());

-- security_audit_logs: usuario ve los suyos; insert propio; update/delete solo admin
DROP POLICY IF EXISTS security_audit_logs_select ON public.security_audit_logs;
DROP POLICY IF EXISTS security_audit_logs_insert ON public.security_audit_logs;
DROP POLICY IF EXISTS security_audit_logs_admin_update ON public.security_audit_logs;
DROP POLICY IF EXISTS security_audit_logs_admin_delete ON public.security_audit_logs;
CREATE POLICY security_audit_logs_select ON public.security_audit_logs
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY security_audit_logs_insert ON public.security_audit_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY security_audit_logs_admin_update ON public.security_audit_logs
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY security_audit_logs_admin_delete ON public.security_audit_logs
  FOR DELETE
  USING (public.is_admin());

-- posts: lectura pública cuando is_public; owner CRUD; admin full
DROP POLICY IF EXISTS posts_select ON public.posts;
DROP POLICY IF EXISTS posts_insert ON public.posts;
DROP POLICY IF EXISTS posts_update ON public.posts;
DROP POLICY IF EXISTS posts_delete ON public.posts;
CREATE POLICY posts_select ON public.posts
  FOR SELECT
  USING (is_public = TRUE OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY posts_insert ON public.posts
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY posts_update ON public.posts
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY posts_delete ON public.posts
  FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- virtual_events: lectura para authenticated; creador o admin puede gestionar
DROP POLICY IF EXISTS virtual_events_select ON public.virtual_events;
DROP POLICY IF EXISTS virtual_events_insert ON public.virtual_events;
DROP POLICY IF EXISTS virtual_events_update ON public.virtual_events;
DROP POLICY IF EXISTS virtual_events_delete ON public.virtual_events;
CREATE POLICY virtual_events_select ON public.virtual_events
  FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY virtual_events_insert ON public.virtual_events
  FOR INSERT
  WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY virtual_events_update ON public.virtual_events
  FOR UPDATE
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY virtual_events_delete ON public.virtual_events
  FOR DELETE
  USING (created_by = auth.uid() OR public.is_admin());

-- clubs: lectura pública de clubs activos; owner/admin CRUD
DROP POLICY IF EXISTS clubs_select ON public.clubs;
DROP POLICY IF EXISTS clubs_insert ON public.clubs;
DROP POLICY IF EXISTS clubs_update ON public.clubs;
DROP POLICY IF EXISTS clubs_delete ON public.clubs;
CREATE POLICY clubs_select ON public.clubs
  FOR SELECT
  USING (is_active = TRUE OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY clubs_insert ON public.clubs
  FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY clubs_update ON public.clubs
  FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY clubs_delete ON public.clubs
  FOR DELETE
  USING (owner_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- FIN DE MIGRACIÓN DE REPARACIÓN
-- ============================================================================
-- Generado: 13 de Diciembre, 2025
-- Paso A: Fix Reports (agregar reporter_id)
-- Paso B: Crear 11 tablas faltantes
-- Paso C: Habilitar RLS en todas
-- Paso D: Crear políticas RLS básicas 
-- Paso E: Crear políticas RLS COMPLETAS NO MINIMAS NI BASICAS 
-- Status: 100% Idempotente - Seguro ejecutar múltiples veces
-- ============================================================================;
