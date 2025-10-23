-- Ensure pgcrypto is available for UUID generation
create extension if not exists pgcrypto;

-- Create table if it does not exist (UUID PK)
create table if not exists public.sightseeing (
  id uuid not null default gen_random_uuid(),
  external_id integer null,
  name text not null,
  description text null,
  country text not null,
  city text not null,
  category text null,
  status text not null default 'active'::text,
  duration text null,
  timing text null,
  difficulty_level text null,
  allowed_age_group text null,
  address text null,
  google_map_link text null,
  price jsonb null,
  is_free boolean null default false,
  sic_available boolean null default false,
  sic_pricing jsonb null,
  requires_mandatory_transfer boolean null default false,
  transfer_mandatory boolean null default false,
  transfer_options jsonb null default '[]'::jsonb,
  pricing_options jsonb null default '[]'::jsonb,
  package_options jsonb null default '[]'::jsonb,
  group_size_options jsonb null default '[]'::jsonb,
  policies jsonb null,
  validity_period jsonb null,
  images jsonb null default '[]'::jsonb,
  created_at timestamptz null default now(),
  updated_at timestamptz null default now(),
  last_updated timestamptz null default now(),
  constraint sightseeing_pkey primary key (id),
  constraint sightseeing_status_check check ((status = any (array['active'::text, 'inactive'::text])))
);

-- Add/align columns when table already exists
alter table public.sightseeing add column if not exists external_id integer;
alter table public.sightseeing add column if not exists description text;
alter table public.sightseeing add column if not exists category text;
alter table public.sightseeing add column if not exists status text default 'active';
alter table public.sightseeing add column if not exists duration text;
alter table public.sightseeing add column if not exists timing text;
alter table public.sightseeing add column if not exists difficulty_level text;
alter table public.sightseeing add column if not exists allowed_age_group text;
alter table public.sightseeing add column if not exists address text;
alter table public.sightseeing add column if not exists google_map_link text;
alter table public.sightseeing add column if not exists price jsonb;
alter table public.sightseeing add column if not exists is_free boolean default false;
alter table public.sightseeing add column if not exists sic_available boolean default false;
alter table public.sightseeing add column if not exists sic_pricing jsonb;
alter table public.sightseeing add column if not exists requires_mandatory_transfer boolean default false;
alter table public.sightseeing add column if not exists transfer_mandatory boolean default false;
alter table public.sightseeing add column if not exists transfer_options jsonb default '[]'::jsonb;
alter table public.sightseeing add column if not exists pricing_options jsonb default '[]'::jsonb;
alter table public.sightseeing add column if not exists package_options jsonb default '[]'::jsonb;
alter table public.sightseeing add column if not exists group_size_options jsonb default '[]'::jsonb;
alter table public.sightseeing add column if not exists policies jsonb;
alter table public.sightseeing add column if not exists validity_period jsonb;
alter table public.sightseeing add column if not exists images jsonb default '[]'::jsonb;
alter table public.sightseeing add column if not exists created_at timestamptz default now();
alter table public.sightseeing add column if not exists updated_at timestamptz default now();
alter table public.sightseeing add column if not exists last_updated timestamptz default now();

-- Indexes
create index if not exists idx_sightseeing_country_city on public.sightseeing using btree (country, city);
create index if not exists idx_sightseeing_status on public.sightseeing using btree (status);

-- Trigger to keep updated_at fresh
drop trigger if exists update_sightseeing_updated_at on public.sightseeing;
create trigger update_sightseeing_updated_at before update on public.sightseeing
for each row execute function update_updated_at_column();

-- Optional: Convert numeric id to UUID and preserve previous id in external_id
-- Uncomment the following if your current `id` is integer and you want to migrate.
-- DO $$
-- BEGIN
--   -- Backfill external_id from old integer id if empty
--   UPDATE public.sightseeing SET external_id = COALESCE(external_id, id::integer)
--   WHERE pg_typeof(id) = 'bigint'::regtype;
--   -- Convert id to uuid and set default
--   ALTER TABLE public.sightseeing ALTER COLUMN id TYPE uuid USING gen_random_uuid();
--   ALTER TABLE public.sightseeing ALTER COLUMN id SET DEFAULT gen_random_uuid();
-- END $$;