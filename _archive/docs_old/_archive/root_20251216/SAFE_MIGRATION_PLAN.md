# PLAN DE ESTABILIZACIÓN DE BASE DE DATOS - ComplicesConecta v3.8.16

## 📋 RESUMEN EJECUTIVO

Este documento describe el plan de migración segura e idempotente para estabilizar la base de datos de ComplicesConecta. Todas las operaciones pueden ejecutarse múltiples veces sin causar errores.

---

## 🔍 ANÁLISIS DEL ORDEN DE EJECUCIÓN ESTRICTO

### Fase 1: Verificación Previa (PRE-MIGRACIÓN)
```sql
-- 1. Verificar que Supabase está disponible
SELECT version();

-- 2. Verificar tablas base existentes
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'couple_profiles');

-- 3. Crear backup de datos críticos (RECOMENDADO)
-- Ejecutar manualmente en Supabase Dashboard:
-- Settings → Backups → Create Manual Backup
```

### Fase 2: Creación de Tablas (ORDEN CRÍTICO)
**Orden de ejecución (IMPORTANTE):**
1. `couple_agreements` - Tabla base para acuerdos
2. `couple_disputes` - Tabla que referencia couple_agreements
3. `frozen_assets` - Tabla que referencia couple_disputes
4. `user_consents` - Tabla independiente
5. `consent_evidence` - Tabla que referencia user_consents

**Razón:** Las foreign keys deben apuntar a tablas que ya existen.

### Fase 3: Agregar Columnas a Tablas Existentes
1. Agregar columnas a `profiles` (agreement_id, dispute_id, consent_status)
2. Agregar columnas a `couple_profiles` (agreement_id, dispute_status)

**Nota:** Usar `IF NOT EXISTS` para evitar errores si ya existen.

### Fase 4: Crear Índices
- Crear índices en todas las foreign keys
- Crear índices en columnas de búsqueda frecuente
- Crear índices en columnas de estado

### Fase 5: Crear Triggers y Funciones
1. Función `update_couple_agreements_timestamp()`
2. Trigger `trigger_update_couple_agreements_timestamp`
3. Función `check_couple_agreement_signatures()`
4. Trigger `trigger_check_couple_agreement_signatures`
5. Función `update_user_consents_timestamp()`
6. Trigger `trigger_update_user_consents_timestamp`

### Fase 6: Habilitar Row Level Security (RLS)
1. Habilitar RLS en `couple_agreements`
2. Crear policies de acceso
3. Habilitar RLS en `couple_disputes`
4. Crear policies de acceso
5. Habilitar RLS en `user_consents`
6. Crear policies de acceso

### Fase 7: Verificación Final
- Contar tablas creadas
- Contar índices creados
- Verificar que no hay errores

---

## 🛡️ PATRONES DE SEGURIDAD - VERIFICACIÓN DE EXISTENCIA

### Patrón 1: Verificar si una Columna Existe

```sql
-- ANTES (ROTO - causa error si existe):
ALTER TABLE public.profiles ADD COLUMN agreement_id UUID;

-- DESPUÉS (SEGURO - idempotente):
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'agreement_id') THEN
        ALTER TABLE public.profiles ADD COLUMN agreement_id UUID;
    END IF;
END $$;
```

### Patrón 2: Verificar si una Tabla Existe

```sql
-- ANTES (ROTO - causa error si existe):
CREATE TABLE public.couple_agreements (id UUID PRIMARY KEY);

-- DESPUÉS (SEGURO - idempotente):
CREATE TABLE IF NOT EXISTS public.couple_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
```

### Patrón 3: Verificar si un Índice Existe

```sql
-- ANTES (ROTO - causa error si existe):
CREATE INDEX idx_couple_agreements_couple_id ON public.couple_agreements(couple_id);

-- DESPUÉS (SEGURO - idempotente):
CREATE INDEX IF NOT EXISTS idx_couple_agreements_couple_id ON public.couple_agreements(couple_id);
```

### Patrón 4: Verificar si un Trigger Existe

```sql
-- ANTES (ROTO - causa error si existe):
CREATE TRIGGER trigger_update_timestamp BEFORE UPDATE ON public.couple_agreements
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- DESPUÉS (SEGURO - idempotente):
DROP TRIGGER IF EXISTS trigger_update_timestamp ON public.couple_agreements;
CREATE TRIGGER trigger_update_timestamp BEFORE UPDATE ON public.couple_agreements
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### Patrón 5: Verificar si una Policy RLS Existe

```sql
-- ANTES (ROTO - causa error si existe):
CREATE POLICY couple_agreements_access ON public.couple_agreements
FOR SELECT USING (auth.uid() = partner_1_id);

