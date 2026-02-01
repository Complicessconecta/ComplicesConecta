# 📌 Hallazgos Consolidados (Nombre / Ruta / Síntoma / Solución)

**Proyecto:** ComplicesConecta
**Fecha:** 1 Febrero 2026
**Propósito:** Fuente única de hallazgos accionables (sin ejecutar cambios en DB hasta verificar local/remoto).

---

## 1) Seguridad (src/) – Auditoría estática

### H001 – Uso de `innerHTML` (XSS potencial)
- **Ruta(s):**
  - `src/tests/security/media-access.test.ts`
  - `src/security/session-pinning.ts` (solo set de HTML fijo para adblock test)
  - `src/utils/testDebugger.ts` (solo debug)
- **Síntoma:** uso de `innerHTML` / `component.container.innerHTML`.
- **Solución:**
  - Mantener `innerHTML` fuera de runtime productivo.
  - En UI productiva: usar `document.createElement(...)` + `textContent`.
  - En `session-pinning.ts`: mantener solo contenido fijo (sin interpolación externa).

### H002 – `dangerouslySetInnerHTML` (inyección CSS)
- **Ruta(s):** no encontrado en `src/` en el estado actual.
- **Síntoma:** N/A.
- **Solución:** N/A.

### H003 – Scripts externos (supply-chain / CSP)
- **Ruta(s) referenciadas por auditoría:**
  - `src/services/social/notifications/OneSignalService.ts`
  - `src/config/posthog.config.ts`
- **Síntoma:** carga de scripts externos en runtime.
- **Solución:**
  - Validar que la **CSP** y gating por entorno/consent estén activos.
  - Si hay warnings por falta de config: asegurar feature flags y carga condicional.

### H004 – `localStorage` para demo
- **Ruta(s) referenciadas por auditoría:**
  - `src/services/payments/NFTService.ts`
- **Síntoma:** persistencia local para datos demo.
- **Solución:**
  - Garantizar que sea estrictamente demo (sin PII real).
  - Si escala a producción: migrar a storage seguro/cifrado.

---

## 2) Type-Safety / Eliminación de `as any` (progreso)

### TS001 – Uso de `(supabase as any)` en servicios/páginas
- **Ruta(s) (pendientes según barrido):**
  - `src/services/social/InvitationsService.ts`
  - `src/services/social/chat/ChatPrivacyService.ts`
  - `src/services/payments/ReferralTokensService.ts`
  - `src/services/features/GlobalSearchService.ts`
  - `src/services/features/BannerManagementService.ts`
  - `src/services/core/AdvancedCacheService.ts`
  - `src/pages/Chat.tsx`
- **Síntoma:** type-unsafe queries a Supabase.
- **Solución:**
  - Tipar cliente como `SupabaseClient<Database>`.
  - Derivar tipos `Database["public"]["Tables"]["..."]["Row"]`.
  - Reemplazar casts por type guards/normalización.

---

## 3) Estructura / Duplicados / Barrels

### ST001 – Duplicado AppLayout
- **Ruta(s):**
  - `src/components/AppLayout.tsx`
  - `src/layouts/AppLayout.tsx`
- **Síntoma:** duplicado, riesgo de imports inconsistentes.
- **Solución:**
  - Consolidar en una sola fuente (preferir `src/layouts/AppLayout.tsx`).
  - Actualizar imports.
  - Verificar build/lint.

### ST002 – Proxy innecesario ChatPrivacyService
- **Ruta(s):**
  - `src/services/chat/ChatPrivacyService.ts` (proxy)
  - `src/services/social/chat/ChatPrivacyService.ts` (real)
- **Síntoma:** re-export innecesario.
- **Solución:**
  - Eliminar proxy.
  - Apuntar imports a implementación real.

---

## 4) Planificación DB (ANTES de migrar: verificar local/remoto)

### DB001 – Tablas sugeridas por planificación (Match)
- **Tablas:** `likes`, `matches`
- **Síntoma:** features core dependen de estas tablas.
- **Solución:**
  - **Primero** verificar existencia (local/remoto), columnas y RLS.
  - Solo si faltan: crear migración idempotente + policies.

### DB002 – Clubs (expansión)
- **Tablas/ajustes planificados:** `club_profiles` + related (events/discounts/etc.)
- **Síntoma:** roadmap de clubs requiere tablas.
- **Solución:**
  - Verificar esquema actual en Supabase (local/remoto).
  - Evitar drift: migraciones idempotentes.

---

## 5) Verificación obligatoria (local y remoto)

### Local (Docker Desktop / Supabase local)
- **Requisito:** Docker Desktop activo.
- **Objetivo:** confirmar tablas/columnas/policies existentes antes de tocar migraciones.
- **Checkpoints:**
  - `supabase status`
  - `supabase db diff` (si aplica)
  - Consultas a `information_schema.tables/columns` y `pg_policies`.

**Resultado (LOCAL):**
- **Tablas existentes (ejemplos):** `admin_users`, `clubs`, `club_applications`, `club_events`, `reports`.
- **RLS habilitado (confirmado):** `admin_users`, `clubs`, `club_applications`, `club_events`, `reports`.
- **Tablas NO existentes (confirmado):** `likes`, `matches`, `profile_likes`, `user_tokens`, `transactions`, `invitations`, `chat_messages`, `club_profiles`.

### Remoto (Supabase project)
- **Objetivo:** confirmar que remoto no tiene drift vs local.
- **Checkpoints:**
  - `supabase link --project-ref <ref>`
  - `supabase db dump -s public` (comparar objetos)
  - Consultas SQL a `pg_policies`/`pg_tables`.

**Resultado (REMOTO):**
- Se generó dump de schema remoto: `docs-unified/auditorias/REMOTE_SCHEMA_public.sql`.
- Búsqueda en el dump (CREATE TABLE / ENABLE RLS / CREATE POLICY) para:
  - `likes`, `matches`, `profile_likes`, `user_tokens`, `transactions`, `invitations`, `chat_messages`, `club_profiles`
  - **Resultado:** no aparecen en el schema remoto actual.
