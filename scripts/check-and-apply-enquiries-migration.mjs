import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function tableExists(name) {
  try {
    const { data, error } = await supabase.from(name).select('id').limit(1);
    if (error) {
      if ((error.message || '').toLowerCase().includes('does not exist')) return false;
      // Unknown error, treat as exists to avoid destructive operations
      console.warn(`⚠️ Unable to verify table ${name}:`, error.message);
      return true;
    }
    return Array.isArray(data);
  } catch (e) {
    if ((e.message || '').toLowerCase().includes('does not exist')) return false;
    console.warn(`⚠️ Exception while verifying table ${name}:`, e.message);
    return true;
  }
}

async function main() {
  const projectRoot = process.cwd();
  const sqlPath = path.join(projectRoot, 'supabase/migrations/enquriy.sql');

  const checks = ['enquiries', 'assignment_history', 'enquiry_workflow_events'];
  let missing = [];
  for (const t of checks) {
    const exists = await tableExists(t);
    console.log(`🔎 Table ${t}: ${exists ? 'exists' : 'missing'}`);
    if (!exists) missing.push(t);
  }

  if (missing.length === 0) {
    console.log('✅ All required tables exist. No migration needed.');
    return;
  }

  console.log('⚠️ Missing tables detected:', missing.join(', '));
  console.log('➡️ Applying migration:', sqlPath);

  // Reuse the exec_sql RPC; prefer sql_query param
  const sqlFile = await import('./apply-single-sql.js');
  // Dynamic import returns module namespace; we cannot call directly. Instead spawn a minimal exec here.
  const fs = await import('fs');
  if (!fs.default.existsSync(sqlPath)) {
    console.error('❌ Migration file not found:', sqlPath);
    process.exit(1);
  }
  const sql = fs.default.readFileSync(sqlPath, 'utf8');

  // Attempt multiple RPC entrypoints, mirroring apply-single-sql
  const attempt = async (label, fn) => {
    try {
      const { error } = await fn();
      if (error) {
        console.log(`⚠️  ${label} failed:`, error.message);
        return false;
      }
      console.log(`✅ ${label} succeeded`);
      return true;
    } catch (err) {
      console.log(`⚠️  ${label} exception:`, err.message);
      return false;
    }
  };

  if (await attempt('exec_sql(sql_query)', () => supabase.rpc('exec_sql', { sql_query: sql }))) return;
  if (await attempt('exec_sql(sql)', () => supabase.rpc('exec_sql', { sql }))) return;
  if (await attempt('exec(sql)', () => supabase.rpc('exec', { sql }))) return;
  if (await attempt('pg_query(query)', () => supabase.rpc('pg_query', { query: sql }))) return;

  console.error('❌ All SQL execution methods failed. Please apply via Supabase SQL editor.');
  process.exit(1);
}

main()
  .then(() => {
    console.log('🎉 Migration check complete');
  })
  .catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });