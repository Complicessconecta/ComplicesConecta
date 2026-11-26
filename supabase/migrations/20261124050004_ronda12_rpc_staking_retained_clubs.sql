-- 20261124050004_ronda12_rpc_staking_retained_clubs.sql
-- Ronda 12, stream D (test de verificación ronda 11 + análisis de
-- brechas Supabase 2026-11-25). Tres huecos del repo, en un solo
-- archivo porque se aplican juntos y en orden, después de las seis
-- migraciones 30000/40000/50000/50001/50002/50003:
--   1. RPC `start_staking`: la llama `src/hooks/useTokens.ts:527-536`
--      y NO tenía DDL en ningún archivo del repo (ni migración, ni
--      Edge Function, ni tipos generados). Sin ella el staking real
--      falla con PGRST202/42883.
--      CORRECCIÓN POR VERIFICACIÓN EN VIVO (2026-11-25 20:02-20:16
--      CST, proyecto axtvqnozatbmllvwzuim, solo SELECT): la función
--      SÍ existe en producción, creada directo en la BD (sin DDL en
--      el repo, fuera de los tipos generados), PERO con otra firma:
--      `start_staking(uuid, integer, integer)` — 3 args, sin
--      `token_type_param` — y `security_definer = false`. El cliente
--      la llama con 4 args (incluye `token_type_param`), así que un
--      simple CREATE OR REPLACE de la versión de 4 args crearía una
--      SOBRECARGA y dejaría viva la versión insegura de 3 args.
--      Por eso esta migración primero hace DROP FUNCTION IF EXISTS
--      de la versión de 3 args y luego crea la de 4 args con
--      SECURITY DEFINER + SET search_path = '' + chequeo
--      auth.uid() = user_id_param. En un entorno nuevo el DROP es
--      no-op (IF EXISTS).
--   2. RPC `check_identity_retained`: `retained_identities` (50000)
--      no tenía quién la leyera en el registro; el cliente anon no
--      puede leer la tabla por RLS, así que la consulta va por RPC
--      SECURITY DEFINER, igual que `check_nickname_available` (50001).
--   3. Políticas de escritura de `club_events` / `club_discounts`
--      (30000): cualquier usuario autenticado podía insertar,
--      actualizar o borrar eventos y descuentos de CUALQUIER club.
--      Ahora solo el dueño del club o un administrador.
--
-- ORDEN DE APLICACIÓN: después de 20261124050003. Requiere que
-- existan `club_events`/`club_discounts` (30000) y
-- `retained_identities` (50000); `start_staking` usa las tablas
-- legacy `user_tokens`/`user_staking`/`transactions` del esquema
-- remoto (20260122065739). Todo es idempotente (CREATE OR REPLACE /
-- DROP POLICY IF EXISTS + CREATE POLICY).
--
-- NOTA DE ESPACIO DE IDS (club owner): `clubs.created_by` es FK a
-- `auth.users(id)` (esquema remoto + 20251216100028), NO a
-- `profiles(id)`. Por eso el dueño se comprueba DIRECTO con
-- `c.created_by = auth.uid()` — igual que el precedente del repo en
-- 20251216100028 (`created_by = auth.uid() OR public.is_admin()`).
-- `is_own_profile()` (50002) NO aplica aquí: esa función resuelve
-- el espacio `profiles.id` y un auth uid pasado como
-- `p_profile_id` solo coincidiría con filas legacy donde
-- `profiles.id = auth.uid()`. Aplicarla a `created_by` rompería
-- la escritura del dueño en todos los clubs normales.
--
-- NOTA DE ADMIN: el chequeo de administrador es el mismo que el de
-- `retained_identities` en 50000: `EXISTS (SELECT 1 FROM profiles p
-- WHERE p.user_id = auth.uid() AND p.is_admin = true)`. Es una señal
-- DISTINTA de `public.is_admin()` (que lee `admin_users`); aquí se
-- usa la de `profiles.is_admin` por coherencia con 50000.
--
-- NOTA DE `start_staking` (doble sistema de tokens, POR DISEÑO de
-- Wacko, no un bug a unificar): esta RPC trabaja sobre las tablas
-- legacy `user_tokens`/`user_staking`/`transactions`, mientras el
-- `TokenService` de la app lee `user_token_balances`/
-- `token_transactions`/`staking_records`. Un staking iniciado por
-- esta RPC NO aparece en `staking_records` ni mueve el saldo que ve
-- `TokenService`; la RPC solo tiene que existir y funcionar bien
-- sobre SUS tablas. Limitaciones heredadas de esas tablas (no se
-- inventan columnas): `user_staking` no tiene columna `token_type`
-- (el tipo queda en `transactions.metadata` y en el json devuelto)
-- y `user_tokens` tiene una sola columna de stakeado
-- (`cmpx_staked`); el APY es 8.0 para cmpx y 12.5 para gtk, igual
-- que en `src/hooks/useTokens.ts`.
--
-- NOTA DE `check_identity_retained`: la RPC solo devuelve un
-- booleano, nunca filas. Que el registro NO bloquee cuando la RPC
-- falta (migraciones sin aplicar) es decisión DEL CLIENTE
-- (fail-open con warning, ver `src/lib/reportBlock.ts`); la RPC
-- en sí no tiene fallback.
--
-- VALIDACIÓN: SQL revisado a mano únicamente; NO ejecutado contra
-- una base de datos viva en esta ronda (no había acceso). Revisar
-- paréntesis, comillas $$ y punto y coma al aplicar en el SQL Editor.

