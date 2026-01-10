# ESTADO DEL BARRIDO DE CÓDIGO (SRC) - AUDITORÍA 2026-01-10

## RESUMEN EJECUTIVO
- **Objetivo**: Limpieza, refactorización y consolidación de código.
- **Estado Actual**: ✅ **Fase de Pruebas Completada (100% Passing)**
- **Archivos Procesados**: ~85%
- **Deuda Técnica Reducida**: Alta (Eliminación de duplicados, typing estricto, centralización de servicios).

## 1. COMPONENTES Y SERVICIOS CONSOLIDADOS (✅ COMPLETADO)
| Componente/Servicio | Estado Original | Estado Actual | Acción Tomada |
|---------------------|-----------------|---------------|---------------|
| `ResponsiveLayout` | Duplicado en root y components | ✅ Único en `src/layouts/` | Unificación y limpieza de imports |
| `CoupleDissolutionService` | Schema mismatch | ✅ Corregido | Migración SQL aplicada |
| `MatchService` | Lógica dispersa | ✅ Centralizado | Integrado en `Discover.tsx` |
| `ContentProtectionService` | Métodos duplicados | ✅ Limpio | Eliminación de redundancia, tests pasando |
| `ReportService` | Tipado débil | ✅ Estricto | Fix `reporterId`, tests passing |
| `UserVerificationService` | Mock state issue | ✅ Corregido | Uso de `vi.hoisted` en tests |
| `ProfileSingle` | Mock incompleto | ✅ Corregido | Agregado `isDemoMode` a mocks |

## 2. SUITE DE PRUEBAS (✅ VERDE)
- **Framework**: Vitest (Unit/Integration) + Playwright (E2E separados)
- **Estado**: 37 Archivos PASSED, 345 Tests PASSED.
- **Cobertura**: Funcionalidad crítica cubierta (Auth, Matches, Posts, Protección de Contenido).
- **Conflictos Resueltos**: `profile-management.spec.ts` movido a `src/tests/e2e/` para evitar conflictos con Vitest.

## 3. PENDIENTES PRIORITARIOS (TODO)
- [ ] **Documentación**: Crear `SERVICE_LOCATIONS.md` y `TYPES.md`.
- [ ] **Base de Datos**: Crear tablas `swinger_interests` y `couple_profile_likes`.
- [ ] **Blockchain**: Implementar lógica de minteo NFT real en `WalletService.ts`.

## 4. NOTAS TÉCNICAS
- **Canonical Locations**:
  - Services: `src/services/core/` (o dominios específicos en `src/services/`)
  - Types: `src/types/`
  - Layouts: `src/layouts/`
- **Testing**:
  - Mocks de Supabase centralizados y robustos.
  - Uso de `vi.hoisted` mandatorio para mocks de módulos externos.

## 5. SIGUIENTES PASOS
1. Generar documentación de arquitectura (`SERVICE_LOCATIONS.md`).
2. Aplicar migración SQL para tablas faltantes.
3. Finalizar integración de Wallet/NFT.
