# ComplicesConecta – Reporte de Progreso del Proyecto

> Núcleo: Consolidación de Base de Datos + Tipado Estricto en Auth/Perfiles

---

## 2025-12-29 – Estado de Fases Core (v3.x)

### ✅ Fase 1 – Consolidación de Migraciones SQL

- **Objetivo:** Unificar el historial de migraciones dispersas en un solo **schema maestro** idempotente.
- **Acciones clave:**
  - Consolidación en:
    - `supabase/migrations/20251216100027_20251209_schema_maestro_consolidado.sql`.
  - Normalización de:
    - Tablas de biometría, scoring de perfiles, seguridad, métricas, tokens/NFTs, clubes, moderación, etc.
  - Uso consistente de `IF NOT EXISTS` / `CREATE OR REPLACE` para permitir **re-aplicación segura**.
- **Resultado:**
  - Un **single source of truth** para el esquema `public`, listo para resets controlados de base de datos.

---

### ✅ Fase 2 – Reset de DB y Tipos de Supabase

- **Objetivo:** Alinear el frontend con el esquema real de Supabase usando tipos generados.
- **Acciones clave:**
  - Reset controlado de la base local usando el schema maestro consolidado.
  - Regeneración de tipos TypeScript hacia:
    - `src/integrations/supabase/types.ts`
  - Conexión del cliente:
    - `src/integrations/supabase/client.ts` ahora usa `Database` desde `@/integrations/supabase/types`.
- **Resultado:**
  - Tipos actualizados para tablas clave como `profiles`, `reports`, `matches`, `biometric_*`, etc.
  - Base sólida para eliminar `any` y `ts-ignore` en el frontend.

---

### ✅ Fase 3 – Saneamiento de AppContext, useAuth y Providers

- **Objetivo:** Tipado estricto en todo el flujo de autenticación y perfiles (demo + real), sin depender de `any`.

#### 3.1 AppContext & tipos base

- Archivo clave: `src/context/AppContext.tsx`.
- Acciones:
  - Definición de tipos canónicos:
    - `Profile = Database['public']['Tables']['profiles']['Row']`.
    - `ProfileFilters` con `ageRange`, `profileType`, `location`, `interests`.
    - `AuthUser` (id, email, profile, metadatos extensibles).
    - `AuthResult` (success, user?, error?).
    - `AppContextType` con contrato estrictamente tipado para:
      - `profiles`, `getProfile`, `getProfiles`.
      - `auth.login`, `auth.logout`, `auth.getCurrentUser`, `auth.signUp`.
  - `AppContext` ya no expone `any`.

#### 3.2 Hook de autenticación – `useAuth`

- Archivo clave: `src/features/auth/useAuth.ts`.
- Acciones:
  - Uso de `Profile` real de DB (alias `DbProfile`) para el estado de perfil.
  - Tipos estrictos para usuario demo y sesión:
    - `DemoUser`, `DemoSession`, `PersistedDemoUser`, `EffectiveUser`.
  - Construcción explícita de perfiles:
    - `demoProfile` y `basicProfile` rellenan **todos** los campos de `profiles.Row` incluyendo:
      - `pin_hash`, `score`, `score_status`, `suspended`, `suspended_at`, `suspended_reason`, `statistics`, etc.
  - Integración segura con Datadog (sin `as any`).
  - Corrección de edge cases demo (`DemoUser.email` ⇒ `string | null`, nunca `undefined`).

#### 3.3 Providers reales y demo

- Archivos clave:
  - `src/demo/RealProvider.tsx`
  - `src/demo/DemoProvider.tsx`
  - `src/demo/demoData.ts`
- Acciones:
  - Ambos providers implementan ahora **exactamente** `AppContextType`:
    - `auth` → `login`, `logout`, `getCurrentUser`, `signUp` devolviendo `AuthResult`.
    - `profiles`, `getProfile`, `getProfiles` con `Profile` y `ProfileFilters` estrictos.
  - `demoData.ts` genera `demoProfiles: Profile[]` con **todos** los campos de `profiles.Row`:
    - Incluye `score`, `score_status`, `pin_hash`, `suspended`, `statistics`, etc.
  - Eliminación de `any`/`as any` en providers y datos demo.

