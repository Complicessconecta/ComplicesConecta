-- ============================================================================
-- SECURITY HARDENING SCRIPT FOR COMPLICESCONECTA (SIMPLIFIED)
-- Versión: v3.8.1
-- Fecha: 13 Enero 2026
-- ============================================================================

-- ============================================================================
-- PASO 1: HABILITAR RLS EN TABLAS CRÍTICAS
-- ============================================================================

-- Tabla: app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage app config" ON public.app_config;
CREATE POLICY "Service role can manage app config"
ON public.app_config
FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read app config" ON public.app_config;
CREATE POLICY "Authenticated users can read app config"
ON public.app_config
FOR SELECT
USING (auth.role() = 'authenticated');

-- Tabla: invitation_templates
ALTER TABLE public.invitation_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view invitation templates" ON public.invitation_templates;
CREATE POLICY "Admin can view invitation templates"
ON public.invitation_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admin can manage invitation templates" ON public.invitation_templates;
CREATE POLICY "Admin can manage invitation templates"
ON public.invitation_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Tabla: user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
CREATE POLICY "Admin can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Service role can manage user roles" ON public.user_roles;
CREATE POLICY "Service role can manage user roles"
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- PASO 2: RESTRINGIR ACCESO A SCHEMA STRIPE
-- ============================================================================

REVOKE ALL ON SCHEMA stripe FROM PUBLIC;
REVOKE ALL ON SCHEMA stripe FROM anon;
REVOKE ALL ON SCHEMA stripe FROM authenticated;

GRANT USAGE ON SCHEMA stripe TO postgres;
GRANT ALL ON SCHEMA stripe TO postgres;

DO $$
DECLARE
  table_rec RECORD;
BEGIN
  FOR table_rec IN 
    SELECT foreign_table_name 
    FROM information_schema.foreign_tables 
    WHERE foreign_table_schema = 'stripe'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE stripe.%I FROM PUBLIC', table_rec.foreign_table_name);
    EXECUTE format('REVOKE ALL ON TABLE stripe.%I FROM anon', table_rec.foreign_table_name);
    EXECUTE format('REVOKE ALL ON TABLE stripe.%I FROM authenticated', table_rec.foreign_table_name);
    EXECUTE format('GRANT ALL ON TABLE stripe.%I TO postgres', table_rec.foreign_table_name);
  END LOOP;
END $$;

-- ============================================================================
-- PASO 3: RESTRINGIR ACCESO A SCHEMA PRIVATE
-- ============================================================================

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

GRANT USAGE ON SCHEMA private TO postgres;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT ALL ON SCHEMA private TO postgres;
GRANT ALL ON SCHEMA private TO service_role;

-- ============================================================================
-- PASO 4: VERIFICACIÓN
-- ============================================================================

-- Verificar tablas sin RLS
SELECT 'Tablas sin RLS' as check_type;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Verificar credenciales expuestas
SELECT 'Credenciales expuestas' as check_type;
SELECT srvname, 
       CASE WHEN srvoptions::text LIKE '%api_key=%sk_%' THEN 'CRITICAL - Migrate to Vault' ELSE 'OK' END as status
FROM pg_foreign_server 
WHERE srvname LIKE '%stripe%';

-- Verificar permisos de schema
SELECT 'Permisos de schema' as check_type;
SELECT nspname, 
       CASE WHEN nspacl::text LIKE '%PUBLIC%' THEN 'PUBLIC ACCESS - Review' ELSE 'RESTRICTED' END as access
FROM pg_namespace 
WHERE nspname IN ('stripe', 'private');

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
