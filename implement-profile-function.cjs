require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function implementProfileFunction() {
  console.log('🔧 Implementing get_or_create_profile_for_current_user() function...\n');

  try {
    // Drop existing function if it exists
    console.log('1. Dropping existing function...');
    const dropResult = await supabase.rpc('exec_sql', {
      sql: `DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user();`
    });
    
    if (dropResult.error) {
      console.log('Note: Function may not have existed:', dropResult.error.message);
    } else {
      console.log('✅ Existing function dropped');
    }

    // Create the new function
    console.log('\n2. Creating new function...');
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
   v_name text; 
 BEGIN 
   -- Return null if no authenticated user 
   IF v_uid IS NULL THEN 
     RETURN NULL; 
   END IF; 
 
   -- Try to get email from auth.users (requires SECURITY DEFINER) 
   SELECT u.email INTO v_email 
   FROM auth.users u 
   WHERE u.id = v_uid; 
 
   v_name := COALESCE(split_part(v_email, '@', 1), v_uid::text); 
 
   -- Insert minimal row or enrich existing row. If row exists, only fill empty/null fields. 
   INSERT INTO public.profiles ( 
     id, email, name, role, department, status, position, created_at, updated_at 
   ) VALUES ( 
     v_uid, 
     COALESCE(v_email, v_uid::text || '@local'), 
     v_name, 
     'agent', 
     'General', 
     'active', 
     'Agent', 
     NOW(), 
     NOW() 
   ) 
   ON CONFLICT (id) DO UPDATE SET 
     email = CASE WHEN public.profiles.email IS NULL OR public.profiles.email = '' THEN EXCLUDED.email ELSE public.profiles.email END, 
     name = CASE WHEN public.profiles.name IS NULL OR public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END, 
     role = CASE WHEN public.profiles.role IS NULL OR public.profiles.role = '' THEN EXCLUDED.role ELSE public.profiles.role END, 
     department = CASE WHEN public.profiles.department IS NULL OR public.profiles.department = '' THEN EXCLUDED.department ELSE public.profiles.department END, 
     status = CASE WHEN public.profiles.status IS NULL OR public.profiles.status = '' THEN EXCLUDED.status ELSE public.profiles.status END, 
     position = CASE WHEN public.profiles.position IS NULL OR public.profiles.position = '' THEN EXCLUDED.position ELSE public.profiles.position END, 
     updated_at = NOW() 
   RETURNING * INTO v_profile; 
 
   RETURN v_profile; 
 END; 
 $$;`;

    const createResult = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    });

    if (createResult.error) {
      console.error('❌ Error creating function:', createResult.error);
      return;
    }
    console.log('✅ Function created successfully');

    // Grant permissions
    console.log('\n3. Granting permissions...');
    const grantSQL = `
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated; 
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon;`;

    const grantResult = await supabase.rpc('exec_sql', {
      sql: grantSQL
    });

    if (grantResult.error) {
      console.error('❌ Error granting permissions:', grantResult.error);
      return;
    }
    console.log('✅ Permissions granted successfully');

    // Verify function exists
    console.log('\n4. Verifying function exists...');
    const verifyResult = await supabase.rpc('exec_sql', {
      sql: `
SELECT 
  p.proname as function_name,
  p.prosecdef as security_definer,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'get_or_create_profile_for_current_user';`
    });

    if (verifyResult.error) {
      console.error('❌ Error verifying function:', verifyResult.error);
      return;
    }

    if (verifyResult.data && verifyResult.data.length > 0) {
      console.log('✅ Function verified:');
      console.log('   Name:', verifyResult.data[0].function_name);
      console.log('   Security Definer:', verifyResult.data[0].security_definer);
      console.log('   Return Type:', verifyResult.data[0].return_type);
    } else {
      console.log('❌ Function not found after creation');
    }

    console.log('\n🎉 Function implementation completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testFunction() {
  console.log('\n🧪 Testing the function...\n');

  try {
    // Create a test user
    console.log('1. Creating test user...');
    const testEmail = `test-profile-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        phone: '+1234567890',
        company_name: 'Test Company',
        role: 'agent',
        department: 'Sales'
      }
    });

    if (authError) {
      console.error('❌ Error creating test user:', authError);
      return;
    }

    const userId = authData.user.id;
    console.log('✅ Test user created:', userId);

    // Wait a moment for any triggers to run
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created by trigger
    console.log('\n2. Checking if profile exists from trigger...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileError);
    } else if (existingProfile) {
      console.log('✅ Profile exists from trigger:');
      console.log('   ID:', existingProfile.id);
      console.log('   Email:', existingProfile.email);
      console.log('   Name:', existingProfile.name);
      console.log('   Role:', existingProfile.role);
      console.log('   Phone:', existingProfile.phone);
      console.log('   Company:', existingProfile.company_name);
    } else {
      console.log('ℹ️ No profile found from trigger');
    }

    // Test the function by calling it as the user
    console.log('\n3. Testing function with user authentication...');
    
    // Sign in as the test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Error signing in:', signInError);
      return;
    }

    console.log('✅ Signed in as test user');

    // Call the function
    const { data: functionResult, error: functionError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (functionError) {
      console.error('❌ Error calling function:', functionError);
    } else {
      console.log('✅ Function result:');
      console.log('   ID:', functionResult?.id);
      console.log('   Email:', functionResult?.email);
      console.log('   Name:', functionResult?.name);
      console.log('   Role:', functionResult?.role);
      console.log('   Department:', functionResult?.department);
      console.log('   Status:', functionResult?.status);
      console.log('   Position:', functionResult?.position);
    }

    // Sign out
    await supabase.auth.signOut();

    // Cleanup - delete test user
    console.log('\n4. Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('❌ Error deleting test user:', deleteError);
    } else {
      console.log('✅ Test user cleaned up');
    }

    console.log('\n🎉 Function testing completed!');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

async function main() {
  console.log('🚀 Starting profile function implementation and testing...\n');
  
  await implementProfileFunction();
  await testFunction();
  
  console.log('\n✨ All done!');
}

main().catch(console.error);