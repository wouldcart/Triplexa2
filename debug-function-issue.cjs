require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugFunctionIssue() {
  console.log('🔍 Debugging function issue...\n');

  try {
    // Check the current function definition
    console.log('1️⃣ Checking current function definition...');
    const { data: funcData, error: funcError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          proname,
          prosrc
        FROM pg_proc 
        WHERE proname = 'get_or_create_profile_for_current_user'
        ORDER BY oid DESC
        LIMIT 1;
      `
    });

    if (funcError) {
      console.log('❌ Function query failed:', funcError.message);
    } else {
      console.log('✅ Function found');
      if (funcData && funcData.length > 0) {
        const source = funcData[0].prosrc;
        console.log('📝 Function source (first 300 chars):');
        console.log(source.substring(0, 300) + '...');
        
        // Check if it contains the problematic line
        if (source.includes('u.user_metadata')) {
          console.log('✅ Function contains u.user_metadata reference');
        } else {
          console.log('❌ Function does NOT contain u.user_metadata reference');
        }
      }
    }

    // Force recreate the function with the correct definition
    console.log('\n2️⃣ Force recreating the function...');
    
    const correctFunctionSQL = `
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
  v_user_metadata jsonb;
  v_raw_user_metadata jsonb;
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

  -- Fetch existing profile without RLS restrictions (SECURITY DEFINER) 
  SELECT p.* INTO v_profile 
  FROM public.profiles p 
  WHERE p.id = v_uid; 

  -- If profile exists, return it 
  IF v_profile IS NOT NULL THEN 
    RETURN v_profile; 
  END IF; 

  -- Get user data from auth.users (requires SECURITY DEFINER) 
  SELECT u.email, u.user_metadata, u.raw_user_meta_data INTO v_email, v_user_metadata, v_raw_user_metadata
  FROM auth.users u 
  WHERE u.id = v_uid; 

  -- Extract metadata with fallbacks (prioritize user_metadata over raw_user_meta_data)
  v_name := COALESCE(
    NULLIF(v_user_metadata->>'name', ''),
    NULLIF(v_raw_user_metadata->>'name', ''),
    split_part(v_email, '@', 1)
  );
  
  v_phone := COALESCE(
    NULLIF(v_user_metadata->>'phone', ''),
    NULLIF(v_raw_user_metadata->>'phone', '')
  );
  
  v_company_name := COALESCE(
    NULLIF(v_user_metadata->>'company_name', ''),
    NULLIF(v_raw_user_metadata->>'company_name', '')
  );
  
  v_role := COALESCE(
    NULLIF(v_user_metadata->>'role', ''),
    NULLIF(v_raw_user_metadata->>'role', ''),
    'agent'
  );
  
  v_department := COALESCE(
    NULLIF(v_user_metadata->>'department', ''),
    NULLIF(v_raw_user_metadata->>'department', ''),
    'General'
  );
  
  v_position := COALESCE(
    NULLIF(v_user_metadata->>'position', ''),
    NULLIF(v_raw_user_metadata->>'position', ''),
    'Agent'
  );

  -- Create profile row with extracted metadata
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
    `;

    const { data: createData, error: createError } = await adminClient.rpc('exec_sql', {
      sql: correctFunctionSQL
    });

    if (createError) {
      console.log('❌ Function recreation failed:', createError.message);
      console.log('   Error details:', createError.details);
    } else {
      console.log('✅ Function recreated successfully');
    }

    // Test the function now
    console.log('\n3️⃣ Testing the function...');
    
    // Create a test user with user_metadata
    const testEmail = `test-func-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      user_metadata: {
        name: 'Test Function User',
        phone: '+1234567890',
        company_name: 'Test Function Company',
        role: 'agent'
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
        .rpc('get_or_create_profile_for_current_user');

      if (rpcError) {
        console.log('❌ RPC function still failed:', rpcError.message);
        console.log('   Error details:', rpcError.details);
      } else {
        console.log('✅ RPC function works!');
        console.log('   Profile data:', {
          id: rpcData?.id,
          name: rpcData?.name,
          phone: rpcData?.phone,
          company_name: rpcData?.company_name,
          role: rpcData?.role
        });
      }
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('❌ Error debugging function:', error);
  }
}

debugFunctionIssue();