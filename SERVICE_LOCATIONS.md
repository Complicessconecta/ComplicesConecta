# MAPA DE SERVICIOS (SERVICE_LOCATIONS)

Este documento define la **ubicación canónica** de los servicios en la arquitectura de ComplicesConecta.
Cualquier servicio fuera de estas rutas se considera **DEPRECADO** o **DUPLICADO** y debe ser refactorizado.

## 1. Core & Infraestructura (`src/services/core/`)
Servicios transversales, de infraestructura y utilidades base.
- **Ubicación**: `src/services/core/`
- **Servicios Clave**:
  - `APMService.ts`: Monitoreo de rendimiento.
  - `NotificationService.ts`: Notificaciones del sistema.
  - `PushNotificationService.ts`: Notificaciones Push.
  - `Neo4jService.ts` (en `graph/`): Conexión a base de datos de grafos.
  - `S2Service.ts` (en `geo/`): Geonetworking y celdas S2.

## 2. Autenticación y Seguridad (`src/services/auth/`)
Manejo de usuarios, sesiones, biometría y protección.
- **Ubicación**: `src/services/auth/`
- **Servicios Clave**:
  - `SecurityService.ts`: Seguridad general y detección de fraudes.
  - `ContentProtectionService.ts`: Anti-screenshot y DRM.
  - `UserVerificationService.ts`: Verificación KYC/Biometría.
  - `UserIdentificationService.ts`: Identificadores únicos.

## 3. Social y Matching (`src/services/social/`)
Lógica de negocio social, posts, matches y moderación.
- **Ubicación**: `src/services/social/`
- **Servicios Clave**:
  - `MatchService.ts`: Lógica de likes y matches.
  - `ContentModerationService.ts`: Moderación de contenido (IA/Manual).
  - `ReportService.ts`: Gestión de reportes de usuarios.
  - `postsService.ts`: Gestión de publicaciones.

## 4. Pagos y Blockchain (`src/services/payments/`)
Gestión de wallet, tokens (CMPX/GTK) y NFTs.
- **Ubicación**: `src/services/payments/`
- **Servicios Clave**:
  - `WalletService.ts`: Gestión de billetera y saldos.
  - `NFTService.ts`: Gestión de NFTs.
  - `TokenService.ts`: Operaciones con tokens.

## 5. Analítica e IA (`src/services/analytics/`)
Servicios de inteligencia artificial y métricas.
- **Ubicación**: `src/services/analytics/`
- **Servicios Clave**:
  - `AILayerService.ts` (en `ai/`): Capa de orquestación de IA.
  - `EmotionalAIService.ts` (en `ai/`): Análisis de sentimiento.
  - `HistoricalMetricsService.ts`: Métricas históricas.

## ⚠️ Archivos a Refactorizar (Duplicados Conocidos)
Los siguientes archivos deben ser eliminados en favor de sus versiones canónicas:
- `src/services/S2Service.ts` -> Usar `src/services/core/geo/S2Service.ts`
- `src/services/ConsentVerificationService.ts` -> Usar `src/services/analytics/ai/ConsentVerificationService.ts`
- `src/services/ReportService.ts` -> Usar `src/services/social/ReportService.ts`
