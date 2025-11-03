#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const sql = `
select pg_get_functiondef(p.oid) as def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'upsert_staff_bank_account' and n.nspname = 'public'
`;

admin.rpc('exec_sql', { sql }).then(({ data, error }) => {
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  console.log(data?.[0]?.def || data);
}).catch(e => { console.error(e); process.exit(1); });