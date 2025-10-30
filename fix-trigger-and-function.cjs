require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixTriggerAndFunction() {
  console.log('🔧 Fixing both trigger and function to use only raw_user_meta_data...\n');

  try {
    // Complete fix for both trigger and function
    console.log('1️⃣ Applying complete fix...');
    
    const completeFixSQL = `
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user();

-- Create updated handle_new_user function that only uses raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_name text;
  v_phone text;
  v_company_name text;
  v_role text;
  v_department text;
  v_position text;
  v_employee_id text;
  v_city text;
  v_country text;
  v_status text;
  v_must_change_password boolean;
BEGIN
  -- Extract metadata from raw_user_meta_data only
  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)
  );
  
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_company_name := NULLIF(NEW.raw_user_meta_data->>'company_name', '');
  
  v_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', ''),
    'agent'
  );
  
  v_department := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    'General'
  );
  
  v_position := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'position', ''),
    'Agent'
  );
  
  v_employee_id := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');
  v_city := NULLIF(NEW.raw_user_meta_data->>'city', '');
  v_country := NULLIF(NEW.raw_user_meta_data->>'country', '');
  
  v_status := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'status', ''),
    'active'
  );
  
  v_must_change_password := COALESCE(
    (NEW.raw_user_meta_data->>'must_change_password')::boolean,
    false
  );

  -- Insert into profiles with extracted metadata
  INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    company_name,
    role,
    department,
    position,
    employee_id,
    city,
    country,
    status,
    must_change_password,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_phone,
    v_company_name,
    v_role,
    v_department,
    v_position,
    v_employee_id,
    v_city,
    v_country,
    v_status,
    v_must_change_password,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    city = COALESCE(EXCLUDED.city, profiles.city),
    country = COALESCE(EXCLUDED.country, profiles.country),
    status = COALESCE(EXCLUDED.status, profiles.status),
    must_change_password = COALESCE(EXCLUDED.must_change_password, profiles.must_change_password),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated get_or_create_profile_for_current_user function
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
  v_raw_metadata jsonb;
  v_name text;
  v_phone text;
  v_company_name text;
  v_role text;
  v_department text;
  v_position text;
BEGIN 
  -- Return null if no authenticated user 
  IF v_uid IS NULL THEN 
    RETURN NULL; 
  END IF; 

  -- Fetch existing profile
  SELECT p.* INTO v_profile 
  FROM public.profiles p 
  WHERE p.id = v_uid; 

  -- If profile exists, return it 
  IF v_profile IS NOT NULL THEN 
    RETURN v_profile; 
  END IF; 

  -- Get user data from auth.users - only use columns we know exist
  SELECT u.email, u.raw_user_meta_data INTO v_email, v_raw_metadata
  FROM auth.users u 
  WHERE u.id = v_uid; 

  -- Extract metadata from raw_user_meta_data
  v_name := COALESCE(
    NULLIF(v_raw_metadata->>'name', ''),
    NULLIF(v_raw_metadata->>'full_name', ''),
    split_part(v_email, '@', 1)
  );
  
  v_phone := NULLIF(v_raw_metadata->>'phone', '');
  v_company_name := NULLIF(v_raw_metadata->>'company_name', '');
  
  v_role := COALESCE(
    NULLIF(v_raw_metadata->>'role', ''),
    'agent'
  );
  
  v_department := COALESCE(
    NULLIF(v_raw_metadata->>'department', ''),
    'General'
  );
  
  v_position := COALESCE(
    NULLIF(v_raw_metadata->>'position', ''),
    'Agent'
  );

  -- Create profile with extracted metadata
  INSERT INTO public.profiles ( 
    id, email, name, phone, company_name, role, department, status, position, created_at, updated_at 
  ) VALUES ( 
    v_uid, 
    COALESCE(v_email, v_uid::text || '@local'),
    v_name,
    v_phone,
    v_company_name,
    v_role,
    v_department,
    'active',
    v_position,
    NOW(), 
    NOW() 
  ) 
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    updated_at = NOW() 
  RETURNING * INTO v_profile; 

  RETURN v_profile; 
END; 
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon;

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create profile from raw_user_meta_data when new user is created';
COMMENT ON FUNCTION public.get_or_create_profile_for_current_user() IS 'Get or create profile for current user using raw_user_meta_data only';
    `;

    const { data: fixData, error: fixError } = await adminClient.rpc('exec_sql', {
      sql: completeFixSQL
    });

    if (fixError) {
      console.log('❌ Complete fix failed:', fixError.message);
      console.log('   Error details:', fixError.details);
      return;
    } else {
      console.log('✅ Complete fix applied successfully');
    }

    // Test the fix
    console.log('\n2️⃣ Testing the complete fix...');
    
    // Create a test user with raw_user_meta_data
    const testEmail = `test-complete-fix-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      raw_user_meta_data: {
        name: 'Test Complete Fix User',
        phone: '+1234567890',
        company_name: 'Test Complete Fix Company',
        role: 'agent',
        department: 'Testing',
        position: 'Test Agent',
        city: 'Test City',
        country: 'Test Country'
      },
      email_confirm: true
    });

    if (userError) {
      console.log('❌ Test user creation failed:', userError.message);
      return;
    }

    console.log('✅ Test user created:', userData.user.id);

    // Wait for trigger to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created by trigger
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile check failed:', profileError.message);
    } else {
      console.log('✅ Profile created by trigger:');
      console.log('   Name:', profileData.name);
      console.log('   Phone:', profileData.phone);
      console.log('   Company:', profileData.company_name);
      console.log('   Role:', profileData.role);
      console.log('   Department:', profileData.department);
      console.log('   Position:', profileData.position);
      console.log('   City:', profileData.city);
      console.log('   Country:', profileData.country);
    }

    // Test the RPC function
    const regularClient = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: signinData, error: signinError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    });

    if (signinError) {
      console.log('❌ Test signin failed:', signinError.message);
    } else {
      console.log('✅ Test signin successful');
      
      const { data: rpcData, error: rpcError } = await regularClient
        .rpc('get_or_create_profile_for_current_user');

      if (rpcError) {
        console.log('❌ RPC function failed:', rpcError.message);
        console.log('   Error details:', rpcError.details);
      } else {
        console.log('✅ RPC function works!');
        console.log('   RPC Profile data:', {
          id: rpcData?.id,
          name: rpcData?.name,
          phone: rpcData?.phone,
          company_name: rpcData?.company_name,
          role: rpcData?.role,
          department: rpcData?.department,
          position: rpcData?.position
        });
      }
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('❌ Error fixing trigger and function:', error);
  }
}

fixTriggerAndFunction();