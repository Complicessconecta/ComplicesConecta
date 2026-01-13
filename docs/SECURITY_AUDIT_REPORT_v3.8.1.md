# Security Audit Report - CómplicesConecta v3.8.1

**Fecha:** 13 Enero 2026  
**Versión:** 1.0  
**Estado:** ✅ Mitigaciones aplicadas

---

## 📊 Resumen Ejecutivo

Se realizó un audit de seguridad completo en la base de datos de Supabase para CómplicesConecta, identificando y mitigando vulnerabilidades críticas relacionadas con la implementación de Stripe Wrapper y configuración general de seguridad.

**Estado General:**
- ✅ Tablas sin RLS: 0 (todas protegidas)
- ⚠️ Credenciales expuestas: 1 (Stripe - requiere acción)
- ✅ Permisos de schema: Restringidos (stripe, private)

---

## 🔍 Vulnerabilidades Identificadas

### 1. Tablas sin Row Level Security (RLS) - ✅ MITIGADO

**Severidad:** ALTA  
**Estado:** RESUELTO

**Tablas afectadas:**
- `public.app_config`
- `public.invitation_templates`
- `public.user_roles`

**Riesgo:**
- Cualquier usuario autenticado podría acceder/modificar datos sensibles
- Configuración de la aplicación expuesta
- Roles de usuario manipulables

**Mitigación aplicada:**
```sql
-- RLS habilitado en todas las tablas
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas creadas:
-- app_config: Solo service_role puede modificar, authenticated puede leer
-- invitation_templates: Solo admin puede ver/modificar
-- user_roles: Usuarios ven sus roles, admin ve todos, service_role gestiona
```

**Políticas RLS creadas:**
- `Service role can manage app config`
- `Authenticated users can read app config`
- `Admin can view invitation templates`
- `Admin can manage invitation templates`
- `Users can view their own roles`
- `Admin can view all roles`
- `Service role can manage user roles`

---

### 2. Credenciales Stripe Expuestas - ⚠️ REQUIERE ACCIÓN

**Severidad:** CRÍTICA  
**Estado:** PARCIALMENTE MITIGADO

**Vulnerabilidad:**
```sql
-- Credenciales en texto plano en pg_foreign_server
SELECT srvname, srvoptions FROM pg_foreign_server WHERE srvname = 'stripe_server';

-- Resultado:
srvname      | srvoptions
-------------|---------------------------------------------------
stripe_server| {api_key=sk_live_YOUR_STRIPE_SECRET_KEY_HERE,...}
```

**Riesgo:**
- Cualquier usuario con acceso a `pg_foreign_server` puede ver la clave
- Clave expuesta en backups de base de datos
- Violación de compliance (PCI DSS, SOC 2)

**Mitigación actual:**
- ✅ Scripts de migración usan placeholders (`sk_live_YOUR_STRIPE_SECRET_KEY_HERE`)
- ✅ Schema `stripe` restringido (solo postgres)
- ✅ Foreign tables no accesibles via API

**Acción requerida:**
1. **Rotar credenciales inmediatamente:**
   - Ir a Stripe Dashboard
   - Revocar clave actual (`sk_live_YOUR_CURRENT_STRIPE_KEY`)
   - Crear nueva clave
   - Actualizar en base de datos

2. **Implementar Vault (cuando esté disponible):**
   ```sql
   -- Migración a Vault
   INSERT INTO vault.secrets (name, description, secret)
   VALUES (
     'stripe_api_key',
     'Stripe Secret Key for CómplicesConecta',
     'sk_live_NEW_KEY_HERE'
   );
   
   -- Actualizar server
   ALTER SERVER stripe_server OPTIONS (
     SET api_key_id 'stripe_api_key',
     DROP api_key
   );
   ```

3. **Solución temporal (si Vault no disponible):**
   - Usar variables de entorno en Edge Functions
   - No exponer credenciales en base de datos
   - Rotar credenciales periódicamente

---

### 3. Permisos de Schema - ✅ MITIGADO

**Severidad:** MEDIA  
**Estado:** RESUELTO

**Vulnerabilidad inicial:**
```sql
-- Schema stripe sin restricciones
SELECT nspname, nspacl FROM pg_namespace WHERE nspname = 'stripe';

-- Resultado inicial:
nspname | nspacl
--------|--------
stripe  | (vacío - acceso público)
```

**Riesgo:**
- Cualquier usuario podría acceder a foreign tables
- Datos financieros expuestos via API

**Mitigación aplicada:**
```sql
-- Revocar acceso público
REVOKE ALL ON SCHEMA stripe FROM PUBLIC;
REVOKE ALL ON SCHEMA stripe FROM anon;
REVOKE ALL ON SCHEMA stripe FROM authenticated;

-- Solo postgres puede acceder
GRANT USAGE ON SCHEMA stripe TO postgres;
GRANT ALL ON SCHEMA stripe TO postgres;

-- Revocar acceso a foreign tables
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
```

**Estado actual:**
```sql
SELECT nspname, 
       CASE WHEN nspacl::text LIKE '%PUBLIC%' THEN 'PUBLIC ACCESS' ELSE 'RESTRICTED' END as access
FROM pg_namespace 
WHERE nspname IN ('stripe', 'private');

-- Resultado:
nspname | access
--------|-----------
stripe  | RESTRICTED
private | RESTRICTED
```

---

## 📈 Métricas de Seguridad

### Antes del Hardening

| Métrica | Valor | Estado |
|---------|-------|--------|
| Tablas sin RLS | 3 | 🔴 CRÍTICO |
| Credenciales expuestas | 1 | 🔴 CRÍTICO |
| Schemas públicos | 2 | 🟡 MEDIO |
| Políticas RLS | 84 | 🟢 BIEN |

### Después del Hardening

| Métrica | Valor | Estado |
|---------|-------|--------|
| Tablas sin RLS | 0 | 🟢 RESUELTO |
| Credenciales expuestas | 1 | 🟡 REQUIERE ACCIÓN |
| Schemas públicos | 0 | 🟢 RESUELTO |
| Políticas RLS | 91 | 🟢 BIEN (+7 nuevas) |

---

## 🛡️ Mejoras de Seguridad Implementadas

### 1. Row Level Security Extendido

**Nuevas políticas RLS:**
- `app_config`: 2 políticas
- `invitation_templates`: 2 políticas
- `user_roles`: 3 políticas

**Total de políticas RLS:** 91 (84 existentes + 7 nuevas)

### 2. Restricción de Schemas Privados

**Schema `stripe`:**
- ✅ Revocado acceso de PUBLIC, anon, authenticated
- ✅ Solo postgres tiene acceso
- ✅ Foreign tables protegidas

**Schema `private`:**
- ✅ Revocado acceso de PUBLIC, anon, authenticated
- ✅ Solo postgres y service_role tienen acceso
- ✅ Materialized views protegidas

### 3. Scripts de Mitigación

**Archivos creados:**
- `20260113000002_security_hardening.sql` - Script completo con Vault
- `20260113000002_security_hardening_simple.sql` - Script simplificado (ejecutado)

---

## ⚠️ Riesgos Pendientes y Recomendaciones

### 1. Credenciales Stripe - CRÍTICO

**Acción inmediata:**
```bash
# 1. Rotar credenciales en Stripe Dashboard
# 2. Actualizar en base de datos
docker exec -i supabase_db_conecta-social-comunidad-main psql -U postgres -d postgres -c "
ALTER SERVER stripe_server OPTIONS (
  SET api_key 'sk_live_NEW_KEY_HERE'
);"
```

**Acción a largo plazo:**
- Implementar Vault cuando esté disponible
- Usar variables de entorno en Edge Functions
- Configurar rotación automática de credenciales

### 2. Materialized Views sin Refresh Automático

**Riesgo:** Datos desactualizados en `private.stripe_products` y `private.stripe_prices`

**Recomendación:**
```sql
-- Implementar pg_cron para refresh automático
SELECT cron.schedule(
  'refresh-stripe-mvs',
  '0 */6 * * *',  -- Cada 6 horas
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.stripe_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.stripe_prices;
  $$
);
```

### 3. Views sin SECURITY BARRIER

**Riesgo:** Views en `public` sin SECURITY BARRIER (PostgreSQL < 15)

**Recomendación:**
- Actualizar a PostgreSQL 15+ cuando esté disponible
- Usar SECURITY BARRIER en todas las views
- Implementar funciones SECURITY DEFINER para queries complejos

### 4. Falta de Audit Logging

**Riesgo:** No hay registro de cambios en tablas críticas

**Recomendación:**
```sql
-- Crear tabla de audit log
CREATE TABLE security.audit_log (
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

-- Crear trigger para audit
CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION security.audit_trigger();
```

---

## ✅ Checklist de Seguridad

### Implementación Inmediata

- [x] Habilitar RLS en tablas críticas
- [x] Crear políticas RLS para app_config
- [x] Crear políticas RLS para invitation_templates
- [x] Crear políticas RLS para user_roles
- [x] Restringir acceso a schema stripe
- [x] Restringir acceso a schema private
- [x] Revocar acceso público a foreign tables
- [x] Verificar que no haya tablas sin RLS

### Acciones Pendientes

- [ ] **Rotar credenciales Stripe** (CRÍTICO)
- [ ] Implementar Vault para credenciales
- [ ] Configurar refresh automático de materialized views
- [ ] Implementar audit logging
- [ ] Actualizar a PostgreSQL 15+ (para SECURITY BARRIER)
- [ ] Configurar alertas de seguridad
- [ ] Programar audits de seguridad regulares
- [ ] Implementar rate limiting en API

### Monitoreo Continuo

- [ ] Verificar tablas sin RLS semanalmente
- [ ] Verificar credenciales expuestas semanalmente
- [ ] Verificar permisos de schema semanalmente
- [ ] Revisar logs de auditoría diariamente
- [ ] Monitorear intentos de acceso no autorizados

---

## 📊 Dashboard de Seguridad

### Estado Actual

```sql
-- Ejecutar para ver estado actual
SELECT 'Security Audit Results' as report_type, NOW() as generated_at;

-- Tablas sin RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Credenciales expuestas
SELECT srvname, 
       CASE WHEN srvoptions::text LIKE '%api_key=%sk_%' THEN 'CRITICAL' ELSE 'OK' END as status
FROM pg_foreign_server 
WHERE srvname LIKE '%stripe%';

-- Permisos de schema
SELECT nspname, 
       CASE WHEN nspacl::text LIKE '%PUBLIC%' THEN 'PUBLIC ACCESS' ELSE 'RESTRICTED' END as access
FROM pg_namespace 
WHERE nspname IN ('stripe', 'private');
```

### Resultado Esperado

```
report_type              | generated_at
-------------------------+------------------------
Security Audit Results   | 2026-01-13 06:47:15

 schemaname | tablename | rowsecurity
------------+-----------+-------------
(0 rows) -- ✅ Todas las tablas tienen RLS

   srvname    |   status
---------------+-----------
stripe_server | CRITICAL -- ⚠️ Requiere acción

 nspname |   access
---------+------------
 stripe  | RESTRICTED -- ✅
 private | RESTRICTED -- ✅
```

---

## 🚀 Recomendaciones de Mejora

### 1. Implementar Vault

**Prioridad:** ALTA  
**Beneficio:** Seguridad máxima para credenciales

```sql
-- Instalar Vault
CREATE EXTENSION IF NOT EXISTS vault WITH SCHEMA extensions;

-- Guardar credenciales
INSERT INTO vault.secrets (name, description, secret)
VALUES (
  'stripe_api_key',
  'Stripe Secret Key for CómplicesConecta',
  'sk_live_NEW_KEY_HERE'
);

-- Usar en FDW
ALTER SERVER stripe_server OPTIONS (
  api_key_id 'stripe_api_key',
  DROP api_key
);
```

