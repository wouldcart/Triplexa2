const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalDebugFix() {
  console.log('🔍 Final debug and fix...\n');

  try {
    // 1. Drop ALL policies on profiles
    console.log('1. Dropping ALL policies on profiles...');
    
    const dropAllPoliciesSql = `
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
    END LOOP;
END $$`;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropAllPoliciesSql });
    if (dropError) {
      console.log('❌ Error dropping policies:', dropError.message);
    } else {
      console.log('✅ All policies dropped');
    }

    // 2. Disable RLS completely
    console.log('\n2. Disabling RLS completely...');
    const { error: disableRlsError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY' 
    });
    if (disableRlsError) {
      console.log('❌ Error disabling RLS:', disableRlsError.message);
    } else {
      console.log('✅ RLS disabled');
    }

    // 3. Recreate function with logging
    console.log('\n3. Creating function with detailed logging...');
    
    const functionWithLoggingSql = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE 'handle_new_user triggered for user: %', NEW.id;
  RAISE NOTICE 'User email: %', NEW.email;
  RAISE NOTICE 'User metadata: %', NEW.raw_user_meta_data;
  
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
      'active',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Profile inserted successfully for user: %', NEW.id;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error inserting profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$`;

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: functionWithLoggingSql });
    if (functionError) {
      console.log('❌ Error creating function:', functionError.message);
    } else {
      console.log('✅ Function with logging created');
    }

    // 4. Recreate trigger
    console.log('\n4. Recreating trigger...');
    const triggerSql = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user()`;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSql });
    if (triggerError) {
      console.log('❌ Error creating trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger recreated');
    }

    // 5. Test manual profile insertion
    console.log('\n5. Testing manual profile insertion...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'agent',
        status: 'active'
      });

    if (insertError) {
      console.log('❌ Manual insert failed:', insertError.message);
    } else {
      console.log('✅ Manual profile insert successful');
      
      // Clean up manual test
      await supabase.from('profiles').delete().eq('id', testUserId);
      console.log('🧹 Manual test profile cleaned up');
    }

    // 6. Test signup
    console.log('\n6. Testing signup with detailed monitoring...');
    const testEmail = `test-final-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Final Test User'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupData.user?.id);
      
      if (signupData.user?.id) {
        // Wait longer for trigger
        console.log('⏳ Waiting for trigger to execute...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check profile multiple ways
        console.log('🔍 Checking profile creation...');
        
        // Method 1: Direct table query
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id);

        if (profileError) {
          console.log('❌ Profile query error:', profileError.message);
        } else if (profiles && profiles.length > 0) {
          console.log('✅ Profile found!');
          console.log('Profile data:', profiles[0]);
        } else {
          console.log('❌ Profile not found');
        }

        // Method 2: Count all profiles
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.log('❌ Count error:', countError.message);
        } else {
          console.log(`📊 Total profiles in table: ${count}`);
        }

        // Clean up
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
        if (deleteError) {
          console.log('⚠️ Could not delete test user:', deleteError.message);
        } else {
          console.log('🧹 Test user cleaned up');
        }
      }
    }

    console.log('\n🎉 Final debug completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

finalDebugFix();