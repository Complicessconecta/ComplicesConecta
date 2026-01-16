-- ============================================================================
-- VERIFICACIÓN DE MIGRACIÓN STRIPE WRAPPER
-- ============================================================================

-- Verificar productos
SELECT '=== PRODUCTOS ===' as section;
SELECT * FROM public.stripe_products WHERE active = true;

-- Verificar precios
SELECT '=== PRECIOS ===' as section;
SELECT * FROM public.stripe_prices WHERE active = true;

-- Verificar mapeos
SELECT '=== MAPEOS DE PRODUCTOS ===' as section;
SELECT * FROM public.stripe_product_mapping WHERE is_active = true;

-- Verificar schema stripe (tablas mock)
SELECT '=== TABLAS MOCK EN SCHEMA STRIPE ===' as section;
SELECT id, name, description, active FROM stripe.products LIMIT 5;

-- Verificar materialized views
SELECT '=== MATERIALIZED VIEW PRODUCTS ===' as section;
SELECT * FROM stripe.mv_products;

-- Verificar functions
SELECT '=== FUNCTIONS CREADAS ===' as section;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%stripe%';

-- Verificar views
SELECT '=== VIEWS CREADAS ===' as section;
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'stripe%';

-- Verificar tablas
SELECT '=== TABLAS CREADAS ===' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'stripe%';
