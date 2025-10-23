-- Migration: Add approve_agent RPC to enforce admin approval and profile completeness
-- Ensures only admins can approve and that the agent profile has required fields

create or replace function public.approve_agent(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_name text;
  v_email text;
  v_phone text;
  v_company text;
begin
  -- Require authenticated context
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Unauthorized');
  end if;

  -- Ensure caller is admin or super_admin
  select get_current_user_role() into v_role;
  if v_role not in ('admin', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Permission denied: admin role required');
  end if;

  -- Validate profile completeness (name, email, phone, company)
  select p.name, p.email, p.phone, p.company_name
    into v_name, v_email, v_phone, v_company
  from public.profiles p
  where p.id = p_id
  limit 1;

  if v_name is null or v_email is null then
    return jsonb_build_object('ok', false, 'error', 'Profile incomplete: name and email required');
  end if;

  if v_phone is null or v_company is null then
    return jsonb_build_object('ok', false, 'error', 'Profile incomplete: phone and company required');
  end if;

  -- Approve agent
  update public.agents
  set status = 'active', updated_at = now()
  where id = p_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Agent not found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.approve_agent(uuid) to authenticated;