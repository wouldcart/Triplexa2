-- Staff documents and bank account details with RLS and storage policies
-- Safe to run multiple times (idempotent constructs and IF NOT EXISTS where applicable)

-- 0) Prereqs
create extension if not exists pgcrypto with schema public;

-- Helper: Check HR role for current user
create or replace function public.is_hr()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('hr_manager','manager','super_admin')
  );
$$;

-- 1) Storage bucket for staff documents (private)
insert into storage.buckets (id, name, public)
values ('staff_docs','staff_docs', false)
on conflict (id) do update set public = false;

-- Storage RLS for staff_docs bucket
-- Allow authenticated users to read their own files; HR/Managers can read all
drop policy if exists "staff_docs_read_own_or_hr" on storage.objects;
create policy "staff_docs_read_own_or_hr"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'staff_docs' and (
      name like ('staff/' || auth.uid()::text || '/%')
      or exists (
        select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('hr_manager','manager','super_admin')
      )
    )
  );

-- Allow only the owner (staff) to insert into their folder
drop policy if exists "staff_docs_insert_own" on storage.objects;
create policy "staff_docs_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'staff_docs' and (
      name like ('staff/' || auth.uid()::text || '/%')
    )
  );

-- Allow owner to update/replace own files (rare) and HR to update any
drop policy if exists "staff_docs_update_own_or_hr" on storage.objects;
create policy "staff_docs_update_own_or_hr"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'staff_docs' and (
      name like ('staff/' || auth.uid()::text || '/%')
      or exists (
        select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('hr_manager','manager','super_admin')
      )
    )
  )
  with check (
    bucket_id = 'staff_docs'
  );

-- Allow delete for owner (their folder) and HR/managers
drop policy if exists "staff_docs_delete_own_or_hr" on storage.objects;
create policy "staff_docs_delete_own_or_hr"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'staff_docs' and (
      name like ('staff/' || auth.uid()::text || '/%')
      or exists (
        select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('hr_manager','manager','super_admin')
      )
    )
  );

-- 2) Staff documents table
create table if not exists public.staff_documents (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  file_ext text,
  mime_type text,
  size_bytes integer,
  storage_path text not null, -- path within staff_docs bucket, e.g., staff/<id>/documents/<uuid>_<filename>
  sha256 text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  verified_by uuid references public.profiles(id),
  verified_at timestamp without time zone,
  notes text,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);

create index if not exists staff_documents_staff_id_idx on public.staff_documents(staff_id);
create index if not exists staff_documents_status_idx on public.staff_documents(status);

alter table if exists public.staff_documents enable row level security;

-- Select own records or HR/manager
drop policy if exists "staff_documents_select_own_or_hr" on public.staff_documents;
create policy "staff_documents_select_own_or_hr"
  on public.staff_documents
  for select
  to authenticated
  using (
    staff_id = auth.uid() or public.is_hr()
  );

-- Insert: only owner can insert their documents
drop policy if exists "staff_documents_insert_own" on public.staff_documents;
create policy "staff_documents_insert_own"
  on public.staff_documents
  for insert
  to authenticated
  with check (
    staff_id = auth.uid()
  );

-- Update: HR/managers can update (approve/reject); owner can update only their non-status metadata when pending
drop policy if exists "staff_documents_update_hr" on public.staff_documents;
create policy "staff_documents_update_hr"
  on public.staff_documents
  for update
  to authenticated
  using (public.is_hr())
  with check (true);

drop policy if exists "staff_documents_delete_own_or_hr" on public.staff_documents;
create policy "staff_documents_delete_own_or_hr"
  on public.staff_documents
  for delete
  to authenticated
  using (
    staff_id = auth.uid() or public.is_hr()
  );

-- Protect status fields via trigger: non-HR cannot change status/verification columns
create or replace function public.staff_documents_protect_status()
returns trigger as $$
begin
  if not public.is_hr() then
    if (new.status is distinct from old.status) or (new.verified_by is not null) or (new.verified_at is not null) then
      raise exception 'Only HR/manager can modify verification status for staff documents';
    end if;
  else
    -- HR update: auto-populate verified_by when status changes from pending
    if new.status is distinct from old.status then
      new.verified_by := auth.uid();
      new.verified_at := now();
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_staff_documents_protect_status on public.staff_documents;
create trigger trg_staff_documents_protect_status
before update on public.staff_documents
for each row execute function public.staff_documents_protect_status();

-- Keep updated_at fresh if helper exists
do $$
begin
  if to_regproc('public.update_updated_at_column') is not null then
    execute 'drop trigger if exists update_staff_documents_updated_at on public.staff_documents';
    execute 'create trigger update_staff_documents_updated_at before update on public.staff_documents for each row execute function public.update_updated_at_column()';
  end if;
end $$;

-- 3) Staff bank accounts table
create table if not exists public.staff_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  bank_name text not null,
  account_holder_name text not null,
  account_number_encrypted text not null,
  account_number_last4 text not null,
  country text,
  ifsc_or_swift text,
  branch text,
  verified_status text not null default 'unverified' check (verified_status in ('unverified','pending','verified','rejected')),
  verified_by uuid references public.profiles(id),
  verified_at timestamp without time zone,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  constraint uniq_staff_bank_account unique (staff_id)
);

create index if not exists staff_bank_accounts_staff_id_idx on public.staff_bank_accounts(staff_id);
create index if not exists staff_bank_accounts_verified_status_idx on public.staff_bank_accounts(verified_status);

alter table if exists public.staff_bank_accounts enable row level security;

-- Select own or HR
drop policy if exists "staff_bank_accounts_select_own_or_hr" on public.staff_bank_accounts;
create policy "staff_bank_accounts_select_own_or_hr"
  on public.staff_bank_accounts
  for select
  to authenticated
  using (
    staff_id = auth.uid() or public.is_hr()
  );

-- Insert: only owner
drop policy if exists "staff_bank_accounts_insert_own" on public.staff_bank_accounts;
create policy "staff_bank_accounts_insert_own"
  on public.staff_bank_accounts
  for insert
  to authenticated
  with check (
    staff_id = auth.uid()
  );

-- Insert: HR/managers/super_admin can insert for any staff
drop policy if exists "staff_bank_accounts_insert_hr" on public.staff_bank_accounts;
create policy "staff_bank_accounts_insert_hr"
  on public.staff_bank_accounts
  for insert
  to authenticated
  with check (
    public.is_hr()
  );

-- Update: owner or HR, with trigger protection for verification fields
drop policy if exists "staff_bank_accounts_update_own_or_hr" on public.staff_bank_accounts;
create policy "staff_bank_accounts_update_own_or_hr"
  on public.staff_bank_accounts
  for update
  to authenticated
  using (
    staff_id = auth.uid() or public.is_hr()
  )
  with check (
    staff_id = auth.uid() or public.is_hr()
  );

drop policy if exists "staff_bank_accounts_delete_own_or_hr" on public.staff_bank_accounts;
create policy "staff_bank_accounts_delete_own_or_hr"
  on public.staff_bank_accounts
  for delete
  to authenticated
  using (
    staff_id = auth.uid() or public.is_hr()
  );

-- Trigger to protect verification fields and maintain last4
create or replace function public.staff_bank_accounts_protect_fields()
returns trigger as $$
declare
  -- nothing
begin
  if not public.is_hr() then
    if (new.verified_status is distinct from old.verified_status)
        or (new.verified_by is not null)
        or (new.verified_at is not null) then
      raise exception 'Only HR/manager can modify bank verification status';
    end if;
  else
    if new.verified_status is distinct from old.verified_status then
      new.verified_by := auth.uid();
      new.verified_at := now();
    end if;
  end if;

  -- Ensure last4 consistent if account number changed via function or admin
  if new.account_number_encrypted is distinct from old.account_number_encrypted then
    -- keep last4 as provided; application should set via RPC
    if new.account_number_last4 is null then
      new.account_number_last4 := old.account_number_last4;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_staff_bank_accounts_protect_fields on public.staff_bank_accounts;
create trigger trg_staff_bank_accounts_protect_fields
before update on public.staff_bank_accounts
for each row execute function public.staff_bank_accounts_protect_fields();

-- Keep updated_at fresh if helper exists
do $$
begin
  if to_regproc('public.update_updated_at_column') is not null then
    execute 'drop trigger if exists update_staff_bank_accounts_updated_at on public.staff_bank_accounts';
    execute 'create trigger update_staff_bank_accounts_updated_at before update on public.staff_bank_accounts for each row execute function public.update_updated_at_column()';
  end if;
end $$;

-- 4) RPC to upsert bank account with encryption (uses app.encryption_key GUC)
create or replace function public.upsert_staff_bank_account(
  p_staff_id uuid,
  p_bank_name text,
  p_account_holder_name text,
  p_account_number_plain text,
  p_ifsc_or_swift text,
  p_country text,
  p_branch text
)
returns public.staff_bank_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := coalesce(current_setting('app.encryption_key', true), 'dev_only_key_change_me');
  v_last4 text := right(coalesce(p_account_number_plain,'0000'), 4);
  v_row public.staff_bank_accounts;
begin
  -- Caller must be owner or HR
  if p_staff_id <> auth.uid() and not public.is_hr() then
    raise exception 'Not authorized to update bank account for this staff';
  end if;

  -- Upsert using unique staff_id
  insert into public.staff_bank_accounts as s (
    staff_id, bank_name, account_holder_name, account_number_encrypted,
    account_number_last4, ifsc_or_swift, country, branch, verified_status, updated_at
  ) values (
    p_staff_id, p_bank_name, p_account_holder_name,
    encode(public.pgp_sym_encrypt(coalesce(p_account_number_plain,''), v_key), 'base64'),
    v_last4, p_ifsc_or_swift, p_country, p_branch,
    -- reset verification to pending on change
    'unverified',
    now()
  )
  on conflict (staff_id) do update set
    bank_name = excluded.bank_name,
    account_holder_name = excluded.account_holder_name,
    account_number_encrypted = excluded.account_number_encrypted,
    account_number_last4 = excluded.account_number_last4,
    ifsc_or_swift = excluded.ifsc_or_swift,
    country = excluded.country,
    branch = excluded.branch,
    verified_status = 'pending',
    verified_by = null,
    verified_at = null,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;