---

### ✅ Fixes adicionales (consumidores)

- **`src/components/profiles/shared/AnimatedProfileCard.tsx`**
  - Reparación de la firma del componente (`AnimatedProfileCardProps`) y destructuring de `profile`.
  - Corrección de cierre del componente (eliminando `});` sobrante).

- **`src/components/stories/StoriesContainer.tsx`**
  - Limpieza del tail JSX duplicado y corregido el cierre del componente.
  - Eliminación de secciones repetidas de estadísticas/modales que causaban errores de sintaxis.

- **`src/services/core/ErrorAlertService.ts`**
  - Manejo seguro de `ErrorAlert.stack`:
    - Se deriva `stack` sólo cuando existe, respetando `exactOptionalPropertyTypes`.
  - Payload hacia `WebhookService` ahora incluye `userId` sólo cuando está definido.

- **`src/services/auth/UserVerificationService.ts`**
  - `VerificationResult.verifiedAt` ahora se agrega sólo cuando hay fecha real.
  - Evita asignar `verifiedAt: undefined` en objetos retornados.

- **`src/services/social/PredictiveMatchingService.ts`**
  - `name` ahora se construye desde `display_name || first_name`, alineado con `profiles.Row`.

---

## Deuda Técnica Restante (Detectada)

Estos puntos NO se abordaron en esta sesión, pero han quedado identificados como pendientes de tipado/refactor:

1. **Invitaciones / Métricas de invitaciones**
   - Rutas que intentan usar tablas o vistas como `invitation_statistics` que no existen en el schema actual.
   - Pendiente: decidir si se crean esas tablas/vistas en Supabase o si se refactoriza la lógica para usar estructuras existentes.

2. **Notificaciones y dispositivos (OneSignal / user_device_tokens)**
   - Archivo: `src/services/social/notifications/OneSignalService.ts`.
   - Uso de tablas como `user_device_tokens` que no aparecen en `Database['public']['Tables']` actual.
   - Pendiente: sincronizar schema real (crear tabla o ajustar servicios para usar tablas existentes como `notifications`).

3. **Timers y moderación (moderatorTimer.ts)**
   - Archivo: `src/services/social/moderatorTimer.ts`.
   - Errores de tipo por asumir `string` donde el schema define `string | null`.
   - Pendiente: normalizar campos a `string | null` y añadir guards antes de parsear fechas (`new Date(...)`).

4. **Posts / Contenido social (`postsService.ts`)**
   - Archivo: `src/services/social/postsService.ts`.
   - Uso de campos no presentes en la tabla real (ej. `description` si la tabla sólo define `caption`, etc.).
   - Pendiente: alinear payloads de inserción/actualización con `Database['public']['Tables']['posts']['Insert' | 'Update']`.

5. **Servicios de analítica avanzada (AI Layer / invitaciones / métricas)**
   - Algunos servicios (`AILayerService`, etc.) acceden a campos o tablas que aún no están totalmente alineados con el schema nuevo.
   - Pendiente: revisar cada acceso a Supabase y cruzarlo con `src/integrations/supabase/types.ts`.

---

## Próximos Pasos Recomendados

1. **Fase 4 – Dominios Sociales y Notificaciones**
   - Unificar tipos y schema para:
     - Invitaciones, notificaciones push, posts, métricas sociales.
   - Objetivo: llevar estos dominios al mismo estándar de tipado estricto que Auth/Perfiles.

2. **Fase 5 – Limpieza de Warnings y Lint**
   - Resolver `services` y componentes con imports no usados o código muerto.
   - Asegurar `pnpm type-check` y `pnpm lint` totalmente en verde.

3. **Fase 6 – Documentación Técnica Final**
   - Actualizar diagramas en `DIAGRAMAS_FLUJOS_v3.x.x.md` reflejando:
     - Nuevos flujos de Auth (demo vs real).
     - Esquema de `profiles` extendido (score, pin_hash, suspended, etc.).
