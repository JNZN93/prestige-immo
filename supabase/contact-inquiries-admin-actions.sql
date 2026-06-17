-- Kontaktanfragen im Admin-Bereich bearbeiten/löschen
-- Dieses Script ausführen, wenn contact-inquiries.sql bereits vorher ausgeführt wurde.

alter table public.contact_inquiries
  add column if not exists handled boolean not null default false,
  add column if not exists handled_at timestamptz,
  add column if not exists handled_by uuid references public.profiles(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contact_inquiries'
  ) then
    alter publication supabase_realtime add table public.contact_inquiries;
  end if;
end $$;

drop policy if exists "Betreiber: Anfragen bearbeiten" on public.contact_inquiries;
create policy "Betreiber: Anfragen bearbeiten"
  on public.contact_inquiries for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner', 'staff')
        and profiles.active = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner', 'staff')
        and profiles.active = true
    )
  );

drop policy if exists "Betreiber: Anfragen löschen" on public.contact_inquiries;
create policy "Betreiber: Anfragen löschen"
  on public.contact_inquiries for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner', 'staff')
        and profiles.active = true
    )
  );
