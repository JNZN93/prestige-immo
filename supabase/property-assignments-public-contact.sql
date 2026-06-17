-- Ansprechpartner auf der öffentlichen Website anzeigen
-- Falls property-assignments.sql bereits ausgeführt wurde, nur dieses Script ausführen.

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
