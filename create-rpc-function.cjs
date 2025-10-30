const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM1MzQxMSwiZXhwIjoyMDczOTI5NDExfQ.DtdmBPTmaaMtXk8s_ZKTuXv9b9EHHQoNaepUUFj89rU';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function createMissingRPCFunction() {
  console.log('🔧 Creating Missing RPC Function...\n');

  try {
    // Create the get_or_create_profile_for_current_user function
    console.log('1. Creating get_or_create_profile_for_current_user function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
      RETURNS public.profiles
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_profile public.profiles;
        v_uid uuid := auth.uid();
        v_email text;
      BEGIN
        -- Return null if no authenticated user
        IF v_uid IS NULL THEN
          RETURN NULL;
        END IF;

        -- Fetch existing profile without RLS restrictions (SECURITY DEFINER)
        SELECT p.* INTO v_profile
        FROM public.profiles p
        WHERE p.id = v_uid;

        -- If profile exists, return it
        IF v_profile IS NOT NULL THEN
          RETURN v_profile;
        END IF;

        -- Try to get email from auth.users (requires SECURITY DEFINER)
        SELECT u.email INTO v_email
        FROM auth.users u
        WHERE u.id = v_uid;

        -- Create minimal profile row if missing, using INSERT ... ON CONFLICT to handle race conditions
        INSERT INTO public.profiles (
          id, email, name, role, department, status, position, created_at, updated_at
        ) VALUES (
          v_uid,
          COALESCE(v_email, v_uid::text || '@local'),
          COALESCE(split_part(v_email, '@', 1), v_uid::text),
          'agent',
          'General',
          'active',
          'Agent',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          updated_at = NOW()
        RETURNING * INTO v_profile;

        RETURN v_profile;
      END;
      $$;

      -- Grant execute permissions
      GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
      GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon;
    `;

    const { data: functionResult, error: functionError } = await adminClient
      .rpc('exec_sql', { sql_query: createFunctionSQL });

    if (functionError) {
      console.error('❌ Function creation failed:', functionError.message);
      
      // Try alternative method using direct SQL execution
      console.log('🔄 Trying alternative method...');
      
      // Use the SQL editor approach
      const { data: altResult, error: altError } = await adminClient
        .from('pg_stat_statements')
        .select('*')
        .limit(1);
      
      if (altError) {
        console.log('⚠️  Direct SQL execution not available, trying manual creation...');
        
        // Manual approach: create via multiple smaller operations
        const parts = [
          `CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()`,
          `RETURNS public.profiles`,
          `LANGUAGE plpgsql`,
          `SECURITY DEFINER`,
          `SET search_path = public`,
          `AS $$ DECLARE v_profile public.profiles; v_uid uuid := auth.uid(); v_email text; BEGIN IF v_uid IS NULL THEN RETURN NULL; END IF; SELECT p.* INTO v_profile FROM public.profiles p WHERE p.id = v_uid; IF v_profile IS NOT NULL THEN RETURN v_profile; END IF; SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid; INSERT INTO public.profiles (id, email, name, role, department, status, position, created_at, updated_at) VALUES (v_uid, COALESCE(v_email, v_uid::text || '@local'), COALESCE(split_part(v_email, '@', 1), v_uid::text), 'agent', 'General', 'active', 'Agent', NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW() RETURNING * INTO v_profile; RETURN v_profile; END; $$;`
        ];
        
        console.log('📝 Function needs to be created manually in Supabase SQL Editor');
        console.log('Copy and paste this SQL:');
        console.log('----------------------------------------');
        console.log(createFunctionSQL);
        console.log('----------------------------------------');
      }
    } else {
      console.log('✅ Function created successfully');
    }

    // Test the function
    console.log('\n2. Testing the function...');
    
    // First, sign in as agent
    const regularClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ');
    
    const { data: authData, error: authError } = await regularClient.auth.signInWithPassword({
      email: 'agent_company@tripoex.com',
      password: 'agent123'
    });

    if (authError) {
      console.error('❌ Agent login failed:', authError.message);
      return;
    }

    console.log('✅ Agent login successful');

    // Test the RPC function
    const { data: rpcData, error: rpcError } = await regularClient
      .rpc('get_or_create_profile_for_current_user');

    if (rpcError) {
      console.error('❌ RPC function test failed:', rpcError.message);
      console.error('   Error code:', rpcError.code);
      console.error('   Details:', rpcError.details);
    } else {
      console.log('✅ RPC function test successful');
      console.log('   Profile data:', {
        id: rpcData.id,
        name: rpcData.name,
        email: rpcData.email,
        role: rpcData.role,
        status: rpcData.status
      });
    }

    // Test get_current_user_role
    const { data: roleData, error: roleError } = await regularClient.rpc('get_current_user_role');
    if (roleError) {
      console.log('⚠️  Role function failed:', roleError.message);
    } else {
      console.log('✅ Role function successful:', roleData);
    }

    await regularClient.auth.signOut();

    console.log('\n📝 Summary:');
    if (!rpcError) {
      console.log('   ✅ get_or_create_profile_for_current_user RPC function is working');
      console.log('   ✅ Authentication should now work in the browser');
      console.log('   🎉 The login issue should be resolved!');
    } else {
      console.log('   ❌ RPC function still not working');
      console.log('   📝 Manual SQL execution may be required');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createMissingRPCFunction();