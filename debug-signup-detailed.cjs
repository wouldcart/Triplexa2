require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugSignupDetailed() {
  console.log('🔍 Detailed signup debugging...\n');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Check if the function exists and is working
    console.log('1. VERIFYING FUNCTION EXISTS:');
    const { data: functionCheck, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';`
      });
    
    if (funcError) {
      console.log('   ❌ Function check error:', funcError.message);
    } else {
      console.log('   ✅ Function exists:', functionCheck.length > 0);
    }

    // 2. Check trigger exists
    console.log('\n2. VERIFYING TRIGGER EXISTS:');
    const { data: triggerCheck, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
      });
    
    if (triggerError) {
      console.log('   ❌ Trigger check error:', triggerError.message);
    } else {
      console.log('   ✅ Trigger exists:', triggerCheck.length > 0);
    }

    // 3. Check RLS policies on profiles table
    console.log('\n3. CHECKING RLS POLICIES ON PROFILES:');
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';`
      });
    
    if (rlsError) {
      console.log('   ❌ RLS check error:', rlsError.message);
    } else {
      console.log('   📋 RLS status:', rlsCheck);
    }

    // 4. Check if we can manually insert into profiles
    console.log('\n4. TESTING MANUAL PROFILE INSERT:');
    const testId = '00000000-0000-0000-0000-000000000001';
    const { data: manualInsert, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'manual-test@example.com',
        name: 'Manual Test',
        role: 'agent'
      })
      .select();
    
    if (insertError) {
      console.log('   ❌ Manual insert error:', insertError.message);
    } else {
      console.log('   ✅ Manual insert works');
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
    }

    // 5. Try signup with email confirmation disabled
    console.log('\n5. TESTING SIGNUP WITH ADMIN CLIENT:');
    const testEmail = `admin-test-${Date.now()}@example.com`;
    
    try {
      const { data: adminSignup, error: adminError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          name: 'Admin Test User',
          role: 'agent',
          phone: '+1-555-0123'
        }
      });

      if (adminError) {
        console.log('   ❌ Admin signup error:', adminError.message);
      } else {
        console.log('   ✅ Admin signup successful!');
        console.log('   📋 User ID:', adminSignup.user?.id);
        
        // Check if profile was created by trigger
        if (adminSignup.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', adminSignup.user.id)
            .single();
          
          if (profileError) {
            console.log('   ❌ Profile not created by trigger:', profileError.message);
          } else {
            console.log('   ✅ Profile created by trigger:', profile);
          }

          // Clean up
          await supabase.auth.admin.deleteUser(adminSignup.user.id);
          console.log('   🧹 Admin test user cleaned up');
        }
      }
    } catch (adminErr) {
      console.log('   ❌ Admin signup exception:', adminErr.message);
    }

    // 6. Check Supabase auth settings
    console.log('\n6. CHECKING AUTH CONFIGURATION:');
    console.log('   📋 Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('   📋 Using service role key:', !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

    // 7. Try a very simple signup without metadata
    console.log('\n7. TESTING SIMPLE SIGNUP (NO METADATA):');
    const simpleEmail = `simple-${Date.now()}@example.com`;
    const { data: simpleSignup, error: simpleError } = await supabase.auth.signUp({
      email: simpleEmail,
      password: 'TestPassword123!'
    });

    if (simpleError) {
      console.log('   ❌ Simple signup error:', simpleError.message);
      console.log('   📋 Error code:', simpleError.code);
      console.log('   📋 Error status:', simpleError.status);
    } else {
      console.log('   ✅ Simple signup successful!');
      if (simpleSignup.user) {
        await supabase.auth.admin.deleteUser(simpleSignup.user.id);
        console.log('   🧹 Simple test user cleaned up');
      }
    }

    // 8. Check if there are any other triggers that might be interfering
    console.log('\n8. CHECKING ALL TRIGGERS ON AUTH.USERS:');
    const { data: allTriggers, error: allTriggersError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT tgname, tgrelid::regclass, tgenabled, pg_get_triggerdef(oid) as definition 
              FROM pg_trigger 
              WHERE tgrelid = 'auth.users'::regclass;`
      });
    
    if (allTriggersError) {
      console.log('   ❌ All triggers check error:', allTriggersError.message);
    } else {
      console.log('   📋 All triggers on auth.users:', allTriggers);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

debugSignupDetailed().catch(console.error);