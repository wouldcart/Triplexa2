-- Create sales_enquiries table and supporting policies/triggers
-- Assumes pgcrypto installed for gen_random_uuid()

create extension if not exists pgcrypto;

-- 1) Table: public.sales_enquiries
create table if not exists public.sales_enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_id text not null unique,
  client_name text,
  email text,
  phone text,
  destination text,
  travelers integer not null default 1 check (travelers >= 1),
  budget numeric(12,2),
  currency text default 'USD',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  tenant_id uuid
);

-- Indexes for common filters/search
create index if not exists sales_enquiries_created_at_idx on public.sales_enquiries (created_at desc);
create index if not exists sales_enquiries_status_idx on public.sales_enquiries (status);
create index if not exists sales_enquiries_destination_idx on public.sales_enquiries (destination);
create index if not exists sales_enquiries_created_by_idx on public.sales_enquiries (created_by);
create index if not exists sales_enquiries_tenant_id_idx on public.sales_enquiries (tenant_id);
create index if not exists sales_enquiries_metadata_gin_idx on public.sales_enquiries using gin (metadata jsonb_path_ops);

-- 2) Updated-at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sales_enquiries_set_updated_at on public.sales_enquiries;
create trigger sales_enquiries_set_updated_at
before update on public.sales_enquiries
for each row execute procedure public.set_updated_at();

-- 3) Optional sync to public.enquiries (existing table from enquriy.sql)
--    We treat sales_enquiries as the write-source for the UI and mirror a subset into enquiries.
--    Avoid bi-directional triggers to prevent loops.
create or replace function public.sync_sales_enquiry_to_enquiries()
returns trigger as $$
declare
  v_country_name text;
  v_budget_min numeric(12,2);
  v_budget_max numeric(12,2);
  v_currency text;
  v_from_date date;
  v_to_date date;
  v_nights int;
  v_days int;
begin
  -- Pull structured fields from metadata when present
  v_country_name := COALESCE(NEW.destination, (NEW.metadata->'destination'->>'country'));
  v_budget_min := COALESCE(NEW.metadata->'budget'->>'min', '0')::numeric;
  v_budget_max := COALESCE(NEW.budget, COALESCE(NEW.metadata->'budget'->>'max','0')::numeric);
  v_currency := COALESCE(NEW.currency, (NEW.metadata->'budget'->>'currency'));
  v_from_date := (NEW.metadata->'travelDates'->>'from')::date;
  v_to_date := (NEW.metadata->'travelDates'->>'to')::date;
  v_days := COALESCE((NEW.metadata->'tripDuration'->>'days')::int, null);
  v_nights := COALESCE((NEW.metadata->'tripDuration'->>'nights')::int, null);

  -- Upsert into enquiries table
  insert into public.enquiries (
    enquiry_id,
    agent_id,
    assigned_to,
    status,
    country_name,
    budget_min,
    budget_max,
    currency,
    start_date,
    end_date,
    nights,
    days,
    pax_adults,
    pax_children,
    pax_infants,
    cities,
    created_at,
    updated_at,
    created_by
  ) values (
    NEW.enquiry_id,
    (NEW.metadata->>'agentId')::int,
    null,
    NEW.status,
    v_country_name,
    v_budget_min,
    v_budget_max,
    v_currency,
    v_from_date,
    v_to_date,
    v_nights,
    v_days,
    COALESCE((NEW.metadata->'paxDetails'->>'adults')::int, NEW.travelers),
    COALESCE((NEW.metadata->'paxDetails'->>'children')::int, 0),
    COALESCE((NEW.metadata->'paxDetails'->>'infants')::int, 0),
    COALESCE(NEW.metadata->'destination'->'cities', '[]'::jsonb),
    NEW.created_at,
    NEW.updated_at,
    NEW.created_by
  )
  on conflict (enquiry_id)
  do update set
    status = EXCLUDED.status,
    country_name = EXCLUDED.country_name,
    budget_min = EXCLUDED.budget_min,
    budget_max = EXCLUDED.budget_max,
    currency = EXCLUDED.currency,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    nights = EXCLUDED.nights,
    days = EXCLUDED.days,
    pax_adults = EXCLUDED.pax_adults,
    pax_children = EXCLUDED.pax_children,
    pax_infants = EXCLUDED.pax_infants,
    cities = EXCLUDED.cities,
    updated_at = now();

  return NEW;
end;
$$ language plpgsql;

drop trigger if exists sales_enquiries_sync_to_enquiries on public.sales_enquiries;
create trigger sales_enquiries_sync_to_enquiries
after insert or update on public.sales_enquiries
for each row execute procedure public.sync_sales_enquiry_to_enquiries();

-- 4) RLS: enable and add policies
alter table public.sales_enquiries enable row level security;

-- Authenticated users can select their own rows (created_by) or same tenant
drop policy if exists sales_enquiries_select_own on public.sales_enquiries;
create policy sales_enquiries_select_own on public.sales_enquiries
  for select
  using (
    (created_by = auth.uid())
    or (tenant_id is not null and tenant_id = auth.jwt() ->> 'tenant_id')
  );

-- Authenticated users can insert rows they own
drop policy if exists sales_enquiries_insert_own on public.sales_enquiries;
create policy sales_enquiries_insert_own on public.sales_enquiries
  for insert
  with check (
    created_by = auth.uid()
    or (tenant_id is not null and tenant_id = auth.jwt() ->> 'tenant_id')
  );

-- Authenticated users can update only their rows
drop policy if exists sales_enquiries_update_own on public.sales_enquiries;
create policy sales_enquiries_update_own on public.sales_enquiries
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Optional admin bypass: allow role 'service_role' or a custom claim to manage all
drop policy if exists sales_enquiries_admin_all on public.sales_enquiries;
create policy sales_enquiries_admin_all on public.sales_enquiries
  for all
  using (
    (auth.jwt() ->> 'role') = 'service_role'
    or (auth.jwt() ->> 'is_admin') = 'true'
  )
  with check (
    (auth.jwt() ->> 'role') = 'service_role'
    or (auth.jwt() ->> 'is_admin') = 'true'
  );

-- Note: ensure your JWT contains 'tenant_id' and 'is_admin' claims as needed.