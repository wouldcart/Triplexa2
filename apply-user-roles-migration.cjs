const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

async function applySql(sql) {
  const res = await fetch(`${supabaseUrl}/rest/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sql',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    },
    body: sql
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostgREST error: ${res.status} ${res.statusText}\n${text}`);
  }
  return await res.text();
}

async function main() {
  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251030_create_user_roles_table_and_sync.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('🔄 Applying user_roles migration...');
    const out = await applySql(sql);
    console.log('✅ Migration applied successfully.');
    if (out) console.log(out);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

main();