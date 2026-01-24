# Inventario de Módulos - src/lib y src/services

**Fecha:** 24 Enero 2026
**Fase:** 1 - Inventario y clasificación (sin cambios de runtime)

---

## src/lib/ (49 archivos)

### Configuración
- `app-config.ts` - Configuración de la aplicación
- `env-utils.ts` - Utilidades de variables de entorno

### Utilidades
- `distance-utils.ts` - Cálculos de distancia
- `image-optimization.ts` - Optimización de imágenes
- `logger.ts` - Logging
- `media.ts` - Utilidades de media
- `medianames.ts` - Nombres de media
- `mobile.ts` - Utilidades móviles
- `userAgent.ts` - Detección de user agent

### Validación
- `validation.ts` - Validación genérica
- `zod-schemas.ts` - Schemas Zod

### Seguridad
- `errorHandling.ts` - Manejo de errores
- `multimediaSecurity.ts` - Seguridad de multimedia
- `safe-storage.ts` - Almacenamiento seguro
- `secureMediaService.ts` - Servicio de media seguro
- `sentry.ts` - Integración Sentry
- `wallet-silencer.ts` - Silenciador de wallet

### Almacenamiento
- `storage.ts` - Almacenamiento genérico
- `storage-manager.ts` - Gestor de almacenamiento
- `redis-cache.ts` - Cache Redis

### Analytics
- `analytics-metrics.ts` - Métricas de analytics

### AI
- `ai/` - Directorio de IA (submódulos)

### Moderación
- `moderation/` - Directorio de moderación (submódulos)

### Seguridad
- `security/` - Directorio de seguridad (submódulos)

### Otros
- `advancedFeatures.ts` - Características avanzadas
- `asset-loader.ts` - Cargador de assets
- `capture-console-errors.ts` - Captura de errores de consola
- `data.ts` - Datos
- `demo-uuid.ts` - UUID demo
- `email-service.ts` - Servicio de email
- `features.ts` - Características
- `imageService.ts` - Servicio de imágenes
- `images.ts` - Imágenes
- `infoCards.ts` - Info cards
- `intelligentAutomation.ts` - Automatización inteligente
- `invitations.ts` - Invitaciones
- `lifestyle-interests.ts` - Intereses de estilo de vida
- `matching.ts` - Matching
- `notifications.ts` - Notificaciones
- `report-export.ts` - Exportación de reportes
- `requests.ts` - Solicitudes
- `roles.ts` - Roles
- `supabase-logger.ts` - Logger Supabase
- `supabase.ts` - Supabase
- `tiktok-share.ts` - Compartir en TikTok
- `tokenPremium.ts` - Token premium
- `visual-validation.ts` - Validación visual
- `index.ts` - Barrel file

---

## src/services/ (18 directorios)

### AI
- `ai/` - Servicios de IA

### Analytics
- `analytics/` - Servicios de analytics

### Auth
- `auth/` - Servicios de autenticación

### Blockchain
- `blockchain/` - Servicios de blockchain

### Chat
- `chat/` - Servicios de chat

### Core
- `core/` - Servicios core

### Features
- `features/` - Servicios de características

### Geo
- `geo/` - Servicios geográficos

### Legal
- `legal/` - Servicios legales

### Neo4j
- `neo4j/` - Servicios de Neo4j

### Notifications
- `notifications/` - Servicios de notificaciones

### Payments
- `payments/` - Servicios de pagos

### RAG
- `rag/` - Servicios de RAG

### Social
- `social/` - Servicios sociales

### Tokens
- `tokens/` - Servicios de tokens

### Verification
- `verification/` - Servicios de verificación

### Otros
- `moderatorTimer.ts` - Timer de moderador
- `index.ts` - Barrel file

---

## Clasificación por Dominio Propuesta

### lib/config/*
- `app-config.ts`
- `env-utils.ts`

### lib/utils/*
- `distance-utils.ts`
- `image-optimization.ts`
- `logger.ts`
- `media.ts`
- `medianames.ts`
- `mobile.ts`
- `userAgent.ts`

### lib/validation/*
- `validation.ts`
- `zod-schemas.ts`
- `visual-validation.ts`

### lib/security/*
- `errorHandling.ts`
- `multimediaSecurity.ts`
- `safe-storage.ts`
- `secureMediaService.ts`
- `sentry.ts`
- `wallet-silencer.ts`

### lib/storage/*
- `storage.ts`
- `storage-manager.ts`
- `redis-cache.ts`

### lib/analytics/*
- `analytics-metrics.ts`

### lib/ai/*
- (submódulos en `ai/`)

### lib/moderation/*
- (submódulos en `moderation/`)

### lib/security/*
- (submódulos en `security/`)

### lib/other/*
- `advancedFeatures.ts`
- `asset-loader.ts`
- `capture-console-errors.ts`
- `data.ts`
- `demo-uuid.ts`
- `email-service.ts`
- `features.ts`
- `imageService.ts`
- `images.ts`
- `infoCards.ts`
- `intelligentAutomation.ts`
- `invitations.ts`
- `lifestyle-interests.ts`
- `matching.ts`
- `notifications.ts`
- `report-export.ts`
- `requests.ts`
- `roles.ts`
- `supabase-logger.ts`
- `supabase.ts`
- `tiktok-share.ts`
- `tokenPremium.ts`

### services/auth/*
- (submódulos en `auth/`)

### services/social/*
- (submódulos en `social/`)

### services/payments/*
- (submódulos en `payments/`)

### services/core/*
- (submódulos en `core/`)

### services/analytics/*
- (submódulos en `analytics/`)

### services/ai/*
- (submódulos en `ai/`)

### services/neo4j/*
- (submódulos en `neo4j/`)

### services/blockchain/*
- (submódulos en `blockchain/`)

### services/tokens/*
- (submódulos en `tokens/`)

### services/chat/*
- (submódulos en `chat/`)

### services/notifications/*
- (submódulos en `notifications/`)

### services/legal/*
- (submódulos en `legal/`)

### services/geo/*
- (submódulos en `geo/`)

### services/features/*
- (submódulos en `features/`)

### services/rag/*
- (submódulos en `rag/`)

### services/verification/*
- (submódulos en `verification/`)

---

## Próximos Pasos

1. **Fase 2:** Crear barrels por dominio
2. **Fase 3:** Migración gradual (un dominio por PR)
3. **Fase 4:** Deprecación y limpieza
