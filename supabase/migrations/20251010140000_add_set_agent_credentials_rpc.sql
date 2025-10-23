-- Ensure required extension for password hashing
create extension if not exists pgcrypto;

-- RPC: Set or update agent credentials with hashed password
create or replace function public.set_agent_credentials(
  p_id uuid,
  p_username text,
  p_password text,
  p_is_temporary boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Upsert credentials: hash password, lowercase username, set temporary flag
  insert into public.agent_credentials (agent_id, username, password_hash, is_temporary, created_at, updated_at)
  values (
    p_id,
    lower(p_username),
    crypt(p_password, gen_salt('bf')),
    coalesce(p_is_temporary, false),
    now(),
    now()
  )
  on conflict (agent_id) do update set
    username = excluded.username,
    password_hash = excluded.password_hash,
    is_temporary = excluded.is_temporary,
    updated_at = now();
end;
$$;

-- Allow both unauthenticated (invite) and authenticated clients to set credentials via server context
grant execute on function public.set_agent_credentials(uuid, text, text, boolean) to authenticated;
grant execute on function public.set_agent_credentials(uuid, text, text, boolean) to anon;