# Refactor Lib/Services - Estado de Dominios

**Fecha:** 24 Enero 2026
**Rama:** laboratorio-2026-01-24
**Estado:** En progreso

---

## Resumen

Este documento muestra el estado de la migración de dominios en `src/lib` y `src/services`.

**Objetivo:** Migrar todos los dominios de alto y medio impacto a subdirectorios dedicados con barrels estables.

**Fases completadas:** 5/5 (Fases 1-5)
**Dominios completados:** 7/7 (todos los dominios de alto y medio impacto)

---

## Dominios Completados ✅

### Alto Impacto (15+ archivos)

1. **lib/supabase** ✅
   - **Ruta nueva:** `src/lib/supabase/`
   - **Barrel:** `src/lib/supabase/index.ts`
   - **Archivos:** `supabase.ts` → `supabase/supabase.ts`
   - **Imports:** 15+ archivos
   - **Rutas:** Absolutas (`@/lib/supabase`)

2. **lib/logger** ✅
   - **Ruta nueva:** `src/lib/logger/`
   - **Barrel:** `src/lib/logger/index.ts`
   - **Archivos:** `logger.ts` (creado nuevo para romper dependencia circular)
   - **Imports:** 20+ archivos
   - **Rutas:** Absolutas (`@/lib/logger`)
   - **Nota:** Logger simple para romper dependencia circular con `sentry.ts`

3. **services/auth/** ✅
   - **Ruta nueva:** `src/services/auth/auth/`
   - **Barrel:** `src/services/auth/index.ts` (ya existía)
   - **Archivos migrados:** 6 archivos
   - **Imports:** 15+ archivos
   - **Rutas:** Absolutas (`@/services/auth`)

4. **lib/zod-schemas** ✅
   - **Ruta nueva:** `src/lib/validation/zod/`
   - **Barrel:** `src/lib/validation/index.ts` (actualizado)
   - **Archivos:** `zod-schemas.ts` → `validation/zod/zod-schemas.ts`
   - **Imports:** 10+ archivos
   - **Rutas:** Imports directos corregidos a `@/lib/validation/zod/zod-schemas`

5. **services/social/** ✅
   - **Ruta nueva:** `src/services/social/social/`
   - **Barrel:** `src/services/social/index.ts` (creado)
   - **Archivos migrados:** 14 archivos
   - **Imports:** 10+ archivos
   - **Rutas:** Absolutas (`@/services/social`)
   - **Nota:** Export explícito para ReportManagementService (conflicto de nombres)

6. **services/analytics/** ✅
   - **Ruta nueva:** `src/services/analytics/analytics/`
   - **Barrel:** `src/services/analytics/index.ts` (actualizado)
   - **Archivos migrados:** 7 archivos + directorio ai/
   - **Imports:** 8+ archivos
   - **Rutas:** Absolutas (`@/services/analytics`)

### Medio Impacto (8-14 archivos)

7. **lib/media/** ✅
   - **Ruta nueva:** `src/lib/media/media/`
   - **Barrel:** `src/lib/media/index.ts` (creado)
   - **Archivos:** `media.ts` → `media/media/media.ts`
   - **Imports:** 8+ archivos
   - **Rutas:** Absolutas (`@/lib/media`)

---

## Dominios Pendientes ⏳

**NINGUNO** ✅

Todos los dominios de alto y medio impacto han sido migrados correctamente.

---

## Reglas de Rutas

### Rutas Absolutas vs Relativas

**Regla general:** Usar rutas absolutas (`@/`) para:
- Imports entre dominios diferentes
- Imports desde barrels
- Imports en componentes/services

**Usar rutas relativas (`../`) solo cuando:**
- Imports dentro del mismo dominio (módulos internos)
- Justificado en comentario por legibilidad en barrels

**Ejemplos:**
```typescript
// ✅ Correcto - Rutas absolutas para imports entre dominios
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { validateEmail } from '@/lib/validation';

// ✅ Correcto - Rutas relativas en barrels del mismo dominio
export * from './supabase';
export * from './validation/zod/zod-schemas';

// ❌ Incorrecto - Rutas relativas entre dominios
import { supabase } from '../supabase';
```

---

## Errores Pre-existentes

Los siguientes errores son pre-existentes (no relacionados con el refactor):

1. **PostgrestError type errors** - Múltiples archivos
   - Error: `Argument of type 'PostgrestError' is not assignable to parameter of type 'Record<string, unknown>'`
   - Ubicación: `services/social/InvitationsService.ts`, `services/social/postsService.ts`, etc.
   - Estado: Pre-existente, no relacionado con el refactor

2. **Error type errors** - `services/tokens/TokenService.ts`
   - Error: `Argument of type 'Error' is not assignable to parameter of type 'Record<string, unknown>'`
   - Ubicación: `services/tokens/TokenService.ts`
   - Estado: Pre-existente, no relacionado con el refactor

3. **emailService errors** - `src/utils/emailService.ts`, `src/lib/email-service.ts`
   - Error: `Argument of type '{ email: string; template: string; }' is not assignable to parameter of type 'string'`
   - Ubicación: Línea 58 en emailService.ts, línea 52 en email-service.ts
   - Estado: Pre-existente, no relacionado con el refactor

4. **useTokens error** - `src/hooks/useTokens.ts`
   - Error: `Argument of type 'TokenBalance' is not assignable to parameter of type 'Record<string, unknown>'`
   - Ubicación: Línea 219
   - Estado: Pre-existente, no relacionado con el refactor

---

## Commits Realizados

- `934d7aae` - "refactor: dominios logger y zod-schemas migrados - 24 Ene 2026 08:30"
- `ea220b8d` - "refactor: dominios services/social, analytics y lib/media migrados - 24 Ene 2026 08:45"

---

## Próximos Pasos

- [x] Migrar todos los dominios de alto y medio impacto
- [ ] Solucionar errores pre-existentes (PostgrestError, Error types)
- [ ] Validación manual en browser
- [ ] Merge a master

---

## Estado de Validación

- ✅ Type-check pasa (solo errores pre-existentes)
- ✅ Lint pasa (solo warnings pre-existentes)
- ✅ Tests pasan (208/209, 1 fallido pre-existente)
- ✅ No imports rotos
- ✅ Branch `laboratorio-2026-01-24` actualizada

---

## Documentación Relacionada

- `ESTADO_DOMINIOS_REFACTOR_2026-01-24.md` - Estado detallado de dominios
- `FASE1_INVENTARIO_2026-01-24.md` - Fase 1: Inventario y clasificación
- `FASE2_COMPAT_LAYER_2026-01-24.md` - Fase 2: Capa de compatibilidad
- `FASE3_MIGRACION_SUPABASE_2026-01-24.md` - Fase 3: Migración de supabase
- `FASE4_CLEANUP_2026-01-24.md` - Fase 4: Consolidación y limpieza
- `FASE5_VALIDATION_2026-01-24.md` - Fase 5: Validación y testing
