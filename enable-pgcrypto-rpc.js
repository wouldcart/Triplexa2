import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function enablePgcryptoViaRPC() {
  console.log('🔧 Attempting to enable pgcrypto via RPC...');
  
  try {
    // Try to create a simple RPC that enables pgcrypto
    console.log('\n1. Creating enable_pgcrypto RPC function...');
    
    // We'll create this function by modifying an existing migration or creating a new one
    // But first, let's try to see if we can use the Supabase REST API directly
    
    const enablePgcryptoSQL = `
      CREATE OR REPLACE FUNCTION public.enable_pgcrypto()
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        RETURN 'pgcrypto extension enabled';
      END;
      $$;
    `;

    // Try to use the REST API to execute SQL
    console.log('   Attempting to create function via REST API...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        sql_query: enablePgcryptoSQL
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Function created via REST API:', result);
      
      // Now call the function
      console.log('\n2. Calling enable_pgcrypto function...');
      const { data: enableData, error: enableError } = await adminSupabase
        .rpc('enable_pgcrypto');
      
      if (enableError) {
        console.log('   ❌ enable_pgcrypto failed:', enableError.message);
      } else {
        console.log('   ✅ enable_pgcrypto result:', enableData);
      }
    } else {
      console.log('   ⚠️  REST API failed:', response.status, response.statusText);
      
      // Alternative approach: Try to manually recreate the authenticate function
      console.log('\n2. Alternative: Recreating authenticate function with explicit pgcrypto...');
      
      const recreateAuthSQL = `
        CREATE OR REPLACE FUNCTION public.authenticate_managed_agent(
          p_username text,
          p_password text
        )
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          v_agent_id uuid;
          v_password_hash text;
          v_is_temporary boolean;
          v_agent_record record;
        BEGIN
          -- Enable pgcrypto extension
          CREATE EXTENSION IF NOT EXISTS pgcrypto;
          
          -- Look up agent credentials
          SELECT agent_id, password_hash, is_temporary
          INTO v_agent_id, v_password_hash, v_is_temporary
          FROM agent_credentials
          WHERE username = p_username;
          
          -- Check if credentials exist
          IF v_agent_id IS NULL THEN
            RETURN jsonb_build_object('ok', false, 'error', 'Credentials not found');
          END IF;
          
          -- Verify password using crypt
          IF crypt(p_password, v_password_hash) != v_password_hash THEN
            RETURN jsonb_build_object('ok', false, 'error', 'Invalid password');
          END IF;
          
          -- Check if password is temporary
          IF v_is_temporary THEN
            RETURN jsonb_build_object('ok', false, 'error', 'Password change required');
          END IF;
          
          -- Get agent details
          SELECT a.id, p.name, p.email, p.role, a.status
          INTO v_agent_record
          FROM agents a
          JOIN profiles p ON a.id = p.id
          WHERE a.id = v_agent_id;
          
          -- Check if agent is active
          IF v_agent_record.status != 'active' THEN
            RETURN jsonb_build_object('ok', false, 'error', 'Agent account is not active');
          END IF;
          
          -- Return success with agent info
          RETURN jsonb_build_object(
            'ok', true,
            'agent', jsonb_build_object(
              'id', v_agent_record.id,
              'name', v_agent_record.name,
              'email', v_agent_record.email,
              'role', v_agent_record.role
            )
          );
        END;
        $$;
      `;
      
      // We can't execute this directly, so let's try a different approach
      console.log('   Cannot execute SQL directly. Checking current function definition...');
    }

    // Test 3: Check if pgcrypto functions are available now
    console.log('\n3. Testing pgcrypto functions availability...');
    
    // Try to call a simple test
    const { data: testData, error: testError } = await adminSupabase
      .rpc('authenticate_managed_agent', {
        p_username: 'test_nonexistent',
        p_password: 'test'
      });
    
    if (testError) {
      console.log('   ❌ Test failed:', testError.message);
      
      // If it's still the crypt error, we need to try a different approach
      if (testError.message.includes('crypt')) {
        console.log('\n4. pgcrypto still not available. Checking Supabase dashboard...');
        console.log('   Please check the Supabase dashboard Extensions tab to manually enable pgcrypto.');
        console.log('   URL: https://supabase.com/dashboard/project/[your-project-id]/database/extensions');
      }
    } else {
      console.log('   ✅ Test successful:', testData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
  
  return true;
}

enablePgcryptoViaRPC()
  .then(success => {
    if (success) {
      console.log('\n✅ pgcrypto enable attempt completed');
    } else {
      console.log('\n❌ pgcrypto enable attempt failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });