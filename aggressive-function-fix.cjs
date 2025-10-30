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

async function aggressiveFunctionFix() {
  console.log('🔧 Aggressive function fix...');

  try {
    // 1. Find all functions with this name
    console.log('\n1. Finding all functions with name handle_new_user...');
    
    const allFunctions = await exec_sql(`
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments,
        p.oid
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'handle_new_user'
    `);
    
    console.log('📊 Found functions:', allFunctions);

    // 2. Drop all functions with this name
    console.log('\n2. Dropping all functions with this name...');
    
    if (allFunctions && allFunctions.length > 0) {
      for (const func of allFunctions) {
        const dropSQL = `DROP FUNCTION IF EXISTS ${func.schema_name}.${func.function_name}(${func.arguments}) CASCADE`;
        console.log(`Dropping: ${dropSQL}`);
        await exec_sql(dropSQL);
      }
    }
    
    // Also try generic drops
    await exec_sql(`DROP FUNCTION IF EXISTS handle_new_user() CASCADE`);
    await exec_sql(`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE`);
    
    console.log('✅ All functions dropped');

    // 3. Drop and recreate trigger
    console.log('\n3. Dropping and recreating trigger...');
    
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE`);
    console.log('✅ Trigger dropped');

    // 4. Create the new function with a unique name first
    console.log('\n4. Creating new function with unique name...');
    
    const uniqueFunctionSQL = `
      CREATE FUNCTION handle_new_user_v2()
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
      $$
    `;
    
    await exec_sql(uniqueFunctionSQL);
    console.log('✅ New function created with unique name');

    // 5. Create trigger with new function
    console.log('\n5. Creating trigger with new function...');
    
    await exec_sql(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user_v2()
    `);
    
    console.log('✅ Trigger created with new function');

    // 6. Grant permissions
    await exec_sql(`GRANT EXECUTE ON FUNCTION handle_new_user_v2() TO authenticated, anon, service_role`);
    console.log('✅ Permissions granted');

    // 7. Verify the new function
    console.log('\n7. Verifying new function...');
    
    const newFunction = await exec_sql(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'handle_new_user_v2'
    `);
    
    console.log('📊 New function definition:');
    if (newFunction && newFunction.length > 0) {
      console.log(newFunction[0].definition);
      
      const hasMetadata = newFunction[0].definition.includes('raw_user_meta_data');
      console.log(`\n✅ Contains metadata extraction: ${hasMetadata}`);
    }

    // 8. Test with real user
    console.log('\n8. Testing with real user...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: {
        name: 'Test User V2',
        phone: '+1234567890',
        company_name: 'Test Company V2',
        role: 'manager',
        department: 'Engineering',
        position: 'Senior Developer'
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
    const profile = await exec_sql(`
      SELECT name, phone, company_name, role, department, position
      FROM profiles 
      WHERE id = '${authData.user.id}'
    `);

    console.log('📊 Profile created by new trigger:');
    if (profile && profile.length > 0) {
      console.log('✅ Profile:', profile[0]);
      
      const hasData = profile[0].name && profile[0].name !== '';
      console.log(`\n🎉 Metadata extracted successfully: ${hasData}`);
      
      if (hasData) {
        console.log('🎉 SUCCESS! The trigger is now working correctly!');
      }
    } else {
      console.log('❌ No profile found');
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Error in aggressive function fix:', error);
    throw error;
  }

  console.log('\n🎉 Aggressive function fix completed!');
}

aggressiveFunctionFix();