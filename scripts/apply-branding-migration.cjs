#!/usr/bin/env node

/**
 * Script to apply the branding bucket migration using exec_sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyBrandingMigration() {
  console.log('🚀 Applying branding bucket migration...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '2025-01-27-create-branding-bucket.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded');

    // Apply the migration using exec_sql with 'sql' parameter
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error applying migration:', error);
      return;
    }

    console.log('✅ Migration applied successfully');

    // Test bucket access
    console.log('🧪 Testing branding bucket...');
    
    const { data: testList, error: testError } = await supabase.storage
      .from('branding')
      .list('', { limit: 1 });

    if (testError) {
      console.error('❌ Error testing bucket:', testError);
    } else {
      console.log('✅ Branding bucket is accessible');
    }

    console.log('\n🎉 Branding bucket migration completed!');
    console.log('📝 The ORB errors should now be resolved.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyBrandingMigration().catch(console.error);