require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkFunctionSource() {
  console.log('🔍 Checking function source code...\n');

  try {
    // Get the actual function source using pg_get_functiondef
    const functionSourceQuery = `
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'handle_new_user'
      AND n.nspname = 'public'
    `;

    const { data: functionResult, error: functionError } = await adminClient.rpc('exec_sql', {
      sql: functionSourceQuery
    });

    if (functionError) {
      console.log(`❌ Function source query error: ${functionError.message}`);
    } else {
      console.log('✅ Function source retrieved:');
      if (functionResult && functionResult.length > 0) {
        console.log('\n📋 Current handle_new_user function:');
        console.log('='.repeat(80));
        console.log(functionResult[0].function_definition);
        console.log('='.repeat(80));
      } else {
        console.log('❌ No function found');
      }
    }

    // Also check get_or_create_profile_for_current_user
    const profileFunctionQuery = `
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'get_or_create_profile_for_current_user'
      AND n.nspname = 'public'
    `;

    const { data: profileFunctionResult, error: profileFunctionError } = await adminClient.rpc('exec_sql', {
      sql: profileFunctionQuery
    });

    if (profileFunctionError) {
      console.log(`❌ Profile function source query error: ${profileFunctionError.message}`);
    } else {
      console.log('\n✅ Profile function source retrieved:');
      if (profileFunctionResult && profileFunctionResult.length > 0) {
        console.log('\n📋 Current get_or_create_profile_for_current_user function:');
        console.log('='.repeat(80));
        console.log(profileFunctionResult[0].function_definition);
        console.log('='.repeat(80));
      } else {
        console.log('❌ No profile function found');
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkFunctionSource().catch(console.error);