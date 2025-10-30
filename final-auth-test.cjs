const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function finalAuthTest() {
  console.log('🚀 Final Authentication Test\n');

  try {
    // Step 1: Create the handle_new_user function using REST API
    console.log('1. Creating handle_new_user function...');
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'basic')
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const createFunctionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: functionSQL })
    });

    if (createFunctionResponse.ok) {
      console.log('✅ Function created successfully');
    } else {
      const error = await createFunctionResponse.text();
      console.log('❌ Function creation failed:', error);
    }

    // Step 2: Create the trigger
    console.log('\n2. Creating trigger...');
    const triggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const createTriggerResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: triggerSQL })
    });

    if (createTriggerResponse.ok) {
      console.log('✅ Trigger created successfully');
    } else {
      const error = await createTriggerResponse.text();
      console.log('❌ Trigger creation failed:', error);
    }

    // Step 3: Test signup and profile creation
    console.log('\n3. Testing signup and profile creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Sign up a new user
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
      return;
    }

    console.log('✅ Signup successful!');
    console.log('User ID:', signupData.user?.id);

    // Wait a moment for the trigger to execute
    console.log('⏳ Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created using direct table access
    console.log('\n4. Checking profile creation...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user?.id);

    if (profileError) {
      console.log('❌ Profile check failed:', profileError.message);
    } else if (profiles && profiles.length > 0) {
      console.log('✅ Profile created successfully!');
      console.log('Profile data:', profiles[0]);
    } else {
      console.log('❌ Profile not found');
    }

    // Step 4: Test manual profile insertion
    console.log('\n5. Testing manual profile insertion...');
    const manualTestId = crypto.randomUUID();
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: manualTestId,
        email: 'manual-test@example.com',
        full_name: 'Manual Test User',
        role: 'basic'
      });

    if (insertError) {
      console.log('❌ Manual insert failed:', insertError.message);
    } else {
      console.log('✅ Manual insert successful!');
      
      // Clean up manual test
      await supabase.from('profiles').delete().eq('id', manualTestId);
      console.log('🧹 Manual test record cleaned up');
    }

    // Step 5: Clean up test user
    console.log('\n6. Cleaning up test user...');
    if (signupData.user?.id) {
      // Delete from profiles first
      await supabase.from('profiles').delete().eq('id', signupData.user.id);
      
      // Delete from auth.users using admin API
      const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
      if (deleteError) {
        console.log('❌ User cleanup failed:', deleteError.message);
      } else {
        console.log('✅ Test user cleaned up');
      }
    }

    console.log('\n🎉 Final authentication test completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

finalAuthTest();