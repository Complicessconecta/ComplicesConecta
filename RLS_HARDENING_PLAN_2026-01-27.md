# RLS Hardening Plan – CómplicesConecta v3.9.x
**Fecha:** 27 Ene 2026  
**Objetivo:** Habilitar Row Level Security (RLS) en tablas marcadas UNRESTRICTED sin romper la app.  
**Estado:** Fase 1 aplicada (high‑risk admin‑only).  

---

## 1️⃣ Fase 1 – High‑Risk (✅ Completado)

### Tablas procesadas (admin‑only)
- `anti_cheat_log`
- `consent_evidence`
- `fingerprint_bans`
- `smart_matches`
- `user_verification`
- `referral_tokens`
- `stripe_webhook_events`

### Cambios aplicados
- `ALTER TABLE … ENABLE ROW LEVEL SECURITY;`
- Policy única `admin_all` para `SELECT/INSERT/UPDATE/DELETE` a `authenticated` con `public.is_admin()` (ya existente).
- **Vistas excluidas:** `users_safe` y `profiles_safe` son vistas → RLS no aplica.

### Verificación
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public' AND rowsecurity=true;
```

---

## 2️⃣ Fase 2 – Tablas de Negocio Críticas (próximo paso)

### Tablas a proteger (con policies por usuario)
| Tabla | Rol esperado | Regla sugerida |
|-------|--------------|----------------|
| `profiles` | `authenticated` | Solo el propio `user_id` puede leer/escribir su perfil. |
| `clubs` | `authenticated` | Lectura pública; inserción/actualización solo si `is_admin()` o `owner_id = auth.uid()`. |
| `events` | `authenticated` | Lectura pública; inserción/actualización solo si `is_admin()` o `organizer_id = auth.uid()`. |
| `posts` | `authenticated` | Lectura pública; inserción/actualización solo si `author_id = auth.uid()` o `is_admin()`. |
| `chat_messages` | `authenticated` | Solo participantes del chat pueden leer/escribir. |
| `user_tokens` | `authenticated` | Solo el propio `user_id` puede leer; solo admins pueden actualizar balances. |
| `invitations` | `authenticated` | Solo `invited_by` o `invited_user_id` pueden leer/actualizar. |
| `moderator_requests` | `authenticated` | Solo admins pueden leer/actualizar; usuarios pueden leer sus propios requests. |
| `career_applications` | `authenticated` | Solo admins pueden leer; usuarios pueden insertar sus propias aplicaciones. |

### Estrategia de migración
1) **Crear policies idempotentes** (`DROP POLICY IF EXISTS …` antes de `CREATE POLICY`).
2) **Usar funciones helper ya existentes** (`public.is_admin()`, `public.is_super_admin()`).
3) **Validar con `SELECT 1 FROM <tabla> LIMIT 1;`** tras aplicar RLS para asegurar que la app no se rompe.
4) **Rollback rápido:** `ALTER TABLE <tabla> DISABLE ROW LEVEL SECURITY;` si falla.

---

## 3️⃣ Fase 3 – Tablas de Lectura Pública (final)

### Tablas que pueden quedar con RLS pero policies públicas
- `categories`, `tags`, `settings`, `themes`, `locales`, `pricing_tiers`, `faqs`, `help_articles`.
- **Policy:** `SELECT` para `authenticated` (o `anon` si aplica), sin `INSERT/UPDATE/DELETE` excepto admins.

---

## 4️⃣ Fase 4 – Vistas y Materializadas

### Vistas (no aplican RLS)
- `users_safe`, `profiles_safe` → ya son vistas filtradas.
- **Recomendación:** mantenerlas como vistas y asegurar que la base (`auth.users`, `profiles`) tenga RLS correcto.

---

## 5️⃣ Validación Post‑Migración

### Checklist por tabla
- [ ] `RLS enabled` ✅
- [ ] Policy `admin_all` (o específica) ✅
- [ ] `SELECT 1 FROM <tabla> LIMIT 1;` sin errores ✅
- [ ] App UI funciona (login, perfiles, clubs, posts) ✅
- [ ] Logs sin errores de permisos ✅

### Comandos útiles
```sql
-- Ver policies activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies p
JOIN pg_tables t ON t.tablename = p.tablename
WHERE t.schemaname='public';

-- Ver si una tabla tiene RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public' AND tablename='profiles';
```

---

## 6️⃣ Notas de Seguridad

- **Nunca habilitar RLS sin policies** → bloquea todo.
- **Usar `SECURITY DEFINER`** en helper functions (`is_admin`, `is_super_admin`) para evitar recursion.
- **Pruebas en staging** antes de producción.
- **Documentar cambios** en `CHANGELOG.md` y `RELEASE_NOTES_v4.0.0.md`.

---

## 7️⃣ Próximos Pasos

1) **Ejecutar Fase 2** (negocio críticas) con migraciones por tabla.
2) **Validar en browser** (login, perfiles, clubs, posts, chat).
3) **Ejecutar Fase 3** (lectura pública).
4) **Actualizar documentación** y hacer commit/push.
5) **Ejecutar `npx cap sync android`** al final del ciclo.

---

**Responsable:** IA Lead Architect  
**Contacto:** Si falla alguna tabla, revertir con `ALTER TABLE <tabla> DISABLE ROW LEVEL SECURITY;` y revisar policies.