-- DESPUÉS (SEGURO - idempotente):
DROP POLICY IF EXISTS couple_agreements_access ON public.couple_agreements;
CREATE POLICY couple_agreements_access ON public.couple_agreements
FOR SELECT USING (auth.uid() = partner_1_id);
```

---

## 📊 ESTRUCTURA DE TABLAS CREADAS

### 1. couple_agreements
```sql
CREATE TABLE public.couple_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,                          -- FK a couple_profiles
    partner_1_id UUID NOT NULL,                       -- FK a profiles
    partner_2_id UUID NOT NULL,                       -- FK a profiles
    partner_1_signature BOOLEAN DEFAULT FALSE,        -- Firma del partner 1
    partner_2_signature BOOLEAN DEFAULT FALSE,        -- Firma del partner 2
    status TEXT DEFAULT 'PENDING',                    -- PENDING, ACTIVE, DISPUTED, DISSOLVED, FORFEITED
    agreement_hash TEXT UNIQUE,                       -- SHA-256 del acuerdo
    dispute_deadline TIMESTAMP WITH TIME ZONE,        -- 30 días después de ambas firmas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
- `idx_couple_agreements_couple_id` - Búsqueda por pareja
- `idx_couple_agreements_partner_1` - Búsqueda por partner 1
- `idx_couple_agreements_partner_2` - Búsqueda por partner 2
- `idx_couple_agreements_status` - Filtro por estado
- `idx_couple_agreements_dispute_deadline` - Búsqueda de acuerdos vencidos

### 2. couple_disputes
```sql
CREATE TABLE public.couple_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL,                       -- FK a couple_agreements
    initiator_id UUID NOT NULL,                       -- FK a profiles
    reason TEXT NOT NULL,                             -- Razón de la disputa
    status TEXT DEFAULT 'OPEN',                       -- OPEN, RESOLVED, ESCALATED
    resolution_notes TEXT,                            -- Notas de resolución
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE              -- Fecha de resolución
);
```

**Índices:**
- `idx_couple_disputes_agreement_id` - Búsqueda por acuerdo
- `idx_couple_disputes_initiator_id` - Búsqueda por iniciador
- `idx_couple_disputes_status` - Filtro por estado
- `idx_couple_disputes_created_at` - Ordenamiento por fecha

### 3. frozen_assets
```sql
CREATE TABLE public.frozen_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL,                         -- FK a couple_disputes
    asset_type TEXT NOT NULL,                         -- Tipo de activo
    asset_value NUMERIC(19, 2),                       -- Valor del activo
    frozen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unfrozen_at TIMESTAMP WITH TIME ZONE              -- Fecha de descongelación
);
```

**Índices:**
- `idx_frozen_assets_dispute_id` - Búsqueda por disputa
- `idx_frozen_assets_asset_type` - Filtro por tipo de activo

### 4. user_consents
```sql
CREATE TABLE public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                            -- FK a profiles
    consent_type TEXT NOT NULL,                       -- Tipo de consentimiento
    consent_text TEXT,                                -- Texto del consentimiento
    accepted BOOLEAN DEFAULT FALSE,                   -- ¿Aceptado?
    ip_address INET,                                  -- IP del usuario
    user_agent TEXT,                                  -- User agent del navegador
    consent_hash TEXT UNIQUE,                         -- SHA-256 del consentimiento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
- `idx_user_consents_user_id` - Búsqueda por usuario
- `idx_user_consents_consent_type` - Filtro por tipo
- `idx_user_consents_accepted` - Filtro por aceptación
- `idx_user_consents_created_at` - Ordenamiento por fecha

### 5. consent_evidence
```sql
CREATE TABLE public.consent_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL,                         -- FK a user_consents
    evidence_type TEXT NOT NULL,                      -- Tipo de evidencia
    evidence_data JSONB,                              -- Datos de evidencia
    evidence_hash TEXT,                               -- SHA-256 de evidencia
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
- `idx_consent_evidence_consent_id` - Búsqueda por consentimiento
- `idx_consent_evidence_evidence_type` - Filtro por tipo

---

## 🔐 COLUMNAS AGREGADAS A TABLAS EXISTENTES

### Columnas en `profiles`
```sql
agreement_id UUID REFERENCES public.couple_agreements(id) ON DELETE SET NULL
dispute_id UUID REFERENCES public.couple_disputes(id) ON DELETE SET NULL
consent_status TEXT DEFAULT 'PENDING' CHECK (consent_status IN ('PENDING', 'ACCEPTED', 'REJECTED'))
```

