-- 20261124050002_fix_social_rls_profile_id_space.sql
-- Ronda de corrección 5 (post-test de verificación del PR #72).
-- Corrige la migración 20261124050000, que aún NO está aplicada en
-- producción: NO se edita 50000, se corrige aquí para que el orden
-- de aplicación sea 50000 -> 50001 -> 50002.
--
-- Problema (punto 19, verificado en el repo, no en vivo): en
-- producción `profiles.id` es un UUID propio, distinto de
-- `auth.uid()`; el auth uid vive en `profiles.user_id`
-- (bootstrap 20250101000000: id DEFAULT uuid_generate_v4(),
-- user_id UNIQUE REFERENCES auth.users). Pero las políticas RLS de
-- 50000 comparan `auth.uid()` DIRECTO con columnas del espacio
-- `profiles.id` (`friend_requests.requester_id/addressee_id`,
-- `friendships.user_id_a/user_id_b`,
-- `profile_blocks.blocker_id/blocked_id`), que referencian
-- `profiles(id)`. Con 50000 tal cual, en real:
--   - el INSERT de una solicitud/amistad/bloqueo con el auth uid
--     violaría la FK (ninguna fila profiles tiene id = auth uid), y
--   - aunque se pasara profiles.id, la RLS negaría SELECT/INSERT
--     porque auth.uid() nunca es igual a un profiles.id.
-- El código (`src/lib/friends.ts`, `src/lib/reportBlock.ts`) ya
-- resuelve auth uid -> profiles.id con `resolveOwnProfileId`; esta
-- migración hace lo mismo del lado BD con `is_own_profile()`.
-- La función cubre los dos espacios de ids: fila con
-- user_id = auth.uid(), o fila legacy con id = auth.uid().
--
-- Además:
--   - Unicidad de apodo en `profiles.nickname` (la RPC de 50001 es
--     la única guarda hoy; sin índice único un duplicado podría
--     colarse en carrera). `couple_profiles.nickname` YA tiene
--     UNIQUE en el esquema remoto; aquí solo se añade la variante
--     insensible a mayúsculas. El paso de deduplicado TOCA DATOS
--     (anula duplicados quedándose el perfil más antiguo): REVISAR
--     antes de aplicar en producción (ver reporte del stream A).
--     VERIFICACIÓN EN VIVO 2026-11-25 20:02-20:16 CST (proyecto
--     axtvqnozatbmllvwzuim, solo SELECT): pre-chequeos en CERO —
--     0 apodos duplicados en `couple_profiles` (`profiles` no tiene
--     columna nickname todavía) y 0 solicitudes pendientes
--     duplicadas (la tabla `friend_requests` aún no existe). El
--     deduplicado es en la práctica un NO-OP una vez aplicada
--     50001; el riesgo de esta migración baja de ALTO a BAJO según
--     datos en vivo. La nota de revisión se conserva por
--     precaución: recontar antes de aplicar si pasa tiempo.
--   - Una sola solicitud pendiente por (requester, addressee, kind):
--     sin esto dos "Solicitar ver fotos" en carrera duplicarían la
--     fila pendiente en `friend_requests`.
--
-- NO se crea una tabla `photo_access_requests` nueva: el acceso a
-- fotos ya tiene tabla (`friend_requests` kind='photo_access', en
-- 50000) y una legacy (`gallery_access_requests`, esquema remoto,
-- con RLS); una tercera tabla partiría el flujo en dos. Tampoco se
-- crea nada para geolocalización / país / visibilidad: ya existen
-- (`profiles.latitude/longitude`, `location_sharing_enabled`,
-- `country_code` y `visibility` en profiles y couple_profiles,
-- 50000). Ver reporte del stream A para el inventario completo.
-- Idempotente y aditiva: no borra ni renombra nada (salvo el
-- deduplicado de apodos, documentado arriba).

-- ------------------------------------------------------------------
-- 1. Función auxiliar: ¿este profiles.id es del usuario autenticado?
-- ------------------------------------------------------------------
-- SECURITY DEFINER para leer profiles sin depender de la RLS de
-- profiles; solo devuelve un booleano. search_path fijado (ver
-- 20261124010001_fix_is_super_admin_search_path).
create or replace function public.is_own_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and (p.user_id = auth.uid() or p.id = auth.uid())
  );
$$;

revoke all on function public.is_own_profile(uuid) from public;
grant execute on function public.is_own_profile(uuid) to anon, authenticated;

comment on function public.is_own_profile(uuid) is
  '¿Este profiles.id pertenece al usuario autenticado? Resuelve auth.uid() vía profiles.user_id (o id legacy = auth.uid()). Para las RLS de las tablas sociales (20261124050002).';

-- ------------------------------------------------------------------
-- 2. RLS corregidas de 20261124050000
-- ------------------------------------------------------------------
-- Se borran las políticas de 50000 y se recrean con
-- is_own_profile(). `retained_identities` NO se toca: sus políticas
-- ya comparan profiles.user_id = auth.uid() y son correctas.
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.profile_blocks enable row level security;

