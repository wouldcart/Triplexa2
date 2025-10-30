require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseTriggers() {
  console.log('🔍 Checking database triggers and functions...\n');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Check if user_profile_data table exists
    console.log('1. CHECKING user_profile_data TABLE:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profile_data');
    
    if (tablesError) {
      console.log('   ❌ Error checking tables:', tablesError.message);
    } else {
      console.log('   📋 user_profile_data exists:', tables.length > 0);
      if (tables.length === 0) {
        console.log('   🚨 PROBLEM: user_profile_data table is missing!');
      }
    }

    // 2. Check current handle_new_user function
    console.log('\n2. CHECKING handle_new_user FUNCTION:');
    try {
      const { data: functionDef, error: funcError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT pg_get_functiondef(oid) as definition 
                FROM pg_proc 
                WHERE proname = 'handle_new_user' 
                AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');`
        });
      
      if (funcError) {
        console.log('   ❌ Error getting function definition:', funcError.message);
      } else if (functionDef && functionDef.length > 0) {
        console.log('   ✅ Function exists');
        console.log('   📋 Function definition preview:');
        const def = functionDef[0].definition;
        if (def.includes('user_profile_data')) {
          console.log('   🚨 PROBLEM: Function references user_profile_data!');
        } else {
          console.log('   ✅ Function looks clean');
        }
      } else {
        console.log('   ❌ Function not found');
      }
    } catch (e) {
      console.log('   ⚠️  Cannot check function:', e.message);
    }

    // 3. Check triggers
    console.log('\n3. CHECKING TRIGGERS:');
    try {
      const { data: triggers, error: triggerError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT tgname, tgrelid::regclass as table_name, tgenabled 
                FROM pg_trigger 
                WHERE tgname LIKE '%user%' OR tgname LIKE '%profile%' OR tgname LIKE '%auth%';`
        });
      
      if (triggerError) {
        console.log('   ❌ Error checking triggers:', triggerError.message);
      } else {
        console.log('   📋 Active triggers:', triggers);
      }
    } catch (e) {
      console.log('   ⚠️  Cannot check triggers:', e.message);
    }

    // 4. Test a simple signup to see the exact error
    console.log('\n4. TESTING SIGNUP TO GET EXACT ERROR:');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Test User',
          role: 'agent'
        }
      }
    });

    if (signupError) {
      console.log('   ❌ SIGNUP ERROR:', signupError.message);
      console.log('   📋 Error details:', signupError);
    } else {
      console.log('   ✅ Signup successful');
      // Clean up
      if (signupData.user) {
        await supabase.auth.admin.deleteUser(signupData.user.id);
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

checkDatabaseTriggers().catch(console.error);
