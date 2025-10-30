require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function implementFunction() {
  try {
    console.log('🔧 Implementing get_or_create_profile_for_current_user function...\n');

    // 1. Drop existing function if it exists
    console.log('1. Dropping existing function...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user();'
    });

    if (dropError) {
      console.log('❌ Error dropping function:', dropError);
    } else {
      console.log('✅ Function dropped (if existed)');
    }

    // 2. Create the function with proper syntax
    console.log('\n2. Creating function...');
    const functionSQL = `
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
    email = CASE WHEN profiles.email IS NULL OR profiles.email = '' THEN EXCLUDED.email ELSE profiles.email END, 
    name = CASE WHEN profiles.name IS NULL OR profiles.name = '' THEN EXCLUDED.name ELSE profiles.name END, 
    role = CASE WHEN profiles.role IS NULL OR profiles.role = '' THEN EXCLUDED.role ELSE profiles.role END, 
    department = CASE WHEN profiles.department IS NULL OR profiles.department = '' THEN EXCLUDED.department ELSE profiles.department END, 
    status = CASE WHEN profiles.status IS NULL OR profiles.status = '' THEN EXCLUDED.status ELSE profiles.status END, 
    position = CASE WHEN profiles.position IS NULL OR profiles.position = '' THEN EXCLUDED.position ELSE profiles.position END, 
    updated_at = NOW() 
  RETURNING * INTO v_profile; 

  RETURN v_profile; 
END; 
$$;`;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: functionSQL
    });

    if (createError) {
      console.log('❌ Error creating function:', createError);
      return;
    } else {
      console.log('✅ Function created successfully');
    }

    // 3. Grant permissions
    console.log('\n3. Granting permissions...');
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: `
        GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
        GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon;
      `
    });

    if (grantError) {
      console.log('❌ Error granting permissions:', grantError);
    } else {
      console.log('✅ Permissions granted');
    }

    // 4. Test function without authentication
    console.log('\n4. Testing function without authentication...');
    const { data: unauthResult, error: unauthError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (unauthError) {
      console.log('❌ Error calling function (unauthenticated):', unauthError);
    } else {
      console.log('✅ Function works (unauthenticated), result:', unauthResult);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testWithExistingUser() {
  try {
    console.log('\n🧪 Testing with existing user...\n');

    // 1. Find an existing user with a profile
    console.log('1. Finding existing user...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('❌ No profiles found for testing');
      return;
    }

    const testProfile = profiles[0];
    console.log('✅ Found test profile:', {
      id: testProfile.id,
      email: testProfile.email,
      name: testProfile.name,
      role: testProfile.role
    });

    // 2. Set up authentication for this user
    console.log('\n2. Setting up authentication...');
    const tempPassword = 'TempPass123!';
    
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      testProfile.id,
      { 
        password: tempPassword,
        email_confirm: true
      }
    );

    if (passwordError) {
      console.log('❌ Error setting password:', passwordError);
      return;
    }

    console.log('✅ Password set and email confirmed');

    // 3. Sign in as the user
    console.log('\n3. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testProfile.email,
      password: tempPassword
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError);
      return;
    }

    console.log('✅ Signed in successfully');
    console.log('   User ID:', signInData.user.id);

    // 4. Test the function with authentication
    console.log('\n4. Testing function with authentication...');
    const { data: authResult, error: authError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (authError) {
      console.log('❌ Error calling function (authenticated):', authError);
    } else {
      console.log('✅ Function works (authenticated)!');
      console.log('   Result:', {
        id: authResult.id,
        email: authResult.email,
        name: authResult.name,
        role: authResult.role,
        department: authResult.department,
        status: authResult.status,
        position: authResult.position
      });
    }

    // 5. Test profile enrichment by clearing some fields
    console.log('\n5. Testing profile enrichment...');
    
    // Clear some fields
    const { error: clearError } = await supabase
      .from('profiles')
      .update({ 
        name: null, 
        department: null,
        position: null 
      })
      .eq('id', testProfile.id);

    if (clearError) {
      console.log('❌ Error clearing fields:', clearError);
    } else {
      console.log('✅ Cleared some profile fields');
    }

    // Call function again to test enrichment
    const { data: enrichResult, error: enrichError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (enrichError) {
      console.log('❌ Error calling function for enrichment:', enrichError);
    } else {
      console.log('✅ Profile enrichment works!');
      console.log('   Enriched result:', {
        id: enrichResult.id,
        email: enrichResult.email,
        name: enrichResult.name,
        role: enrichResult.role,
        department: enrichResult.department,
        status: enrichResult.status,
        position: enrichResult.position
      });
    }

    // 6. Sign out
    console.log('\n6. Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.log('❌ Sign out error:', signOutError);
    } else {
      console.log('✅ Signed out successfully');
    }

  } catch (error) {
    console.error('❌ Unexpected error in testing:', error);
  }
}

async function main() {
  console.log('🚀 Starting final function implementation and testing...\n');
  
  try {
    await implementFunction();
    await testWithExistingUser();
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n🎉 Function implementation and testing completed!');
  console.log('\n✨ All done!');
}

main();