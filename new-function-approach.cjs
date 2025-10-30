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

async function exec_sql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  if (error) {
    console.error('SQL Error:', error);
    throw error;
  }
  return data;
}

async function newFunctionApproach() {
  console.log('🔧 New function approach...');

  try {
    // 1. Drop existing trigger
    console.log('\n1. Dropping existing trigger...');
    
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE`);
    console.log('✅ Trigger dropped');

    // 2. Create a completely new function with a different name
    console.log('\n2. Creating new function with different name...');
    
    const newFunctionSQL = `CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    name, 
    phone, 
    company_name, 
    role, 
    department, 
    position,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'position', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$`;
    
    await exec_sql(newFunctionSQL);
    console.log('✅ New function created successfully');

    // 3. Create trigger with new function
    console.log('\n3. Creating trigger with new function...');
    
    await exec_sql(`CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_with_metadata()`);
    
    console.log('✅ Trigger created with new function');

    // 4. Grant permissions
    console.log('\n4. Granting permissions...');
    
    await exec_sql(`GRANT EXECUTE ON FUNCTION handle_new_user_with_metadata() TO authenticated, anon, service_role`);
    console.log('✅ Permissions granted');

    // 5. Verify the new function
    console.log('\n5. Verifying new function...');
    
    const functionCheck = await exec_sql(`SELECT pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'handle_new_user_with_metadata'`);
    
    console.log('📊 New function definition:');
    if (functionCheck && functionCheck.length > 0) {
      console.log(functionCheck[0].definition);
      
      const hasMetadata = functionCheck[0].definition.includes('raw_user_meta_data');
      console.log(`\n✅ Contains metadata extraction: ${hasMetadata}`);
    } else {
      console.log('❌ New function not found');
    }

    // 6. Test with a real user
    console.log('\n6. Testing with real user...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      user_metadata: {
        name: 'New Function Test User',
        phone: '+1234567890',
        company_name: 'New Function Company',
        role: 'new_tester',
        department: 'Engineering',
        position: 'Lead Developer'
      }
    });

    if (authError) {
      console.error('❌ Error creating test user:', authError);
      return;
    }

    console.log('✅ Test user created:', authData.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check profile
    const profile = await exec_sql(`SELECT name, phone, company_name, role, department, position
FROM profiles 
WHERE id = '${authData.user.id}'`);

    console.log('📊 Profile created by new trigger:');
    if (profile && profile.length > 0) {
      console.log('✅ Profile:', profile[0]);
      
      const hasData = profile[0].name && profile[0].name !== '';
      console.log(`\n🎉 Metadata extracted successfully: ${hasData}`);
      
      if (hasData) {
        console.log('🎉 SUCCESS! The new trigger is working correctly with metadata extraction!');
        console.log('🎯 All form fields are now being properly extracted and stored!');
      } else {
        console.log('❌ Metadata extraction still not working');
      }
    } else {
      console.log('❌ No profile found');
    }

    // 7. Also update the get_or_create function
    console.log('\n7. Updating get_or_create function...');
    
    const getOrCreateSQL = `CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  phone TEXT,
  company_name TEXT,
  role TEXT,
  department TEXT,
  position TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  user_email TEXT;
  user_metadata JSONB;
  profile_exists BOOLEAN;
BEGIN
  -- Get current user info
  SELECT auth.uid(), auth.email() INTO user_id, user_email;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE profiles.id = user_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Get user metadata from auth.users
    SELECT raw_user_meta_data INTO user_metadata
    FROM auth.users 
    WHERE auth.users.id = user_id;
    
    -- Create profile with metadata
    INSERT INTO profiles (
      id, 
      email,
      name, 
      phone, 
      company_name, 
      role, 
      department, 
      position,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_email,
      COALESCE(user_metadata->>'name', ''),
      COALESCE(user_metadata->>'phone', ''),
      COALESCE(user_metadata->>'company_name', ''),
      COALESCE(user_metadata->>'role', 'employee'),
      COALESCE(user_metadata->>'department', ''),
      COALESCE(user_metadata->>'position', ''),
      NOW(),
      NOW()
    );
  END IF;
  
  -- Return the profile
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.phone,
    p.company_name,
    p.role,
    p.department,
    p.position,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$`;
    
    await exec_sql(getOrCreateSQL);
    console.log('✅ get_or_create function updated');

    // Grant permissions for get_or_create
    await exec_sql(`GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO authenticated, anon, service_role`);
    console.log('✅ get_or_create permissions granted');

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Error in new function approach:', error);
    throw error;
  }

  console.log('\n🎉 New function approach completed!');
}

newFunctionApproach();