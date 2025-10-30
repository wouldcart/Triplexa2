require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createNewFunction() {
  console.log('🔧 Creating a completely new function...\n');

  try {
    // First, let's check what columns actually exist in auth.users
    console.log('1️⃣ Checking auth.users table structure...');
    
    const { data: tableData, error: tableError } = await adminClient.rpc('exec_sql', {
      sql: `SELECT * FROM auth.users LIMIT 0;`
    });

    if (tableError) {
      console.log('❌ Table check failed:', tableError.message);
    } else {
      console.log('✅ auth.users table accessible');
    }

    // Create a new function with a different name that only uses raw_user_meta_data
    console.log('\n2️⃣ Creating new function: get_profile_with_metadata...');
    
    const newFunctionSQL = `
-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.get_profile_with_metadata();

-- Create new function that only uses raw_user_meta_data
CREATE OR REPLACE FUNCTION public.get_profile_with_metadata() 
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
GRANT EXECUTE ON FUNCTION public.get_profile_with_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_with_metadata() TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_profile_with_metadata() IS 'Get or create profile for current user using raw_user_meta_data';
    `;

    const { data: createData, error: createError } = await adminClient.rpc('exec_sql', {
      sql: newFunctionSQL
    });

    if (createError) {
      console.log('❌ New function creation failed:', createError.message);
      console.log('   Error details:', createError.details);
      return;
    } else {
      console.log('✅ New function created successfully');
    }

    // Test the new function
    console.log('\n3️⃣ Testing the new function...');
    
    // Create a test user with raw_user_meta_data
    const testEmail = `test-new-func-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      raw_user_meta_data: {
        name: 'Test New Function User',
        phone: '+1234567890',
        company_name: 'Test New Function Company',
        role: 'agent',
        department: 'Testing',
        position: 'Test Agent'
      },
      email_confirm: true
    });

    if (userError) {
      console.log('❌ Test user creation failed:', userError.message);
      return;
    }

    console.log('✅ Test user created:', userData.user.id);

    // Sign in and test the function
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
        .rpc('get_profile_with_metadata');

      if (rpcError) {
        console.log('❌ New RPC function failed:', rpcError.message);
        console.log('   Error details:', rpcError.details);
      } else {
        console.log('✅ New RPC function works!');
        console.log('   Profile data:', {
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

    // Now replace the old function with the working version
    console.log('\n4️⃣ Replacing the old function...');
    
    const replaceFunctionSQL = `
-- Drop the old function
DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user();

-- Create the corrected version
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
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_or_create_profile_for_current_user() IS 'Get or create profile for current user using raw_user_meta_data only';
    `;

    const { data: replaceData, error: replaceError } = await adminClient.rpc('exec_sql', {
      sql: replaceFunctionSQL
    });

    if (replaceError) {
      console.log('❌ Function replacement failed:', replaceError.message);
      console.log('   Error details:', replaceError.details);
    } else {
      console.log('✅ Original function replaced successfully');
    }

  } catch (error) {
    console.error('❌ Error creating new function:', error);
  }
}

createNewFunction();