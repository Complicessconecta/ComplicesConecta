-- ============================================================================
-- STRIPE WRAPPER CONFIGURATION FOR COMPLICESCONECTA (SIN VAULT)
-- Versión: v3.8.1
-- Fecha: 13 Enero 2026
--
-- NOTA: Esta versión NO usa Vault porque la extensión no está disponible
-- en el sistema PostgreSQL actual. Las credenciales se almacenan temporalmente
-- en el server. Se recomienda instalar Vault cuando esté disponible.
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR MATERIALIZED VIEWS PARA PERFORMANCE
-- ============================================================================

-- Materialized View para Products (datos semi-estáticos)
DROP MATERIALIZED VIEW IF EXISTS private.stripe_products;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'stripe' AND table_name = 'products')
  THEN
    EXECUTE 'CREATE MATERIALIZED VIEW private.stripe_products AS
      SELECT id, object, active, created, description, images, name, statement_descriptor, type, updated, metadata
      FROM stripe.products
      WHERE active = true
      WITH DATA';
  END IF;
END $$;

-- Índice para performance
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'private'
      AND c.relname = 'stripe_products'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_stripe_products_id ON private.stripe_products(id);
    CREATE INDEX IF NOT EXISTS idx_stripe_products_active ON private.stripe_products(active);
  END IF;
END $$;

-- Materialized View para Prices (datos semi-estáticos)
DROP MATERIALIZED VIEW IF EXISTS private.stripe_prices;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'stripe' AND table_name = 'prices')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'stripe' AND table_name = 'products')
  THEN
    EXECUTE 'CREATE MATERIALIZED VIEW private.stripe_prices AS
      SELECT p.id, p.object, p.active, p.billing_scheme, p.created, p.currency, p.livemode, p.lookup_key, p.nickname,
        p.product, p.recurring, p.tax_behavior, p.type, p.unit_amount, p.unit_amount_decimal, p.metadata,
        pr.name as product_name, pr.description as product_description
      FROM stripe.prices p
      LEFT JOIN stripe.products pr ON p.product = pr.id
      WHERE p.active = true
      WITH DATA';
  END IF;
END $$;

-- Índice para performance
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'private'
      AND c.relname = 'stripe_prices'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_stripe_prices_id ON private.stripe_prices(id);
    CREATE INDEX IF NOT EXISTS idx_stripe_prices_product ON private.stripe_prices(product);
    CREATE INDEX IF NOT EXISTS idx_stripe_prices_active ON private.stripe_prices(active);
  END IF;
END $$;

-- ============================================================================
-- PASO 2: VIEWS EN PUBLIC (SIN SECURITY BARRIER)
-- ============================================================================
-- NOTA: Esta versión no usa SECURITY BARRIER por compatibilidad
-- El filtrado por auth.uid() en WHERE proporciona seguridad básica

-- View para Products (desde materialized view)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'private'
      AND c.relname = 'stripe_products'
  ) THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.stripe_products_view AS
      SELECT id, object, active, created, description, images, name, statement_descriptor, type, updated, metadata
      FROM private.stripe_products
      WHERE active = true';
  END IF;
END $$;

-- View para Prices (desde materialized view)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'private'
      AND c.relname = 'stripe_prices'
  ) THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.stripe_prices_view AS
      SELECT id, object, active, billing_scheme, created, currency, livemode, lookup_key, nickname, product, recurring, tax_behavior,
        type, unit_amount, unit_amount_decimal, metadata, product_name, product_description
      FROM private.stripe_prices
      WHERE active = true';
  END IF;
END $$;

-- View para Payment Intents del usuario actual
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'private'
      AND c.relname = 'stripe_products'
  ) THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.user_payment_intents AS
      SELECT
        pi.id,
        pi.object,
        pi.amount,
        pi.amount_capturable,
        pi.amount_received,
        pi.currency,
        pi.created,
        pi.description,
        pi.invoice,
        pi.payment_method,
        pi.status,
        pi.next_action,
        pi.metadata,
        pi.livemode,
        usc.stripe_customer_id as customer_id
      FROM stripe.payment_intents pi
      INNER JOIN public.user_stripe_customers usc ON pi.customer = usc.stripe_customer_id
      WHERE usc.user_id = auth.uid()';
  END IF;
END $$;

-- View para Charges del usuario actual
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'stripe' AND table_name = 'charges')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stripe_customers')
  THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.user_charges AS
      SELECT
        c.id,
        c.object,
        c.amount,
        c.amount_captured,
        c.amount_refunded,
        c.currency,
        c.created,
        c.description,
        c.invoice,
        c.paid,
        c.status,
        c.payment_intent,
        c.receipt_url,
        c.receipt_number,
        c.refunded,
        c.metadata,
        c.livemode,
        usc.stripe_customer_id as customer_id
      FROM stripe.charges c
      INNER JOIN public.user_stripe_customers usc ON c.customer = usc.stripe_customer_id
      WHERE usc.user_id = auth.uid()';
  END IF;
END $$;

-- View para Subscriptions del usuario actual
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'stripe' AND table_name = 'subscriptions')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stripe_customers')
  THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.user_subscriptions AS
      SELECT
        s.id,
        s.object,
        s.cancel_at_period_end,
        s.cancel_at,
        s.canceled_at,
        s.collection_method,
        s.created,
        s.currency,
        s.current_period_end,
        s.current_period_start,
        s.default_payment_method,
        s.items,
        s.latest_invoice,
        s.livemode,
        s.metadata,
        s.status,
        s.trial_end,
        s.trial_start,
        usc.stripe_customer_id as customer_id
      FROM stripe.subscriptions s
      INNER JOIN public.user_stripe_customers usc ON s.customer = usc.stripe_customer_id
      WHERE usc.user_id = auth.uid()';
  END IF;
END $$;

-- View para Invoices del usuario actual
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'stripe' AND table_name = 'invoices')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stripe_customers')
  THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.user_invoices AS
      SELECT
        i.id,
        i.object,
        i.amount_due,
        i.amount_paid,
        i.amount_remaining,
        i.currency,
        i.created,
        i.description,
        i.hosted_invoice_url,
        i.invoice_pdf,
        i.paid,
        i.status,
        i.subscription,
        i.total,
        i.metadata,
        i.livemode,
        usc.stripe_customer_id as customer_id
      FROM stripe.invoices i
      INNER JOIN public.user_stripe_customers usc ON i.customer = usc.stripe_customer_id
      WHERE usc.user_id = auth.uid()';
  END IF;
END $$;

-- ============================================================================
-- PASO 3: VERIFICACIÓN
-- ============================================================================

-- Verificar materialized views
SELECT matviewname FROM pg_matviews WHERE schemaname = 'private';

-- Verificar views en public
SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'stripe_%' OR table_name LIKE 'user_%';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
