#!/usr/bin/env node
// Apply the exec_sql helper migration using PostgREST query endpoint
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase env: VITE_SUPABASE_URL/SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251027_add_exec_sql_helper.sql');
if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  console.log('🚀 Applying exec_sql helper migration via PostgREST /query...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: migrationSQL
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to apply migration:', response.status, errorText);
      process.exit(1);
    }

    console.log('✅ exec_sql helper migration applied successfully');
  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    process.exit(1);
  }
}

applyMigration();