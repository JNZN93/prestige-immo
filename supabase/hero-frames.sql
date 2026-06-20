-- Hero scroll frames (public CDN via Supabase Storage)
-- SQL Editor ausführen, danach: npm run upload:hero-frames

insert into storage.buckets (id, name, public)
values ('hero-frames', 'hero-frames', true)
on conflict (id) do update
set public = excluded.public;

create policy "Öffentlich: Hero-Frames lesen"
  on storage.objects for select
  using (bucket_id = 'hero-frames');

create policy "Service: Hero-Frames hochladen"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'hero-frames');

create policy "Service: Hero-Frames aktualisieren"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'hero-frames')
  with check (bucket_id = 'hero-frames');
