-- Ensure agent_branding bucket exists and is public for reads
insert into storage.buckets (id, name, public)
values ('agent_branding', 'agent_branding', true)
on conflict (id) do update set public = true;

-- Storage RLS for agent_branding: Public read; authenticated users can write under their own folder
create policy if not exists "agent_branding_read_public_v2"
  on storage.objects
  for select
  to public
  using (bucket_id = 'agent_branding');

create policy if not exists "agent_branding_insert_own_v2"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'agent_branding' and (
      name like ('agents/' || auth.uid()::text || '/%')
    )
  );

create policy if not exists "agent_branding_update_own_v2"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'agent_branding' and (
      name like ('agents/' || auth.uid()::text || '/%')
    )
  )
  with check (
    bucket_id = 'agent_branding' and (
      name like ('agents/' || auth.uid()::text || '/%')
    )
  );

create policy if not exists "agent_branding_delete_own_v2"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'agent_branding' and (
      name like ('agents/' || auth.uid()::text || '/%')
    )
  );

-- Agents table RLS: enable and ensure own-row access
alter table if exists public.agents enable row level security;

create policy if not exists "agents_select_own_v2"
  on public.agents
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "agents_update_own_v2"
  on public.agents
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Agent settings RLS kept for backward compatibility of preferences.documents
alter table if exists public.agent_settings enable row level security;

create policy if not exists "agent_settings_select_own_v2"
  on public.agent_settings
  for select
  to authenticated
  using (agent_id = auth.uid());

create policy if not exists "agent_settings_insert_own_v2"
  on public.agent_settings
  for insert
  to authenticated
  with check (agent_id = auth.uid());

create policy if not exists "agent_settings_update_own_v2"
  on public.agent_settings
  for update
  to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());