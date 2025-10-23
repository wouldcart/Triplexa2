-- Migration: Add authenticate_managed_agent RPC for agent login
-- Creates a secure RPC that validates agent credentials against public.agent_credentials
-- and returns basic agent info when the agent is active.

-- Ensure pgcrypto is available for password verification
create extension if not exists pgcrypto;

-- RPC: authenticate_managed_agent
-- Params: p_username (text), p_password (text)
-- Returns: jsonb { ok: boolean, agent?: { id, name, email, role }, error?: text }
create or replace function public.authenticate_managed_agent(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(trim(p_username));
  v_agent_id uuid;
  v_password_hash text;
  v_is_temporary boolean;
  v_status text;
  v_name text;
  v_email text;
  v_role text;
begin
  -- Lookup credentials by normalized username
  select c.agent_id, c.password_hash, c.is_temporary
    into v_agent_id, v_password_hash, v_is_temporary
  from public.agent_credentials c
  join public.profiles p on p.id = c.agent_id
  where c.username = v_username
     or lower(p.email) = v_username
  limit 1;

  if v_agent_id is null then
    return jsonb_build_object('ok', false, 'error', 'Credentials not found');
  end if;

  -- Verify password using pgcrypto
  if crypt(p_password, v_password_hash) <> v_password_hash then
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
      'email', coalesce(v_email, v_username),
      'role', coalesce(v_role, 'agent')
    )
  );
end;
$$;

-- Allow unauthenticated and authenticated clients to execute during login
grant execute on function public.authenticate_managed_agent(text, text) to authenticated;
grant execute on function public.authenticate_managed_agent(text, text) to anon;