drop policy if exists friend_requests_select_policy on public.friend_requests;
create policy friend_requests_select_policy
  on public.friend_requests for select
  using (
    public.is_own_profile(requester_id)
    or public.is_own_profile(addressee_id)
  );

drop policy if exists friend_requests_insert_policy on public.friend_requests;
create policy friend_requests_insert_policy
  on public.friend_requests for insert
  with check (public.is_own_profile(requester_id));

drop policy if exists friend_requests_update_policy on public.friend_requests;
create policy friend_requests_update_policy
  on public.friend_requests for update
  using (
    public.is_own_profile(requester_id)
    or public.is_own_profile(addressee_id)
  )
  with check (
    public.is_own_profile(requester_id)
    or public.is_own_profile(addressee_id)
  );

drop policy if exists friendships_select_policy on public.friendships;
create policy friendships_select_policy
  on public.friendships for select
  using (
    public.is_own_profile(user_id_a)
    or public.is_own_profile(user_id_b)
  );

drop policy if exists friendships_insert_policy on public.friendships;
create policy friendships_insert_policy
  on public.friendships for insert
  with check (
    public.is_own_profile(user_id_a)
    or public.is_own_profile(user_id_b)
  );

drop policy if exists friendships_delete_policy on public.friendships;
create policy friendships_delete_policy
  on public.friendships for delete
  using (
    public.is_own_profile(user_id_a)
    or public.is_own_profile(user_id_b)
  );

drop policy if exists profile_blocks_select_policy on public.profile_blocks;
create policy profile_blocks_select_policy
  on public.profile_blocks for select
  using (
    public.is_own_profile(blocker_id)
    or public.is_own_profile(blocked_id)
  );

drop policy if exists profile_blocks_insert_policy on public.profile_blocks;
create policy profile_blocks_insert_policy
  on public.profile_blocks for insert
  with check (public.is_own_profile(blocker_id));

drop policy if exists profile_blocks_delete_policy on public.profile_blocks;
create policy profile_blocks_delete_policy
  on public.profile_blocks for delete
  using (public.is_own_profile(blocker_id));

-- ------------------------------------------------------------------
-- 3. Unicidad de apodo (insensible a mayúsculas y espacios)
-- ------------------------------------------------------------------
-- La RPC check_nickname_available (50001) compara con
-- lower(btrim(nickname)): el índice debe aplicar la misma regla o
-- dos apodos que la RPC ve iguales podrían convivir en la tabla.
--
-- PASO CON TOCA DE DATOS — revisar antes de aplicar: el backfill
-- de 50001 (nickname = display_name) puede haber creado duplicados
-- (varios perfiles con el mismo nombre visible). Se conserva el
-- perfil más antiguo de cada apodo y a los demás se les anula el
-- nickname (la app sigue mostrando display_name, no se borra el
-- perfil). Si hay duplicados y este paso no corre, el CREATE UNIQUE
-- INDEX de abajo falla y la migración se detiene: eso es preferible
-- a aplicar a medias, pero conviene revisar el conteo antes con:
--   select lower(btrim(nickname)), count(*)
--   from public.profiles
--   where nickname is not null and btrim(nickname) <> ''
--   group by 1 having count(*) > 1;
with ranked as (
  select
    id,
    row_number() over (
      partition by lower(btrim(nickname))
      order by created_at asc nulls last, id asc
    ) as rn
  from public.profiles
  where nickname is not null and btrim(nickname) <> ''
)
update public.profiles p
set nickname = null
from ranked r
where p.id = r.id and r.rn > 1;

create unique index if not exists idx_profiles_nickname_unique_ci
  on public.profiles (lower(btrim(nickname)))
  where nickname is not null and btrim(nickname) <> '';

-- couple_profiles: el esquema remoto ya trae UNIQUE (nickname)
-- sensible a mayúsculas; se añade la variante insensible para que
-- coincida con la RPC. Mismo deduplicado previo que en profiles.
with ranked as (
  select
    id,
    row_number() over (
      partition by lower(btrim(nickname))
      order by created_at asc nulls last, id asc
    ) as rn
  from public.couple_profiles
  where nickname is not null and btrim(nickname) <> ''
)
update public.couple_profiles p
set nickname = null
from ranked r
where p.id = r.id and r.rn > 1;

create unique index if not exists idx_couple_profiles_nickname_unique_ci
  on public.couple_profiles (lower(btrim(nickname)))
  where nickname is not null and btrim(nickname) <> '';

-- ------------------------------------------------------------------
-- 4. Una sola solicitud pendiente por (requester, addressee, kind)
-- ------------------------------------------------------------------
-- Evita duplicar "Solicitar ver fotos" / "Enviar solicitud de
-- amistad" en carrera. Se conserva la pendiente más antigua.
with ranked as (
  select
    id,
    row_number() over (
      partition by requester_id, addressee_id, kind
      order by created_at asc nulls last, id asc
    ) as rn
  from public.friend_requests
  where status = 'pending'
)
delete from public.friend_requests f
using ranked r
where f.id = r.id and r.rn > 1;

create unique index if not exists idx_friend_requests_one_pending
  on public.friend_requests (requester_id, addressee_id, kind)
  where status = 'pending';
