require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCurrentFunctions() {
  console.log('🔍 Checking current function and trigger definitions...\n');

  try {
    // Check handle_new_user function
    console.log('📋 1. Checking handle_new_user function...');
    const { data: handleNewUserData, error: handleNewUserError } = await adminSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            p.proname as function_name,
            pg_get_functiondef(p.oid) as function_definition
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' 
          AND p.proname = 'handle_new_user';
        `
      });

    if (handleNewUserError) {
      console.error('❌ Error checking handle_new_user:', handleNewUserError);
    } else if (handleNewUserData && handleNewUserData.length > 0) {
      console.log('✅ handle_new_user function found:');
      console.log(handleNewUserData[0].function_definition);
    } else {
      console.log('❌ handle_new_user function not found');
    }

    // Check get_or_create_profile_for_current_user function
    console.log('\n📋 2. Checking get_or_create_profile_for_current_user function...');
    const { data: getRpcData, error: getRpcError } = await adminSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            p.proname as function_name,
            pg_get_functiondef(p.oid) as function_definition
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' 
          AND p.proname = 'get_or_create_profile_for_current_user';
        `
      });

    if (getRpcError) {
      console.error('❌ Error checking get_or_create_profile_for_current_user:', getRpcError);
    } else if (getRpcData && getRpcData.length > 0) {
      console.log('✅ get_or_create_profile_for_current_user function found:');
      console.log(getRpcData[0].function_definition);
    } else {
      console.log('❌ get_or_create_profile_for_current_user function not found');
    }

    // Check trigger
    console.log('\n📋 3. Checking on_auth_user_created trigger...');
    const { data: triggerData, error: triggerError } = await adminSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            t.tgname as trigger_name,
            pg_get_triggerdef(t.oid) as trigger_definition
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = 'auth' 
          AND c.relname = 'users'
          AND t.tgname = 'on_auth_user_created';
        `
      });

    if (triggerError) {
      console.error('❌ Error checking trigger:', triggerError);
    } else if (triggerData && triggerData.length > 0) {
      console.log('✅ on_auth_user_created trigger found:');
      console.log(triggerData[0].trigger_definition);
    } else {
      console.log('❌ on_auth_user_created trigger not found');
    }

    // Check auth.users table structure
    console.log('\n📋 4. Checking auth.users table structure...');
    const { data: authUsersData, error: authUsersError } = await adminSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'auth' 
          AND table_name = 'users'
          ORDER BY ordinal_position;
        `
      });

    if (authUsersError) {
      console.error('❌ Error checking auth.users structure:', authUsersError);
    } else {
      console.log('✅ auth.users table structure:');
      console.log('Raw data:', authUsersData);
      if (Array.isArray(authUsersData)) {
        authUsersData.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      } else {
        console.log('Data is not an array:', typeof authUsersData);
      }
    }

    // Check agents table structure
    console.log('\n📋 5. Checking agents table structure...');
    const { data: agentsData, error: agentsError } = await adminSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = 'agents'
          ORDER BY ordinal_position;
        `
      });

    if (agentsError) {
      console.error('❌ Error checking agents structure:', agentsError);
    } else {
      console.log('✅ agents table structure:');
      console.log('Raw data:', agentsData);
      if (Array.isArray(agentsData)) {
        agentsData.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      } else {
        console.log('Data is not an array:', typeof agentsData);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkCurrentFunctions().catch(console.error);