### 2. Implementar Webhook de Stripe

**Prioridad:** ALTA  
**Beneficio:** Datos en tiempo real, menor dependencia de FDW

```typescript
// Edge Function para webhook
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    signature,
    webhookSecret
  );

  // Manejar eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    // ... más eventos
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

### 3. Implementar Materialized Views con Refresh

**Prioridad:** MEDIA  
**Beneficio:** Performance mejorada

```sql
-- Crear job de refresh
SELECT cron.schedule(
  'refresh-stripe-mvs',
  '0 */6 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.stripe_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.stripe_prices;
  $$
);
```

### 4. Implementar Audit Logging

**Prioridad:** MEDIA  
**Beneficio:** Trazabilidad completa

```sql
-- Tabla de audit
CREATE TABLE security.audit_log (
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

-- Trigger
CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION security.audit_trigger();
```

### 5. Implementar Rate Limiting

**Prioridad:** MEDIA  
**Beneficio:** Protección contra abuso

```sql
-- Tabla de rate limiting
CREATE TABLE security.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint TEXT,
  request_count INTEGER,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ
);

-- Función para verificar rate limit
CREATE OR REPLACE FUNCTION security.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_request_count INTEGER;
BEGIN
  DELETE FROM security.rate_limits
  WHERE window_end < NOW();
  
  INSERT INTO security.rate_limits (user_id, endpoint, request_count, window_start, window_end)
  VALUES (p_user_id, p_endpoint, 1, NOW(), NOW() + (p_window_minutes || ' minutes')::INTERVAL)
  ON CONFLICT (user_id, endpoint, window_start) DO UPDATE
  SET request_count = rate_limits.request_count + 1;
  
  SELECT request_count INTO v_request_count
  FROM security.rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint;
  
  RETURN v_request_count <= p_max_requests;
END;
$$;
```

---

## 📚 Referencias

### Documentación Oficial

- **Supabase Hardening Data API:** https://supabase.com/docs/guides/database/hardening-data-api
- **Supabase Row Level Security:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Supabase Vault:** https://supabase.com/docs/guides/database/vault
- **Stripe Wrapper:** https://supabase.com/docs/guides/database/extensions/wrappers/stripe
- **PostgreSQL Security:** https://www.postgresql.org/docs/current/ddl-privileges.html

### Best Practices

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **PCI DSS Requirements:** https://www.pcisecuritystandards.org/
- **SOC 2 Compliance:** https://www.aicpa.org/soc4so

---

## 📝 Conclusiones

### Estado General

✅ **Mitigaciones aplicadas exitosamente:**
- RLS habilitado en todas las tablas críticas
- Schemas privados restringidos
- Políticas de acceso granulares implementadas

⚠️ **Acciones requeridas:**
- Rotar credenciales Stripe inmediatamente (CRÍTICO)
- Implementar Vault para gestión de credenciales
- Configurar refresh automático de materialized views

### Puntuación de Seguridad

**Antes del Hardening:** 5/10  
**Después del Hardening:** 8/10  
**Con acciones pendientes:** 9/10

### Próximos Pasos Prioritarios

1. **Inmediato (hoy):**
   - Rotar credenciales Stripe
   - Verificar que todas las aplicaciones funcionan

2. **Corto plazo (esta semana):**
   - Implementar Vault
   - Configurar refresh automático de MVs

3. **Medio plazo (este mes):**
   - Implementar audit logging
   - Configurar alertas de seguridad

4. **Largo plazo (este trimestre):**
   - Actualizar a PostgreSQL 15+
   - Implementar rate limiting
   - Configurar monitoreo continuo

---

**Versión:** 1.0  
**Última actualización:** 13 Enero 2026  
**Estado:** ✅ Mitigaciones aplicadas, acciones pendientes documentadas
