-- Prestige Immobilien: Supabase Schema
-- Im Supabase Dashboard unter SQL Editor ausführen.

create extension if not exists "pgcrypto";

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  price_display text not null,
  type text not null check (type in ('Kauf', 'Miete')),
  beds integer not null default 0,
  baths integer not null default 0,
  area integer not null default 0,
  image_url text not null default '',
  featured boolean not null default false,
  layout text not null default 'standard' check (layout in ('hero', 'wide', 'tall', 'standard')),
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

create policy "Öffentlich: veröffentlichte Inserate lesen"
  on public.properties for select
  using (published = true);

create policy "Betreiber: alle Inserate lesen"
  on public.properties for select
  to authenticated
  using (true);

create policy "Betreiber: Inserate erstellen"
  on public.properties for insert
  to authenticated
  with check (true);

create policy "Betreiber: Inserate bearbeiten"
  on public.properties for update
  to authenticated
  using (true)
  with check (true);

create policy "Betreiber: Inserate löschen"
  on public.properties for delete
  to authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

create policy "Öffentlich: Bilder lesen"
  on storage.objects for select
  using (bucket_id = 'property-images');

create policy "Betreiber: Bilder hochladen"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images');

create policy "Betreiber: Bilder löschen"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images');

-- Beispiel-Inserate (optional, nur wenn Tabelle leer ist)
insert into public.properties (
  title, location, price_display, type, beds, baths, area, image_url, featured, layout, published, sort_order
)
select
  v.title,
  v.location,
  v.price_display,
  v.type,
  v.beds,
  v.baths,
  v.area,
  v.image_url,
  v.featured,
  v.layout,
  v.published,
  v.sort_order
from (
  values
    ('Penthouse am Starnberger See', 'Starnberg, Bayern', '4.850.000 €', 'Kauf', 5, 3, 320,
     'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80', true, 'hero', true, 1),
    ('Villa mit Garten', 'Grünwald, München', '2.950.000 €', 'Kauf', 6, 4, 450,
     'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', false, 'tall', true, 2),
    ('Loft in der Speicherstadt', 'Hamburg, HafenCity', '1.890.000 €', 'Kauf', 3, 2, 185,
     'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', false, 'standard', true, 3),
    ('Altbauwohnung mit Balkon', 'Berlin, Charlottenburg', '3.200 €', 'Miete', 4, 2, 145,
     'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', false, 'wide', true, 4),
    ('Modernes Einfamilienhaus', 'Frankfurt, Westend', '1.650.000 €', 'Kauf', 4, 3, 210,
     'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', false, 'standard', true, 5)
) as v(
  title, location, price_display, type, beds, baths, area, image_url, featured, layout, published, sort_order
)
where not exists (select 1 from public.properties limit 1);

-- Betreiber-Account im Supabase Dashboard anlegen:
-- Authentication → Users → Add user (E-Mail + Passwort)
