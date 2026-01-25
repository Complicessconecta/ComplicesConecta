# Estado de Dominios - Refactor Lib/Services

**Fecha:** 24 Enero 2026
**Rama:** laboratorio-2026-01-24

---

## Actualización 25 Ene 2026

- **Fix aplicado:** `src/services/analytics/analytics/ai/index.ts` corregido a exports relativos (`./...`) para eliminar rutas inválidas `@/services/analytics/ai/*`.
- **Fix aplicado:** consumidores que importaban rutas antiguas fueron movidos a barrels:
  - `@/services/social/*` -> `@/services/social`
  - `@/services/analytics/*` -> `@/services/analytics`
- **Pendiente:** correr type-check/lint para confirmar build limpio.

### Verificación Final

- ✅ `npm run build:check` (TypeScript app/node + Vite build)
- ✅ `npm run lint`
- ✅ Warnings de chunks ajustados en `vite.config.ts` (sin romper build)

---

## Dominios Completados ✅

### Alto Impacto (15+ archivos)

1. **lib/supabase** ✅
   - **Estado:** Migrado en Fase 3
   - **Ruta nueva:** `src/lib/supabase/`
   - **Barrel:** `src/lib/supabase/index.ts`
   - **Archivos:** `supabase.ts` → `supabase/supabase.ts`
   - **Imports:** 15+ archivos importan desde `@/lib/supabase`
   - **Rutas:** Absolutas (`@/lib/supabase`)

2. **lib/logger**
   - **Estado:** Barrel creado con logger simple
   - **Ruta nueva:** `src/lib/logger/`
   - **Barrel:** `src/lib/logger/index.ts`
   - **Archivos:** `logger.ts` (creado nuevo para romper dependencia circular)
   - **Imports:** 20+ archivos importan desde `@/lib/logger`
   - **Rutas:** Absolutas (`@/lib/logger`)
   - **Nota:** Logger simple para romper dependencia circular con `sentry.ts`

3. **services/auth/**
   - **Estado:** Archivos migrados a subdirectorio
   - **Ruta nueva:** `src/services/auth/auth/`
   - **Archivos migrados:**
     - `ContentProtectionService.ts` → `auth/ContentProtectionService.ts`
     - `MFAService.ts` → `auth/MFAService.ts`
     - `SecurityAuditService.ts` → `auth/SecurityAuditService.ts`
     - `SecurityService.ts` → `auth/SecurityService.ts`
     - `UserIdentificationService.ts` → `auth/UserIdentificationService.ts`
     - `UserVerificationService.ts` → `auth/UserVerificationService.ts`
   - **Imports:** 15+ archivos importan desde `@/services/auth`
   - **Rutas:** Absolutas (`@/services/auth`)

4. **lib/zod-schemas**
   - **Estado:** Migrado a validation/zod
   - **Ruta nueva:** `src/lib/validation/zod/`
   - **Archivos:** `zod-schemas.ts` → `validation/zod/zod-schemas.ts`
   - **Imports:** 10+ archivos importan desde `@/lib/zod-schemas`
   - **Rutas:** Imports directos corregidos a `@/lib/validation/zod/zod-schemas`
   - **Nota:** Barrel de validation ya exporta desde la nueva ruta

5. **services/social/**
   - **Estado:** Migrado a social/ subdirectorio
   - **Ruta nueva:** `src/services/social/social/`
   - **Archivos migrados:**
     - `ContentModerationService.ts` → `social/ContentModerationService.ts`
     - `MatchService.ts` → `social/MatchService.ts`
     - `PredictiveMatchingService.ts` → `social/PredictiveMatchingService.ts`
     - `ReportManagementService.ts` → `social/ReportManagementService.ts`
     - `ReportService.ts` → `social/ReportService.ts`
     - `SmartMatchingService.ts` → `social/SmartMatchingService.ts`
     - `VideoChatService.ts` → `social/VideoChatService.ts`
     - `InvitationsService.ts` → `social/InvitationsService.ts`
     - `postsService.ts` → `social/postsService.ts`
     - `moderatorTimer.ts` → `social/moderatorTimer.ts`
     - `reportAIClassification.ts` → `social/reportAIClassification.ts`
     - `OneSignalService.ts` → `notifications/OneSignalService.ts`
     - `AdvancedCoupleService.ts` → `couple/AdvancedCoupleService.ts`
     - `GalleryPrivacyService.ts` → `social/GalleryPrivacyService.ts`
   - **Imports:** 10+ archivos importan desde `@/services/social`
   - **Rutas:** Absolutas (`@/services/social`)
   - **Barrel:** `src/services/social/index.ts` (con export explícito para ReportManagementService)

6. **services/analytics/**
   - **Estado:** Migrado a analytics/ subdirectorio
   - **Ruta nueva:** `src/services/analytics/analytics/`
   - **Archivos migrados:**
     - `AnalyticsService.ts` → `analytics/AnalyticsService.ts`
     - `TokenAnalyticsService.ts` → `analytics/TokenAnalyticsService.ts`
     - `HistoricalMetricsService.ts` → `analytics/HistoricalMetricsService.ts`
     - `ProfileStatsService.ts` → `analytics/ProfileStatsService.ts`
     - `AdvancedAnalyticsService.ts` → `analytics/AdvancedAnalyticsService.ts`
     - `ModerationMetricsService.ts` → `analytics/ModerationMetricsService.ts`
     - `ai/` → `analytics/ai/`
   - **Imports:** 8+ archivos importan desde `@/services/analytics`
   - **Rutas:** Absolutas (`@/services/analytics`)
   - **Barrel:** `src/services/analytics/index.ts` (actualizado)

### Medio Impacto (8-14 archivos)

7. **lib/media/**
   - **Estado:** Migrado a media/ subdirectorio
   - **Ruta nueva:** `src/lib/media/media/`
   - **Archivos:** `media.ts` → `media/media/media.ts`
   - **Imports:** 8+ archivos importan desde `@/lib/media`
   - **Rutas:** Absolutas (`@/lib/media`)
   - **Barrel:** `src/lib/media/index.ts` (creado)

---

## Dominios Restantes

**TODOS COMPLETADOS**

Todos los dominios de alto y medio impacto han sido migrados correctamente. No quedan dominios pendientes para migrar.

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

## Próximos Pasos

1. Migrar `services/social/` (alto impacto)
2. Migrar `services/analytics/` (alto impacto)
3. Migrar `lib/media/` (medio impacto)
4. Verificar type-check después de cada migración
5. Actualizar este .md con el progreso

---

## Commits Realizados

- `934d7aae` - "refactor: dominios logger y zod-schemas migrados - 24 Ene 2026 08:30"
- `fcdc2bed` - "refactor: fase 5 - validación y testing completada - 24 Ene 2026 08:20"
- `8e472469` - "refactor: fase 4 - consolidación y limpieza completada - 24 Ene 2026 08:15"
- `c458a57b` - "fix: corregir ruta de export de supabase en index.ts - 24 Ene 2026 08:10"
- `00022491` - "fix: eliminar export obsoleto de supabase en other/index.ts - 24 Ene 2026 08:05"
- `3b7e1590` - "refactor: fase 3 - migración de supabase a su propio directorio - 24 Ene 2026 08:00"
- `edccac1e` - "refactor: fase 2 - cambiar rutas relativas por absolutas en barrels - 24 Ene 2026 07:45"
- `8efc54a5` - "refactor: fase 2 - capa de compatibilidad (barrels por dominio) - 24 Ene 2026 07:40"
