import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executeSql(sql) {
  try {
    const { error } = await adminSupabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error(`❌ SQL execution failed: ${error.message}`);
      return false;
    }
    console.log('✅ SQL executed successfully');
    return true;
  } catch (err) {
    console.error(`❌ SQL execution error: ${err.message}`);
    return false;
  }
}

async function main() {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251027_fix_agent_role_triggers.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found at', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('🚀 Applying migration 20251027_fix_agent_role_triggers.sql as a single chunk...');
  const ok = await executeSql(sql);
  if (!ok) process.exit(1);
  console.log('🎉 Migration applied successfully');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});