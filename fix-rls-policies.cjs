const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRlsPolicies() {
  console.log('🔧 Fixing RLS policies to prevent infinite recursion...\n');

  try {
    // Step 1: Drop all existing policies on profiles
    console.log('1. Dropping all existing policies on profiles...');
    
    const dropPoliciesSql = `
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
      DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
      DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
      DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Allow service role full access" ON public.profiles;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPoliciesSql });
    if (dropError) {
      console.log('⚠️ Drop policies warning:', dropError.message);
    } else {
      console.log('✅ Existing policies dropped');
    }

    // Step 2: Temporarily disable RLS to allow function to work
    console.log('\n2. Temporarily disabling RLS on profiles...');
    
    const disableRlsSql = `
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    `;
    
    const { error: disableError } = await supabase.rpc('exec_sql', { sql: disableRlsSql });
    if (disableError) {
      console.log('❌ Disable RLS failed:', disableError.message);
    } else {
      console.log('✅ RLS disabled on profiles');
    }

    // Step 3: Test signup with RLS disabled
    console.log('\n3. Testing signup with RLS disabled...');
    const testEmail = `test-rls-${Date.now()}@example.com`;
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
      console.log('❌ Signup still failed:', signupError.message);
    } else {
      console.log('✅ Signup successful with RLS disabled');
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
          console.log('✅ Profile created successfully:', profile);
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

    // Step 4: Re-enable RLS with simpler policies
    console.log('\n4. Re-enabling RLS with simpler policies...');
    
    const enableRlsWithPoliciesSql = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      
      -- Simple policy for service role (used by triggers)
      CREATE POLICY "service_role_all_access" ON public.profiles
        FOR ALL 
        TO service_role
        USING (true)
        WITH CHECK (true);
      
      -- Simple policy for authenticated users to view their own profile
      CREATE POLICY "users_own_profile_select" ON public.profiles
        FOR SELECT 
        TO authenticated
        USING (id = auth.uid());
      
      -- Simple policy for authenticated users to update their own profile
      CREATE POLICY "users_own_profile_update" ON public.profiles
        FOR UPDATE 
        TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
    `;
    
    const { error: enableError } = await supabase.rpc('exec_sql', { sql: enableRlsWithPoliciesSql });
    if (enableError) {
      console.log('❌ Enable RLS with policies failed:', enableError.message);
    } else {
      console.log('✅ RLS re-enabled with simpler policies');
    }

    // Step 5: Test signup again with new policies
    console.log('\n5. Testing signup with new RLS policies...');
    const testEmail2 = `test-rls-final-${Date.now()}@example.com`;

    const { data: signupData2, error: signupError2 } = await supabase.auth.signUp({
      email: testEmail2,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Test User Final',
          phone: '+1234567890'
        }
      }
    });

    if (signupError2) {
      console.log('❌ Final signup failed:', signupError2.message);
    } else {
      console.log('✅ Final signup successful!');
      console.log('User ID:', signupData2.user?.id);
      
      // Check if profile was created
      if (signupData2.user?.id) {
        const { data: profile2, error: profileError2 } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData2.user.id)
          .single();

        if (profileError2) {
          console.log('❌ Profile not found:', profileError2.message);
        } else {
          console.log('✅ Profile created successfully with new policies!');
          console.log('Profile data:', profile2);
        }

        // Clean up test user
        const { error: deleteError2 } = await supabase.auth.admin.deleteUser(signupData2.user.id);
        if (deleteError2) {
          console.log('⚠️ Could not delete test user:', deleteError2.message);
        } else {
          console.log('🧹 Test user cleaned up');
        }
      }
    }

    console.log('\n🎉 RLS policy fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixRlsPolicies();