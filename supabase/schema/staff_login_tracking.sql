-- Staff Login Tracking Schema for Supabase
-- Creates tables if they do not already exist.

-- staff_login_records: stores historical login/logout events
create table if not exists public.staff_login_records (
  id text primary key,
  staff_id uuid not null,
  staff_name text not null,
  login_time timestamptz not null,
  logout_time timestamptz null,
  duration_minutes integer null,
  status text not null check (status in ('active','logged-out')),
  ip_address text null,
  user_agent text null,
  department text null,
  city text null,
  country text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- staff_active_sessions: current active sessions keyed by staff_id
create table if not exists public.staff_active_sessions (
  staff_id uuid primary key,
  staff_name text not null,
  login_time timestamptz not null,
  last_activity timestamptz not null,
  status text not null check (status = 'active'),
  login_record_id text null,
  department text null,
  city text null,
  country text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_login_record foreign key (login_record_id) references public.staff_login_records(id) on delete set null
);

-- Helpful indexes
create index if not exists idx_staff_login_records_staff_id on public.staff_login_records(staff_id);
create index if not exists idx_staff_login_records_login_time on public.staff_login_records(login_time desc);
create index if not exists idx_staff_login_records_department on public.staff_login_records(department);
create index if not exists idx_staff_login_records_city on public.staff_login_records(city);
create index if not exists idx_staff_login_records_country on public.staff_login_records(country);
create index if not exists idx_staff_active_sessions_last_activity on public.staff_active_sessions(last_activity desc);

-- Optional update triggers (if pgcrypto or trigger functions are desired, add separately)
-- This file avoids extension dependencies to remain portable.