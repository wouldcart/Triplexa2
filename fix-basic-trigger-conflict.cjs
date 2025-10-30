const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Fixing basic trigger conflict to extract metadata correctly...\n');

async function fixBasicTriggerConflict() {
  try {
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📋 Step 1: Dropping the basic trigger that creates minimal profiles...');
    
    // Drop the existing basic trigger
    const { error: dropTriggerError } = await adminSupabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;'
    });

    if (dropTriggerError) {
      console.error('❌ Failed to drop trigger:', dropTriggerError);
      return;
    }

    // Drop the basic function
    const { error: dropFunctionError } = await adminSupabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS public.handle_new_user();'
    });

    if (dropFunctionError) {
      console.error('❌ Failed to drop function:', dropFunctionError);
      return;
    }

    console.log('✅ Basic trigger and function dropped');

    console.log('\n📋 Step 2: Creating enhanced trigger function that extracts metadata...');
    
    const enhancedFunctionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, auth
      AS $$
      BEGIN
        -- Insert profile with metadata extraction
        INSERT INTO public.profiles (
          id,
          email,
          name,
          role,
          department,
          phone,
          position,
          employee_id,
          company_name,
          avatar,
          preferred_language,
          country,
          city,
          must_change_password,
          status,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
          COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
          NEW.raw_user_meta_data->>'department',
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'position',
          NEW.raw_user_meta_data->>'employee_id',
          NEW.raw_user_meta_data->>'company_name',
          NEW.raw_user_meta_data->>'avatar',
          NEW.raw_user_meta_data->>'preferred_language',
          NEW.raw_user_meta_data->>'country',
          NEW.raw_user_meta_data->>'city',
          COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
          COALESCE(NEW.raw_user_meta_data->>'status', 'active'),
          NOW(),
          NOW()
        );
        
        RETURN NEW;
      END;
      $$;
    `;

    const { error: createFunctionError } = await adminSupabase.rpc('exec_sql', {
      sql: enhancedFunctionSql
    });

    if (createFunctionError) {
      console.error('❌ Failed to create enhanced function:', createFunctionError);
      return;
    }

    console.log('✅ Enhanced trigger function created');

    console.log('\n📋 Step 3: Creating the enhanced trigger...');
    
    const triggerSql = `
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: createTriggerError } = await adminSupabase.rpc('exec_sql', {
      sql: triggerSql
    });

    if (createTriggerError) {
      console.error('❌ Failed to create trigger:', createTriggerError);
      return;
    }

    console.log('✅ Enhanced trigger created');

    console.log('\n📋 Step 4: Testing the enhanced trigger...');
    
    // Create a test user with metadata
    const testEmail = `enhanced-trigger-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testMetadata = {
      name: 'Enhanced Trigger User',
      role: 'manager',
      department: 'Engineering',
      phone: '+1234567890',
      position: 'Senior Developer',
      employee_id: 'ENH001',
      company_name: 'Enhanced Test Company',
      city: 'San Francisco',
      country: 'United States'
    };

    console.log('Creating test user with metadata:', JSON.stringify(testMetadata, null, 2));

    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: testMetadata
    });

    if (userError) {
      console.error('❌ Failed to create test user:', userError);
      return;
    }

    console.log('✅ Test user created with ID:', userData.user.id);

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check the created profile
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Failed to fetch profile:', profileError);
    } else {
      console.log('✅ Profile created by enhanced trigger:', JSON.stringify(profileData, null, 2));
      
      // Check if metadata was extracted correctly
      const metadataExtracted = 
        profileData.name === testMetadata.name &&
        profileData.phone === testMetadata.phone &&
        profileData.company_name === testMetadata.company_name;

      if (metadataExtracted) {
        console.log('🎉 SUCCESS: Metadata extraction working correctly!');
      } else {
        console.log('❌ FAILED: Metadata extraction incomplete');
        console.log(`Expected name: ${testMetadata.name}, Got: ${profileData.name}`);
        console.log(`Expected phone: ${testMetadata.phone}, Got: ${profileData.phone}`);
        console.log(`Expected company: ${testMetadata.company_name}, Got: ${profileData.company_name}`);
      }
    }

    console.log('\n📋 Step 5: Cleaning up test user...');
    
    // Clean up the test user
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userData.user.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete test user:', deleteError);
    } else {
      console.log('✅ Test user cleaned up');
    }

    console.log('\n🎉 Enhanced trigger fix completed successfully!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

fixBasicTriggerConflict();