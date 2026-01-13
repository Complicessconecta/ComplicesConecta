-- ============================================================================
-- SECURITY HARDENING SCRIPT FOR COMPLICESCONECTA
-- Versión: v3.8.1
-- Fecha: 13 Enero 2026
-- 
-- Este script mitiga vulnerabilidades identificadas en la base de datos
-- ============================================================================
--
-- VULNERABILIDADES IDENTIFICADAS:
-- 1. Credenciales Stripe en texto plano en pg_foreign_server
-- 2. Tablas sin RLS: app_config, invitation_templates, user_roles
-- 3. Schema stripe sin restricciones de acceso
-- 4. Views sin SECURITY BARRIER (PostgreSQL < 15)
--
-- ============================================================================

-- ============================================================================
-- PASO 1: MITIGACIÓN DE CREDENCIALES STRIPE
-- ============================================================================

-- NOTA CRÍTICA: Las credenciales de Stripe están expuestas en pg_foreign_server
-- Solución temporal: Rotar credenciales y usar Vault cuando esté disponible

-- Rotar clave Stripe en server (reemplazar con nueva clave)
-- IMPORTANTE: Generar nueva clave en Stripe Dashboard antes de ejecutar
ALTER SERVER stripe_server OPTIONS (
  SET api_key 'sk_live_YOUR_NEW_STRIPE_SECRET_KEY_HERE'
);

-- Opcional: Crear función para rotación programada
CREATE OR REPLACE FUNCTION private.rotate_stripe_credentials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_key TEXT;
BEGIN
  -- Aquí se integraría con Vault o sistema de rotación
  -- Por ahora, esto es un placeholder
  RAISE NOTICE 'Implementar rotación de credenciales con Vault';
END;
$$;

-- ============================================================================
-- PASO 2: HABILITAR RLS EN TABLAS CRÍTICAS
-- ============================================================================

-- Tabla: app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Política: Solo service_role puede modificar config
CREATE POLICY "Service role can manage app config"
ON public.app_config
FOR ALL
USING (auth.role() = 'service_role');

-- Política: Todos pueden leer config
CREATE POLICY "Authenticated users can read app config"
ON public.app_config
FOR SELECT
USING (auth.role() = 'authenticated');

-- Tabla: invitation_templates
ALTER TABLE public.invitation_templates ENABLE ROW LEVEL SECURITY;

-- Política: Solo admin puede ver templates
CREATE POLICY "Admin can view invitation templates"
ON public.invitation_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política: Solo admin puede modificar templates
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

-- Política: Usuarios pueden ver sus propios roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Política: Admin puede ver todos los roles
CREATE POLICY "Admin can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política: Solo service_role puede modificar roles
CREATE POLICY "Service role can manage user roles"
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- PASO 3: RESTRINGIR ACCESO A SCHEMA STRIPE
-- ============================================================================

-- Revocar permisos públicos en schema stripe
REVOKE ALL ON SCHEMA stripe FROM PUBLIC;
REVOKE ALL ON SCHEMA stripe FROM anon;
REVOKE ALL ON SCHEMA stripe FROM authenticated;

-- Solo postgres puede acceder a schema stripe
GRANT USAGE ON SCHEMA stripe TO postgres;
GRANT ALL ON SCHEMA stripe TO postgres;

-- Revocar permisos en foreign tables
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
-- PASO 4: RESTRINGIR ACCESO A SCHEMA PRIVATE
-- ============================================================================

-- Revocar permisos públicos en schema private
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

-- Solo postgres y service_role pueden acceder
GRANT USAGE ON SCHEMA private TO postgres;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT ALL ON SCHEMA private TO postgres;
GRANT ALL ON SCHEMA private TO service_role;

-- ============================================================================
-- PASO 5: CREAR VISTAS ADMINISTRATIVAS CON SECURITY DEFINER
-- ============================================================================

-- Vista para admin ver datos de Stripe
CREATE OR REPLACE VIEW private.admin_stripe_overview AS
SELECT 
  'customers' as entity_type,
  COUNT(*) as total_count
FROM stripe.customers
UNION ALL
SELECT 
  'charges' as entity_type,
  COUNT(*) as total_count
FROM stripe.charges
UNION ALL
SELECT 
  'subscriptions' as entity_type,
  COUNT(*) as total_count
FROM stripe.subscriptions
UNION ALL
SELECT 
  'payment_intents' as entity_type,
  COUNT(*) as total_count
FROM stripe.payment_intents;

-- Solo service_role puede ver esta vista
GRANT SELECT ON private.admin_stripe_overview TO service_role;

