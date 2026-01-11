# PLAN DE ACCIÓN - CORRECCIONES SUPABASE

**Fecha:** January 10, 2026
**Rama:** refact-inteligente-Tra-2025-12-26
**Agente:** Operando bajo las reglas del Documento Maestro IA v4.0
**Objetivo:** Sanear y consolidar el esquema de Supabase (local y remoto)

---

## RESUMEN EJECUTIVO

**Opción seleccionada:** Ejecutar SQL manualmente en el dashboard de Supabase
**Razón:** Los archivos en `supabase/migrations/` están protegidos por `.gitignore`, lo que impide crear o modificar migraciones directamente. La opción más segura y viable es usar el SQL generado y ejecutarlo manualmente.

---

## TABLAS EXISTENTES (VERIFICADO)

✅ **profile_likes** - Tabla para likes entre perfiles (Discover → Match)
- Archivo: `supabase/migrations/20260108011600_create_likes_table.sql`
- Estado: Existe y consolidada en schema maestro
- RLS: Habilitado con políticas apropiadas

✅ **matches** - Tabla para matches mutuos entre usuarios
- Archivo: `supabase/migrations/20260108011800_align_matches_schema.sql`
- Estado: Existe y consolidada en schema maestro
- RLS: Habilitado con políticas apropiadas

---

## TABLAS FALTANTES (IDENTIFICADO)

⚠️ **swinger_interests** - Intereses específicos de swingers para IA
- Sintoma: Tabla no existe en migraciones ni en schema maestro
- Impacto: IA de matching no puede usar intereses específicos
- Solución: Crear tabla con RLS

⚠️ **couple_profile_likes** - Likes específicos para perfiles de pareja
- Sintoma: Tabla no existe en migraciones ni en schema maestro
- Impacto: Sistema de likes para parejas incompleto
- Solución: Crear tabla con RLS

⚠️ **biometric_auth** - Datos de autenticación biométrica
- Sintoma: Tabla no existe en migraciones ni en schema maestro
- Impacto: Sistema de autenticación biométrica no funcional
- Solución: Crear tabla con RLS

⚠️ **gallery_access_requests** - Solicitudes de acceso a galerías privadas
- Sintoma: Tabla no existe en migraciones ni en schema maestro
- Impacto: Sistema de galerías privadas en chat incompleto
- Solución: Crear tabla con RLS

---

## PLAN DE ACCIÓN

### PASO 1: Revisar SQL generado
**Archivo:** `database/migrations/001_missing_tables.sql`
**Acción:** Revisar el SQL completo para verificar que sea seguro y correcto
**Tiempo estimado:** 5 minutos

### PASO 2: Ejecutar SQL en dashboard de Supabase
**Ubicación:** https://supabase.com/dashboard/project/[PROJECT-ID]/sql/new
**Acción:**
1. Abrir el dashboard de Supabase
2. Ir a SQL Editor
3. Copiar el contenido de `database/migrations/001_missing_tables.sql`
4. Ejecutar el SQL
5. Verificar que no haya errores
**Tiempo estimado:** 10 minutos

### PASO 3: Verificar tablas creadas
**Ubicación:** https://supabase.com/dashboard/project/[PROJECT-ID]/database/tables
**Acción:**
1. Ir a Table Editor
2. Verificar que las 4 tablas estén creadas:
   - `swinger_interests`
   - `couple_profile_likes`
   - `biometric_auth`
   - `gallery_access_requests`
3. Verificar que tengan RLS habilitado
4. Verificar que tengan las políticas correctas
**Tiempo estimado:** 5 minutos

### PASO 4: Actualizar documentación
**Archivos:**
- `BARRIDO_SRC_ESTADO.md`
- `SUPABASE_CORRECCIONES.md`
**Acción:** Marcar tablas como creadas y documentar fecha de ejecución
**Tiempo estimado:** 5 minutos

### PASO 5: Commit y push
**Acción:** Hacer commit de la documentación actualizada
**Tiempo estimado:** 2 minutos

---

## DETALLE DE TABLAS A CREAR

### 1. swinger_interests
```sql
CREATE TABLE IF NOT EXISTS public.swinger_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  preference_level INTEGER CHECK (preference_level BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Índices:** user_id, category, is_active
**RLS:** Los usuarios solo pueden ver/crear/modificar sus propios intereses

### 2. couple_profile_likes
```sql
CREATE TABLE IF NOT EXISTS public.couple_profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_couple_id UUID NOT NULL REFERENCES public.couple_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_user_id, liked_couple_id)
);
```
**Índices:** liker_user_id, liked_couple_id, created_at
**RLS:** Los usuarios solo pueden ver/crear/borrar sus propios likes

### 3. biometric_auth
```sql
CREATE TABLE IF NOT EXISTS public.biometric_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biometric_type VARCHAR(50) NOT NULL,
  device_id VARCHAR(255),
  is_enabled BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, biometric_type, device_id)
);
```
**Índices:** user_id, is_enabled
**RLS:** Los usuarios solo pueden ver/crear/modificar sus propios datos biométricos

### 4. gallery_access_requests
```sql
CREATE TABLE IF NOT EXISTS public.gallery_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);
```
**Índices:** viewer_id, owner_id, status, created_at
**RLS:** Los usuarios pueden ver sus propias solicitudes (viewer u owner)

---

## RIESGOS Y MITIGACIÓN

### Riesgo 1: Error al ejecutar SQL
**Probabilidad:** Baja
**Impacto:** Medio
**Mitigación:** Revisar SQL antes de ejecutar, ejecutar en ambiente de desarrollo primero

### Riesgo 2: Conflictos con tablas existentes
**Probabilidad:** Muy baja
**Impacto:** Alto
**Mitigación:** Usar `CREATE TABLE IF NOT EXISTS` para evitar conflictos

### Riesgo 3: RLS incorrecto
**Probabilidad:** Baja
**Impacto:** Alto
**Mitigación:** Verificar políticas RLS después de crear las tablas

---

## ESTADO ACTUAL

**Análisis completado:** ✅
**SQL generado:** ✅
**Plan de acción creado:** ✅
**Ejecución pendiente:** ⚠️
**Verificación pendiente:** ⚠️

---

## SIGUIENTES PASOS

1. [ ] Revisar SQL en `database/migrations/001_missing_tables.sql`
2. [ ] Ejecutar SQL en dashboard de Supabase
3. [ ] Verificar tablas creadas
4. [ ] Actualizar documentación
5. [ ] Commit y push

---

## NOTAS

- El archivo `supabase/migrations/` está protegido por `.gitignore`
- La opción más segura es ejecutar SQL manualmente en el dashboard
- Todas las tablas incluyen RLS para seguridad
- Se usan índices para optimización de consultas
- Se incluyen triggers para `updated_at` automáticos
