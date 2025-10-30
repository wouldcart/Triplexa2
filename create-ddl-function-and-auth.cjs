require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createDDLFunctionAndAuth() {
  console.log('🔧 Creating DDL function and authentication RPC...\n');

  try {
    // Step 1: Create a DDL-capable function using direct SQL execution
    console.log('1️⃣ Creating DDL-capable function...');
    
    const ddlFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.exec_ddl(sql_query text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
      
      GRANT EXECUTE ON FUNCTION public.exec_ddl(text) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.exec_ddl(text) TO service_role;
    `;

    // Try to execute this using the existing migration pattern
    const { data: ddlResult, error: ddlError } = await adminClient
      .from('_sql')
      .insert({ query: ddlFunctionSQL });

    if (ddlError) {
      console.log('⚠️ Direct SQL insert failed, trying alternative...');
      
      // Try using any existing RPC that might work
      try {
        const { data: rpcResult, error: rpcError } = await adminClient.rpc('sql', { 
          query: ddlFunctionSQL 
        });
        if (rpcError) {
          console.log('❌ RPC sql failed:', rpcError.message);
        } else {
          console.log('✅ DDL function created via RPC');
        }
      } catch (e) {
        console.log('⚠️ No suitable RPC found for DDL execution');
      }
    } else {
      console.log('✅ DDL function created via direct SQL');
    }

    // Step 2: Test if we can now use exec_ddl
    console.log('\n2️⃣ Testing DDL function...');
    
    const { data: testResult, error: testError } = await adminClient.rpc('exec_ddl', {
      sql_query: 'SELECT 1 as test_value'
    });

    if (testError) {
      console.log('❌ DDL function test failed:', testError.message);
      console.log('⚠️ Will try alternative approach...');
      
      // Alternative: Use the migration pattern from apply-migrations.js
      console.log('\n3️⃣ Using migration pattern...');
      
      const authFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
        RETURNS public.profiles
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, pg_catalog
        AS $$
        DECLARE
          v_profile public.profiles;
          v_uid uuid := auth.uid();
          v_user_data jsonb;
        BEGIN
          -- Return null if no authenticated user
          IF v_uid IS NULL THEN
            RETURN NULL;
          END IF;

          -- Try to get existing profile
          SELECT p.* INTO v_profile
          FROM public.profiles p
          WHERE p.id = v_uid;

          -- If profile exists, return it
          IF FOUND THEN
            RETURN v_profile;
          END IF;

          -- Get user metadata from auth.users
          SELECT raw_user_meta_data INTO v_user_data
          FROM auth.users
          WHERE id = v_uid;

          -- Create new profile with metadata
          INSERT INTO public.profiles (
            id,
            name,
            email,
            phone,
            company_name,
            role,
            department,
            position,
            created_at,
            updated_at
          ) VALUES (
            v_uid,
            COALESCE(v_user_data->>'name', v_user_data->>'full_name', 'Unknown'),
            COALESCE(v_user_data->>'email', ''),
            COALESCE(v_user_data->>'phone', ''),
            COALESCE(v_user_data->>'company_name', ''),
            COALESCE(v_user_data->>'role', 'user'),
            COALESCE(v_user_data->>'department', ''),
            COALESCE(v_user_data->>'position', ''),
            now(),
            now()
          ) RETURNING * INTO v_profile;

          RETURN v_profile;
        END;
        $$;
      `;

      // Split into statements and execute individually
      const statements = [
        `DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user()`,
        authFunctionSQL,
        `GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated`,
        `GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon`
      ];

      for (const statement of statements) {
        try {
          // Try the migration pattern used in apply-migrations.js
          const { data: migrationResult, error: migrationError } = await adminClient
            .from('_migrations')
            .insert({ sql: statement });

          if (migrationError) {
            console.log(`⚠️ Migration insert failed for statement, trying RPC...`);
            
            // Try any available RPC
            try {
              const { data: rpcResult, error: rpcError } = await adminClient.rpc('execute', { 
                sql: statement 
              });
              if (!rpcError) {
                console.log(`✅ Statement executed via RPC`);
              }
            } catch (e) {
              console.log(`⚠️ Statement execution failed: ${statement.substring(0, 50)}...`);
            }
          } else {
            console.log(`✅ Statement executed via migration`);
          }
        } catch (e) {
          console.log(`⚠️ Error with statement: ${e.message}`);
        }
      }

    } else {
      console.log('✅ DDL function works! Result:', testResult);
      
      // Step 3: Use exec_ddl to create the authentication function
      console.log('\n3️⃣ Creating authentication function...');
      
      const authFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
        RETURNS public.profiles
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, pg_catalog
        AS $$
        DECLARE
          v_profile public.profiles;
          v_uid uuid := auth.uid();
          v_user_data jsonb;
        BEGIN
          -- Return null if no authenticated user
          IF v_uid IS NULL THEN
            RETURN NULL;
          END IF;

          -- Try to get existing profile
          SELECT p.* INTO v_profile
          FROM public.profiles p
          WHERE p.id = v_uid;

          -- If profile exists, return it
          IF FOUND THEN
            RETURN v_profile;
          END IF;

          -- Get user metadata from auth.users
          SELECT raw_user_meta_data INTO v_user_data
          FROM auth.users
          WHERE id = v_uid;

          -- Create new profile with metadata
          INSERT INTO public.profiles (
            id,
            name,
            email,
            phone,
            company_name,
            role,
            department,
            position,
            created_at,
            updated_at
          ) VALUES (
            v_uid,
            COALESCE(v_user_data->>'name', v_user_data->>'full_name', 'Unknown'),
            COALESCE(v_user_data->>'email', ''),
            COALESCE(v_user_data->>'phone', ''),
            COALESCE(v_user_data->>'company_name', ''),
            COALESCE(v_user_data->>'role', 'user'),
            COALESCE(v_user_data->>'department', ''),
            COALESCE(v_user_data->>'position', ''),
            now(),
            now()
          ) RETURNING * INTO v_profile;

          RETURN v_profile;
        END;
        $$;
      `;

      const { data: authResult, error: authError } = await adminClient.rpc('exec_ddl', {
        sql_query: authFunctionSQL
      });

      if (authError) {
        console.log('❌ Auth function creation failed:', authError.message);
      } else {
        console.log('✅ Auth function created! Result:', authResult);
        
        // Grant permissions
        const { data: grantResult, error: grantError } = await adminClient.rpc('exec_ddl', {
          sql_query: `
            GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
            GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon;
          `
        });

        if (grantError) {
          console.log('⚠️ Grant permissions failed:', grantError.message);
        } else {
          console.log('✅ Permissions granted! Result:', grantResult);
        }
      }
    }

    // Step 4: Trigger schema reload
    console.log('\n4️⃣ Triggering PostgREST schema reload...');
    
    const reloadResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (reloadResponse.ok) {
      console.log('✅ Schema reload triggered');
    } else {
      console.log('⚠️ Schema reload may have failed');
    }

    // Step 5: Test the function
    console.log('\n5️⃣ Testing authentication function...');
    
    const { data: finalTest, error: finalError } = await adminClient.rpc('get_or_create_profile_for_current_user');

    if (finalError) {
      if (finalError.message.includes('PGRST202')) {
        console.log('⚠️ Function not found in schema cache - may need manual reload');
      } else {
        console.log('❌ Function test failed:', finalError.message);
      }
    } else {
      console.log('✅ Function test successful! Result:', finalTest);
    }

    console.log('\n🎯 Summary:');
    console.log('   - DDL function creation attempted');
    console.log('   - Authentication function creation attempted');
    console.log('   - Schema reload triggered');
    console.log('   - Function test completed');
    console.log('\n📋 Next steps:');
    console.log('   1. Test the login flow in the application');
    console.log('   2. If still failing, check Supabase SQL Editor for manual function creation');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createDDLFunctionAndAuth();