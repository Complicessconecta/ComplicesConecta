-- 20261124050001_nickname_check.sql
-- Registro bloqueado: NicknameValidator consultaba
-- profiles.nickname directo con el cliente anon, sin sesión. Dos
-- problemas confirmados en el repo:
--   1. RLS: la política SELECT de profiles exige auth.uid() (propio o
--      admin); en registro aún no hay sesión, así que anon no ve nada.
--   2. La columna nickname existe en los tipos generados pero NINGUNA
--      migración la agrega a public.profiles (solo couple_profiles la
--      tiene, vía el remote schema) y el registro escribe el apodo en
--      display_name, no en nickname. Si la columna no existe en
--      producción, PostgREST devuelve error 42703 con CUALQUIER apodo:
--      exactamente el "Error al verificar disponibilidad" del test.
-- Fix: columna garantizada + backfill desde display_name + función RPC
-- SECURITY DEFINER que cualquier visitante (anon) puede ejecutar para
-- consultar disponibilidad sin leer la tabla. El validador usa la RPC;
-- el insert del registro debe escribir nickname (ver SingleRegistrationForm,
-- fuera de esta migración).
-- Idempotente y aditiva: no borra ni renombra nada.

-- 1. Columna nickname en profiles (si falta) + backfill desde display_name.
alter table public.profiles
  add column if not exists nickname text;

update public.profiles
  set nickname = display_name
  where nickname is null
    and display_name is not null
    and btrim(display_name) <> '';

-- Misma garantía en couple_profiles (el registro de pareja sí escribe
-- nickname ahí, pero la columna solo existe vía remote schema).
alter table public.couple_profiles
  add column if not exists nickname text;

-- 2. RPC pública de disponibilidad de apodo.
--    check_nickname_available('Wacko') -> true si nadie lo usa en
--    profiles ni en couple_profiles (insensible a mayúsculas y a
--    espacios al inicio/fin). SECURITY DEFINER salta RLS; la función
--    solo devuelve un booleano, nunca filas de la tabla.
create or replace function public.check_nickname_available(p_nickname text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_nickname is not null
    and btrim(p_nickname) <> ''
    and char_length(btrim(p_nickname)) between 3 and 20
    and btrim(p_nickname) ~ '^[A-Za-z0-9_-]+$'
    and not exists (
      select 1 from public.profiles
      where nickname is not null
        and lower(btrim(nickname)) = lower(btrim(p_nickname))
    )
    and not exists (
      select 1 from public.couple_profiles
      where nickname is not null
        and lower(btrim(nickname)) = lower(btrim(p_nickname))
    );
$$;

revoke all on function public.check_nickname_available(text) from public;
grant execute on function public.check_nickname_available(text) to anon, authenticated;

comment on function public.check_nickname_available(text) is
  'Disponibilidad de apodo para registro (sin sesión): true si el apodo no está usado en profiles ni couple_profiles. SECURITY DEFINER, solo devuelve boolean.';
