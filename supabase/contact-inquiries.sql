-- Kontaktformular: Anfragen speichern und per E-Mail benachrichtigen
-- Im Supabase Dashboard unter SQL Editor ausführen.

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  interest text not null,
  message text,
  handled boolean not null default false,
  handled_at timestamptz,
  handled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_settings (
  id int primary key default 1 check (id = 1),
  recipient_email text not null default 'firat.tasyurdu@web.de',
  updated_at timestamptz not null default now()
);

insert into public.contact_settings (recipient_email)
values ('firat.tasyurdu@web.de')
on conflict (id) do update
  set recipient_email = excluded.recipient_email,
      updated_at = now();

alter table public.contact_inquiries enable row level security;
alter table public.contact_settings enable row level security;

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

create policy "Betreiber: Anfragen lesen"
  on public.contact_inquiries for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner', 'staff')
        and profiles.active = true
    )
  );

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

create policy "Betreiber: Kontakt-Einstellungen lesen"
  on public.contact_settings for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner', 'staff')
        and profiles.active = true
    )
  );

create policy "Betreiber: Empfänger-E-Mail ändern"
  on public.contact_settings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'owner'
        and profiles.active = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'owner'
        and profiles.active = true
    )
  );

-- Edge Function send-contact-inquiry speichert Anfragen mit Service Role.
-- Die Function verschickt keine E-Mails mehr.
-- Deploy:
--    supabase functions deploy send-contact-inquiry --no-verify-jwt
