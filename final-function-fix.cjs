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

async function finalFunctionFix() {
  console.log('🔧 Final function fix (no semicolons)...');

  try {
    // 1. Drop existing trigger and function completely
    console.log('\n1. Dropping existing trigger and function...');
    
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE`);
    await exec_sql(`DROP FUNCTION IF EXISTS handle_new_user() CASCADE`);
    await exec_sql(`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE`);
    
    console.log('✅ Dropped existing trigger and function');

    // 2. Create the new function WITHOUT semicolons
    console.log('\n2. Creating new function (without semicolons)...');
    
    const functionSQL = `CREATE OR REPLACE FUNCTION public.handle_new_user()
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
    
    await exec_sql(functionSQL);
    console.log('✅ Function created successfully');

    // 3. Create the trigger
    console.log('\n3. Creating trigger...');
    
    await exec_sql(`CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user()`);
    
    console.log('✅ Trigger created successfully');

    // 4. Grant permissions
    console.log('\n4. Granting permissions...');
    
    await exec_sql(`GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon, service_role`);
    console.log('✅ Permissions granted');

    // 5. Verify the function
    console.log('\n5. Verifying function...');
    
    const functionCheck = await exec_sql(`SELECT pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'handle_new_user'`);
    
    console.log('📊 Function definition:');
    if (functionCheck && functionCheck.length > 0) {
      console.log(functionCheck[0].definition);
      
      const hasMetadata = functionCheck[0].definition.includes('raw_user_meta_data');
      console.log(`\n✅ Contains metadata extraction: ${hasMetadata}`);
    } else {
      console.log('❌ Function not found');
    }

    // 6. Test with a real user
    console.log('\n6. Testing with real user...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      user_metadata: {
        name: 'Final Test User',
        phone: '+1234567890',
        company_name: 'Final Test Company',
        role: 'final_tester',
        department: 'QA',
        position: 'Senior Tester'
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

    console.log('📊 Profile created by trigger:');
    if (profile && profile.length > 0) {
      console.log('✅ Profile:', profile[0]);
      
      const hasData = profile[0].name && profile[0].name !== '';
      console.log(`\n🎉 Metadata extracted successfully: ${hasData}`);
      
      if (hasData) {
        console.log('🎉 SUCCESS! The trigger is now working correctly with metadata extraction!');
      } else {
        console.log('❌ Metadata extraction still not working');
        
        // Debug: Check what's in raw_user_meta_data
        const userMetadata = await exec_sql(`SELECT raw_user_meta_data
FROM auth.users 
WHERE id = '${authData.user.id}'`);
        
        console.log('🔍 Debug - User metadata:', userMetadata);
      }
    } else {
      console.log('❌ No profile found');
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Error in final function fix:', error);
    throw error;
  }

  console.log('\n🎉 Final function fix completed!');
}

finalFunctionFix();