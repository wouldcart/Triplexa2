import dotenv from 'dotenv';
import fs from 'fs';
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

async function applySQLFile(filePath) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error('❌ SQL file not found:', absPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(absPath, 'utf8');
  console.log('📄 Applying SQL file:', absPath);

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

  // Try exec_sql with sql_query param
  if (await attempt('exec_sql(sql_query)', () => supabase.rpc('exec_sql', { sql_query: sql }))) return;
  // Try exec_sql with sql param
  if (await attempt('exec_sql(sql)', () => supabase.rpc('exec_sql', { sql }))) return;
  // Try generic exec
  if (await attempt('exec(sql)', () => supabase.rpc('exec', { sql }))) return;
  // Try pg_query
  if (await attempt('pg_query(query)', () => supabase.rpc('pg_query', { query: sql }))) return;

  console.error('❌ All SQL execution methods failed. Please apply via Supabase SQL editor.');
  process.exit(1);
}

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Usage: node scripts/apply-single-sql.js <path-to-sql-file>');
  process.exit(1);
}

applySQLFile(fileArg)
  .then(() => {
    console.log('🎉 SQL applied');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });