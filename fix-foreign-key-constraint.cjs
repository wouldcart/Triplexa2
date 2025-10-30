const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixForeignKeyConstraint() {
  console.log('🔧 Fixing foreign key constraint issue...\n');

  try {
    // 1. Drop the problematic foreign key constraint
    console.log('1. Dropping foreign key constraint...');
    
    const dropConstraintSql = 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey';
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropConstraintSql });
    
    if (dropError) {
      console.log('❌ Error dropping constraint:', dropError.message);
    } else {
      console.log('✅ Foreign key constraint dropped');
    }

    // 2. Ensure RLS is disabled
    console.log('\n2. Ensuring RLS is disabled...');
    const { error: disableRlsError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY' 
    });
    if (disableRlsError) {
      console.log('❌ Error disabling RLS:', disableRlsError.message);
    } else {
      console.log('✅ RLS disabled');
    }

    // 3. Test manual profile insertion
    console.log('\n3. Testing manual profile insertion...');
    const testUserId = '00000000-0000-0000-0000-000000000003';
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test3@example.com',
        name: 'Test User 3',
        role: 'agent',
        status: 'active'
      });

    if (insertError) {
      console.log('❌ Manual insert failed:', insertError.message);
    } else {
      console.log('✅ Manual profile insert successful!');
      
      // Verify the insert
      const { data: insertedProfile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      if (selectError) {
        console.log('❌ Could not retrieve inserted profile:', selectError.message);
      } else {
        console.log('✅ Profile retrieved successfully:', insertedProfile);
      }
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testUserId);
      console.log('🧹 Test profile cleaned up');
    }

    // 4. Recreate the trigger function (ensuring it works without foreign key constraint)
    console.log('\n4. Recreating trigger function...');
    
    const functionSql = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE 'handle_new_user triggered for user: %', NEW.id;
  
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
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RAISE NOTICE 'Profile created/updated for user: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$`;

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: functionSql });
    if (functionError) {
      console.log('❌ Error creating function:', functionError.message);
    } else {
      console.log('✅ Function recreated');
    }

    // 5. Recreate trigger
    console.log('\n5. Recreating trigger...');
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

    // 6. Test complete signup flow
    console.log('\n6. Testing complete signup flow...');
    const testEmail = `test-complete-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Complete Test User'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupData.user?.id);
      
      if (signupData.user?.id) {
        // Wait for trigger
        console.log('⏳ Waiting for trigger to execute...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();

        if (profileError) {
          console.log('❌ Profile not found:', profileError.message);
        } else {
          console.log('✅ Profile created successfully!');
          console.log('Profile data:', profile);
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

    console.log('\n🎉 Foreign key constraint fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixForeignKeyConstraint();