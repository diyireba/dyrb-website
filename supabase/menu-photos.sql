-- Run once after schema.sql and the event-menu migrations. Safe to rerun.
-- Public food photography only; writes require the existing menu.manage permission.
begin;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 2097152, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists menu_photos_public_read on storage.objects;
create policy menu_photos_public_read on storage.objects for select to anon, authenticated
using (bucket_id = 'menu-photos');

drop policy if exists menu_photos_manager_insert on storage.objects;
create policy menu_photos_manager_insert on storage.objects for insert to authenticated
with check (bucket_id = 'menu-photos' and public.has_permission('menu.manage'));
-- Uploads have unique names. No overwrite/delete policy: existing photo links stay valid.
commit;
