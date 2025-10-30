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

async function directSupabaseFix() {
  console.log('🔧 Direct Supabase fix...');

  try {
    // 1. Use Supabase's direct SQL execution
    console.log('\n1. Using Supabase direct SQL execution...');
    
    // First, let's check what we can access
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name');
    
    if (schemaError) {
      console.log('❌ Cannot access information_schema:', schemaError);
    } else {
      console.log('📊 Available schemas:', schemas?.map(s => s.schema_name));
    }

    // 2. Try using the REST API directly for function creation
    console.log('\n2. Trying REST API approach...');
    
    const functionSQL = `
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
      $$;
    `;

    // Try using fetch directly to the PostgREST endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: functionSQL })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Function created via REST API');
      console.log('📊 Result:', result);
    } else {
      console.log('❌ REST API error:', result);
    }

    // 3. Test the function by creating a user
    console.log('\n3. Testing the function...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      user_metadata: {
        name: 'REST API Test User',
        phone: '+1234567890',
        company_name: 'REST API Company',
        role: 'api_tester',
        department: 'QA',
        position: 'Test Engineer'
      }
    });

    if (authError) {
      console.error('❌ Error creating test user:', authError);
      return;
    }

    console.log('✅ Test user created:', authData.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check profile using direct query
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('name, phone, company_name, role, department, position')
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    } else {
      console.log('📊 Profile created by trigger:');
      if (profiles && profiles.length > 0) {
        console.log('✅ Profile:', profiles[0]);
        
        const hasData = profiles[0].name && profiles[0].name !== '';
        console.log(`\n🎉 Metadata extracted: ${hasData}`);
        
        if (hasData) {
          console.log('🎉 SUCCESS! The trigger is working with metadata extraction!');
        } else {
          console.log('❌ Metadata extraction still not working');
        }
      } else {
        console.log('❌ No profile found');
      }
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user deleted');

    // 4. If that didn't work, try updating the get_or_create function instead
    console.log('\n4. Updating get_or_create_profile_for_current_user function...');
    
    const getOrCreateSQL = `
      CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
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
      $$;
    `;

    const getOrCreateResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: getOrCreateSQL })
    });

    const getOrCreateResult = await getOrCreateResponse.json();
    
    if (getOrCreateResponse.ok) {
      console.log('✅ get_or_create function updated via REST API');
    } else {
      console.log('❌ get_or_create REST API error:', getOrCreateResult);
    }

  } catch (error) {
    console.error('❌ Error in direct Supabase fix:', error);
    throw error;
  }

  console.log('\n🎉 Direct Supabase fix completed!');
}

directSupabaseFix();