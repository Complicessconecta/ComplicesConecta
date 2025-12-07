create table premium_access (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  feature_id text not null,
  expires_at timestamptz not null,
  purchased_at timestamptz not null default now(),
  cost numeric not null
);