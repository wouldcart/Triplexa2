require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTriggerFunction() {
  console.log('🔍 Checking trigger function definition...');

  try {
    // Check the function definition
    const { data: functionDef, error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          p.proname as function_name,
          pg_get_functiondef(p.oid) as function_definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname IN ('handle_new_user', 'get_or_create_profile_for_current_user');
      `
    });

    if (functionError) {
      console.error('❌ Error getting function definition:', functionError);
      return;
    }

    console.log('\n📋 Function definitions:');
    console.log('Raw response:', functionDef);
    
    if (Array.isArray(functionDef)) {
      functionDef.forEach(func => {
        console.log(`\n🔧 ${func.function_name}:`);
        console.log(func.function_definition);
        console.log('\n' + '='.repeat(80));
      });
    } else {
      console.log('Function definitions response is not an array:', typeof functionDef);
    }

    // Check triggers
    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          t.tgname as trigger_name,
          c.relname as table_name,
          p.proname as function_name,
          t.tgenabled as enabled
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE c.relname = 'users'
        AND t.tgname = 'on_auth_user_created';
      `
    });

    if (triggerError) {
      console.error('❌ Error getting trigger info:', triggerError);
    } else {
      console.log('\n🎯 Trigger information:');
      console.log(triggers);
    }

    // Test raw metadata access
    console.log('\n🧪 Testing raw metadata access...');
    
    const { data: testUser, error: testUserError } = await supabase.auth.admin.createUser({
      email: `test-metadata-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: {
        name: 'Test User',
        phone: '+1234567890',
        company_name: 'Test Corp'
      }
    });

    if (testUserError) {
      console.error('❌ Error creating test user:', testUserError);
      return;
    }

    console.log('✅ Test user created:', testUser.user.id);

    // Check raw metadata
    const { data: rawMetadata, error: rawError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          id,
          email,
          raw_user_meta_data,
          raw_user_meta_data->>'name' as extracted_name,
          raw_user_meta_data->>'phone' as extracted_phone,
          raw_user_meta_data->>'company_name' as extracted_company
        FROM auth.users 
        WHERE id = '${testUser.user.id}';
      `
    });

    if (rawError) {
      console.error('❌ Error getting raw metadata:', rawError);
    } else {
      console.log('\n📊 Raw metadata check:');
      console.log(rawMetadata[0]);
    }

    // Wait for trigger and check profile
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error getting profile:', profileError);
    } else {
      console.log('\n👤 Profile created by trigger:');
      console.log({
        name: profile.name,
        phone: profile.phone,
        company_name: profile.company_name,
        role: profile.role,
        department: profile.department,
        position: profile.position
      });
    }

    // Clean up
    try {
      await supabase.auth.admin.deleteUser(testUser.user.id);
      console.log('\n✅ Test user deleted');
    } catch (error) {
      console.log('\n⚠️ Could not delete test user:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTriggerFunction();