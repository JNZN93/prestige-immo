-- Mitarbeiter-Zuweisung für Inserate
-- Im Supabase SQL Editor ausführen.

alter table public.properties
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

create index if not exists properties_assigned_to_idx on public.properties(assigned_to);

create or replace function public.enforce_assigned_to_owner_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_active_owner() and new.assigned_to is not null then
      new.assigned_to := null;
    end if;
  elsif tg_op = 'UPDATE' then
    if not public.is_active_owner() and new.assigned_to is distinct from old.assigned_to then
      new.assigned_to := old.assigned_to;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists properties_assigned_to_guard on public.properties;

create trigger properties_assigned_to_guard
  before insert or update on public.properties
  for each row execute function public.enforce_assigned_to_owner_only();

-- Öffentliche Website: Ansprechpartner-Namen für veröffentlichte Inserate lesbar
drop policy if exists "Öffentlich: Ansprechpartner lesen" on public.profiles;

create policy "Öffentlich: Ansprechpartner lesen"
  on public.profiles for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.properties
      where properties.assigned_to = profiles.id
        and properties.published = true
    )
  );
