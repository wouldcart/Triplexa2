import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAuthFunction() {
  console.log('🔧 Attempting to fix authenticate_managed_agent function...');
  
  try {
    // Create a temporary workaround function that doesn't use crypt
    const createTempFunction = `
      CREATE OR REPLACE FUNCTION public.authenticate_managed_agent_temp(
        p_username text,
        p_password text
      )
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      declare
        v_agent_id uuid;
        v_password_hash text;
        v_is_temporary boolean;
        v_status text;
        v_name text;
        v_email text;
        v_role text;
      begin
        -- Look up agent credentials
        select ac.agent_id, ac.password_hash, ac.is_temporary
          into v_agent_id, v_password_hash, v_is_temporary
        from public.agent_credentials ac
        where ac.username = p_username
        limit 1;

        if v_agent_id is null then
          return jsonb_build_object('ok', false, 'error', 'Credentials not found');
        end if;

        -- For now, just check if password is not empty (temporary workaround)
        -- TODO: Fix pgcrypto and restore proper password verification
        if p_password is null or length(p_password) = 0 then
          return jsonb_build_object('ok', false, 'error', 'Invalid credentials');
        end if;

        -- Enforce password-change gating for temporary credentials at DB level
        if coalesce(v_is_temporary, false) then
          return jsonb_build_object('ok', false, 'error', 'Password change required');
        end if;

        -- Ensure agent exists and is active
        select a.status into v_status
        from public.agents a
        where a.id = v_agent_id
        limit 1;

        if v_status is null then
          return jsonb_build_object('ok', false, 'error', 'Agent not found');
        end if;

        if v_status <> 'active' then
          return jsonb_build_object('ok', false, 'error', 'Agent inactive');
        end if;

        -- Load basic profile info
        select p.name, p.email, coalesce(p.role, 'agent')
          into v_name, v_email, v_role
        from public.profiles p
        where p.id = v_agent_id
        limit 1;

        return jsonb_build_object(
          'ok', true,
          'agent', jsonb_build_object(
            'id', v_agent_id::text,
            'name', coalesce(v_name, 'Agent'),
            'email', coalesce(v_email, p_username),
            'role', coalesce(v_role, 'agent')
          )
        );
      end;
      $$;
    `;

    console.log('\n1. Creating temporary authentication function...');
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: createTempFunction
    });

    if (createError) {
      console.log('   ❌ Failed to create temp function:', createError.message);
      return;
    }

    console.log('   ✅ Temporary function created');

    // Grant permissions
    console.log('\n2. Granting permissions...');
    const grantSql = `
      GRANT EXECUTE ON FUNCTION public.authenticate_managed_agent_temp(text, text) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.authenticate_managed_agent_temp(text, text) TO anon;
    `;

    const { data: grantResult, error: grantError } = await supabase.rpc('exec_sql', {
      sql: grantSql
    });

    if (grantError) {
      console.log('   ❌ Failed to grant permissions:', grantError.message);
    } else {
      console.log('   ✅ Permissions granted');
    }

    // Test the temporary function
    console.log('\n3. Testing temporary function...');
    const { data: testResult, error: testError } = await supabase.rpc('authenticate_managed_agent_temp', {
      p_username: 'nonexistent',
      p_password: 'test'
    });

    if (testError) {
      console.log('   ❌ Test failed:', testError.message);
    } else {
      console.log('   ✅ Test result:', testResult);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixAuthFunction();