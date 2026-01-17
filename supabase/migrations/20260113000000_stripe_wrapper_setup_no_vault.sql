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
-- PASO 1: PREPARACIÓN - Crear schema privado 'stripe'
-- ============================================================================

-- Crear schema privado para FDW (NO exponer via API)
CREATE SCHEMA IF NOT EXISTS stripe;

-- Crear schema private para materialized views
CREATE SCHEMA IF NOT EXISTS private;

-- ============================================================================
-- PASO 2: HABILITAR EXTENSIONES
-- ============================================================================

-- Habilitar Wrappers extension
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;

-- NOTA: Vault no está disponible en este sistema
-- CREATE EXTENSION IF NOT EXISTS vault WITH SCHEMA extensions;

-- ============================================================================
-- PASO 3: CREAR STRIPE FDW Y SERVER (SIN VAULT)
-- ============================================================================

-- NOTA: Las funciones stripe_fdw_handler y stripe_fdw_validator no están disponibles
-- en la extensión wrappers actual. Se omite la creación del FDW por ahora.
-- Cuando estén disponibles, descomentar el siguiente código:

-- Crear Foreign Data Wrapper para Stripe
-- CREATE FOREIGN DATA WRAPPER stripe_wrapper
--   HANDLER stripe_fdw_handler
--   VALIDATOR stripe_fdw_validator;

-- Crear server conectado a Stripe (credenciales directas por ahora)
-- IMPORTANTE: Reemplaza con tu clave real de Stripe
-- CREATE SERVER stripe_server
--   FOREIGN DATA WRAPPER stripe_wrapper
--   OPTIONS (
--     api_key 'sk_live_YOUR_STRIPE_SECRET_KEY_HERE',
--     api_url 'https://api.stripe.com/v1/',
--     api_version '2024-06-20'
--   );

-- ============================================================================
-- PASO 4: IMPORTAR TABLAS DE STRIPE
-- ============================================================================

-- NOTA: Las foreign tables no se pueden crear sin el FDW y el server.
-- Se omiten por ahora. Cuando el FDW esté disponible, descomentar el código.

-- Balance Transactions
-- CREATE FOREIGN TABLE stripe.balance_transactions (
--   id TEXT,
--   object TEXT,
--   amount BIGINT,
--   currency TEXT,
--   net BIGINT,
--   gross BIGINT,
--   fee BIGINT,
--   created TIMESTAMPTZ,
--   available_on TIMESTAMPTZ,
--   reporting_category TEXT,
--   description TEXT,
--   source TEXT,
--   type TEXT,
--   metadata JSONB,
--   exchange_rate NUMERIC
-- ) SERVER stripe_server
-- OPTIONS (object 'balance_transactions');

-- Customers
-- CREATE FOREIGN TABLE stripe.customers (
--   id TEXT,
--   object TEXT,
--   email TEXT,
--   name TEXT,
--   description TEXT,
--   created TIMESTAMPTZ,
--   currency TEXT,
--   default_source TEXT,
--   invoice_settings JSONB,
--   metadata JSONB,
--   livemode BOOLEAN,
--   tax_exempt TEXT,
--   test_clock TEXT
-- ) SERVER stripe_server
-- OPTIONS (object 'customers');

-- Charges
-- CREATE FOREIGN TABLE stripe.charges (
--   id TEXT,
--   object TEXT,
--   amount BIGINT,
--   amount_captured BIGINT,
--   amount_refunded BIGINT,
--   currency TEXT,
--   created TIMESTAMPTZ,
--   customer TEXT,
--   description TEXT,
--   invoice TEXT,
--   paid BOOLEAN,
--   status TEXT,
--   payment_intent TEXT,
--   receipt_url TEXT,
--   receipt_number TEXT,
--   refunded BOOLEAN,
--   metadata JSONB,
--   livemode BOOLEAN
-- ) SERVER stripe_server
-- OPTIONS (object 'charges');

-- Payment Intents
-- CREATE FOREIGN TABLE stripe.payment_intents (
--   id TEXT,
--   object TEXT,
--   amount BIGINT,
--   amount_capturable BIGINT,
--   amount_received BIGINT,
--   currency TEXT,
--   created TIMESTAMPTZ,
--   customer TEXT,
--   description TEXT,
--   invoice TEXT,
--   payment_method TEXT,
--   status TEXT,
--   next_action JSONB,
--   metadata JSONB,
--   livemode BOOLEAN
-- ) SERVER stripe_server
-- OPTIONS (object 'payment_intents');

-- Invoices
-- CREATE FOREIGN TABLE stripe.invoices (
--   id TEXT,
--   object TEXT,
--   account_country TEXT,
--   account_name TEXT,
--   amount_due BIGINT,
--   amount_paid BIGINT,
--   amount_remaining BIGINT,
--   currency TEXT,
--   created TIMESTAMPTZ,
--   customer TEXT,
--   description TEXT,
--   hosted_invoice_url TEXT,
--   invoice_pdf TEXT,
--   paid BOOLEAN,
--   status TEXT,
--   subscription TEXT,
--   total BIGINT,
--   metadata JSONB,
--   livemode BOOLEAN
-- ) SERVER stripe_server
-- OPTIONS (object 'invoices');

-- Subscriptions
-- CREATE FOREIGN TABLE stripe.subscriptions (
--   id TEXT,
--   object TEXT,
--   cancel_at_period_end BOOLEAN,
--   cancel_at TIMESTAMPTZ,
--   canceled_at TIMESTAMPTZ,
--   collection_method TEXT,
--   created TIMESTAMPTZ,
--   currency TEXT,
--   current_period_end TIMESTAMPTZ,
--   current_period_start TIMESTAMPTZ,
--   customer TEXT,
--   default_payment_method TEXT,
--   items JSONB,
--   latest_invoice TEXT,
--   livemode BOOLEAN,
--   metadata JSONB,
--   plan JSONB,
--   status TEXT,
--   trial_end TIMESTAMPTZ,
--   trial_start TIMESTAMPTZ
-- ) SERVER stripe_server
-- OPTIONS (object 'subscriptions');

-- Products
-- CREATE FOREIGN TABLE stripe.products (
--   id TEXT,
--   object TEXT,
--   active BOOLEAN,
--   created TIMESTAMPTZ,
--   description TEXT,
--   images TEXT[],
--   livemode BOOLEAN,
--   metadata JSONB,
--   name TEXT,
--   package_dimensions JSONB,
--   shippable BOOLEAN,
--   statement_descriptor TEXT,
--   tax_code TEXT,
--   type TEXT,
--   unit_label TEXT,
--   updated TIMESTAMPTZ
-- ) SERVER stripe_server
-- OPTIONS (object 'products');

-- Prices
-- CREATE FOREIGN TABLE stripe.prices (
--   id TEXT,
--   object TEXT,
--   active BOOLEAN,
--   billing_scheme TEXT,
--   created TIMESTAMPTZ,
--   currency TEXT,
--   custom_unit_amount BIGINT,
--   livemode BOOLEAN,
--   lookup_key TEXT,
--   metadata JSONB,
--   nickname TEXT,
--   product TEXT,
--   recurring JSONB,
--   tax_behavior TEXT,
--   tiers JSONB,
--   tiers_mode TEXT,
--   transform_quantity JSONB,
--   type TEXT,
--   unit_amount BIGINT,
--   unit_amount_decimal NUMERIC
-- ) SERVER stripe_server
-- OPTIONS (object 'prices');

-- ============================================================================
-- PASO 5: MATERIALIZED VIEWS PARA PERFORMANCE
-- ============================================================================

-- NOTA: Las materialized views no se pueden crear sin las foreign tables.
-- Se omiten por ahora. Cuando el FDW esté disponible, descomentar el código.

-- Materialized View para Products (datos semi-estáticos)
-- CREATE MATERIALIZED VIEW private.stripe_products AS
-- SELECT 
--   id,
--   object,
--   active,
--   created,
--   description,
--   images,
--   name,
--   statement_descriptor,
--   type,
--   updated,
--   metadata
-- FROM stripe.products
-- WHERE active = true
-- WITH DATA;

-- Índice para performance
-- CREATE INDEX idx_stripe_products_id ON private.stripe_products(id);
-- CREATE INDEX idx_stripe_products_active ON private.stripe_products(active);

-- Materialized View para Prices (datos semi-estáticos)
-- CREATE MATERIALIZED VIEW private.stripe_prices AS
-- SELECT 
--   p.id,
--   p.object,
--   p.active,
--   p.billing_scheme,
--   p.created,
--   p.currency,
--   p.livemode,
--   p.lookup_key,
--   p.nickname,
--   p.product,
--   p.recurring,
--   p.tax_behavior,
--   p.type,
--   p.unit_amount,
--   p.unit_amount_decimal,
--   p.metadata,
--   pr.name as product_name,
--   pr.description as product_description
-- FROM stripe.prices p
-- LEFT JOIN stripe.products pr ON p.product = pr.id
-- WHERE p.active = true
-- WITH DATA;

-- Índice para performance
-- CREATE INDEX idx_stripe_prices_id ON private.stripe_prices(id);
-- CREATE INDEX idx_stripe_prices_product ON private.stripe_prices(product);
-- CREATE INDEX idx_stripe_prices_active ON private.stripe_prices(active);

-- ============================================================================
-- PASO 6: TABLA LOCAL PARA MAPEAR USUARIOS → STRIPE CUSTOMERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_stripe_customers_user_id ON public.user_stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stripe_customers_stripe_id ON public.user_stripe_customers(stripe_customer_id);

