-- Mehrere Bilder pro Inserat
-- Im Supabase SQL Editor ausführen.

alter table public.properties
  add column if not exists gallery_urls text[] not null default '{}';

update public.properties
set gallery_urls = array[image_url]
where image_url <> ''
  and (gallery_urls is null or gallery_urls = '{}');
