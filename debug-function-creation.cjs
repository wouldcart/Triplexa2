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

async function debugFunctionCreation() {
  console.log('🔍 Debugging function creation...');

  try {
    // 1. Check current state
    console.log('\n1. Checking current functions...');
    
    const currentFunctions = await exec_sql(`
      SELECT proname, pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname LIKE '%handle_new_user%'
    `);
    
    console.log('📊 Current functions:', currentFunctions);

    // 2. Try creating a simple test function first
    console.log('\n2. Creating simple test function...');
    
    const simpleFunction = `
      CREATE OR REPLACE FUNCTION test_simple()
      RETURNS TEXT
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN 'Hello World';
      END;
      $$
    `;
    
    await exec_sql(simpleFunction);
    console.log('✅ Simple function created');

    // Check if it exists
    const testCheck = await exec_sql(`
      SELECT proname, pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'test_simple'
    `);
    
    console.log('📊 Test function check:', testCheck);

    // 3. Try creating trigger function with simpler syntax
    console.log('\n3. Creating trigger function with simpler syntax...');
    
    const simpleTriggerFunction = `
      CREATE OR REPLACE FUNCTION handle_new_user_simple()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, name, created_at, updated_at)
        VALUES (NEW.id, NEW.email, 'Test Name', NOW(), NOW());
        RETURN NEW;
      END;
      $$
    `;
    
    await exec_sql(simpleTriggerFunction);
    console.log('✅ Simple trigger function created');

    // Check if it exists
    const simpleTriggerCheck = await exec_sql(`
      SELECT proname, pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'handle_new_user_simple'
    `);
    
    console.log('📊 Simple trigger function check:', simpleTriggerCheck);

    // 4. Try creating the full function with metadata extraction
    console.log('\n4. Creating full function with metadata extraction...');
    
    const fullFunction = `
      CREATE OR REPLACE FUNCTION handle_new_user_full()
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
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
          NOW(),
          NOW()
        );
        RETURN NEW;
      END;
      $$
    `;
    
    await exec_sql(fullFunction);
    console.log('✅ Full function created');

    // Check if it exists
    const fullFunctionCheck = await exec_sql(`
      SELECT proname, pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'handle_new_user_full'
    `);
    
    console.log('📊 Full function check:', fullFunctionCheck);

    // 5. Test the full function with a trigger
    console.log('\n5. Testing full function with trigger...');
    
    // Drop existing trigger
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE`);
    
    // Create new trigger
    await exec_sql(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user_full()
    `);
    
    console.log('✅ Trigger created with full function');

    // Grant permissions
    await exec_sql(`GRANT EXECUTE ON FUNCTION handle_new_user_full() TO authenticated, anon, service_role`);
    
    // Test with user
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      user_metadata: {
        name: 'Debug Test User',
        phone: '+1234567890',
        company_name: 'Debug Company',
        role: 'tester'
      }
    });

    if (authError) {
      console.error('❌ Error creating test user:', authError);
      return;
    }

    console.log('✅ Test user created:', authData.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check profile
    const profile = await exec_sql(`
      SELECT name, phone, company_name, role
      FROM profiles 
      WHERE id = '${authData.user.id}'
    `);

    console.log('📊 Profile created by full function trigger:');
    if (profile && profile.length > 0) {
      console.log('✅ Profile:', profile[0]);
      
      const hasData = profile[0].name && profile[0].name !== '';
      console.log(`\n🎉 Metadata extracted: ${hasData}`);
      
      if (hasData) {
        console.log('🎉 SUCCESS! The trigger is working with metadata extraction!');
      }
    } else {
      console.log('❌ No profile found');
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user deleted');

    // Clean up test functions
    await exec_sql(`DROP FUNCTION IF EXISTS test_simple() CASCADE`);
    await exec_sql(`DROP FUNCTION IF EXISTS handle_new_user_simple() CASCADE`);

  } catch (error) {
    console.error('❌ Error in debug function creation:', error);
    throw error;
  }

  console.log('\n🎉 Debug function creation completed!');
}

debugFunctionCreation();