-- ============================================================================
-- PASO 6: CREAR FUNCIONES DE MONITOREO DE SEGURIDAD
-- ============================================================================

-- Función para verificar tablas sin RLS
CREATE OR REPLACE FUNCTION security.check_tables_without_rls()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  rowsecurity BOOLEAN,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
      WHEN schemaname = 'public' AND rowsecurity = false THEN 'HIGH'
      WHEN schemaname = 'public' AND rowsecurity = true THEN 'LOW'
      ELSE 'MEDIUM'
    END as severity
  FROM pg_tables
  WHERE schemaname IN ('public', 'stripe', 'private')
  ORDER BY 
    CASE 
      WHEN schemaname = 'public' AND rowsecurity = false THEN 1
      ELSE 2
    END,
    schemaname,
    tablename;
END;
$$;

-- Función para verificar credenciales expuestas
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
DECLARE
  v_has_creds BOOLEAN;
BEGIN
  RETURN QUERY
  SELECT 
    srvname as server_name,
    CASE 
      WHEN srvoptions::text LIKE '%api_key%' OR srvoptions::text LIKE '%password%' THEN true
      ELSE false
    END as has_credentials,
    CASE 
      WHEN srvoptions::text LIKE '%api_key=%sk_%' THEN 'CRITICAL'
      WHEN srvoptions::text LIKE '%api_key=%' THEN 'HIGH'
      ELSE 'LOW'
    END as severity,
    CASE 
      WHEN srvoptions::text LIKE '%api_key=%sk_%' THEN 'Migrate to Vault immediately'
      WHEN srvoptions::text LIKE '%api_key=%' THEN 'Use Vault or environment variables'
      ELSE 'No action needed'
    END as recommendation
  FROM pg_foreign_server
  WHERE srvname LIKE '%stripe%' OR srvname LIKE '%api%';
END;
$$;

-- Función para verificar permisos de schema
CREATE OR REPLACE FUNCTION security.check_schema_permissions()
RETURNS TABLE (
  schemaname TEXT,
  nspowner TEXT,
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
    n.nspname as schemaname,
    n.nspowner::regrole::text as nspowner,
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
-- PASO 7: CREAR DASHBOARD DE SEGURIDAD
-- ============================================================================

-- Vista consolidada de seguridad
CREATE OR REPLACE VIEW security.security_dashboard AS
SELECT 
  'tables_without_rls' as check_type,
  COUNT(*) as issues,
  MAX(severity) as max_severity
FROM security.check_tables_without_rls()
WHERE rowsecurity = false

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
-- PASO 8: AUDIT LOGGING PARA OPERACIONES SENSIBLE
-- ============================================================================

-- Crear tabla de audit log
CREATE TABLE IF NOT EXISTS security.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON security.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON security.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON security.audit_log(created_at);

-- Habilitar RLS
ALTER TABLE security.audit_log ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede ver logs
CREATE POLICY "Service role can view audit logs"
ON security.audit_log
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- PASO 9: TRIGGER PARA AUDITAR CAMBIOS EN TABLAS CRÍTICAS
-- ============================================================================

-- Función de trigger para audit
CREATE OR REPLACE FUNCTION security.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO security.audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO security.audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO security.audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id::TEXT,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Aplicar trigger a tablas críticas (ejemplo)
-- DROP TRIGGER IF EXISTS audit_trigger ON public.user_roles;
-- CREATE TRIGGER audit_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
--   FOR EACH ROW EXECUTE FUNCTION security.audit_trigger();

-- ============================================================================
-- PASO 10: VERIFICACIÓN FINAL
-- ============================================================================

-- Ejecutar verificaciones
SELECT 'Security Audit Results' as report_type, NOW() as generated_at;

-- Tablas sin RLS
SELECT * FROM security.check_tables_without_rls() WHERE rowsecurity = false;

-- Credenciales expuestas
SELECT * FROM security.check_exposed_credentials() WHERE has_credentials = true;

-- Permisos de schema
SELECT * FROM security.check_schema_permissions() WHERE public_access = true;

-- Dashboard consolidado
SELECT * FROM security.security_dashboard;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- 
-- ACCIONES REQUERIDAS POST-EJECUCIÓN:
-- 1. Rotar credenciales de Stripe en Stripe Dashboard
-- 2. Actualizar api_key en stripe_server con nueva clave
-- 3. Implementar Vault cuando esté disponible
-- 4. Revisar políticas RLS creadas
-- 5. Configurar alertas para cambios en tablas críticas
-- 6. Programar ejecución regular de security_dashboard
--
-- NOTA: Este script debe ejecutarse como usuario postgres o service_role
