const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentAuthFunctions() {
  console.log('🔍 Checking current auth functions and triggers...\n');

  try {
    // Check if handle_new_user function exists
    console.log('1. Checking handle_new_user function...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            routine_name,
            routine_type,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_name = 'handle_new_user' 
          AND routine_schema = 'public';
        `
      });

    if (funcError) {
      console.log('❌ Error checking functions:', funcError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ handle_new_user function exists');
      console.log('Function definition preview:', functions[0].routine_definition?.substring(0, 200) + '...');
    } else {
      console.log('❌ handle_new_user function NOT found');
    }

    // Check if trigger exists
    console.log('\n2. Checking on_auth_user_created trigger...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_statement,
            action_timing
          FROM information_schema.triggers 
          WHERE trigger_name = 'on_auth_user_created';
        `
      });

    if (triggerError) {
      console.log('❌ Error checking triggers:', triggerError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ on_auth_user_created trigger exists');
      console.log('Trigger details:', triggers[0]);
    } else {
      console.log('❌ on_auth_user_created trigger NOT found');
    }

    // Check all triggers on auth.users table
    console.log('\n3. Checking all triggers on auth.users table...');
    const { data: authTriggers, error: authTriggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_statement,
            action_timing
          FROM information_schema.triggers 
          WHERE event_object_table = 'users' 
          AND event_object_schema = 'auth';
        `
      });

    if (authTriggerError) {
      console.log('❌ Error checking auth.users triggers:', authTriggerError.message);
    } else if (authTriggers && authTriggers.length > 0) {
      console.log('✅ Found triggers on auth.users:');
      authTriggers.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
      });
    } else {
      console.log('❌ No triggers found on auth.users table');
    }

    // Check profiles table structure
    console.log('\n4. Checking profiles table structure...');
    const { data: profilesStructure, error: structureError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'profiles' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (structureError) {
      console.log('❌ Error checking profiles table:', structureError.message);
    } else if (profilesStructure && profilesStructure.length > 0) {
      console.log('✅ Profiles table structure:');
      profilesStructure.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Profiles table not found or no columns');
    }

    // Test a simple signup to see what happens
    console.log('\n5. Testing signup process...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Test User',
          phone: '+1234567890'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
      console.log('Error details:', signupError);
    } else {
      console.log('✅ Signup successful');
      console.log('User ID:', signupData.user?.id);
      
      // Check if profile was created
      if (signupData.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();

        if (profileError) {
          console.log('❌ Profile not found:', profileError.message);
        } else {
          console.log('✅ Profile created:', profile);
        }

        // Clean up test user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
        if (deleteError) {
          console.log('⚠️ Could not delete test user:', deleteError.message);
        } else {
          console.log('🧹 Test user cleaned up');
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCurrentAuthFunctions();