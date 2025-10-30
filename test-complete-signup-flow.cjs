const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqjqfqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ1NzI2NCwiZXhwIjoyMDUzMDMzMjY0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exec_sql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  if (error) {
    console.error('SQL Error:', error);
    throw error;
  }
  return data;
}

async function testCompleteSignupFlow() {
  console.log('🧪 Testing complete signup flow with metadata extraction...');

  const testEmail = `test-signup-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  // Test metadata that should be extracted
  const testMetadata = {
    name: 'John Doe',
    phone: '+1234567890',
    company_name: 'Test Company Inc',
    role: 'manager',
    department: 'Sales',
    position: 'Sales Manager'
  };

  try {
    // 1. First, let's check what functions are currently in the database
    console.log('\n1. Checking current database functions...');
    
    const functions = await exec_sql(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname IN ('handle_new_user', 'get_or_create_profile_for_current_user')
      ORDER BY proname
    `);
    
    console.log('📊 Functions in database:', functions.length);
    functions.forEach(func => {
      console.log(`📊 Function: ${func.proname}`);
      console.log(`  - Uses raw_user_meta_data: ${func.prosrc.includes('raw_user_meta_data')}`);
      console.log(`  - Uses user_metadata: ${func.prosrc.includes('user_metadata')}`);
      console.log(`  - Has metadata extraction: ${func.prosrc.includes('name') && func.prosrc.includes('phone')}`);
    });

    // 2. Create a test user with metadata (simulating the signup form)
    console.log('\n2. Creating test user with metadata...');
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: testMetadata,  // This goes to user_metadata
      app_metadata: {
        provider: 'email',
        providers: ['email']
      }
    });

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    console.log('✅ User created:', userData.user.id);
    console.log('📊 User metadata:', userData.user.user_metadata);
    console.log('📊 Raw user meta data:', userData.user.raw_user_meta_data);

    // 3. Wait a moment for the trigger to execute
    console.log('\n3. Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Check if profile was created by the trigger
    console.log('\n4. Checking profile created by trigger...');
    
    const profileCheck = await exec_sql(`
      SELECT id, name, email, role, phone, company_name, department, position, status, created_at
      FROM profiles 
      WHERE id = '${userData.user.id}'
    `);
    
    if (profileCheck && profileCheck.length > 0) {
      const profile = profileCheck[0];
      console.log('✅ Profile found:', profile);
      console.log('📊 Metadata extraction results:');
      console.log(`  - Name: ${profile.name} (expected: ${testMetadata.name})`);
      console.log(`  - Phone: ${profile.phone} (expected: ${testMetadata.phone})`);
      console.log(`  - Company: ${profile.company_name} (expected: ${testMetadata.company_name})`);
      console.log(`  - Role: ${profile.role} (expected: ${testMetadata.role})`);
      console.log(`  - Department: ${profile.department} (expected: ${testMetadata.department})`);
      console.log(`  - Position: ${profile.position} (expected: ${testMetadata.position})`);
      
      // Check if metadata was extracted correctly
      const metadataWorking = 
        profile.name === testMetadata.name &&
        profile.phone === testMetadata.phone &&
        profile.company_name === testMetadata.company_name &&
        profile.role === testMetadata.role;
        
      if (metadataWorking) {
        console.log('🎉 Metadata extraction is WORKING!');
      } else {
        console.log('❌ Metadata extraction is NOT working properly');
      }
    } else {
      console.log('❌ No profile found - trigger may not be working');
    }

    // 5. Test the get_or_create function
    console.log('\n5. Testing get_or_create_profile_for_current_user function...');
    
    // Sign in as the test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Error signing in:', signInError);
    } else {
      console.log('✅ Signed in as test user');
      
      // Try to call the get_or_create function
      try {
        const { data: getOrCreateResult, error: getOrCreateError } = await supabase.rpc('get_or_create_profile_for_current_user');
        
        if (getOrCreateError) {
          console.error('❌ Error calling get_or_create function:', getOrCreateError);
        } else {
          console.log('✅ get_or_create function result:', getOrCreateResult);
        }
      } catch (error) {
        console.error('❌ Exception calling get_or_create function:', error);
      }
    }

    // 6. Also test creating a user with raw_user_meta_data
    console.log('\n6. Testing with raw_user_meta_data...');
    
    const testEmail2 = `test-raw-${Date.now()}@example.com`;
    
    // Create user with raw_user_meta_data instead
    const createUserSQL = `
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        '${testEmail2}',
        crypt('${testPassword}', gen_salt('bf')),
        NOW(),
        '${JSON.stringify(testMetadata)}'::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
      )
      RETURNING id, email, raw_user_meta_data
    `;
    
    try {
      const rawUserResult = await exec_sql(createUserSQL);
      console.log('✅ User with raw_user_meta_data created:', rawUserResult[0]);
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check profile
      const rawProfileCheck = await exec_sql(`
        SELECT id, name, email, role, phone, company_name, department, position
        FROM profiles 
        WHERE id = '${rawUserResult[0].id}'
      `);
      
      if (rawProfileCheck && rawProfileCheck.length > 0) {
        const rawProfile = rawProfileCheck[0];
        console.log('✅ Profile from raw_user_meta_data:', rawProfile);
        
        const rawMetadataWorking = 
          rawProfile.name === testMetadata.name &&
          rawProfile.phone === testMetadata.phone &&
          rawProfile.company_name === testMetadata.company_name &&
          rawProfile.role === testMetadata.role;
          
        if (rawMetadataWorking) {
          console.log('🎉 raw_user_meta_data extraction is WORKING!');
        } else {
          console.log('❌ raw_user_meta_data extraction is NOT working');
        }
      }
      
    } catch (error) {
      console.error('❌ Error testing raw_user_meta_data:', error);
    }

    // 7. Cleanup
    console.log('\n7. Cleaning up test users...');
    
    try {
      await supabase.auth.admin.deleteUser(userData.user.id);
      console.log('✅ Test user 1 deleted');
    } catch (error) {
      console.log('⚠️ Could not delete test user 1:', error.message);
    }

  } catch (error) {
    console.error('❌ Error in signup flow test:', error);
    throw error;
  }

  console.log('\n🎉 Complete signup flow test completed!');
}

testCompleteSignupFlow();