-- =====================================================================
--  ISOKO PHOTO STORAGE
--  Run this AFTER schema.sql (Supabase -> SQL Editor -> New query -> Run).
--  Creates the "listing-photos" bucket. Photos are public to view;
--  only an owner can upload into their own folder.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

drop policy if exists "listing photos are public" on storage.objects;
create policy "listing photos are public" on storage.objects
  for select using (bucket_id = 'listing-photos');

drop policy if exists "owners upload to own folder" on storage.objects;
create policy "owners upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

drop policy if exists "owners delete own photos" on storage.objects;
create policy "owners delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
