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

async function directSqlTest() {
  console.log('🧪 Direct SQL test...');

  try {
    // 1. Create a test user
    console.log('\n1. Creating test user...');
    
    const testMetadata = {
      name: 'Direct Test User',
      phone: '+1234567890',
      company_name: 'Direct Corp',
      role: 'Manager',
      department: 'Engineering',
      position: 'Senior Manager'
    };

    const { data: testUser, error: testUserError } = await supabase.auth.admin.createUser({
      email: `direct-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: testMetadata
    });

    if (testUserError) {
      console.error('❌ Error creating test user:', testUserError);
      return;
    }

    console.log('✅ Test user created:', testUser.user.id);

    // 2. Wait a bit for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Check what's in auth.users
    console.log('\n2. Checking auth.users...');
    
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    if (authError) {
      console.log('⚠️ Cannot access auth.users via Supabase client:', authError.message);
      
      // Try with direct SQL
      console.log('🔍 Trying direct SQL access...');
      
      const { data: directAuthUser, error: directAuthError } = await supabase.rpc('exec_sql', {
        sql: `SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = '${testUser.user.id}';`
      });

      if (directAuthError) {
        console.error('❌ Direct SQL error:', directAuthError);
      } else {
        console.log('✅ Direct SQL result:', directAuthUser);
      }
    } else {
      console.log('✅ Auth user:', authUser);
    }

    // 4. Check what's in profiles
    console.log('\n3. Checking profiles...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Profile:', {
        name: profile.name,
        phone: profile.phone,
        company_name: profile.company_name,
        role: profile.role,
        department: profile.department,
        position: profile.position
      });
    }

    // 5. Try manual profile creation with direct SQL
    console.log('\n4. Testing manual profile creation...');
    
    // Delete existing profile first
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUser.user.id);

    console.log('✅ Deleted existing profile');

    // Create profile manually with SQL
    const { data: manualProfile, error: manualError } = await supabase.rpc('exec_sql', {
      sql: `
        WITH user_data AS (
          SELECT 
            id,
            raw_user_meta_data->>'name' as name,
            raw_user_meta_data->>'phone' as phone,
            raw_user_meta_data->>'company_name' as company_name,
            raw_user_meta_data->>'role' as role,
            raw_user_meta_data->>'department' as department,
            raw_user_meta_data->>'position' as position
          FROM auth.users 
          WHERE id = '${testUser.user.id}'
        )
        INSERT INTO profiles (id, name, phone, company_name, role, department, position, created_at, updated_at)
        SELECT id, name, phone, company_name, role, department, position, now(), now()
        FROM user_data
        RETURNING *;
      `
    });

    if (manualError) {
      console.error('❌ Manual profile creation error:', manualError);
    } else {
      console.log('✅ Manual profile creation result:', manualProfile);
    }

    // 6. Check the manually created profile
    const { data: finalProfile, error: finalProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    if (finalProfileError) {
      console.error('❌ Final profile error:', finalProfileError);
    } else {
      console.log('✅ Final profile:', {
        name: finalProfile.name,
        phone: finalProfile.phone,
        company_name: finalProfile.company_name,
        role: finalProfile.role,
        department: finalProfile.department,
        position: finalProfile.position
      });
      
      // Check if extraction worked
      const allFieldsExtracted = 
        finalProfile.name === testMetadata.name &&
        finalProfile.phone === testMetadata.phone &&
        finalProfile.company_name === testMetadata.company_name &&
        finalProfile.role === testMetadata.role &&
        finalProfile.department === testMetadata.department &&
        finalProfile.position === testMetadata.position;
      
      if (allFieldsExtracted) {
        console.log('🎉 MANUAL EXTRACTION SUCCESSFUL!');
      } else {
        console.log('⚠️ Manual extraction partially failed');
      }
    }

    // 7. Clean up
    try {
      await supabase.auth.admin.deleteUser(testUser.user.id);
      console.log('\n✅ Test user deleted');
    } catch (error) {
      console.log('\n⚠️ Could not delete test user:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

directSqlTest();