-- 1. Extensión pg_trgm para búsqueda difusa
create extension if not exists pg_trgm;
-- 2. Índice GIN para perfiles usando email (campo seguro)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'email'
  ) then
    execute 'create index if not exists idx_profiles_email_trgm on public.profiles using gin (email gin_trgm_ops)';
  end if;
end $$;
-- Índices para events (si la tabla existe)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name   = 'events'
  ) then
    execute 'create index if not exists idx_events_title_trgm on public.events using gin (title gin_trgm_ops)';
    execute 'create index if not exists idx_events_description_trgm on public.events using gin (description gin_trgm_ops)';
  end if;
end $$;
-- 3. Función RPC search_unified usando solo email para evitar errores de columnas inexistentes
create or replace function public.search_unified(query_text text)
returns table (
  id uuid,
  type text,
  title text,
  subtitle text,
  image_url text
) as $$
begin
  return query
    select
      p.id,
      'profile'::text as type,
      coalesce(p.email, '') as title,
      ''::text as subtitle,
      coalesce(p.avatar_url, '') as image_url
    from public.profiles p
    where
      query_text is not null
      and query_text <> ''
      and p.email ilike '%' || query_text || '%'
    order by similarity(coalesce(p.email, ''), query_text) desc
    limit 10;
end;
$$ language plpgsql security definer;
grant execute on function public.search_unified(text) to anon, authenticated;
