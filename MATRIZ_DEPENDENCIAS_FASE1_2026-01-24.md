# Matriz de Dependencias - Fase 1

**Fecha:** 24 Enero 2026
**Fase:** 1 - Inventario y clasificación (sin cambios de runtime)

---

## Actualización 25 Ene 2026

- **Import fixes (aplicados):** se corrigieron rutas antiguas hacia barrels estables para `@/services/social` y `@/services/analytics`, y se corrigió el barrel interno `src/services/analytics/analytics/ai/index.ts` a exports relativos.
- **Pendiente inmediato:** ejecutar type-check (`build:check`) para confirmar 0 imports rotos.

---

## Análisis de Imports

### Patrones de Import Más Comunes

#### Desde @/lib/
- `@/lib/logger` - Logging (usado en 20+ archivos)
- `@/lib/supabase` - Cliente Supabase (usado en 15+ archivos)
- `@/lib/zod-schemas` - Validación Zod (usado en 10+ archivos)
- `@/lib/media` - Tipos de media (usado en 8+ archivos)
- `@/lib/matching` - Algoritmos de matching (usado en 5+ archivos)
- `@/lib/app-config` - Configuración de app (usado en 5+ archivos)
- `@/lib/data` - Datos de prueba (usado en 5+ archivos)
- `@/lib/validation` - Validación genérica (usado en 4+ archivos)
- `@/lib/errorHandling` - Manejo de errores (usado en 4+ archivos)
- `@/lib/storage` - Almacenamiento (usado en 4+ archivos)

#### Desde @/services/
- `@/services/auth/*` - Autenticación (usado en 15+ archivos)
- `@/services/social/*` - Social features (usado en 10+ archivos)
- `@/services/analytics/*` - Analytics (usado en 8+ archivos)
- `@/services/core/*` - Core services (usado en 6+ archivos)
- `@/services/blockchain/*` - Blockchain (usado en 5+ archivos)
- `@/services/tokens/*` - Tokens (usado en 5+ archivos)
- `@/services/chat/*` - Chat (usado en 4+ archivos)
- `@/services/neo4j/*` - Neo4j (usado en 4+ archivos)

---

## Duplicados Detectados

### 1. Servicios de Email
- `src/lib/email-service.ts`
- `src/lib/emailService.ts`
- Posible duplicación: ambos archivos parecen manejar email

### 2. Servicios de Imágenes
- `src/lib/image-optimization.ts`
- `src/lib/imageService.ts`
- `src/lib/images.ts`
- Posible duplicación: múltiples archivos para manejo de imágenes

### 3. Servicios de Storage
- `src/lib/storage.ts`
- `src/lib/storage-manager.ts`
- `src/lib/safe-storage.ts`
- Posible duplicación: múltiples archivos para almacenamiento

### 4. Servicios de Notificaciones
- `src/lib/notifications.ts`
- `src/services/notifications/*`
- Posible duplicación: lib/notifications.ts vs services/notifications/*

### 5. Servicios de Validación
- `src/lib/validation.ts`
- `src/lib/zod-schemas.ts`
- `src/lib/visual-validation.ts`
- Posible duplicación: múltiples archivos de validación

---

## Proxies Detectados

### 1. Barrel Files
- `src/lib/index.ts` - Re-exporta desde lib/
- `src/services/index.ts` - Re-exporta desde services/

### 2. Utils Proxies
- `src/utils/tiktokShare.ts` - Re-exporta desde @/lib/tiktok-share
- `src/utils/reportExport.ts` - Re-exporta desde @/lib/report-export

---

## Dependencias Cruzadas

### Archivos con Dependencias Cruzadas (ejemplos)

#### src/lib/
- `app-config.ts` - Importa de @/lib/logger, @/lib/validation
- `email-service.ts` - Importa de @/lib/logger, @/lib/zod-schemas
- `imageService.ts` - Importa de @/lib/logger, @/lib/storage
- `matching.ts` - Importa de @/lib/logger, @/lib/media

#### src/services/
- `services/auth/*` - Importa de @/lib/logger, @/lib/validation, @/lib/security
- `services/social/*` - Importa de @/lib/logger, @/lib/matching, @/lib/media
- `services/analytics/*` - Importa de @/lib/logger, @/lib/validation

---

## Matriz de Migración Propuesta

### Dominios Prioritarios para Migración

#### Alto Impacto (usados en 15+ archivos)
1. **lib/logger** - Logging (usado en 20+ archivos)
2. **lib/supabase** - Cliente Supabase (usado en 15+ archivos)
3. **services/auth/** - Autenticación (usado en 15+ archivos)

#### Medio Impacto (usados en 8-14 archivos)
4. **lib/zod-schemas** - Validación Zod (usado en 10+ archivos)
5. **lib/media** - Tipos de media (usado en 8+ archivos)
6. **services/social/** - Social features (usado en 10+ archivos)
7. **services/analytics/** - Analytics (usado en 8+ archivos)

#### Bajo Impacto (usados en 4-7 archivos)
8. **lib/matching** - Matching (usado en 5+ archivos)
9. **lib/app-config** - Configuración (usado en 5+ archivos)
10. **lib/data** - Datos de prueba (usado en 5+ archivos)

---

## Recomendaciones

### 1. Consolidar Duplicados
- Unificar `email-service.ts` y `emailService.ts`
- Unificar archivos de imágenes en un solo servicio
- Unificar archivos de storage en un solo gestor
- Unificar archivos de validación en un solo módulo

### 2. Eliminar Proxies
- Mover re-exports a barrel files centralizados
- Eliminar archivos proxy en `src/utils/`

### 3. Migración Gradual
- Comenzar con dominios de alto impacto (logger, supabase, auth)
- Mover un dominio por PR
- Mantener exports legacy durante transición

---

## Criterio de Salida Fase 1

✅ Inventario de módulos completado
✅ Clasificación por dominio completada
✅ Duplicados detectados (5 casos)
✅ Proxies detectados (2 casos)
✅ Dependencias cruzadas identificadas
✅ Matriz de migración propuesta
✅ Recomendaciones documentadas

**Estado:** Fase 1 completada. Listo para Fase 2: Capa de compatibilidad.
