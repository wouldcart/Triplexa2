import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const migrationPath = path.join(process.cwd(), 'supabase/schema/ai_integrations.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`🚀 Applying AI Integrations migration (${statements.length} statements)...`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt });
      if (error) {
        console.error(`❌ Statement ${i + 1} failed:`, error.message);
        console.error(stmt.substring(0, 120) + '...');
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error in statement ${i + 1}:`, err.message);
    }
  }
  console.log('🎉 AI Integrations migration finished');
}

run();