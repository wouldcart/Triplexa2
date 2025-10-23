-- Fix pgcrypto issue in authenticate_managed_agent function
-- This migration recreates the function with proper pgcrypto handling

-- First, ensure pgcrypto extension is properly installed
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION pgcrypto WITH SCHEMA public;

-- Recreate the authenticate_managed_agent function with explicit schema references
CREATE OR REPLACE FUNCTION public.authenticate_managed_agent(
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

  -- Verify password using pgcrypto with explicit schema reference
  if public.crypt(p_password, v_password_hash) <> v_password_hash then
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

-- Also recreate set_agent_credentials with explicit schema reference
CREATE OR REPLACE FUNCTION public.set_agent_credentials(
  p_agent_id uuid,
  p_username text,
  p_password text,
  p_is_temporary boolean default true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_salt text;
  v_password_hash text;
begin
  -- Generate salt and hash password using pgcrypto with explicit schema
  v_salt := public.gen_salt('bf');
  v_password_hash := public.crypt(p_password, v_salt);
  
  -- Insert or update credentials
  insert into public.agent_credentials (agent_id, username, password_hash, is_temporary)
  values (p_agent_id, p_username, v_password_hash, p_is_temporary)
  on conflict (agent_id) do update set
    username = excluded.username,
    password_hash = excluded.password_hash,
    is_temporary = excluded.is_temporary,
    updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.authenticate_managed_agent(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_managed_agent(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.set_agent_credentials(uuid, text, text, boolean) TO authenticated;

-- Test that pgcrypto functions work
DO $$
BEGIN
  -- Test gen_salt function with explicit schema
  PERFORM public.gen_salt('bf');
  
  -- Test crypt function with explicit schema
  PERFORM public.crypt('test', public.gen_salt('bf'));
  
  RAISE NOTICE 'pgcrypto extension is working correctly with explicit schema references';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'pgcrypto extension test failed: %', SQLERRM;
END;
$$;