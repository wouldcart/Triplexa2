#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const sql = `
select n.nspname, p.proname, p.pronargs,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_function_result(p.oid) as result_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname like 'pgp_sym_encrypt%'
`;

admin.rpc('exec_sql', { sql }).then(({ data, error }) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log('Functions:', data);
}).catch(e => { console.error(e); process.exit(1); });