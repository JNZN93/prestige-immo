-- Mitarbeiter-Verwaltung für Prestige Immobilien
-- Im Supabase SQL Editor ausführen (nach schema.sql).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'staff' check (role in ('owner', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'staff'),
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Bestehende Auth-User als Betreiber (owner) übernehmen
insert into public.profiles (id, email, full_name, role, active)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data->>'full_name', ''),
  'owner',
  true
from auth.users
on conflict (id) do update
set role = 'owner', active = true;

drop policy if exists "Eigenes Profil lesen" on public.profiles;
drop policy if exists "Betreiber: alle Profile lesen" on public.profiles;
drop policy if exists "Betreiber: Mitarbeiter bearbeiten" on public.profiles;

create or replace function public.is_active_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner' and active = true
  );
$$;

create policy "Eigenes Profil lesen"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Betreiber: alle Profile lesen"
  on public.profiles for select
  to authenticated
  using (public.is_active_owner());

create policy "Betreiber: Mitarbeiter bearbeiten"
  on public.profiles for update
  to authenticated
  using (public.is_active_owner() and role = 'staff')
  with check (role = 'staff');

-- Hinweis: In Authentication → Settings → "Enable email signups" aktivieren
-- und "Confirm email" deaktivieren, damit Mitarbeiter sofort einloggen können.
