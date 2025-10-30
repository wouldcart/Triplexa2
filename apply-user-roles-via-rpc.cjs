const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function execSql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
  return data;
}

async function main() {
  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251030_create_user_roles_table_and_sync.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('🔄 Applying user_roles migration via RPC...');
    const result = await execSql(sql);
    console.log('✅ Migration applied.');
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

main();