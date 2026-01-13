-- ============================================================================
-- STRIPE CREDENTIAL ROTATION WITH VAULT
-- Versión: v3.8.1
-- Fecha: 13 Enero 2026
--
-- NOTA: Este script requiere que la extensión Vault esté disponible
-- Ejecutar: CREATE EXTENSION IF NOT EXISTS vault WITH SCHEMA extensions;
-- ============================================================================

-- ============================================================================
-- PASO 1: INSTALAR Y CONFIGURAR VAULT
-- ============================================================================

-- Instalar extensión Vault (si está disponible)
-- CREATE EXTENSION IF NOT EXISTS vault WITH SCHEMA extensions;

-- ============================================================================
-- PASO 2: GUARDAR NUEVA CREDENCIAL EN VAULT
-- ============================================================================

-- IMPORTANTE: Reemplaza 'sk_live_NEW_KEY_HERE' con tu nueva clave de Stripe
-- Genera una nueva clave en: https://dashboard.stripe.com/apikeys

INSERT INTO vault.secrets (name, description, secret)
VALUES (
  'stripe_api_key',
  'Stripe Secret Key for CómplicesConecta - Production',
  'sk_live_NEW_KEY_HERE'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  secret = EXCLUDED.secret;

-- Obtener el key_id generado por Vault
SELECT id, name, description, created_at 
FROM vault.secrets 
WHERE name = 'stripe_api_key';

-- ============================================================================
-- PASO 3: ACTUALIZAR STRIPE SERVER PARA USAR VAULT
-- ============================================================================

-- Opción A: Usar Vault (recomendado)
ALTER SERVER stripe_server OPTIONS (
  SET api_key_id 'stripe_api_key',
  DROP api_key
);

-- ============================================================================
-- PASO 4: VERIFICAR CONFIGURACIÓN
-- ============================================================================

-- Verificar que stripe_server ahora usa Vault
SELECT srvname, srvoptions 
FROM pg_foreign_server 
WHERE srvname = 'stripe_server';

-- Debe mostrar: {api_key_id=stripe_api_key, api_url=..., api_version=...}

-- ============================================================================
-- PASO 5: VERIFICAR ACCESO A STRIPE VIA VAULT
-- ============================================================================

-- Probar conexión con Stripe usando Vault
SELECT COUNT(*) as test_connection
FROM stripe.products
LIMIT 1;

-- Si funciona, la rotación fue exitosa

-- ============================================================================
-- PASO 6: (OPCIONAL) ROTAR CLAVE ANTIGUA EN STRIPE DASHBOARD
-- ============================================================================

-- Después de verificar que la nueva clave funciona:
-- 1. Ve a https://dashboard.stripe.com/apikeys
-- 2. Revoca la clave antigua
-- 3. Confirma que la aplicación sigue funcionando

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- NOTAS IMPORTANTES:
-- 1. Genera la nueva clave en Stripe Dashboard ANTES de ejecutar este script
-- 2. Verifica que la nueva clave funciona antes de revocar la antigua
-- 3. Guarda el key_id generado por Vault para referencia futura
-- 4. Si Vault no está disponible, usa el script de rotación manual