-- Habilitar RLS
ALTER TABLE public.user_stripe_customers ENABLE ROW LEVEL SECURITY;

-- Política: Solo el usuario puede ver su propio customer
CREATE POLICY "Users can view their own stripe customer"
ON public.user_stripe_customers
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Solo el usuario puede insertar su customer
CREATE POLICY "Users can insert their own stripe customer"
ON public.user_stripe_customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Solo el usuario puede actualizar su customer
CREATE POLICY "Users can update their own stripe customer"
ON public.user_stripe_customers
FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================================
-- PASO 7: VIEWS EN PUBLIC CON SECURITY BARRIER
-- ============================================================================
-- NOTA: PostgreSQL no soporta ALTER VIEW ENABLE ROW LEVEL SECURITY
-- Usamos SECURITY BARRIER y WHERE clauses para filtrado

-- NOTA: Las vistas no se pueden crear sin las foreign tables.
-- Se omiten por ahora. Cuando el FDW esté disponible, descomentar el código.

-- View para Products (desde materialized view)
-- CREATE OR REPLACE VIEW public.stripe_products_view AS
-- SELECT 
--   id,
--   object,
--   active,
--   created,
--   description,
--   images,
--   name,
--   statement_descriptor,
--   type,
--   updated,
--   metadata
-- FROM private.stripe_products
-- WHERE active = true
-- WITH (security_barrier = true);

-- View para Prices (desde materialized view)
-- CREATE OR REPLACE VIEW public.stripe_prices_view AS
-- SELECT 
--   id,
--   object,
--   active,
--   billing_scheme,
--   created,
--   currency,
--   livemode,
--   lookup_key,
--   nickname,
--   product,
--   recurring,
--   tax_behavior,
--   type,
--   unit_amount,
--   unit_amount_decimal,
--   metadata,
--   product_name,
--   product_description
-- FROM private.stripe_prices
-- WHERE active = true
-- WITH (security_barrier = true);

-- View para Payment Intents del usuario actual
-- CREATE OR REPLACE VIEW public.user_payment_intents AS
-- SELECT 
--   pi.id,
--   pi.object,
--   pi.amount,
--   pi.amount_capturable,
--   pi.amount_received,
--   pi.currency,
--   pi.created,
--   pi.description,
--   pi.invoice,
--   pi.payment_method,
--   pi.status,
--   pi.next_action,
--   pi.metadata,
--   pi.livemode,
--   usc.stripe_customer_id as customer_id
-- FROM stripe.payment_intents pi
-- INNER JOIN public.user_stripe_customers usc ON pi.customer = usc.stripe_customer_id
-- WHERE usc.user_id = auth.uid()
-- WITH (security_barrier = true);

-- View para Charges del usuario actual
-- CREATE OR REPLACE VIEW public.user_charges AS
-- SELECT 
--   c.id,
--   c.object,
--   c.amount,
--   c.amount_captured,
--   c.amount_refunded,
--   c.currency,
--   c.created,
--   c.description,
--   c.invoice,
--   c.paid,
--   c.status,
--   c.payment_intent,
--   c.receipt_url,
--   c.receipt_number,
--   c.refunded,
--   c.metadata,
--   c.livemode,
--   usc.stripe_customer_id as customer_id
-- FROM stripe.charges c
-- INNER JOIN public.user_stripe_customers usc ON c.customer = usc.stripe_customer_id
-- WHERE usc.user_id = auth.uid()
-- WITH (security_barrier = true);

-- View para Subscriptions del usuario actual
-- CREATE OR REPLACE VIEW public.user_subscriptions AS
-- SELECT 
--   s.id,
--   s.object,
--   s.cancel_at_period_end,
--   s.cancel_at,
--   s.canceled_at,
--   s.collection_method,
--   s.created,
--   s.currency,
--   s.current_period_end,
--   s.current_period_start,
--   s.default_payment_method,
--   s.items,
--   s.latest_invoice,
--   s.livemode,
--   s.metadata,
--   s.status,
--   s.trial_end,
--   s.trial_start,
--   usc.stripe_customer_id as customer_id
-- FROM stripe.subscriptions s
-- INNER JOIN public.user_stripe_customers usc ON s.customer = usc.stripe_customer_id
-- WHERE usc.user_id = auth.uid()
-- WITH (security_barrier = true);

-- View para Invoices del usuario actual
-- CREATE OR REPLACE VIEW public.user_invoices AS
-- SELECT 
--   i.id,
--   i.object,
--   i.amount_due,
--   i.amount_paid,
--   i.amount_remaining,
--   i.currency,
--   i.created,
--   i.description,
--   i.hosted_invoice_url,
--   i.invoice_pdf,
--   i.paid,
--   i.status,
--   i.subscription,
--   i.total,
--   i.metadata,
--   i.livemode,
--   usc.stripe_customer_id as customer_id
-- FROM stripe.invoices i
-- INNER JOIN public.user_stripe_customers usc ON i.customer = usc.stripe_customer_id
-- WHERE usc.user_id = auth.uid()
-- WITH (security_barrier = true);

-- ============================================================================
-- PASO 8: FUNCIONES HELPER PARA REFRESH DE MATERIALIZED VIEWS
-- ============================================================================

-- NOTA: Las funciones no se pueden crear sin las materialized views.
-- Se omiten por ahora. Cuando el FDW esté disponible, descomentar el código.

-- CREATE OR REPLACE FUNCTION private.refresh_stripe_materialized_views()
-- RETURNS void
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   REFRESH MATERIALIZED VIEW CONCURRENTLY private.stripe_products;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY private.stripe_prices;
--   
--   RAISE NOTICE 'Stripe materialized views refreshed successfully';
-- END;
-- $$;

-- Grant ejecución a roles necesarios
-- GRANT EXECUTE ON FUNCTION private.refresh_stripe_materialized_views() TO postgres;
-- GRANT EXECUTE ON FUNCTION private.refresh_stripe_materialized_views() TO authenticated;

-- ============================================================================
-- PASO 9: FUNCIONES HELPER PARA CREAR STRIPE CUSTOMER
-- ============================================================================

-- NOTA: Las funciones no se pueden crear sin las foreign tables.
-- Se omiten por ahora. Cuando el FDW esté disponible, descomentar el código.

-- CREATE OR REPLACE FUNCTION public.create_stripe_customer(
--   p_user_id UUID,
--   p_email TEXT DEFAULT NULL,
--   p_name TEXT DEFAULT NULL,
--   p_metadata JSONB DEFAULT '{}'::jsonb
-- )
-- RETURNS TABLE (
--   customer_id TEXT,
--   success BOOLEAN,
--   message TEXT
-- )
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--   v_customer_id TEXT;
--   v_existing_customer TEXT;
-- BEGIN
--   -- Verificar si el usuario ya tiene un customer
--   SELECT stripe_customer_id INTO v_existing_customer
--   FROM public.user_stripe_customers
--   WHERE user_id = p_user_id;
--   
--   IF v_existing_customer IS NOT NULL THEN
--     RETURN QUERY SELECT 
--       v_existing_customer::TEXT,
--       false::BOOLEAN,
--       'User already has a Stripe customer'::TEXT;
--     RETURN;
--   END IF;
--   
--   -- Crear customer en Stripe via FDW INSERT
--   INSERT INTO stripe.customers (email, name, metadata)
--   VALUES (p_email, p_name, p_metadata)
--   RETURNING id INTO v_customer_id;
--   
--   -- Guardar mapeo en tabla local
--   INSERT INTO public.user_stripe_customers (user_id, stripe_customer_id, metadata)
--   VALUES (p_user_id, v_customer_id, p_metadata)
--   ON CONFLICT (user_id) DO NOTHING;
--   
--   RETURN QUERY SELECT 
--     v_customer_id::TEXT,
--     true::BOOLEAN,
--     'Stripe customer created successfully'::TEXT;
-- END;
-- $$;

-- Grant ejecución a usuarios autenticados
-- GRANT EXECUTE ON FUNCTION public.create_stripe_customer(UUID, TEXT, TEXT, JSONB) TO authenticated;

-- ============================================================================
-- PASO 10: COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON SCHEMA stripe IS 'Schema privado para Stripe FDW - NO exponer via API';
COMMENT ON SCHEMA private IS 'Schema privado para materialized views y funciones internas';

COMMENT ON TABLE public.user_stripe_customers IS 'Mapeo entre usuarios de Supabase Auth y customers de Stripe';

COMMENT ON MATERIALIZED VIEW private.stripe_products IS 'Materialized view de productos de Stripe para performance (refresh manual)';
COMMENT ON MATERIALIZED VIEW private.stripe_prices IS 'Materialized view de precios de Stripe para performance (refresh manual)';

COMMENT ON FUNCTION public.create_stripe_customer IS 'Crea un Stripe customer para un usuario y lo mapea en user_stripe_customers';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- 
-- NOTAS IMPORTANTES:
-- 1. Vault no está disponible en este sistema PostgreSQL
-- 2. Credenciales almacenadas temporalmente en server (reemplazar con Vault cuando esté disponible)
-- 3. Views usan SECURITY BARRIER en lugar de RLS directo
-- 4. Materialized views requieren refresh manual o pg_cron
--
-- PRÓXIMOS PASOS:
-- 1. Instalar extensión Vault cuando esté disponible
-- 2. Migrar credenciales a Vault
-- 3. Configurar Webhook en Stripe
-- 4. Crear Edge Function para webhooks
-- 5. Implementar refresh automático de materialized views