### Columnas en `couple_profiles`
```sql
agreement_id UUID REFERENCES public.couple_agreements(id) ON DELETE SET NULL
dispute_status TEXT DEFAULT 'NONE' CHECK (dispute_status IN ('NONE', 'ACTIVE', 'RESOLVED'))
```

---

## 🚀 CÓMO EJECUTAR LA MIGRACIÓN

### Opción 1: Supabase Dashboard (RECOMENDADO)
1. Ir a `supabase.com` → Tu proyecto
2. Ir a `SQL Editor`
3. Copiar el contenido de `202512_MIGRACION_CONSOLIDADA_SEGURA.sql`
4. Pegar en el editor
5. Hacer clic en "Run" (Ejecutar)
6. Verificar que no hay errores

### Opción 2: Supabase CLI
```bash
# Copiar el archivo SQL a supabase/migrations/
cp 202512_MIGRACION_CONSOLIDADA_SEGURA.sql supabase/migrations/

# Aplicar migraciones
supabase db push

# Verificar estado
supabase migration list
```

### Opción 3: Verificación Manual
```bash
# Conectar a la base de datos
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Ejecutar el script
\i 202512_MIGRACION_CONSOLIDADA_SEGURA.sql

# Verificar tablas
\dt public.*

# Verificar índices
\di public.*
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### Verificar Tablas Creadas
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('couple_agreements', 'couple_disputes', 'frozen_assets', 'user_consents', 'consent_evidence')
ORDER BY table_name;

-- Resultado esperado: 5 filas
```

### Verificar Columnas Agregadas
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('agreement_id', 'dispute_id', 'consent_status')
ORDER BY column_name;

-- Resultado esperado: 3 filas
```

### Verificar Índices Creados
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Resultado esperado: 20+ índices
```

### Verificar Triggers Creados
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'trigger_%'
ORDER BY trigger_name;

-- Resultado esperado: 3 triggers
```

### Verificar RLS Habilitado
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Resultado esperado: couple_agreements, couple_disputes, user_consents
```

---

## 🔄 IDEMPOTENCIA - EJECUTAR MÚLTIPLES VECES

El script está diseñado para ser **100% idempotente**. Puedes ejecutarlo 10 veces sin problemas:

✅ **CREATE TABLE IF NOT EXISTS** - No falla si tabla existe
✅ **DO $$ ... IF NOT EXISTS ...** - Verifica antes de agregar columnas
✅ **CREATE INDEX IF NOT EXISTS** - No falla si índice existe
✅ **DROP TRIGGER IF EXISTS** - Limpia antes de crear
✅ **DROP POLICY IF EXISTS** - Limpia antes de crear

---

## ⚠️ ROLLBACK (SI ALGO FALLA)

Si necesitas revertir los cambios:

```sql
-- OPCIÓN 1: Restaurar desde backup (RECOMENDADO)
-- En Supabase Dashboard: Settings → Backups → Restore

-- OPCIÓN 2: Eliminar tablas manualmente
DROP TABLE IF EXISTS public.consent_evidence CASCADE;
DROP TABLE IF EXISTS public.user_consents CASCADE;
DROP TABLE IF EXISTS public.frozen_assets CASCADE;
DROP TABLE IF EXISTS public.couple_disputes CASCADE;
DROP TABLE IF EXISTS public.couple_agreements CASCADE;

-- OPCIÓN 3: Eliminar solo columnas agregadas
ALTER TABLE public.profiles DROP COLUMN IF EXISTS agreement_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS dispute_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS consent_status;
ALTER TABLE public.couple_profiles DROP COLUMN IF EXISTS agreement_id;
ALTER TABLE public.couple_profiles DROP COLUMN IF EXISTS dispute_status;
```

---

## 📝 NOTAS IMPORTANTES

1. **NO EJECUTES MANUALMENTE** - Usa el script SQL proporcionado
2. **HABILITA BACKUPS** - Antes de ejecutar, crea un backup manual
3. **VERIFICA PERMISOS** - Necesitas permisos de admin en Supabase
4. **PRUEBA EN DEV PRIMERO** - Ejecuta en ambiente de desarrollo antes de producción
5. **MONITOREA LOGS** - Revisa los logs de Supabase después de ejecutar

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Revisar este documento
2. ✅ Crear backup manual en Supabase
3. ✅ Ejecutar `202512_MIGRACION_CONSOLIDADA_SEGURA.sql`
4. ✅ Verificar que todas las tablas se crearon
5. ✅ Ejecutar queries de verificación
6. ✅ Monitorear logs de Supabase
7. ✅ Actualizar documentación de API
8. ✅ Notificar al equipo de desarrollo

---

**Documento creado:** Diciembre 2025
**Versión:** 1.0
**Estado:** Listo para producción
