require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixAuthTriggerFinal() {
  console.log('🔧 Final fix for auth trigger and signup issues...\n');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Clean up any existing triggers and functions
    console.log('1. CLEANING UP EXISTING TRIGGERS AND FUNCTIONS:');
    
    const cleanupSQL = `
-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user();
`;

    const { error: cleanupError } = await supabase.rpc('exec_sql', { sql: cleanupSQL });
    if (cleanupError) {
      console.log('   ⚠️  Cleanup warning:', cleanupError.message);
    } else {
      console.log('   ✅ Cleanup completed');
    }

    // 2. Create the handle_new_user function
    console.log('\n2. CREATING HANDLE_NEW_USER FUNCTION:');
    
    const functionSQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name text;
  user_role text;
  user_phone text;
  user_company_name text;
  user_department text;
  user_position text;
  user_employee_id text;
  user_avatar text;
  user_preferred_language text;
  user_country text;
  user_city text;
  user_must_change_password boolean;
BEGIN
  -- Extract metadata with fallbacks (prioritize raw_user_meta_data over user_metadata)
  user_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.user_metadata->>'name', ''),
    split_part(NEW.email, '@', 1)
  );
  
  user_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', ''),
    NULLIF(NEW.user_metadata->>'role', ''),
    'agent'
  );
  
  user_phone := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.user_metadata->>'phone', '')
  );
  
  user_company_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(NEW.user_metadata->>'company_name', '')
  );
  
  user_department := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    NULLIF(NEW.user_metadata->>'department', ''),
    'General'
  );
  
  user_position := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'position', ''),
    NULLIF(NEW.user_metadata->>'position', ''),
    'Agent'
  );
  
  user_employee_id := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'employee_id', ''),
    NULLIF(NEW.user_metadata->>'employee_id', '')
  );
  
  user_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar', ''),
    NULLIF(NEW.user_metadata->>'avatar', '')
  );
  
  user_preferred_language := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''),
    NULLIF(NEW.user_metadata->>'preferred_language', '')
  );
  
  user_country := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.user_metadata->>'country', '')
  );
  
  user_city := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.user_metadata->>'city', '')
  );
  
  user_must_change_password := COALESCE(
    (NEW.raw_user_meta_data->>'must_change_password')::boolean,
    (NEW.user_metadata->>'must_change_password')::boolean,
    false
  );

  -- Insert profile with extracted metadata
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    phone,
    company_name,
    department,
    position,
    employee_id,
    avatar,
    preferred_language,
    country,
    city,
    must_change_password,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    user_phone,
    user_company_name,
    user_department,
    user_position,
    user_employee_id,
    user_avatar,
    user_preferred_language,
    user_country,
    user_city,
    user_must_change_password,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    avatar = COALESCE(EXCLUDED.avatar, profiles.avatar),
    preferred_language = COALESCE(EXCLUDED.preferred_language, profiles.preferred_language),
    country = COALESCE(EXCLUDED.country, profiles.country),
    city = COALESCE(EXCLUDED.city, profiles.city),
    must_change_password = COALESCE(EXCLUDED.must_change_password, profiles.must_change_password),
    updated_at = NOW();

  -- Also create an agent record if role is 'agent'
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      id,
      name,
      email,
      role,
      department,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      user_name,
      NEW.email,
      user_role,
      user_department,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, agents.name),
      email = EXCLUDED.email,
      role = COALESCE(EXCLUDED.role, agents.role),
      department = COALESCE(EXCLUDED.department, agents.department),
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;
`;

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: functionSQL });
    if (functionError) {
      console.log('   ❌ Function creation error:', functionError.message);
      return;
    } else {
      console.log('   ✅ Function created successfully');
    }

    // 3. Create the trigger
    console.log('\n3. CREATING TRIGGER:');
    
    const triggerSQL = `
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    if (triggerError) {
      console.log('   ❌ Trigger creation error:', triggerError.message);
      return;
    } else {
      console.log('   ✅ Trigger created successfully');
    }

    // 4. Grant necessary permissions
    console.log('\n4. GRANTING PERMISSIONS:');
    
    const permissionsSQL = `
-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Ensure the function can access auth.users
GRANT SELECT ON auth.users TO postgres;
GRANT SELECT ON auth.users TO service_role;

-- Ensure the function can insert into profiles and agents
GRANT INSERT, UPDATE ON public.profiles TO postgres;
GRANT INSERT, UPDATE ON public.profiles TO service_role;
GRANT INSERT, UPDATE ON public.agents TO postgres;
GRANT INSERT, UPDATE ON public.agents TO service_role;
`;

    const { error: permissionsError } = await supabase.rpc('exec_sql', { sql: permissionsSQL });
    if (permissionsError) {
      console.log('   ❌ Permissions error:', permissionsError.message);
    } else {
      console.log('   ✅ Permissions granted successfully');
    }

    // 5. Verify the setup
    console.log('\n5. VERIFYING SETUP:');
    
    // Check if function exists
    const { data: functionCheck, error: functionCheckError } = await supabase.rpc('exec_sql', {
      sql: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';"
    });
    
    if (functionCheckError) {
      console.log('   ❌ Function check error:', functionCheckError.message);
    } else {
      console.log('   ✅ Function exists:', functionCheck && functionCheck.length > 0);
    }

    // Check if trigger exists
    const { data: triggerCheck, error: triggerCheckError } = await supabase.rpc('exec_sql', {
      sql: "SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';"
    });
    
    if (triggerCheckError) {
      console.log('   ❌ Trigger check error:', triggerCheckError.message);
    } else {
      console.log('   ✅ Trigger exists:', triggerCheck && triggerCheck.length > 0);
    }

    // 6. Test signup
    console.log('\n6. TESTING SIGNUP:');
    
    const testEmail = `final-test-${Date.now()}@example.com`;
    console.log(`   Testing with email: ${testEmail}`);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Final Test User',
          role: 'agent',
          department: 'Testing'
        }
      }
    });

    if (signupError) {
      console.log('   ❌ Signup still failing:', signupError.message);
      console.log('   📋 Error details:', {
        code: signupError.status,
        name: signupError.name
      });
    } else {
      console.log('   ✅ Signup successful!');
      console.log('   📋 User ID:', signupData.user?.id);
      
      // Check if profile was created
      if (signupData.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileError) {
          console.log('   ❌ Profile check error:', profileError.message);
        } else {
          console.log('   ✅ Profile created:', profile ? 'Yes' : 'No');
          if (profile) {
            console.log('   📋 Profile data:', {
              name: profile.name,
              role: profile.role,
              department: profile.department
            });
          }
        }

        // Clean up test user
        await supabase.auth.admin.deleteUser(signupData.user.id);
        console.log('   🧹 Test user cleaned up');
      }
    }

    console.log('\n🎉 Auth trigger fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixAuthTriggerFinal().catch(console.error);