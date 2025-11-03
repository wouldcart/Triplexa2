-- Create branding storage bucket for app logos and favicons
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do update set public = true;

-- Storage RLS for branding bucket: Public read; authenticated users can write
create policy if not exists "branding_read_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'branding');

create policy if not exists "branding_insert_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'branding');

create policy if not exists "branding_update_authenticated"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'branding')
  with check (bucket_id = 'branding');

create policy if not exists "branding_delete_authenticated"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'branding');