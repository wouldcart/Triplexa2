#!/usr/bin/env node
require('dotenv').config();
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing env');
  process.exit(1);
}

const sql = `
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
    encode(extensions.pgp_sym_encrypt(coalesce(p_account_number_plain,''), v_key), 'base64'),
    v_last4, p_ifsc_or_swift, p_country, p_branch,
    -- reset verification to pending on change
    case when s.staff_id is null then 'unverified' else 'pending' end,
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
$$
`;

async function main() {
  // Execute DDL through PostgREST query endpoint
  const res = await fetch(`${url}/rest/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sql',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Prefer': 'return=minimal'
    },
    body: sql
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('Failed to update upsert_staff_bank_account:', text);
    process.exit(1);
  }
  console.log('Updated upsert_staff_bank_account successfully.');
}

main().catch(err => { console.error(err); process.exit(1); });