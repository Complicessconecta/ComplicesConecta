# Estado de Errores TypeScript - Build Check

**Fecha:** 24 Enero 2026
**Rama:** master
**Commit:** b9d1e735
**Total Errores:** ~75 errores TypeScript

---

## Errores por Categoría

### 1. Errores de Logger.error (PostgrestError/Error → LogContext)

| Archivo | Línea | Síntoma | Solución |
|---------|-------|---------|----------|
| `src/services/ai/AIIntegrationService.ts` | 112 | `Argument of type 'Error' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { error: error.message, stack: error.stack })` |
| `src/services/ai/AIIntegrationService.ts` | 120 | `Argument of type 'Error' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { error: error.message, stack: error.stack })` |
| `src/services/ai/AIIntegrationService.ts` | 128 | `Argument of type 'Error' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { error: error.message, stack: error.stack })` |
| `src/services/ai/AIIntegrationService.ts` | 411 | `'error' is of type 'unknown'` | `const errorMsg = error instanceof Error ? error.message : String(error)` |
| `src/services/auth/auth/UserIdentificationService.ts` | 128 | `Argument of type 'PostgrestError' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { error: error.message, details: error.details })` |
| `src/services/auth/mfa/MFAService.ts` | 314 | `Argument of type 'MFAConfig' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { config: JSON.stringify(config) })` |
| `src/services/core/DesktopNotificationService.ts` | 138 | `Argument of type 'NotificationConfig' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { config: JSON.stringify(config) })` |
| `src/services/core/RateLimitService.ts` | 243 | `Argument of type 'RateLimitConfig' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { config: JSON.stringify(config) })` |
| `src/lib/validation.ts` | 101 | `Argument of type 'PostgrestError' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { error: error.message, details: error.details })` |
| `src/pages/profiles/shared/Profiles.tsx` | 264 | `Argument of type 'PostgrestError' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { error: error.message, details: error.details })` |
| `src/utils/emailValidation.ts` | 36 | `Argument of type 'PostgrestError' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { error: error.message, details: error.details })` |

### 2. Errores de Importación (Módulos no encontrados)

| Archivo | Línea | Módulo Faltante | Solución |
|---------|-------|----------------|----------|
| `src/services/ai/ConsentVerificationService.ts` | 1 | `@/services/analytics/ai/ConsentVerificationService` | Cambiar a `@/services/analytics/ai/ConsentVerificationService` |
| `src/services/analytics/analytics/ai/AILayerService.ts` | 26 | `@/services/analytics/ai/types` | Crear `src/services/analytics/analytics/ai/types.ts` |
| `src/services/analytics/analytics/ai/AILayerService.ts` | 27 | `@/services/analytics/ai/utils` | Crear `src/services/analytics/analytics/ai/utils.ts` |
| `src/services/analytics/analytics/ai/index.ts` | 1-7 | Múltiples módulos ai/* | Actualizar rutas a subdirectorios analytics/ai/ |
| `src/services/analytics/analytics/ai/models/PyTorchScoringModel.ts` | 20,22 | `@/services/analytics/ai/types`, `@/services/analytics/ai/utils` | Crear archivos types.ts y utils.ts |
| `src/services/analytics/analytics/ai/PredictiveGraphMatchingService.ts` | 16 | `@/services/analytics/ai/EmotionalAIService` | Cambiar a ruta correcta |
| `src/services/analytics/analytics/ai/PredictiveGraphMatchingService.ts` | 20 | `@/services/social/SmartMatchingService` | Cambiar a `@/services/social/social/SmartMatchingService` |
| `src/services/analytics/analytics/ai/utils.ts` | 11 | `@/services/analytics/ai/types` | Crear types.ts |
| `src/pages/TokensInfo.tsx` | 11 | `@/services/analytics/TokenAnalyticsService` | Cambiar a `@/services/analytics/analytics/TokenAnalyticsService` |
| `src/pages/Chat.tsx` | 36 | `@/services/social/MatchService` | Cambiar a `@/services/social/social/MatchService` |
| `src/pages/Discover.tsx` | 28 | `@/services/social/MatchService` | Cambiar a `@/services/social/social/MatchService` |
| `src/pages/Feed.tsx` | 6 | `@/services/social/postsService` | Cambiar a `@/services/social/social/postsService` |
| `src/services/core/TestingService.ts` | Múltiples | Varios servicios | Actualizar todas las rutas de importación |
| `src/moderatorTimer.ts` | 1 | `@/services/social/moderatorTimer` | Cambiar a `@/services/social/social/moderatorTimer` |

### 3. Errores de Argumentos (Número incorrecto de parámetros)

| Archivo | Línea | Síntoma | Solución |
|---------|-------|---------|----------|
| `src/lib/images.ts` | 145, 206, 251, 288, 329 | `Expected 1-2 arguments, but got 4` | Revisar firmas de funciones, eliminar parámetros extra |
| `src/lib/intelligentAutomation.ts` | 731, 762 | `Argument of type 'AutomationRule' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { rule: JSON.stringify(rule) })` |
| `src/lib/storage-manager.ts` | 94 | `Argument of type 'string[]' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { files: filesArray })` |
| `src/pages/Clubs.tsx` | 204 | `Argument of type 'GeolocationPositionError' is not assignable to parameter of type 'LogContext'` | `logger.error("mensaje", { error: error.message, code: error.code })` |

---

## Plan de Acción

### Fase 1: Corregir Logger.error (Prioridad Alta)
1. Usar script `fix-logger-errors.cjs` para errores restantes
2. Corregir manualmente casos especiales (MFAConfig, NotificationConfig, etc.)

### Fase 2: Crear Módulos Faltantes (Prioridad Alta)
1. Crear `src/services/analytics/analytics/ai/types.ts`
2. Crear `src/services/analytics/analytics/ai/utils.ts`
3. Actualizar barrels en `src/services/analytics/analytics/ai/index.ts`

### Fase 3: Corregir Importaciones (Prioridad Media)
1. Actualizar rutas en archivos afectados
2. Usar búsqueda y reemplazo masivo para patrones comunes

### Fase 4: Corregir Argumentos (Prioridad Baja)
1. Revisar firmas de funciones en lib/images.ts
2. Corregir casos específicos de LogContext

---

## Scripts Disponibles

### fix-logger-errors.cjs
```bash
node fix-logger-errors.cjs
```
Corrige automáticamente errores de logger.error con patrones comunes.

---

## Estado Actual

- ✅ **Logger errores principales:** Corregidos en servicios principales
- ⏳ **Logger errores restantes:** ~11 pendientes
- ❌ **Importaciones faltantes:** ~40 errores
- ❌ **Argumentos incorrectos:** ~20 errores

**Próximo paso recomendado:** Ejecutar script para logger errores restantes y luego crear módulos faltantes.
