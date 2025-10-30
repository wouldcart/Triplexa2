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

async function directFunctionReplace() {
  console.log('🔧 Direct function replacement...');

  try {
    // 1. Check current function
    console.log('\n1. Checking current function...');
    
    const currentFunction = await exec_sql(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    
    console.log('📊 Current function:');
    if (currentFunction && currentFunction.length > 0) {
      console.log(currentFunction[0].definition);
    } else {
      console.log('❌ No function found');
    }

    // 2. Use CREATE OR REPLACE with explicit signature
    console.log('\n2. Using CREATE OR REPLACE with explicit signature...');
    
    const replaceSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
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
    
    await exec_sql(replaceSQL);
    console.log('✅ Function replaced');

    // 3. Verify the replacement
    console.log('\n3. Verifying replacement...');
    
    const newFunction = await exec_sql(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    
    console.log('📊 New function definition:');
    if (newFunction && newFunction.length > 0) {
      console.log(newFunction[0].definition);
      
      // Check if it contains metadata extraction
      const hasMetadata = newFunction[0].definition.includes('raw_user_meta_data');
      console.log(`\n✅ Contains metadata extraction: ${hasMetadata}`);
    } else {
      console.log('❌ No function found after replacement');
    }

    // 4. Test with a real user
    console.log('\n4. Testing with real user...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: {
        name: 'Test User',
        phone: '+1234567890',
        company_name: 'Test Company',
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

    // Wait a moment for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check profile
    const profile = await exec_sql(`
      SELECT name, phone, company_name, role, department, position
      FROM profiles 
      WHERE id = '${authData.user.id}'
    `);

    console.log('📊 Profile created by trigger:');
    if (profile && profile.length > 0) {
      console.log('✅ Profile:', profile[0]);
      
      const hasData = profile[0].name && profile[0].name !== '';
      console.log(`\n✅ Metadata extracted successfully: ${hasData}`);
    } else {
      console.log('❌ No profile found');
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Error in direct function replacement:', error);
    throw error;
  }

  console.log('\n🎉 Direct function replacement completed!');
}

directFunctionReplace();