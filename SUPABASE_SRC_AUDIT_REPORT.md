# Auditoría Supabase en `src/`

## Objetivo

Detectar discrepancias entre:

- Referencias a Supabase desde el código (`.from()`, `.rpc()`, `functions.invoke()`, `storage.from()`)
- Tipos locales `src/types/supabase-generated.ts`

Para ubicar posibles síntomas de:

- Tabla/view inexistente o renombrada
- Tipos desactualizados (no regenerados)
- Referencias a views/relaciones que no están en `Database["public"]["Tables"]`
- Funciones RPC/Edge Functions no desplegadas

## Resumen

- **Archivos escaneados (`.ts/.tsx`)**: 925
- **Tablas referenciadas por `.from("...")`**: 100
- **Tablas referenciadas que NO aparecen en `src/types/supabase-generated.ts`**: 36
- **RPCs referenciadas**: 6
- **Edge Functions invocadas**: 6
- **Buckets de Storage referenciados**: 1

## Hallazgos críticos (tipos vs referencias)

### Síntoma

Las siguientes tablas/views se usan en el código (`.from("...")`) pero **no aparecen** dentro de `Database.public.Tables` del archivo `src/types/supabase-generated.ts`.

Esto normalmente indica:

- **Tipos desactualizados** (falta regenerar tipos), o
- La referencia apunta a **view** / **tabla en otro schema** / **tabla borrada**, o
- Nombre diferente al real.

### Lista de tablas/views faltantes en tipos + rutas donde se usan

#### `chat_permissions`
- **Ruta**: `src/services/social/chat/ChatPrivacyService.ts`
- **Síntoma**: Uso de `.from("chat_permissions")` pero no existe en `Database.public.Tables`.

#### `chat_requests`
- **Ruta**: `src/services/social/chat/ChatPrivacyService.ts`
- **Síntoma**: Uso de `.from("chat_requests")` pero no existe en `Database.public.Tables`.

#### `club_applications`
- **Ruta**: `src/pages/Clubs.tsx`
- **Síntoma**: Uso de `.from("club_applications")` pero no existe en `Database.public.Tables`.

#### `content_permissions`
- **Ruta**: `src/services/auth/auth/ContentProtectionService.ts`
- **Síntoma**: Uso de `.from("content_permissions")` pero no existe en `Database.public.Tables`.

#### `content_violations`
- **Ruta**: `src/services/auth/auth/ContentProtectionService.ts`
- **Síntoma**: Uso de `.from("content_violations")` pero no existe en `Database.public.Tables`.

#### `couple_profiles_with_partners`
- **Ruta**: `src/features/profile/coupleProfilesCompatibility.ts`
- **Síntoma**: Uso de `.from("couple_profiles_with_partners")` pero no existe en `Database.public.Tables`.

#### `gallery_access`
- **Ruta**: `src/services/social/chat/ChatPrivacyService.ts`
- **Síntoma**: Uso de `.from("gallery_access")` pero no existe en `Database.public.Tables`.

#### `partner_requests`
- **Ruta**: `src/components/clubs/PartnerRequestModal.tsx`
- **Síntoma**: Uso de `.from("partner_requests")` pero no existe en `Database.public.Tables`.

#### `security_logs`
- **Ruta**: `src/tests/security/media-access.test.ts`
- **Síntoma**: Uso de `.from("security_logs")` pero no existe en `Database.public.Tables`.

#### `staking_records`
- **Rutas**:
  - `src/hooks/useTokens.ts`
  - `src/services/analytics/analytics/TokenAnalyticsService.ts`
  - `src/services/payments/nft/NFTVerificationService.ts`
- **Síntoma**: Uso de `.from("staking_records")` pero no existe en `Database.public.Tables`.

#### `stories`
- **Rutas**:
  - `src/services/core/DataPrivacyService.ts`
  - `src/services/core/QueryOptimizationService.ts`
  - `src/services/social/social/postsService.ts`
- **Síntoma**: Uso de `.from("stories")` pero no existe en `Database.public.Tables`.

#### `story_comments`
- **Ruta**: `src/services/social/social/postsService.ts`
- **Síntoma**: Uso de `.from("story_comments")` pero no existe en `Database.public.Tables`.

#### `story_likes`
- **Ruta**: `src/services/social/social/postsService.ts`
- **Síntoma**: Uso de `.from("story_likes")` pero no existe en `Database.public.Tables`.

#### `story_shares`
- **Rutas**:
  - `src/components/stories/StoryService.ts`
  - `src/services/social/social/postsService.ts`
- **Síntoma**: Uso de `.from("story_shares")` pero no existe en `Database.public.Tables`.

#### `summary_feedback`
- **Rutas**:
  - `src/components/chat/SummaryModal.tsx`
  - `src/components/modals/SummaryModal.tsx`
  - `src/features/chat/ChatSummaryService.ts`
- **Síntoma**: Uso de `.from("summary_feedback")` pero no existe en `Database.public.Tables`.

#### `summary_requests`
- **Ruta**: `src/features/chat/ChatSummaryService.ts`
- **Síntoma**: Uso de `.from("summary_requests")` pero no existe en `Database.public.Tables`.

#### `swinger_interests`
- **Ruta**: `src/hooks/useInterests.ts`
- **Síntoma**: Uso de `.from("swinger_interests")` pero no existe en `Database.public.Tables`.

#### `testnet_token_claims`
- **Ruta**: `src/services/payments/WalletService.ts`
- **Síntoma**: Uso de `.from("testnet_token_claims")` pero no existe en `Database.public.Tables`.

#### `token_analytics`
- **Ruta**: `src/services/analytics/analytics/TokenAnalyticsService.ts`
- **Síntoma**: Uso de `.from("token_analytics")` pero no existe en `Database.public.Tables`.

#### `token_transactions`
- **Rutas**:
  - `src/services/analytics/analytics/TokenAnalyticsService.ts`
  - `src/services/core/DataPrivacyService.ts`
  - `src/services/payments/TokenService.ts`
- **Síntoma**: Uso de `.from("token_transactions")` pero no existe en `Database.public.Tables`.

#### `two_factor_auth`
- **Ruta**: `src/services/auth/auth/SecurityService.ts`
- **Síntoma**: Uso de `.from("two_factor_auth")` pero no existe en `Database.public.Tables`.

#### `user_consents`
- **Rutas**:
  - `src/components/ui/ConsentGuard.tsx`
  - `src/config/posthog.config.ts`
  - `src/services/core/legal/ConsentService.ts`
  - `src/services/social/notifications/OneSignalService.ts`
- **Síntoma**: Uso de `.from("user_consents")` pero no existe en `Database.public.Tables`.

#### `user_device_tokens`
- **Ruta**: `src/services/social/notifications/OneSignalService.ts`
- **Síntoma**: Uso de `.from("user_device_tokens")` pero no existe en `Database.public.Tables`.

#### `user_identifiers`
- **Ruta**: `src/services/auth/auth/UserIdentificationService.ts`
- **Síntoma**: Uso de `.from("user_identifiers")` pero no existe en `Database.public.Tables`.

#### `user_interests`
- **Rutas**:
  - `src/hooks/useInterests.ts`
  - `src/services/social/social/PredictiveMatchingService.ts`
- **Síntoma**: Uso de `.from("user_interests")` pero no existe en `Database.public.Tables`.

#### `user_nfts`
- **Ruta**: `src/services/payments/NFTService.ts`
- **Síntoma**: Uso de `.from("user_nfts")` pero no existe en `Database.public.Tables`.

#### `user_referral_balances`
- **Ruta**: `src/services/payments/ReferralTokensService.ts`
- **Síntoma**: Uso de `.from("user_referral_balances")` pero no existe en `Database.public.Tables`.

