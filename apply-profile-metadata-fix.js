import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function applyProfileMetadataFix() {
  console.log('🔧 Applying fixed get_or_create_profile_for_current_user function...');

  try {
    // Read the migration file
    const sqlContent = fs.readFileSync('./supabase/migrations/20251028_fix_get_or_create_profile_metadata.sql', 'utf8');
    
    // Extract just the function creation part (remove comments)
    const functionSQL = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');

    console.log('\n1. Attempting to apply profile metadata fix...');
    
    // Try to execute the SQL using rpc
    try {
      const { data, error } = await adminClient
        .rpc('exec_sql', { sql_query: functionSQL });
      
      if (error) {
        console.log('❌ exec_sql approach failed:', error.message);
        throw error;
      }
      
      console.log('✅ Successfully applied fix using exec_sql rpc');
      console.log('📊 Result:', data);
      
    } catch (rpcError) {
      console.log('⚠️ RPC approach failed, trying direct query...');
      
      // Fallback: try direct query execution
      const { data, error } = await adminClient.query(functionSQL);
      
      if (error) {
        console.log('❌ Direct query approach failed:', error.message);
        throw error;
      }
      
      console.log('✅ Successfully applied fix using direct query');
      console.log('📊 Result:', data);
    }

    console.log('\n2. Testing the fixed function...');
    
    // Test the function by calling it
    const { data: testResult, error: testError } = await adminClient
      .rpc('get_or_create_profile_for_current_user');
    
    if (testError) {
      console.log('⚠️ Function test failed (this might be expected if no user is authenticated):', testError.message);
    } else {
      console.log('✅ Function test successful:', testResult);
    }

    console.log('\n✅ Profile metadata fix applied successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('   • Function now extracts name from user_metadata->>"name"');
    console.log('   • Function now extracts phone from user_metadata->>"phone"');
    console.log('   • Function now extracts company_name from user_metadata->>"company_name"');
    console.log('   • Function now extracts role from user_metadata->>"role"');
    console.log('   • Function includes proper fallbacks for missing data');
    console.log('   • Function updates existing profiles with new metadata if available');
    
  } catch (error) {
    console.error('❌ Failed to apply profile metadata fix:', error);
    console.error('Error details:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    process.exit(1);
  }
}

applyProfileMetadataFix();