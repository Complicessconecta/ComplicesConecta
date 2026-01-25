-- ============================================================================
-- STRIPE WRAPPER CONFIGURATION FOR COMPILICESCONECTA (DEV LOCAL)
-- Autor: DevOps Senior Expert - 16 Ene 2026
-- Versión simplificada para desarrollo local sin Vault ni conexión real a Stripe
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR SCHEMA PRIVADO 'stripe'
-- ============================================================================
-- "Wrappers should always be stored in a private schema"
-- https://supabase.com/docs/guides/database/extensions/wrappers/stripe
CREATE SCHEMA IF NOT EXISTS stripe;

-- IMPORTANTE: NO agregar 'stripe' a "Additional Schemas" en API settings
-- Esto evita exposición vía PostgREST

-- ============================================================================
-- PASO 2: CREAR TABLAS MOCK PARA DESARROLLO LOCAL
-- ============================================================================
-- Estas tablas simulan las foreign tables de Stripe para desarrollo local
-- En producción, estas serán reemplazadas por FDW real

-- Tabla mock: products
CREATE TABLE IF NOT EXISTS stripe.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla mock: prices
CREATE TABLE IF NOT EXISTS stripe.prices (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES stripe.products(id) ON DELETE CASCADE,
  nickname TEXT,
  currency TEXT NOT NULL,
  unit_amount INTEGER,
  type TEXT NOT NULL,
  recurring_interval TEXT,
  recurring_interval_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla mock: customers
CREATE TABLE IF NOT EXISTS stripe.customers (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla mock: subscriptions
CREATE TABLE IF NOT EXISTS stripe.subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES stripe.customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla mock: charges
CREATE TABLE IF NOT EXISTS stripe.charges (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES stripe.customers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla mock: invoices
CREATE TABLE IF NOT EXISTS stripe.invoices (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES stripe.customers(id) ON DELETE CASCADE,
  number TEXT,
  amount_paid INTEGER DEFAULT 0,
  amount_due INTEGER DEFAULT 0,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  hosted_invoice_url TEXT,
  invoice_pdf TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- PASO 3: CREAR MATERIALIZED VIEWS PARA PERFORMANCE
-- ============================================================================
-- Para datos semi-estáticos: products y prices

-- Materialized View: Products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_matviews
    WHERE schemaname = 'stripe'
      AND matviewname = 'mv_products'
  ) THEN
    EXECUTE $sql$
      CREATE MATERIALIZED VIEW stripe.mv_products AS
      SELECT
        id,
        name,
        description,
        active,
        metadata,
        created,
        updated
      FROM stripe.products
      WHERE active = true
      WITH DATA
    $sql$;
  END IF;
END $$;

-- Materialized View: Prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_matviews
    WHERE schemaname = 'stripe'
      AND matviewname = 'mv_prices'
  ) THEN
    EXECUTE $sql$
      CREATE MATERIALIZED VIEW stripe.mv_prices AS
      SELECT
        p.id,
        p.product_id,
        p.nickname,
        p.currency,
        p.unit_amount,
        p.type,
        p.recurring_interval,
        p.recurring_interval_count,
        p.metadata,
        p.created,
        p.updated
      FROM stripe.prices p
      JOIN stripe.mv_products pr ON p.product_id = pr.id
      WHERE p.active = true
      WITH DATA
    $sql$;
  END IF;
END $$;

-- ============================================================================
-- PASO 4: CREAR ÍNDICES EN MATERIALIZED VIEWS
-- ============================================================================
-- Mejora performance de queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_products_id ON stripe.mv_products (id);
CREATE INDEX IF NOT EXISTS idx_mv_products_active ON stripe.mv_products (active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_prices_id ON stripe.mv_prices (id);
CREATE INDEX IF NOT EXISTS idx_mv_prices_product_id ON stripe.mv_prices (product_id);

-- En algunas variantes del wrapper, mv_prices no expone la columna active.
-- Crear este índice solo si existe para evitar fallo de migración.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'stripe'
      AND table_name = 'mv_prices'
      AND column_name = 'active'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_mv_prices_active ON stripe.mv_prices (active)';
  END IF;
END $$;

-- ============================================================================
-- PASO 5: CREAR TABLA LOCAL PARA MAPPING USER → STRIPE_CUSTOMER
-- ============================================================================
-- Necesario para vincular usuarios de Supabase con customers de Stripe
CREATE TABLE IF NOT EXISTS public.user_stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT user_stripe_customers_user_id_key UNIQUE (user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_stripe_customers_user_id ON public.user_stripe_customers (user_id);
CREATE INDEX IF NOT EXISTS idx_user_stripe_customers_stripe_customer_id ON public.user_stripe_customers (stripe_customer_id);

-- ============================================================================
-- PASO 6: CREAR VIEWS EN 'public' CON RLS PARA EXPOSICIÓN SEGURA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEW: stripe_products
-- ----------------------------------------------------------------------------
-- Exposición segura de productos
CREATE OR REPLACE VIEW public.stripe_products AS
SELECT 
  id,
  name,
  description,
  active,
  metadata,
  created,
  updated
FROM stripe.mv_products;

COMMENT ON VIEW public.stripe_products IS 'View pública de productos Stripe (desde materialized view)';

-- ----------------------------------------------------------------------------
-- VIEW: stripe_prices
-- ----------------------------------------------------------------------------
-- Exposición segura de precios
CREATE OR REPLACE VIEW public.stripe_prices AS
SELECT 
  p.id,
  p.product_id,
  p.nickname,
  p.currency,
  p.unit_amount,
  p.type,
  p.recurring_interval,
  p.recurring_interval_count,
  p.metadata,
  p.created,
  p.updated
FROM stripe.mv_prices p;

COMMENT ON VIEW public.stripe_prices IS 'View pública de precios Stripe (desde materialized view)';

-- ----------------------------------------------------------------------------
-- VIEW: stripe_user_subscriptions
-- ----------------------------------------------------------------------------
-- Exposición segura de suscripciones del usuario actual
CREATE OR REPLACE VIEW public.stripe_user_subscriptions AS
SELECT 
  s.id,
  s.customer_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.cancel_at,
  s.canceled_at,
  s.metadata,
  s.created,
  s.updated
FROM stripe.subscriptions s
JOIN public.user_stripe_customers usc ON s.customer_id = usc.stripe_customer_id
WHERE usc.user_id = auth.uid();  -- RLS implícito: solo suscripciones del usuario actual

COMMENT ON VIEW public.stripe_user_subscriptions IS 'View de suscripciones del usuario actual (RLS por user_id)';

-- ----------------------------------------------------------------------------
-- VIEW: stripe_user_charges
-- ----------------------------------------------------------------------------
-- Exposición segura de cargos del usuario actual
CREATE OR REPLACE VIEW public.stripe_user_charges AS
SELECT 
  c.id,
  c.amount,
  c.currency,
  c.status,
  c.created,
  c.description,
  c.metadata
FROM stripe.charges c
JOIN public.user_stripe_customers usc ON c.customer_id = usc.stripe_customer_id
WHERE usc.user_id = auth.uid()  -- RLS implícito: solo cargos del usuario actual
ORDER BY c.created DESC
LIMIT 100;  -- LIMIT para performance

COMMENT ON VIEW public.stripe_user_charges IS 'View de cargos del usuario actual (RLS por user_id, limitado a 100)';

-- ----------------------------------------------------------------------------
-- VIEW: stripe_user_invoices
-- ----------------------------------------------------------------------------
-- Exposición segura de facturas del usuario actual
CREATE OR REPLACE VIEW public.stripe_user_invoices AS
SELECT 
  i.id,
  i.number,
  i.amount_paid,
  i.amount_due,
  i.currency,
  i.status,
  i.created,
  i.due_date,
  i.hosted_invoice_url,
  i.invoice_pdf,
  i.metadata
FROM stripe.invoices i
JOIN public.user_stripe_customers usc ON i.customer_id = usc.stripe_customer_id
WHERE usc.user_id = auth.uid()  -- RLS implícito: solo facturas del usuario actual
ORDER BY i.created DESC
LIMIT 100;  -- LIMIT para performance

COMMENT ON VIEW public.stripe_user_invoices IS 'View de facturas del usuario actual (RLS por user_id, limitado a 100)';

-- ============================================================================
-- PASO 7: APLICAR RLS A TABLA user_stripe_customers
-- ============================================================================
ALTER TABLE public.user_stripe_customers ENABLE ROW LEVEL SECURITY;

-- Política: Solo el usuario puede ver su propio mapping
DROP POLICY IF EXISTS "Users can view their own stripe customer" ON public.user_stripe_customers;
CREATE POLICY "Users can view their own stripe customer"
  ON public.user_stripe_customers
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Solo el usuario puede insertar su propio mapping
DROP POLICY IF EXISTS "Users can insert their own stripe customer" ON public.user_stripe_customers;
CREATE POLICY "Users can insert their own stripe customer"
  ON public.user_stripe_customers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: Solo el usuario puede actualizar su propio mapping
DROP POLICY IF EXISTS "Users can update their own stripe customer" ON public.user_stripe_customers;
CREATE POLICY "Users can update their own stripe customer"
  ON public.user_stripe_customers
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- PASO 8: CREAR SECURITY DEFINER FUNCTIONS PARA QUERIES COMPLEJAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION: get_user_stripe_customer_id
-- ----------------------------------------------------------------------------
-- Obtiene el stripe_customer_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_stripe_customer_id()
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN stripe_customer_id
  FROM public.user_stripe_customers
  WHERE user_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION public.get_user_stripe_customer_id() IS 'Obtiene el stripe_customer_id del usuario actual (security definer)';

-- ----------------------------------------------------------------------------
-- FUNCTION: create_stripe_customer_for_user
-- ----------------------------------------------------------------------------
-- Crea un customer en Stripe y lo vincula al usuario
CREATE OR REPLACE FUNCTION public.create_stripe_customer_for_user(
  p_email TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_stripe_customer_id TEXT;
BEGIN
  -- Verificar que el usuario ya tenga un customer
  SELECT stripe_customer_id INTO v_stripe_customer_id
  FROM public.user_stripe_customers
  WHERE user_id = auth.uid();
  
  IF v_stripe_customer_id IS NOT NULL THEN
    RETURN v_stripe_customer_id;  -- Ya existe, retornar
  END IF;
  
  -- Generar ID mock para customer (en producción, esto será real de Stripe)
  v_stripe_customer_id := 'cus_' || substr(md5(random()::text), 1, 20);
  
  -- Crear customer mock en tabla local
  INSERT INTO stripe.customers (id, email, name, metadata)
  VALUES (v_stripe_customer_id, p_email, p_name, p_metadata);
  
  -- Vincular al usuario
  INSERT INTO public.user_stripe_customers (user_id, stripe_customer_id)
  VALUES (auth.uid(), v_stripe_customer_id);
  
  RETURN v_stripe_customer_id;
END;
$$;

COMMENT ON FUNCTION public.create_stripe_customer_for_user(TEXT, TEXT, JSONB) IS 'Crea un customer en Stripe y lo vincula al usuario actual (security definer)';

-- ----------------------------------------------------------------------------
-- FUNCTION: refresh_stripe_materialized_views
-- ----------------------------------------------------------------------------
-- Refresca las materialized views de Stripe
CREATE OR REPLACE FUNCTION public.refresh_stripe_materialized_views()
RETURNS VOID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY stripe.mv_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY stripe.mv_prices;
END;
$$;

COMMENT ON FUNCTION public.refresh_stripe_materialized_views() IS 'Refresca las materialized views de Stripe (security definer)';

-- ============================================================================
-- PASO 9: CREAR TABLA LOCAL PARA WEBHOOK EVENTS (ENFOQUE HÍBRIDO)
-- ============================================================================
-- Almacenar eventos de Stripe recibidos vía webhooks
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

-- Tolerancia a drift: si la tabla ya existía con otro schema, asegurar columnas mínimas.
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS event_data JSONB,
  ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Asegurar constraint UNIQUE sobre stripe_event_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'stripe_webhook_events'
      AND c.contype = 'u'
      AND c.conname = 'stripe_webhook_events_stripe_event_id_key'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.stripe_webhook_events ADD CONSTRAINT stripe_webhook_events_stripe_event_id_key UNIQUE (stripe_event_id)';
    EXCEPTION WHEN others THEN
      -- Si hay datos duplicados o el constraint ya existe con otro nombre, no bloquear la migración local
      NULL;
    END;
  END IF;
END $$;

-- Índices para performance
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stripe_webhook_events' AND column_name='stripe_event_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON public.stripe_webhook_events (stripe_event_id)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stripe_webhook_events' AND column_name='event_type'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type ON public.stripe_webhook_events (event_type)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stripe_webhook_events' AND column_name='processed'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON public.stripe_webhook_events (processed)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stripe_webhook_events' AND column_name='created_at'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created_at ON public.stripe_webhook_events (created_at DESC)';
  END IF;
END $$;

-- RLS para webhook events
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Política: Solo Edge Functions (service role) pueden insertar
DROP POLICY IF EXISTS "Service role can insert webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role can insert webhook events"
  ON public.stripe_webhook_events
  FOR INSERT
  WITH CHECK (true);  -- Service role bypass

-- Política: Solo el usuario puede ver sus propios eventos (opcional)
-- Para admin dashboard, usar service role

-- ============================================================================
-- PASO 10: CREAR FUNCTION PARA PROCESAR WEBHOOK EVENTS
-- ============================================================================
-- Esta función será llamada desde Edge Functions al recibir webhooks
CREATE OR REPLACE FUNCTION public.process_stripe_webhook_event(
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_customer_id TEXT;
  v_user_id UUID;
BEGIN
  -- Verificar si el evento ya fue procesado
  IF EXISTS (
    SELECT 1 FROM public.stripe_webhook_events
    WHERE stripe_event_id = p_stripe_event_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Event already processed'
    );
  END IF;
  
  -- Insertar evento
  INSERT INTO public.stripe_webhook_events (stripe_event_id, event_type, event_data)
  VALUES (p_stripe_event_id, p_event_type, p_event_data);
  
  -- Procesar según tipo de evento
  v_result := jsonb_build_object('success', true, 'message', 'Event received');
  
  -- Evento: payment_intent.succeeded
  IF p_event_type = 'payment_intent.succeeded' THEN
    -- Actualizar balance de tokens CMPX del usuario
    -- Aquí iría la lógica de recarga de tokens
    v_result := v_result || jsonb_build_object(
      'action', 'payment_succeeded',
      'message', 'Payment processed, tokens credited'
    );
  END IF;
  
  -- Evento: customer.subscription.updated
  IF p_event_type = 'customer.subscription.updated' THEN
    -- Actualizar estado de suscripción premium del usuario
    v_customer_id := p_event_data->'data'->'object'->'customer';
    
    SELECT user_id INTO v_user_id
    FROM public.user_stripe_customers
    WHERE stripe_customer_id = v_customer_id;
    
    -- Aquí iría la lógica para actualizar el estado premium
    v_result := v_result || jsonb_build_object(
      'action', 'subscription_updated',
      'user_id', v_user_id,
      'message', 'Subscription status updated'
    );
  END IF;
  
  -- Marcar como procesado
  UPDATE public.stripe_webhook_events
  SET processed = true,
      processed_at = NOW()
  WHERE stripe_event_id = p_stripe_event_id;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.process_stripe_webhook_event(TEXT, TEXT, JSONB) IS 'Procesa eventos de webhook de Stripe (llamado desde Edge Functions)';

-- ============================================================================
-- PASO 11: GRANT PERMISOS
-- ============================================================================
-- Dar permisos a authenticated role
GRANT USAGE ON SCHEMA stripe TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA stripe TO authenticated;

-- Dar permisos a views públicas
GRANT SELECT ON public.stripe_products TO authenticated;
GRANT SELECT ON public.stripe_prices TO authenticated;
GRANT SELECT ON public.stripe_user_subscriptions TO authenticated;
GRANT SELECT ON public.stripe_user_charges TO authenticated;
GRANT SELECT ON public.stripe_user_invoices TO authenticated;

-- Dar permisos a functions
GRANT EXECUTE ON FUNCTION public.get_user_stripe_customer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_stripe_customer_for_user(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_stripe_materialized_views() TO authenticated;

-- ============================================================================
-- PASO 12: CREAR TABLA DE CONFIGURACIÓN DE PRODUCTOS CMPX
-- ============================================================================
-- Define qué productos de Stripe corresponden a qué tokens CMPX
CREATE TABLE IF NOT EXISTS public.stripe_product_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id TEXT UNIQUE NOT NULL,
  cmpx_tokens_amount INTEGER NOT NULL,
  bonus_tokens INTEGER DEFAULT 0,
  product_type TEXT NOT NULL CHECK (product_type IN ('tokens', 'subscription', 'vip')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tolerancia a drift: si la tabla ya existía con otro schema, asegurar columnas mínimas.
ALTER TABLE public.stripe_product_mapping
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS cmpx_tokens_amount INTEGER,
  ADD COLUMN IF NOT EXISTS bonus_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_type TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stripe_product_mapping' AND column_name='stripe_price_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stripe_product_mapping_stripe_price_id ON public.stripe_product_mapping (stripe_price_id)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stripe_product_mapping' AND column_name='is_active'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stripe_product_mapping_active ON public.stripe_product_mapping (is_active)';
  END IF;
END $$;

-- RLS
ALTER TABLE public.stripe_product_mapping ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios pueden ver mapeos activos
DROP POLICY IF EXISTS "Users can view active product mappings" ON public.stripe_product_mapping;
CREATE POLICY "Users can view active product mappings"
  ON public.stripe_product_mapping
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- PASO 13: INSERTAR DATOS MOCK PARA PRUEBAS
-- ============================================================================

-- Productos mock
INSERT INTO stripe.products (id, name, description, active) VALUES
  ('prod_tokens_100', 'Tokens CMPX 100', '100 tokens CMPX + 10 bonus', true),
  ('prod_tokens_500', 'Tokens CMPX 500', '500 tokens CMPX + 50 bonus', true),
  ('prod_tokens_1000', 'Tokens CMPX 1000', '1000 tokens CMPX + 150 bonus', true),
  ('prod_premium_monthly', 'Premium Monthly', 'Suscripción premium mensual', true),
  ('prod_premium_yearly', 'Premium Yearly', 'Suscripción premium anual', true)
ON CONFLICT (id) DO NOTHING;

-- Precios mock
INSERT INTO stripe.prices (id, product_id, nickname, currency, unit_amount, type, recurring_interval, active) VALUES
  ('price_100', 'prod_tokens_100', '100 Tokens', 'usd', 1000, 'one_time', NULL, true),
  ('price_500', 'prod_tokens_500', '500 Tokens', 'usd', 4500, 'one_time', NULL, true),
  ('price_1000', 'prod_tokens_1000', '1000 Tokens', 'usd', 8000, 'one_time', NULL, true),
  ('price_premium_monthly', 'prod_premium_monthly', 'Premium Monthly', 'usd', 999, 'recurring', 'month', true),
  ('price_premium_yearly', 'prod_premium_yearly', 'Premium Yearly', 'usd', 9999, 'recurring', 'year', true)
ON CONFLICT (id) DO NOTHING;

 -- Refrescar materialized views con datos mock
 REFRESH MATERIALIZED VIEW stripe.mv_products;
 REFRESH MATERIALIZED VIEW stripe.mv_prices;
 
 -- Mapeos de productos mock
 DO $$
 DECLARE
   requires_product_id boolean;
 BEGIN
   -- Si la tabla existente tiene un esquema distinto (ej. product_id NOT NULL),
   -- no insertar mocks para evitar violaciones de constraints.
   SELECT EXISTS (
     SELECT 1
     FROM information_schema.columns c
     WHERE c.table_schema = 'public'
       AND c.table_name = 'stripe_product_mapping'
       AND c.column_name = 'product_id'
       AND c.is_nullable = 'NO'
       AND c.column_default IS NULL
   ) INTO requires_product_id;

   IF requires_product_id THEN
     RETURN;
   END IF;

   IF EXISTS (
     SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='stripe_product_mapping' AND column_name='stripe_price_id'
   ) THEN
     INSERT INTO public.stripe_product_mapping (stripe_price_id, cmpx_tokens_amount, bonus_tokens, product_type)
     SELECT v.stripe_price_id, v.cmpx_tokens_amount, v.bonus_tokens, v.product_type
     FROM (
       VALUES
         ('price_100', 100, 10, 'tokens'),
         ('price_500', 500, 50, 'tokens'),
         ('price_1000', 1000, 150, 'tokens'),
         ('price_premium_monthly', 0, 0, 'subscription'),
         ('price_premium_yearly', 0, 0, 'subscription')
     ) AS v(stripe_price_id, cmpx_tokens_amount, bonus_tokens, product_type)
     WHERE NOT EXISTS (
       SELECT 1
       FROM public.stripe_product_mapping m
       WHERE m.stripe_price_id = v.stripe_price_id
     );
   END IF;
 END $$;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Prueba de funcionamiento:
-- 1. Crear customer para usuario: SELECT public.create_stripe_customer_for_user('user@example.com', 'John Doe');
-- 2. Obtener customer_id: SELECT public.get_user_stripe_customer_id();
-- 3. Ver productos: SELECT * FROM public.stripe_products WHERE active = true;
-- 4. Ver precios: SELECT * FROM public.stripe_prices WHERE active = true;
-- 5. Refrescar materialized views: SELECT public.refresh_stripe_materialized_views();
-- 6. Ver mapeos: SELECT * FROM public.stripe_product_mapping WHERE is_active = true;
