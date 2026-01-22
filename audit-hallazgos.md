# Hallazgos del Barrido Inicial - ComplicesConecta

## 1. Archivos en Directorio Incorrecto
- **Nombre:** AdminNav.tsx
  - **Ruta Actual:** src/components/AdminNav.tsx
  - **Síntoma:** Componente específico de administración ubicado en la raíz de components/ en lugar del módulo de administración existente.
  - **Solución Propuesta:** Mover a src/components/admin/AdminNav.tsx y actualizar paths.

## 2. Problemas en Index.ts
- **Nombre:** src/services/index.ts
  - **Ruta:** src/services/index.ts
  - **Síntoma:** Funciona correctamente como barril central, pero coexiste con archivos "proxy" en el mismo directorio que causan duplicidad conceptual.
  - **Solución Propuesta:** Consolidar el uso de este index.ts y eliminar los archivos proxy individuales.

## 3. Otros Problemas Estructurales
- **Nombre:** Proxies de Servicios (Root)
  - **Archivos:** 
    - src/services/AdvancedCacheService.ts
    - src/services/TokenService.ts
    - src/services/NFTService.ts
    - src/services/ContentModerationService.ts
    - src/services/SmartMatchingService.ts
    - src/services/BannerManagementService.ts
    - src/services/DataPrivacyService.ts
    - src/services/DesktopNotificationService.ts
    - src/services/ErrorAlertService.ts
    - src/services/GlobalSearchService.ts
    - src/services/HistoricalMetricsService.ts
    - src/services/NFTGalleryService.ts
    - src/services/NotificationService.ts
    - src/services/PerformanceMonitoringService.ts
    - src/services/ProfileStatsService.ts
    - src/services/SecurityAuditService.ts
    - src/services/TokenAnalyticsService.ts
    - src/services/WalletService.ts
    - src/services/WebhookService.ts
  - **Síntoma:** Archivos "proxy" que solo re-exportan servicios desde subdirectorios (ej: `export * from "@/services/core/..."`). Generan ruido y duplicidad conceptual.
  - **Solución Propuesta:** Eliminar archivos proxy y actualizar imports en dependientes para apuntar a la ruta canónica o usar `src/services/index.ts`.

- **Nombre:** Directorio Shadow "couple"
  - **Ruta:** src/services/couple/
  - **Síntoma:** Directorio completo que duplica `src/services/social/couple/` mediante re-exports.
  - **Solución Propuesta:** Eliminar `src/services/couple/` y redirigir referencias a `src/services/social/couple/`.
