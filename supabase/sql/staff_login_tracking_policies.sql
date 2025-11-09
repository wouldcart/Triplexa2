-- Minimal RLS policies for staff login tracking tables
-- Aligns access to management roles from public.profiles.role

-- Enable RLS on tables
alter table if exists public.staff_login_records enable row level security;
alter table if exists public.staff_active_sessions enable row level security;

-- Allow managers/admins to SELECT all records
drop policy if exists "login_records_select_mgmt" on public.staff_login_records;
create policy "login_records_select_mgmt"
  on public.staff_login_records
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin','manager','admin','hr_manager')
    )
  );

-- Allow staff to SELECT their own records
drop policy if exists "login_records_select_own" on public.staff_login_records;
create policy "login_records_select_own"
  on public.staff_login_records
  for select
  to authenticated
  using (staff_id = auth.uid());

-- Active sessions: managers/admins can SELECT all
drop policy if exists "active_sessions_select_mgmt" on public.staff_active_sessions;
create policy "active_sessions_select_mgmt"
  on public.staff_active_sessions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin','manager','admin','hr_manager')
    )
  );

-- Active sessions: staff can SELECT own session
drop policy if exists "active_sessions_select_own" on public.staff_active_sessions;
create policy "active_sessions_select_own"
  on public.staff_active_sessions
  for select
  to authenticated
  using (staff_id = auth.uid());

-- NOTE:
-- Inserts/updates/deletes are performed via the service (admin) key in code,
-- so explicit write policies are intentionally omitted for regular clients.
-- If you need non-admin writes, add corresponding policies with appropriate checks.