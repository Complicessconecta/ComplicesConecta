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
- **Tablas/views referenciadas que NO aparecen en `src/types/supabase-generated.ts` (revalidado)**: 8
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

### Lista de tablas/views faltantes en tipos + rutas donde se usan (revalidado)

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

## Estado de corrección (SQL)

### Revalidación

La auditoría inicial reportó 36 faltantes por un parse parcial del archivo grande `src/types/supabase-generated.ts`. Se revalidó con parse completo del bloque `Database.public.Tables`.

### Acciones tomadas

- **Ya existía**:
  - `partner_requests` ya existe (migración: `supabase/migrations/20260115030549_add_partner_comment_structures.sql`).

- **Creado/actualizado en migración nueva**:
  - `supabase/migrations/20260126203000_create_missing_tables_views_src_audit.sql`
  - Crea (idempotente, con RLS/policies mínimas):
    - `chat_requests`
    - `chat_permissions`
    - `gallery_access`
    - `club_applications`
    - `content_permissions`
    - `content_violations`
  - Crea/actualiza view:
    - `couple_profiles_with_partners`

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