-- ------------------------------------------------------------------
-- 1. RPC start_staking
-- ------------------------------------------------------------------
-- La versión de producción (creada directo, sin DDL) tiene 3 args
-- `(uuid, integer, integer)` y `security_definer = false`. El
-- cliente llama con 4 args (incluye `token_type_param`), así que
-- CREATE OR REPLACE solo no la sustituiría: crearía una sobrecarga
-- y la versión insegura de 3 args seguiría viva y llamable. Se
-- elimina primero (IF EXISTS: no-op en entorno nuevo).
drop function if exists public.start_staking(uuid, integer, integer);
-- SECURITY DEFINER con SET search_path = '' (patrón de
-- `is_admin()` / `is_admin_or_moderator()`): todos los nombres van
-- cualificados con esquema. La función verifica que el llamador
-- autenticado (`auth.uid()`) sea el mismo `user_id_param` que pasa
-- el cliente; sin sesión o con otro usuario, rechaza antes de tocar
-- ninguna tabla. Límites iguales al `StakingSchema` del cliente
-- (`src/lib/validation/zod/zod-schemas.ts`): amount entero 10–10000,
-- duration 1–365 días, token_type 'cmpx' | 'gtk'.
create or replace function public.start_staking(
  user_id_param uuid,
  amount_param integer,
  duration_days integer,
  token_type_param text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_cmpx_balance integer;
  v_gtk_balance integer;
  v_balance_before integer;
  v_balance_after integer;
  v_reward_percentage numeric(5, 2);
  v_staking_id uuid;
  v_start timestamptz := now();
  v_end timestamptz;
begin
  if v_uid is null then
    raise exception 'start_staking: sin sesión autenticada';
  end if;
  if user_id_param is null or user_id_param <> v_uid then
    raise exception 'start_staking: user_id_param no coincide con el usuario autenticado';
  end if;
  if amount_param is null or amount_param < 10 or amount_param > 10000 then
    raise exception 'start_staking: amount_param fuera de rango (10-10000)';
  end if;
  if duration_days is null or duration_days < 1 or duration_days > 365 then
    raise exception 'start_staking: duration_days fuera de rango (1-365)';
  end if;
  if token_type_param is null or token_type_param not in ('cmpx', 'gtk') then
    raise exception 'start_staking: token_type_param debe ser cmpx o gtk';
  end if;

  v_reward_percentage := case when token_type_param = 'gtk' then 12.5 else 8.0 end;
  v_end := v_start + (duration_days || ' days')::interval;

  -- Fila de tokens del usuario (bloqueada para que dos stakes en
  -- carrera no resten del mismo saldo). Sin fila no se crea una en
  -- cero: el error es explícito para que el cliente lo vea.
  select t.cmpx_balance, t.gtk_balance
    into v_cmpx_balance, v_gtk_balance
    from public.user_tokens t
    where t.user_id = v_uid
    for update;

  if not found then
    raise exception 'start_staking: sin fila en user_tokens para el usuario';
  end if;

  if token_type_param = 'cmpx' then
    v_balance_before := v_cmpx_balance;
  else
    v_balance_before := v_gtk_balance;
  end if;
  if v_balance_before < amount_param then
    raise exception 'start_staking: saldo insuficiente';
  end if;
  v_balance_after := v_balance_before - amount_param;

  -- Descuenta del saldo del token y lo mueve a stakeado. La tabla
  -- legacy solo tiene `cmpx_staked` (sin columna por token).
  if token_type_param = 'cmpx' then
    update public.user_tokens
      set cmpx_balance = v_balance_after,
          cmpx_staked = cmpx_staked + amount_param,
          updated_at = now()
      where user_id = v_uid;
  else
    update public.user_tokens
      set gtk_balance = v_balance_after,
          cmpx_staked = cmpx_staked + amount_param,
          updated_at = now()
      where user_id = v_uid;
  end if;

  insert into public.user_staking (
    user_id, amount, start_date, end_date,
    reward_percentage, status, reward_claimed
  ) values (
    v_uid, amount_param, v_start, v_end,
    v_reward_percentage, 'active', false
  ) returning id into v_staking_id;

  -- `user_staking` no tiene columna token_type: el tipo y la
  -- duración quedan en `transactions.metadata` y en la respuesta.
  insert into public.transactions (
    user_id, transaction_type, token_type, amount,
    balance_before, balance_after, description, metadata
  ) values (
    v_uid, 'staking', token_type_param, amount_param,
    v_balance_before, v_balance_after,
    'Staking ' || token_type_param || ' por ' || duration_days || ' días',
    jsonb_build_object(
      'staking_id', v_staking_id,
      'duration_days', duration_days,
      'reward_percentage', v_reward_percentage
    )
  );

  return jsonb_build_object(
    'staking_id', v_staking_id,
    'user_id', v_uid,
    'token_type', token_type_param,
    'amount', amount_param,
    'start_date', v_start,
    'end_date', v_end,
    'reward_percentage', v_reward_percentage,
    'status', 'active'
  );
end;
$$;

revoke all on function public.start_staking(uuid, integer, integer, text) from public;
grant execute on function public.start_staking(uuid, integer, integer, text) to authenticated;

comment on function public.start_staking(uuid, integer, integer, text) is
  'Staking real sobre las tablas legacy user_tokens/user_staking/transactions. SECURITY DEFINER; solo el propio usuario autenticado puede stakear (auth.uid() = user_id_param). Límites: amount 10-10000, duration 1-365 días, token cmpx/gtk.';

-- ------------------------------------------------------------------
-- 2. RPC check_identity_retained
-- ------------------------------------------------------------------
-- ¿Este correo o apodo está retenido tras una baja por reporte?
-- SECURITY DEFINER para leer `retained_identities` sin depender de
-- su RLS (anon no puede leer la tabla directo); mismo patrón que
-- `check_nickname_available` (50001). Solo devuelve un booleano.
-- La comparación es insensible a mayúsculas y espacios, igual que
-- el alta (`retainIdentityAfterBan` guarda el correo en minúsculas).
create or replace function public.check_identity_retained(p_email text, p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.retained_identities
    where (p_email is not null
           and btrim(p_email) <> ''
           and lower(email) = lower(btrim(p_email)))
       or (p_username is not null
           and btrim(p_username) <> ''
           and lower(btrim(username)) = lower(btrim(p_username)))
  );
$$;

revoke all on function public.check_identity_retained(text, text) from public;
grant execute on function public.check_identity_retained(text, text) to anon, authenticated;

comment on function public.check_identity_retained(text, text) is
  '¿Correo o apodo retenido tras baja por reporte? Para el registro sin sesión: true si el email o el username está en retained_identities. SECURITY DEFINER, solo devuelve boolean.';

-- ------------------------------------------------------------------
-- 3. Escritura de club_events / club_discounts: solo dueño o admin
-- ------------------------------------------------------------------
-- Helper para las políticas (patrón `is_own_profile` de 50002):
-- ¿el autenticado es dueño del club (clubs.created_by = auth.uid(),
-- FK a auth.users) o administrador (profiles.is_admin)? SECURITY
-- DEFINER para leer `clubs`/`profiles` sin depender de sus RLS.
create or replace function public.is_club_owner_or_admin(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clubs c
    where c.id = p_club_id
      and (
        c.created_by = auth.uid()
        or exists (
          select 1
          from public.profiles p
          where p.user_id = auth.uid()
            and p.is_admin = true
        )
      )
  );
$$;

revoke all on function public.is_club_owner_or_admin(uuid) from public;
grant execute on function public.is_club_owner_or_admin(uuid) to anon, authenticated;

comment on function public.is_club_owner_or_admin(uuid) is
  '¿El usuario autenticado es dueño del club (clubs.created_by = auth.uid()) o administrador (profiles.is_admin)? Para las políticas de escritura de club_events y club_discounts (20261124050004).';

-- Las políticas SELECT no se tocan: las filas activas siguen siendo
-- legibles (`USING (is_active = true)`). Solo se endurecen
-- insert/update/delete, que en 30000 aceptaban a cualquier usuario
-- autenticado (`auth.uid() IS NOT NULL`).
alter table public.club_events enable row level security;
alter table public.club_discounts enable row level security;

drop policy if exists club_events_insert_policy on public.club_events;
create policy club_events_insert_policy
  on public.club_events for insert
  with check (public.is_club_owner_or_admin(club_id));

drop policy if exists club_events_update_policy on public.club_events;
create policy club_events_update_policy
  on public.club_events for update
  using (public.is_club_owner_or_admin(club_id))
  with check (public.is_club_owner_or_admin(club_id));

drop policy if exists club_events_delete_policy on public.club_events;
create policy club_events_delete_policy
  on public.club_events for delete
  using (public.is_club_owner_or_admin(club_id));

drop policy if exists club_discounts_insert_policy on public.club_discounts;
create policy club_discounts_insert_policy
  on public.club_discounts for insert
  with check (public.is_club_owner_or_admin(club_id));

drop policy if exists club_discounts_update_policy on public.club_discounts;
create policy club_discounts_update_policy
  on public.club_discounts for update
  using (public.is_club_owner_or_admin(club_id))
  with check (public.is_club_owner_or_admin(club_id));

drop policy if exists club_discounts_delete_policy on public.club_discounts;
create policy club_discounts_delete_policy
  on public.club_discounts for delete
  using (public.is_club_owner_or_admin(club_id));
