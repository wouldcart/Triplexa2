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

async function debugTriggerFunction() {
  console.log('🔍 Debugging trigger function...');

  try {
    // 1. Check current trigger function definition
    console.log('\n1. Checking current trigger function definition...');
    
    const functionDef = await exec_sql(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    
    console.log('📊 Current function definition:');
    if (functionDef && functionDef.length > 0) {
      console.log(functionDef[0].definition);
    } else {
      console.log('❌ No function found');
    }

    // 2. Check trigger definition
    console.log('\n2. Checking trigger definition...');
    
    const triggerDef = await exec_sql(`
      SELECT tgname, tgtype, tgenabled, tgfoid::regproc as function_name
      FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    `);
    
    console.log('📊 Current trigger definition:', JSON.stringify(triggerDef, null, 2));

    // 3. Create a test trigger function with logging
    console.log('\n3. Creating test trigger function with logging...');
    
    const testTriggerSQL = `
      CREATE OR REPLACE FUNCTION handle_new_user_debug()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Log the raw metadata
        RAISE NOTICE 'NEW.id: %', NEW.id;
        RAISE NOTICE 'NEW.raw_user_meta_data: %', NEW.raw_user_meta_data;
        RAISE NOTICE 'Extracted name: %', NEW.raw_user_meta_data->>'name';
        RAISE NOTICE 'Extracted phone: %', NEW.raw_user_meta_data->>'phone';
        RAISE NOTICE 'Extracted company_name: %', NEW.raw_user_meta_data->>'company_name';
        
        -- Insert with explicit values for debugging
        INSERT INTO profiles (
          id, 
          name, 
          phone, 
          company_name, 
          role, 
          department, 
          position
        ) VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', 'DEFAULT_NAME'),
          COALESCE(NEW.raw_user_meta_data->>'phone', 'DEFAULT_PHONE'),
          COALESCE(NEW.raw_user_meta_data->>'company_name', 'DEFAULT_COMPANY'),
          COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
          COALESCE(NEW.raw_user_meta_data->>'department', 'DEFAULT_DEPT'),
          COALESCE(NEW.raw_user_meta_data->>'position', 'DEFAULT_POS')
        );
        
        RAISE NOTICE 'Profile inserted successfully';
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `;
    
    await exec_sql(testTriggerSQL);
    console.log('✅ Created debug trigger function');

    // 4. Replace the trigger to use debug function
    console.log('\n4. Replacing trigger with debug function...');
    
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
    await exec_sql(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user_debug()
    `);
    
    console.log('✅ Created debug trigger');

    // 5. Test with a user
    console.log('\n5. Testing with debug trigger...');
    
    const testMetadata = {
      name: 'Debug Trigger User',
      phone: '+1111111111',
      company_name: 'Debug Trigger Corp',
      role: 'Tester',
      department: 'QA',
      position: 'Senior Tester'
    };

    const { data: testUser, error: userError } = await supabase.auth.admin.createUser({
      email: `debug-trigger-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: testMetadata
    });

    if (userError) {
      console.error('❌ Error creating test user:', userError);
      return;
    }

    console.log('✅ Test user created:', testUser.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    console.log('\n📊 Profile created by debug trigger:');
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Debug profile:', {
        name: profile.name,
        phone: profile.phone,
        company_name: profile.company_name,
        role: profile.role,
        department: profile.department,
        position: profile.position
      });
      
      // Check if debug values are present
      if (profile.name === 'DEFAULT_NAME') {
        console.log('⚠️ Trigger function ran but metadata extraction failed (got default values)');
      } else if (profile.name === testMetadata.name) {
        console.log('🎉 METADATA EXTRACTION SUCCESSFUL!');
      } else {
        console.log('❓ Unexpected result');
      }
    }

    // 6. Clean up
    console.log('\n6. Cleaning up...');
    await supabase.auth.admin.deleteUser(testUser.user.id);
    console.log('✅ Test user deleted');

    // 7. Restore original trigger function
    console.log('\n7. Restoring original trigger function...');
    
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
    
    const originalTriggerSQL = `
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO profiles (
          id, 
          name, 
          phone, 
          company_name, 
          role, 
          department, 
          position
        ) VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
          COALESCE(NEW.raw_user_meta_data->>'department', ''),
          COALESCE(NEW.raw_user_meta_data->>'position', '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `;
    
    await exec_sql(originalTriggerSQL);
    
    await exec_sql(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user()
    `);
    
    console.log('✅ Restored original trigger function');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🎉 Trigger function debugging completed!');
}

debugTriggerFunction();