-- ============================================================================
-- SECURITY HARDENING SCRIPT FOR COMPLICESCONECTA (FINAL)
-- Versión: v3.8.1
-- Fecha: 13 Enero 2026
-- ============================================================================

-- Crear schema security
CREATE SCHEMA IF NOT EXISTS security;

-- ============================================================================
-- PASO 1: MITIGACIÓN DE CREDENCIALES STRIPE
-- ============================================================================

-- NOTA: El server stripe_server no existe. Se omite la rotación de credenciales.
-- Cuando el FDW esté disponible, descomentar el siguiente código:

-- -- Rotar clave Stripe en server (reemplazar con nueva clave)
-- ALTER SERVER stripe_server OPTIONS (
--   SET api_key 'sk_live_YOUR_NEW_STRIPE_SECRET_KEY_HERE'
-- );

-- ============================================================================
-- PASO 2: HABILITAR RLS EN TABLAS CRÍTICAS
-- ============================================================================

-- Tabla: app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role can manage app config"
ON public.app_config
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Authenticated users can read app config"
ON public.app_config
FOR SELECT
USING (auth.role() = 'authenticated');

-- Tabla: invitation_templates
ALTER TABLE public.invitation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admin can view invitation templates"
ON public.invitation_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "Admin can manage invitation templates"
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

CREATE POLICY IF NOT EXISTS "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "Service role can manage user roles"
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- PASO 3: RESTRINGIR ACCESO A SCHEMA STRIPE
-- ============================================================================

REVOKE ALL ON SCHEMA stripe FROM PUBLIC;
REVOKE ALL ON SCHEMA stripe FROM anon;
REVOKE ALL ON SCHEMA stripe FROM authenticated;

GRANT USAGE ON SCHEMA stripe TO postgres;
GRANT ALL ON SCHEMA stripe TO postgres;

-- NOTA: No hay foreign tables en el schema stripe. Se omite la revocación de permisos.
-- Cuando el FDW esté disponible, descomentar el siguiente código:

-- DO $$
-- DECLARE
--   table_rec RECORD;
-- BEGIN
--   FOR table_rec IN 
--     SELECT foreign_table_name 
--     FROM information_schema.foreign_tables 
--     WHERE foreign_table_schema = 'stripe'
--   LOOP
--     EXECUTE format('REVOKE ALL ON TABLE stripe.%I FROM PUBLIC', table_rec.foreign_table_name);
--     EXECUTE format('REVOKE ALL ON TABLE stripe.%I FROM anon', table_rec.foreign_table_name);
--     EXECUTE format('REVOKE ALL ON TABLE stripe.%I FROM authenticated', table_rec.foreign_table_name);
--     EXECUTE format('GRANT ALL ON TABLE stripe.%I TO postgres', table_rec.foreign_table_name);
--   END LOOP;
-- END $$;

-- ============================================================================
-- PASO 4: RESTRINGIR ACCESO A SCHEMA PRIVATE
-- ============================================================================

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

GRANT USAGE ON SCHEMA private TO postgres;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT ALL ON SCHEMA private TO postgres;
GRANT ALL ON SCHEMA private TO service_role;

-- ============================================================================
-- PASO 5: CREAR FUNCIONES DE MONITOREO DE SEGURIDAD
-- ============================================================================

CREATE OR REPLACE FUNCTION security.check_tables_without_rls()
RETURNS TABLE (
  schema_name TEXT,
  table_name TEXT,
  has_rls BOOLEAN,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.schemaname as schema_name,
    t.tablename as table_name,
    t.rowsecurity as has_rls,
    CASE 
      WHEN t.schemaname = 'public' AND t.rowsecurity = false THEN 'HIGH'
      WHEN t.schemaname = 'public' AND t.rowsecurity = true THEN 'LOW'
      ELSE 'MEDIUM'
    END as severity
  FROM pg_tables t
  WHERE t.schemaname IN ('public', 'stripe', 'private')
  ORDER BY 
    CASE 
      WHEN t.schemaname = 'public' AND t.rowsecurity = false THEN 1
      ELSE 2
    END,
    t.schemaname,
    t.tablename;
END;
$$;

CREATE OR REPLACE FUNCTION security.check_exposed_credentials()
RETURNS TABLE (
  server_name TEXT,
  has_credentials BOOLEAN,
  severity TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.srvname::TEXT as server_name,
    CASE 
      WHEN s.srvoptions::text LIKE '%api_key=%sk_%' THEN true
      ELSE false
    END as has_credentials,
    CASE 
      WHEN s.srvoptions::text LIKE '%api_key=%sk_%' THEN 'CRITICAL'
      ELSE 'LOW'
    END as severity,
    CASE 
      WHEN s.srvoptions::text LIKE '%api_key=%sk_%' THEN 'Migrate to Vault immediately'
      ELSE 'No action needed'
    END as recommendation
  FROM pg_foreign_server s
  WHERE s.srvname LIKE '%stripe%' OR s.srvname LIKE '%api%';
END;
$$;

CREATE OR REPLACE FUNCTION security.check_schema_permissions()
RETURNS TABLE (
  schema_name TEXT,
  schema_owner TEXT,
  public_access BOOLEAN,
  severity TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::TEXT as schema_name,
    n.nspowner::regrole::text as schema_owner,
    CASE 
      WHEN n.nspacl IS NULL THEN false
      WHEN n.nspacl::text LIKE '%PUBLIC%' THEN true
      ELSE false
    END as public_access,
    CASE 
      WHEN n.nspname IN ('stripe', 'private') AND n.nspacl::text LIKE '%PUBLIC%' THEN 'HIGH'
      WHEN n.nspname = 'public' THEN 'LOW'
      ELSE 'MEDIUM'
    END as severity,
    CASE 
      WHEN n.nspname IN ('stripe', 'private') AND n.nspacl::text LIKE '%PUBLIC%' THEN 'Revoke PUBLIC access immediately'
      WHEN n.nspname = 'public' THEN 'Review permissions'
      ELSE 'No action needed'
    END as recommendation
  FROM pg_namespace n
  WHERE n.nspname IN ('public', 'stripe', 'private')
  ORDER BY 
    CASE 
      WHEN n.nspname IN ('stripe', 'private') AND n.nspacl::text LIKE '%PUBLIC%' THEN 1
      ELSE 2
    END,
    n.nspname;
END;
$$;

-- ============================================================================
-- PASO 6: CREAR DASHBOARD DE SEGURIDAD
-- ============================================================================

CREATE OR REPLACE VIEW security.security_dashboard AS
SELECT 
  'tables_without_rls' as check_type,
  COUNT(*) as issues,
  MAX(severity) as max_severity
FROM security.check_tables_without_rls()
WHERE has_rls = false

UNION ALL

SELECT 
  'exposed_credentials' as check_type,
  COUNT(*) as issues,
  MAX(severity) as max_severity
FROM security.check_exposed_credentials()
WHERE has_credentials = true

UNION ALL

SELECT 
  'schema_permissions' as check_type,
  COUNT(*) as issues,
  MAX(severity) as max_severity
FROM security.check_schema_permissions()
WHERE public_access = true;

-- ============================================================================
-- PASO 7: VERIFICACIÓN FINAL
-- ============================================================================

SELECT 'Security Audit Results' as report_type, NOW() as generated_at;

SELECT * FROM security.check_tables_without_rls() WHERE has_rls = false;
SELECT * FROM security.check_exposed_credentials() WHERE has_credentials = true;
SELECT * FROM security.check_schema_permissions() WHERE public_access = true;
SELECT * FROM security.security_dashboard;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
