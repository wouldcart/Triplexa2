-- Ensure buckets exist and are public for reads
insert into storage.buckets (id, name, public)
values ('agent_branding', 'agent_branding', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do update set public = true;

-- Storage RLS: agent_branding allow public read; restrict writes to agent-owned folder
create policy if not exists "agent_branding_read_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'agent_branding');

create policy if not exists "agent_branding_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'agent_branding' and (
      name like ('agents/' || auth.uid()::text || '/%')
    )
  );

create policy if not exists "agent_branding_update_own"
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

-- Storage RLS: branding allow public read; restrict writes to logos/*
create policy if not exists "branding_read_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'branding');

create policy if not exists "branding_insert_logos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'branding' and (
      name like ('logos/%')
    )
  );

create policy if not exists "branding_update_logos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'branding' and (
      name like ('logos/%')
    )
  )
  with check (
    bucket_id = 'branding' and (
      name like ('logos/%')
    )
  );

-- Agents table RLS: allow users to read and update their own row
alter table if exists public.agents enable row level security;

create policy if not exists "agents_select_own"
  on public.agents
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "agents_update_own"
  on public.agents
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Agent settings preferences (documents) RLS
alter table if exists public.agent_settings enable row level security;

create policy if not exists "agent_settings_select_own"
  on public.agent_settings
  for select
  to authenticated
  using (agent_id = auth.uid());

create policy if not exists "agent_settings_insert_own"
  on public.agent_settings
  for insert
  to authenticated
  with check (agent_id = auth.uid());

create policy if not exists "agent_settings_update_own"
  on public.agent_settings
  for update
  to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

-- Agent tax info RLS (multi-row per agent)
alter table if exists public.agent_tax_info enable row level security;

create policy if not exists "agent_tax_info_select_own"
  on public.agent_tax_info
  for select
  to authenticated
  using (agent_id = auth.uid());

create policy if not exists "agent_tax_info_insert_own"
  on public.agent_tax_info
  for insert
  to authenticated
  with check (agent_id = auth.uid());

create policy if not exists "agent_tax_info_update_own"
  on public.agent_tax_info
  for update
  to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());