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

async function debugFunctionExecution() {
  console.log('🔍 Debugging function execution...');

  try {
    // 1. Create a debug function that logs everything
    console.log('\n1. Creating debug function...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION debug_metadata_extraction(user_id uuid)
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          user_metadata jsonb;
          result jsonb := '{}';
        BEGIN
          -- Try to get user metadata
          SELECT raw_user_meta_data INTO user_metadata
          FROM auth.users
          WHERE id = user_id;
          
          -- Build result
          result := jsonb_build_object(
            'user_id', user_id,
            'raw_metadata', user_metadata,
            'extracted_name', user_metadata->>'name',
            'extracted_phone', user_metadata->>'phone',
            'extracted_company', user_metadata->>'company_name',
            'extracted_role', user_metadata->>'role',
            'extracted_department', user_metadata->>'department',
            'extracted_position', user_metadata->>'position'
          );
          
          RETURN result;
        END;
        $$;
      `
    });
    console.log('✅ Debug function created');

    // 2. Grant permissions
    await supabase.rpc('exec_sql', {
      sql: `GRANT EXECUTE ON FUNCTION debug_metadata_extraction(uuid) TO authenticated, anon, service_role;`
    });
    console.log('✅ Permissions granted');

    // 3. Create test user
    console.log('\n3. Creating test user...');
    
    const testMetadata = {
      name: 'Debug Function User',
      phone: '+9999999999',
      company_name: 'Debug Function Corp',
      role: 'Debug Role',
      department: 'Debug Dept',
      position: 'Debug Position'
    };

    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: `debug-function-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: testMetadata
    });

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    console.log('✅ User created:', user.user.id);

    // 4. Test the debug function
    console.log('\n4. Testing debug function...');
    
    const { data: debugResult, error: debugError } = await supabase.rpc('debug_metadata_extraction', {
      user_id: user.user.id
    });

    if (debugError) {
      console.error('❌ Debug function error:', debugError);
    } else {
      console.log('📊 Debug function result:', debugResult);
    }

    // 5. Test direct SQL access
    console.log('\n5. Testing direct SQL access...');
    
    const { data: directResult, error: directError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          id,
          email,
          raw_user_meta_data,
          raw_user_meta_data->>'name' as name,
          raw_user_meta_data->>'phone' as phone,
          raw_user_meta_data->>'company_name' as company_name
        FROM auth.users 
        WHERE id = '${user.user.id}'
      `
    });

    if (directError) {
      console.error('❌ Direct SQL error:', directError);
    } else {
      console.log('📊 Direct SQL result:', directResult);
    }

    // 6. Test the actual update function with logging
    console.log('\n6. Creating update function with logging...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_profile_with_metadata_debug(user_id uuid)
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          user_metadata jsonb;
          profile_exists boolean;
          result jsonb := '{}';
        BEGIN
          -- Get user metadata
          SELECT raw_user_meta_data INTO user_metadata
          FROM auth.users
          WHERE id = user_id;
          
          result := result || jsonb_build_object('step1_metadata', user_metadata);
          
          -- Check if profile exists
          SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
          
          result := result || jsonb_build_object('step2_profile_exists', profile_exists);
          
          -- Insert or update profile
          IF profile_exists THEN
            UPDATE profiles SET
              name = COALESCE(user_metadata->>'name', name),
              phone = COALESCE(user_metadata->>'phone', phone),
              company_name = COALESCE(user_metadata->>'company_name', company_name),
              role = COALESCE(user_metadata->>'role', role),
              department = COALESCE(user_metadata->>'department', department),
              position = COALESCE(user_metadata->>'position', position),
              updated_at = now()
            WHERE id = user_id;
            
            result := result || jsonb_build_object('step3_action', 'updated');
          ELSE
            INSERT INTO profiles (
              id, name, phone, company_name, role, department, position,
              created_at, updated_at
            ) VALUES (
              user_id,
              user_metadata->>'name',
              user_metadata->>'phone',
              user_metadata->>'company_name',
              user_metadata->>'role',
              user_metadata->>'department',
              user_metadata->>'position',
              now(),
              now()
            );
            
            result := result || jsonb_build_object('step3_action', 'inserted');
          END IF;
          
          RETURN result;
        END;
        $$;
      `
    });
    console.log('✅ Debug update function created');

    // Grant permissions
    await supabase.rpc('exec_sql', {
      sql: `GRANT EXECUTE ON FUNCTION update_profile_with_metadata_debug(uuid) TO authenticated, anon, service_role;`
    });

    // 7. Test the debug update function
    console.log('\n7. Testing debug update function...');
    
    const { data: updateResult, error: updateError } = await supabase.rpc('update_profile_with_metadata_debug', {
      user_id: user.user.id
    });

    if (updateError) {
      console.error('❌ Debug update error:', updateError);
    } else {
      console.log('📊 Debug update result:', updateResult);
    }

    // 8. Check final profile
    console.log('\n8. Checking final profile...');
    
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    if (finalError) {
      console.error('❌ Final profile error:', finalError);
    } else {
      console.log('📊 Final profile:', {
        name: finalProfile.name,
        phone: finalProfile.phone,
        company_name: finalProfile.company_name,
        role: finalProfile.role,
        department: finalProfile.department,
        position: finalProfile.position
      });
    }

    // 9. Clean up
    console.log('\n9. Cleaning up...');
    try {
      await supabase.auth.admin.deleteUser(user.user.id);
      console.log('✅ User deleted');
    } catch (error) {
      console.log('⚠️ Could not delete user:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🎉 Function execution debugging completed!');
}

debugFunctionExecution();