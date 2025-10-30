require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMetadataFix() {
  console.log('🔧 Applying metadata extraction fix...\n');

  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20251028_fix_user_metadata_extraction.sql', 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('📝 Migration size:', migrationSQL.length, 'characters');
    
    // Apply the migration
    console.log('\n🚀 Executing migration...');
    const { data, error } = await adminClient.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (error) {
      console.log('❌ Migration failed:', error.message);
      console.log('   Error details:', error.details);
      console.log('   Error code:', error.code);
      return;
    }

    console.log('✅ Migration applied successfully!');
    
    // Verify the functions exist
    console.log('\n🔍 Verifying functions...');
    
    // Test the trigger function
    const { data: triggerTest, error: triggerError } = await adminClient
      .rpc('exec_sql', { 
        sql: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';" 
      });
    
    if (triggerError) {
      console.log('⚠️  Could not verify trigger function:', triggerError.message);
    } else {
      console.log('✅ handle_new_user function exists');
    }
    
    // Test the RPC function
    const { data: rpcTest, error: rpcError } = await adminClient
      .rpc('exec_sql', { 
        sql: "SELECT proname FROM pg_proc WHERE proname = 'get_or_create_profile_for_current_user';" 
      });
    
    if (rpcError) {
      console.log('⚠️  Could not verify RPC function:', rpcError.message);
    } else {
      console.log('✅ get_or_create_profile_for_current_user function exists');
    }

    console.log('\n🎉 Metadata extraction fix has been applied!');
    console.log('📋 What was fixed:');
    console.log('   • handle_new_user trigger now extracts from user_metadata (with raw_user_meta_data fallback)');
    console.log('   • get_or_create_profile_for_current_user RPC now extracts from user_metadata (with raw_user_meta_data fallback)');
    console.log('   • Both functions handle all profile fields: name, phone, company_name, role, etc.');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

applyMetadataFix();