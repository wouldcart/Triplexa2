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

async function analyzeFunctionConflicts() {
  try {
    console.log('🔍 Analyzing function conflicts and relationships...\n');

    // 1. Check what functions currently exist
    console.log('1. Checking existing functions...');
    const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          proname as function_name,
          pg_get_functiondef(oid) as definition
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname IN (
          'get_or_create_profile_for_current_user',
          'handle_new_user', 
          'profiles_enrich_after_basic',
          'exec_sql'
        )
        ORDER BY proname;
      `
    });

    if (funcError) {
      console.log('❌ Error getting functions:', funcError);
    } else if (functions && Array.isArray(functions)) {
      console.log('✅ Found functions:');
      functions.forEach(func => {
        console.log(`   📋 ${func.function_name}`);
      });
    } else {
      console.log('   No matching functions found');
    }

    // 2. Check triggers on auth.users
    console.log('\n2. Checking triggers on auth.users...');
    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_statement,
          action_timing
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
        ORDER BY trigger_name;
      `
    });

    if (triggerError) {
      console.log('❌ Error getting triggers:', triggerError);
    } else if (triggers && Array.isArray(triggers)) {
      console.log('✅ Found triggers on auth.users:');
      if (triggers.length === 0) {
        console.log('   No triggers found');
      } else {
        triggers.forEach(trigger => {
          console.log(`   🔗 ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
          console.log(`      Action: ${trigger.action_statement}`);
        });
      }
    } else {
      console.log('   No triggers found');
    }

    // 3. Check triggers on public.profiles
    console.log('\n3. Checking triggers on public.profiles...');
    const { data: profileTriggers, error: profileTriggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_statement,
          action_timing
        FROM information_schema.triggers 
        WHERE event_object_table = 'profiles' 
        AND event_object_schema = 'public'
        ORDER BY trigger_name;
      `
    });

    if (profileTriggerError) {
      console.log('❌ Error getting profile triggers:', profileTriggerError);
    } else if (profileTriggers && Array.isArray(profileTriggers)) {
      console.log('✅ Found triggers on public.profiles:');
      if (profileTriggers.length === 0) {
        console.log('   No triggers found');
      } else {
        profileTriggers.forEach(trigger => {
          console.log(`   🔗 ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
          console.log(`      Action: ${trigger.action_statement}`);
        });
      }
    } else {
      console.log('   No triggers found');
    }

    // 4. Test the current get_or_create_profile_for_current_user function
    console.log('\n4. Testing current function...');
    const { data: testResult, error: testError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (testError) {
      console.log('❌ Function test error:', testError);
    } else {
      console.log('✅ Function test successful (unauthenticated)');
      console.log('   Result:', testResult);
    }

    // 5. Check for any syntax issues in the function
    console.log('\n5. Checking function syntax...');
    const { data: syntaxCheck, error: syntaxError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          pg_get_functiondef(oid) as definition
        FROM pg_proc 
        WHERE proname = 'get_or_create_profile_for_current_user'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `
    });

    if (syntaxError) {
      console.log('❌ Error checking syntax:', syntaxError);
    } else if (syntaxCheck && Array.isArray(syntaxCheck) && syntaxCheck.length > 0) {
      const definition = syntaxCheck[0].definition;
      console.log('✅ Function definition retrieved');
      
      // Check for the syntax issue mentioned
      if (definition.includes('public.profiles.email')) {
        console.log('⚠️  SYNTAX ISSUE FOUND: Function contains "public.profiles.email"');
        console.log('   This should be "profiles.email" in the ON CONFLICT clause');
      } else if (definition.includes('profiles.email')) {
        console.log('✅ Syntax looks correct: Uses "profiles.email"');
      }
    } else {
      console.log('❌ Function definition not found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Starting function conflict analysis...\n');
  
  try {
    await analyzeFunctionConflicts();
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n✨ Analysis complete!');
}

main();