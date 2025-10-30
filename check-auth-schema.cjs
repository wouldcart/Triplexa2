require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAuthSchema() {
  console.log('🔍 Checking auth.users table schema...\n');

  try {
    // Check what columns exist in auth.users
    console.log('1️⃣ Checking auth.users columns...');
    const { data: columnsData, error: columnsError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `
    });

    if (columnsError) {
      console.log('❌ Columns query failed:', columnsError.message);
    } else {
      console.log('✅ auth.users columns:');
      console.log('   Raw data:', columnsData);
      if (Array.isArray(columnsData)) {
        columnsData.forEach(col => {
          console.log(`   ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}`);
        });
      } else {
        console.log('   Data is not an array:', typeof columnsData);
      }
    }

    // Check if we can access auth.users directly
    console.log('\n2️⃣ Testing direct access to auth.users...');
    const { data: usersData, error: usersError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          id,
          email,
          raw_user_meta_data
        FROM auth.users 
        LIMIT 1;
      `
    });

    if (usersError) {
      console.log('❌ Direct access failed:', usersError.message);
    } else {
      console.log('✅ Direct access works');
      if (usersData && usersData.length > 0) {
        console.log('   Sample user data:', {
          id: usersData[0].id,
          email: usersData[0].email,
          raw_user_meta_data: usersData[0].raw_user_meta_data
        });
      }
    }

    // Create a simple function that only uses raw_user_meta_data
    console.log('\n3️⃣ Creating function with only raw_user_meta_data...');
    
    const simpleFunctionSQL = `
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

  -- Get user data from auth.users (only raw_user_meta_data)
  SELECT u.email, u.raw_user_meta_data INTO v_email, v_raw_user_metadata
  FROM auth.users u 
  WHERE u.id = v_uid; 

  -- Extract metadata from raw_user_meta_data only
  v_name := COALESCE(
    NULLIF(v_raw_user_metadata->>'name', ''),
    split_part(v_email, '@', 1)
  );
  
  v_phone := NULLIF(v_raw_user_metadata->>'phone', '');
  v_company_name := NULLIF(v_raw_user_metadata->>'company_name', '');
  
  v_role := COALESCE(
    NULLIF(v_raw_user_metadata->>'role', ''),
    'agent'
  );
  
  v_department := COALESCE(
    NULLIF(v_raw_user_metadata->>'department', ''),
    'General'
  );
  
  v_position := COALESCE(
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
      sql: simpleFunctionSQL
    });

    if (createError) {
      console.log('❌ Simple function creation failed:', createError.message);
      console.log('   Error details:', createError.details);
    } else {
      console.log('✅ Simple function created successfully');
    }

    // Test the simple function
    console.log('\n4️⃣ Testing the simple function...');
    
    // Create a test user with raw_user_meta_data
    const testEmail = `test-simple-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      raw_user_meta_data: {
        name: 'Test Simple User',
        phone: '+1234567890',
        company_name: 'Test Simple Company',
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
        console.log('❌ RPC function failed:', rpcError.message);
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
    console.error('❌ Error checking auth schema:', error);
  }
}

checkAuthSchema();