#### `user_roles`
- **Ruta**: `src/pages/admin/useAdminDashboard.ts`
- **Síntoma**: Uso de `.from("user_roles")` pero no existe en `Database.public.Tables`.

#### `user_suspensions`
- **Rutas**:
  - `src/pages/ModeratorDashboard.tsx`
  - `src/pages/moderators/ModeratorDashboard.tsx`
- **Síntoma**: Uso de `.from("user_suspensions")` pero no existe en `Database.public.Tables`.

#### `user_themes`
- **Rutas**:
  - `src/hooks/useTheme.ts`
  - `src/themes/useTheme.ts`
- **Síntoma**: Uso de `.from("user_themes")` pero no existe en `Database.public.Tables`.

#### `user_token_balances`
- **Rutas**:
  - `src/pages/admin/AdminProduction.tsx`
  - `src/services/analytics/analytics/TokenAnalyticsService.ts`
  - `src/services/payments/TokenService.ts`
- **Síntoma**: Uso de `.from("user_token_balances")` pero no existe en `Database.public.Tables`.

#### `user_wallets`
- **Ruta**: `src/services/payments/WalletService.ts`
- **Síntoma**: Uso de `.from("user_wallets")` pero no existe en `Database.public.Tables`.

#### `web_vitals_history`
- **Rutas**:
  - `src/services/analytics/analytics/HistoricalMetricsService.ts`
  - `src/services/core/PerformanceMonitoringService.ts`
- **Síntoma**: Uso de `.from("web_vitals_history")` pero no existe en `Database.public.Tables`.

#### `worldid_rewards`
- **Ruta**: `src/hooks/useWorldID.ts`
- **Síntoma**: Uso de `.from("worldid_rewards")` pero no existe en `Database.public.Tables`.

#### `worldid_statistics`
- **Ruta**: `src/hooks/useWorldID.ts`
- **Síntoma**: Uso de `.from("worldid_statistics")` pero no existe en `Database.public.Tables`.

#### `worldid_verifications`
- **Rutas**:
  - `src/hooks/useWorldID.ts`
  - `src/pages/ModeratorDashboard.tsx`
  - `src/pages/moderators/ModeratorDashboard.tsx`
- **Síntoma**: Uso de `.from("worldid_verifications")` pero no existe en `Database.public.Tables`.

## Inventario de RPCs (uso en código)

- `check_fingerprint_banned`
  - `src/services/auth/digitalFingerprint.ts`
- `is_admin`
  - `src/components/auth/AdminRoute.tsx`
- `is_admin_or_moderator`
  - `src/components/auth/ModeratorRoute.tsx`
- `record_gallery_commission`
  - `src/services/payments/galleryCommission.ts`
- `resolve_couple_dispute`
  - `src/services/core/legal/CoupleDissolutionService.ts`
- `search_unified`
  - `src/services/features/GlobalSearchService.ts`

## Inventario de Edge Functions (uso en código)

- `create-cmpx-checkout`
  - `src/pages/Shop.tsx`
- `create-investment-checkout`
  - `src/pages/Invest.tsx`
- `create-user`
  - `src/components/admin/UserManagementPanel.tsx`
- `delete-user`
  - `src/components/admin/UserManagementPanel.tsx`
- `hcaptcha-verify`
  - `src/utils/hcaptcha-verify.ts`
- `suspend-user`
  - `src/components/admin/UserManagementPanel.tsx`

## Inventario de Storage Buckets (uso en código)

- `profile-images`
  - `src/components/profiles/couple/useCouplePhotos.ts`

## Próxima acción sugerida

1. Verificar si estas tablas/views existen realmente en Supabase (schema `public`) y/o si son views.
2. Si existen, regenerar tipos para alinear `src/types/supabase-generated.ts`.
3. Si NO existen, crear migraciones faltantes (con RLS/policies) o corregir referencias en código.
4. Si son views, validar si el generador de tipos las incluye o si se requiere estrategia alternativa.
