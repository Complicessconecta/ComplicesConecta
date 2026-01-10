# BARRIDO_SRC_ESTADO.md

**Fecha:** January 08, 2026
**Estado:** EN PROCESO
**Responsable:** Lead Architect & Tech Lead (IA)

Este documento rastrea el progreso del protocolo "BARRIDO PROFUNDO" ejecutado bajo las reglas del Documento Maestro IA v4.0.

## 📋 Tabla de Problemas Identificados

| ID | Ruta del Archivo | Síntoma / Problema | Solución Propuesta | Estado |
|----|------------------|--------------------|--------------------|--------|
| 1 | `src/services/legal/CoupleDissolutionService.ts` | Discrepancia de esquema: columnas faltantes (`frozen_assets_snapshot`, `proposed_winner_id`, etc.) y errores de inserción (`couple_agreement_id`, `dispute_reason`). | Actualizar interfaz, ajustar lógica de inserción y crear migración SQL para tabla `couple_disputes`. | ✅ CORREGIDO |
| 2 | `src/pages/Discover.tsx` | Lógica de Match incompleta: `handleLike` solo muestra toast, no persiste en DB. | Implementar `MatchService.ts` con lógica de likes, check mutuo y creación de match. Integrar en `Discover.tsx`. | ✅ CORREGIDO |
| 3 | `src/components/layout/ResponsiveLayout.tsx` | Duplicidad con `src/layouts/ResponsiveLayout.tsx`. | Elegir una ubicación canónica (`src/layouts`), migrar imports y eliminar el duplicado. | ✅ CORREGIDO |
| 4 | `src/pages/Chat.tsx` | Falta Galería Privada y Gating. | Lógica de paywall y verificación de match existe en `Chat.tsx`. Se creó migración `20260109_add_gallery_commissions.sql` para soportar comisiones. | ✅ VERIFICADO |
| 5 | `src/services/blockchain/WalletService.ts` | Verificar existencia y lógica de minteo NFT. | Lógica existe pero usa mocks/demo para Minting (contratos pendientes Q2 2026). Se verificó integración. | ✅ VERIFICADO |

## �️ Auditoría de Directorios y Pruebas (v3.6.6)

### 1. Estado de Migraciones SQL
- **Estado**: ⚠️ **Parcialmente Fallido**
- **Detalle**: La base de datos local tiene inconsistencias (tablas/columnas existentes que no coinciden con el historial).
- **Acción**: Se han generado los archivos de migración correctos (`20260108...`, `20260109...`). Se recomienda un `supabase db reset` (con backup previo) o sincronización manual para aplicar los cambios en un entorno limpio.

### 2. Auditoría de Código (`src/features`, `src/hooks`)
- **Hallazgos Principales**:
  - **Tipado Débil (`any`)**: Detectado uso extensivo de `any` en `useAuth.ts` (perfil) y `useRealtimeChat.ts` (cliente Supabase).
    - *Impacto*: Reduce la seguridad de tipos y aumenta riesgo de bugs en runtime.
  - **Duplicidad de Servicios**: Se detectaron múltiples copias de servicios clave:
    - `ConsentVerificationService.ts` existe en `src/services/`, `src/services/ai/` y `src/services/analytics/ai/`.
    - `ReportService.ts` existe en `src/services/` y `src/services/social/`.
  - **Lógica Mock**: `useTokens.ts` confirma que la lógica de Blockchain/Tokens opera en modo "Mock temporal", consistente con el roadmap (Fase 4).

### 3. Resultados de Pruebas (`npm test`)
- **Resumen**: 🔴 **FALLIDO** (4/40 suites fallaron)
- **Causa Raíz**: Rutas de importación rotas debido a reestructuración de `src/services`.
  - `Neo4jService.test.ts`: Busca en `@/services/graph` → Real: `src/services/core/graph`.
  - `PushNotificationService.test.ts`: Busca en `@/services` → Real: `src/services/core`.
  - `ReportService.test.ts`: Error de constructor (posible duplicidad de clases).
- **Suites Exitosas**: 105 tests pasaron correctamente (Lógica de negocio core).

### 4. Recomendaciones Inmediatas
1. **Consolidar Servicios**: Eliminar archivos duplicados en `src/services` y centralizar exportaciones en `src/services/index.ts`.
2. **Corregir Imports en Tests**: Actualizar las rutas en los archivos de prueba para reflejar la estructura actual (`src/services/core/...`).
3. **Reforzar Tipos**: Reemplazar `any` en `useAuth` con interfaces `Profile` completas.

## �📂 Progreso de Directorios

- [ ] `src/ai`
- [ ] `src/assets`
- [ ] `src/components`
- [ ] `src/config`
- [ ] `src/context`
- [ ] `src/entities`
- [ ] `src/features`
- [ ] `src/hooks`
- [ ] `src/layouts`
- [ ] `src/lib`
- [ ] `src/pages`
- [ ] `src/profiles`
- [ ] `src/services`
- [ ] `src/shared`
- [ ] `src/store`
- [ ] `src/styles`
- [ ] `src/types`
- [ ] `src/utils`

## 📝 Notas de Ejecución

- Se priorizan los archivos marcados como problemáticos en los reportes previos.
- Se generarán correcciones acumulativas sin eliminar flujos existentes.
- Se crearán las migraciones SQL necesarias en `supabase/migrations/`.
