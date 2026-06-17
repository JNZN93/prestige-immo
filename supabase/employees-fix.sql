-- HOTFIX: Login nach employees.sql reparieren
-- Im Supabase SQL Editor ausführen.

-- RLS-Rekursion beheben (security definer statt Subquery in Policy)
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

drop policy if exists "Betreiber: alle Profile lesen" on public.profiles;
drop policy if exists "Betreiber: Mitarbeiter bearbeiten" on public.profiles;

create policy "Betreiber: alle Profile lesen"
  on public.profiles for select
  to authenticated
  using (public.is_active_owner());

create policy "Betreiber: Mitarbeiter bearbeiten"
  on public.profiles for update
  to authenticated
  using (public.is_active_owner() and role = 'staff')
  with check (role = 'staff');

-- Fehlende Profile anlegen / Betreiber-Account sicherstellen
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

-- Falls du mehrere User hast: nur DEINE E-Mail als owner setzen, z. B.:
-- update public.profiles set role = 'owner', active = true where email = 'deine@email.de';
