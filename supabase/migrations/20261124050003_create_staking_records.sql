-- 20261124050003_create_staking_records.sql
-- Ronda de corrección 6 (post-test de verificación del PR #72, punto 19).
--
-- Ninguna migración del repo CREA `public.staking_records`: solo la
-- referencian los scripts de verificación (20251027210466/67) y el dump
-- de esquema remoto (20260122065739) la ALTERA (columnas is_active,
-- last_claimed_at, rewards_earned, amount bigint, apy numeric). En
-- producción existe (por eso el dump la altera), pero un entorno nuevo
-- (`supabase db reset`) no la tendría y la ruta real de `useTokens`
-- (`select ... from staking_records where user_id = ...`) fallaría.
-- Esta migración la crea de forma idempotente con la forma remota +
-- las columnas que lee el hook (id, user_id, token_type, amount,
-- start_date, end_date, apy, status, created_at).
--
-- ORDEN DE APLICACIÓN (ninguna de las 5 anteriores está aplicada en
-- producción): 20261124030000 (clubs) -> 20261124040000
-- (privacy_settings) -> 20261124050000 (amistad/privacidad) ->
-- 20261124050001 (nickname + RPC) -> 20261124050002 (fix RLS espacio
-- de IDs + dedup de apodos) -> ESTA (50003).
--
-- REVISAR ANTES DE APLICAR (ver reporte del stream D, ronda 6):
--   1. El dedup de apodos de la 50002 TOCA DATOS (anula duplicados
--      quedándose el perfil más antiguo): contar duplicados antes con
--        select lower(btrim(nickname)), count(*) from public.profiles
--        where nickname is not null and btrim(nickname) <> ''
--        group by 1 having count(*) > 1;
--   2. Verificar que `create_missing_tables.sql` está aplicada en
--      producción (ahí viven user_token_balances y token_transactions
--      con sus políticas RLS); si no, esas tablas tampoco existen.
--   3. Doble sistema de tokens sin unificar (NO lo resuelve esta
--      migración; decide Wacko): la app (TokenService, useTokens) lee
--      user_token_balances / token_transactions / staking_records,
--      pero la RPC `start_staking` lee/escribe user_tokens /
--      user_staking / transactions. Un staking iniciado por RPC no
--      aparece en `staking_records` y su balance no lo ve TokenService.
--
-- Idempotente y aditiva: no borra ni renombra nada.

create table if not exists public.staking_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_type text not null default 'cmpx',
  amount bigint not null default 0,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  apy numeric(5, 2) not null default 0.00,
  status text not null default 'active',
  is_active boolean not null default true,
  last_claimed_at timestamptz,
  rewards_earned bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staking_records_user_id
  on public.staking_records (user_id);
create index if not exists idx_staking_records_status
  on public.staking_records (user_id, status);

alter table public.staking_records enable row level security;

drop policy if exists "Users can view own staking records"
  on public.staking_records;
create policy "Users can view own staking records"
  on public.staking_records
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own staking records"
  on public.staking_records;
create policy "Users can insert own staking records"
  on public.staking_records
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own staking records"
  on public.staking_records;
create policy "Users can update own staking records"
  on public.staking_records
  for update using (auth.uid() = user_id);
