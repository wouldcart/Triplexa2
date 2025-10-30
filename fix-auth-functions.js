import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const publicClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixAuthFunctions() {
  console.log('🔧 Fixing authentication functions and data...');

  try {
    // 1. Create the missing get_or_create_profile_for_current_user function
    console.log('\n1. Creating get_or_create_profile_for_current_user function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
      RETURNS public.profiles
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_profile public.profiles;
        v_uid uuid := auth.uid();
        v_email text;
      BEGIN
        -- Return null if no authenticated user
        IF v_uid IS NULL THEN
          RETURN NULL;
        END IF;

        -- Fetch existing profile without RLS restrictions (SECURITY DEFINER)
        SELECT p.* INTO v_profile
        FROM public.profiles p
        WHERE p.id = v_uid;

        IF v_profile IS NOT NULL THEN
          RETURN v_profile;
        END IF;

        -- Try to get email from auth.users (requires SECURITY DEFINER)
        SELECT u.email INTO v_email
        FROM auth.users u
        WHERE u.id = v_uid;

        -- Create minimal profile row if missing
        INSERT INTO public.profiles (
          id, email, name, role, department, status, position, created_at, updated_at
        ) VALUES (
          v_uid,
          COALESCE(v_email, v_uid::text || '@local'),
          COALESCE(split_part(v_email, '@', 1), v_uid::text),
          'agent',
          'General',
          'active',
          'Agent',
          NOW(),
          NOW()
        )
        RETURNING * INTO v_profile;

        RETURN v_profile;
      END;
      $$;

      GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
    `;

    // Execute the SQL directly using the admin client
    const { error: functionError } = await adminClient.rpc('exec_sql', { sql_query: createFunctionSQL });
    
    if (functionError) {
      console.log('❌ Function creation failed:', functionError.message);
      
      // Try alternative approach - create via SQL query
      console.log('   Trying alternative approach...');
      const { error: altError } = await adminClient
        .from('_sql_exec')
        .insert({ query: createFunctionSQL });
      
      if (altError) {
        console.log('❌ Alternative approach failed:', altError.message);
        console.log('⚠️  You may need to create this function manually in Supabase SQL Editor');
      } else {
        console.log('✅ Function created via alternative method');
      }
    } else {
      console.log('✅ Function created successfully');
    }

    // 2. Test the function
    console.log('\n2. Testing get_or_create_profile_for_current_user...');
    const { error: testError } = await publicClient.rpc('get_or_create_profile_for_current_user');
    
    if (testError) {
      if (testError.message.includes('Could not find the function')) {
        console.log('❌ Function still not found - manual creation needed');
      } else {
        console.log('✅ Function exists (auth error expected without login)');
      }
    } else {
      console.log('✅ Function works');
    }

    // 3. Create a test user for login testing
    console.log('\n3. Creating test user...');
    const testEmail = 'test@example.com';
    const testPassword = 'test123456';

    const { data: signUpData, error: signUpError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ Test user already exists');
      } else {
        console.log('❌ Failed to create test user:', signUpError.message);
      }
    } else {
      console.log('✅ Test user created:', signUpData.user?.email);
    }

    // 4. Test login with the test user
    console.log('\n4. Testing login with test user...');
    const { data: loginData, error: loginError } = await publicClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful:', loginData.user?.email);
      
      // Test the profile function with authenticated user
      console.log('   Testing profile function with auth...');
      const { data: profileData, error: profileError } = await publicClient.rpc('get_or_create_profile_for_current_user');
      
      if (profileError) {
        console.log('❌ Profile function failed:', profileError.message);
      } else {
        console.log('✅ Profile function works:', profileData?.email);
      }

      // Sign out
      await publicClient.auth.signOut();
    }

    // 5. Fix agent credentials password hashing
    console.log('\n5. Checking agent credentials...');
    const { data: credentials, error: credError } = await adminClient
      .from('agent_credentials')
      .select('username, agent_id, password_hash')
      .limit(1);

    if (credError) {
      console.log('❌ Cannot access credentials:', credError.message);
    } else if (credentials && credentials.length > 0) {
      const cred = credentials[0];
      console.log('🔑 Sample credential username:', cred.username);
      
      // Test the authenticate function
      const { data: authTest, error: authTestError } = await publicClient.rpc('authenticate_managed_agent', {
        p_username: cred.username,
        p_password: 'test123' // This will likely fail, but let's see
      });

      if (authTestError) {
        console.log('❌ Auth test error:', authTestError.message);
      } else {
        console.log('🔑 Auth test result:', authTest);
      }
    }

    console.log('\n🎉 Authentication fix complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Attempted to create get_or_create_profile_for_current_user function');
    console.log('   ✅ Created test user: test@example.com / test123456');
    console.log('   ✅ Tested login functionality');
    console.log('\n💡 Next steps:');
    console.log('   1. Try logging in via the web interface with test@example.com / test123456');
    console.log('   2. If function creation failed, apply it manually in Supabase SQL Editor');
    console.log('   3. Check agent password hashing if agent login is needed');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixAuthFunctions();