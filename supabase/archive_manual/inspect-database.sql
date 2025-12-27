-- ============================================================================
-- SCRIPT DE INSPECCIÓN DE BASE DE DATOS SUPABASE
-- ============================================================================
-- Descripción: Script SQL para inspeccionar todo el esquema de la base de datos
-- Fecha: 13 Dic 2025
-- Uso: Ejecutar en Supabase Studio o con psql
-- ============================================================================

-- ============================================================================
-- 1. LISTAR TODAS LAS TABLAS
-- ============================================================================
SELECT 
    schemaname AS schema,
    tablename AS table_name,
    tableowner AS owner
FROM pg_tables
WHERE schemaname IN ('public', 'auth', 'storage')
ORDER BY schemaname, tablename;

-- ============================================================================
-- 2. LISTAR TODAS LAS COLUMNAS DE CADA TABLA
-- ============================================================================
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema IN ('public', 'auth', 'storage')
ORDER BY table_schema, table_name, ordinal_position;

-- ============================================================================
-- 3. LISTAR TODAS LAS POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================
SELECT 
    schemaname AS schema,
    tablename AS table_name,
    policyname AS policy_name,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. VERIFICAR QUÉ TABLAS TIENEN RLS HABILITADO
-- ============================================================================
SELECT 
    schemaname AS schema,
    tablename AS table_name,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 5. LISTAR TODOS LOS ÍNDICES
-- ============================================================================
SELECT 
    schemaname AS schema,
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 6. LISTAR TODAS LAS FOREIGN KEYS (RELACIONES)
-- ============================================================================
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 7. LISTAR TODOS LOS TRIGGERS
-- ============================================================================
SELECT 
    event_object_schema AS schema,
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_timing AS timing,
    action_statement AS action
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 8. LISTAR TODAS LAS FUNCIONES/STORED PROCEDURES
-- ============================================================================
SELECT 
    n.nspname AS schema,
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS return_type,
    pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY function_name;

-- ============================================================================
-- 9. LISTAR TODAS LAS EXTENSIONES INSTALADAS
-- ============================================================================
SELECT 
    extname AS extension_name,
    extversion AS version
FROM pg_extension
ORDER BY extname;

-- ============================================================================
-- 10. LISTAR TODOS LOS TIPOS ENUM
-- ============================================================================
SELECT 
    n.nspname AS schema,
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY enum_name, e.enumsortorder;

-- ============================================================================
-- 11. CONTAR REGISTROS EN CADA TABLA
-- ============================================================================
SELECT 
    schemaname AS schema,
    relname AS table_name,
    n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================================================
-- 12. VERIFICAR TABLA ESPECÍFICA: banner_config
-- ============================================================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'banner_config'
ORDER BY ordinal_position;

-- ============================================================================
-- 13. VERIFICAR POLÍTICAS RLS DE banner_config
-- ============================================================================
SELECT 
    policyname AS policy_name,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'banner_config'
ORDER BY policyname;

-- ============================================================================
-- 14. VERIFICAR ÍNDICES DE banner_config
-- ============================================================================
SELECT 
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'banner_config'
ORDER BY indexname;

-- ============================================================================
-- 15. TAMAÑO DE LAS TABLAS
-- ============================================================================
SELECT 
    schemaname AS schema,
    tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- FIN DEL SCRIPT DE INSPECCIÓN
-- ============================================================================
