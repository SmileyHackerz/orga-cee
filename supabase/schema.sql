-- Orga — schéma Supabase
-- À exécuter une fois dans Supabase > SQL Editor.
-- Chaque ligne appartient à un pôle ; seul le président de ce pôle peut l'écrire.
-- Le conseil lit les lignes « visible » ; les superviseurs lisent tout.

create extension if not exists pgcrypto;

-- ---------- membres du conseil (comptes) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  kind text not null check (kind in ('supervisor', 'president')),
  pole text check (pole in ('logistique', 'communication', 'finance', 'secretariat')),
  title text not null default ''
);

alter table public.profiles add column if not exists must_change_password boolean not null default true;

alter table public.profiles enable row level security;

create or replace function public.my_pole() returns text
language sql stable security definer set search_path = public as $$
  select pole from public.profiles where id = auth.uid() and kind = 'president'
$$;

create or replace function public.is_supervisor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and kind = 'supervisor')
$$;

create or replace function public.is_council() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid())
$$;

drop policy if exists "profiles lisibles par le conseil" on public.profiles;
create policy "profiles lisibles par le conseil" on public.profiles for select using (public.is_council());

-- Called by the app right after a member replaces the initial password (passer123) with their own.
create or replace function public.password_changed() returns void
language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false where id = auth.uid()
$$;
revoke all on function public.password_changed() from public, anon;
grant execute on function public.password_changed() to authenticated;

-- ---------- tables des pôles ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'secretariat' check (pole = 'secretariat'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  role text not null default 'membre' check (role in ('membre', 'chef_pole', 'secretaire', 'president', 'adjoint')),
  member_poles text[] not null default '{}' check (member_poles <@ array['logistique', 'communication', 'finance', 'secretariat']::text[]),
  phone text,
  level text,
  department text
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'logistique' check (pole = 'logistique'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  date date,
  time time,
  place text,
  status text not null default 'preparation' check (status in ('preparation', 'prete', 'probleme')),
  objective text,
  audience text,
  expected integer,
  program text,
  speakers text,
  lead text
);

create table if not exists public.checklist (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'logistique' check (pole = 'logistique'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activity_id uuid not null references public.activities on delete cascade,
  label text not null,
  quantity integer,
  owner text,
  done boolean not null default false
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'logistique' check (pole = 'logistique'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  details text,
  activity_id uuid references public.activities on delete set null,
  severity text not null default 'moyenne' check (severity in ('faible', 'moyenne', 'haute')),
  status text not null default 'ouvert' check (status in ('ouvert', 'resolu'))
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  pole text not null check (pole in ('logistique', 'communication', 'finance', 'secretariat')),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  details text,
  activity_id uuid references public.activities on delete set null,
  assignee text,
  status text not null default 'a_faire' check (status in ('a_faire', 'en_cours', 'termine', 'bloque')),
  due date
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'communication' check (pole = 'communication'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  body text,
  audience text not null default 'commission' check (audience in ('commission', 'cee', 'eleves')),
  status text not null default 'brouillon' check (status in ('brouillon', 'programmee', 'publiee')),
  date date,
  pinned boolean not null default false
);

create table if not exists public.visuals (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'communication' check (pole = 'communication'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  activity_id uuid references public.activities on delete set null,
  link text,
  status text not null default 'a_faire' check (status in ('a_faire', 'en_cours', 'a_valider', 'valide')),
  assignee text,
  due date
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'communication' check (pole = 'communication'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  date date not null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'instagram', 'facebook', 'affiche', 'autre')),
  content text not null,
  status text not null default 'prevu' check (status in ('prevu', 'publie'))
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'finance' check (pole = 'finance'),
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  member_id uuid not null references public.members on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  amount integer not null,
  method text not null default 'wave' check (method in ('wave', 'especes')),
  paid_on date,
  unique (member_id, month)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'finance' check (pole = 'finance'),
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  date date not null,
  label text not null,
  kind text not null default 'entree' check (kind in ('entree', 'sortie')),
  amount integer not null,
  category text
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'finance' check (pole = 'finance'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  details text,
  status text not null default 'idee' check (status in ('idee', 'etude', 'en_cours', 'realise', 'abandonne')),
  budget integer,
  revenue integer
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'finance' check (pole = 'finance'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  organisation text,
  kind text not null default 'alumni' check (kind in ('alumni', 'entreprise', 'institution', 'autre')),
  status text not null default 'a_contacter' check (status in ('a_contacter', 'en_discussion', 'partenaire', 'inactif')),
  contact text,
  last_contact date,
  notes text
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'secretariat' check (pole = 'secretariat'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  audience text not null default 'conseil' check (audience in ('conseil', 'commission', 'logistique', 'communication', 'finance')),
  date date not null,
  time time,
  place text,
  agenda text
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'secretariat' check (pole = 'secretariat'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  meeting_id uuid not null references public.meetings on delete cascade,
  member_id uuid not null references public.members on delete cascade,
  status text not null check (status in ('present', 'absent', 'excuse')),
  unique (meeting_id, member_id)
);

create table if not exists public.minutes (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'secretariat' check (pole = 'secretariat'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  meeting_date date not null,
  summary text,
  body text,
  link text
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  pole text not null default 'secretariat' check (pole = 'secretariat'),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  number integer not null,
  date date not null,
  title text not null,
  details text,
  concerns text not null default 'commission' check (concerns in ('commission', 'logistique', 'communication', 'finance', 'secretariat')),
  status text not null default 'adoptee' check (status in ('adoptee', 'en_application', 'appliquee', 'abandonnee'))
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  pole text not null check (pole in ('logistique', 'communication', 'finance', 'secretariat')),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  key text not null,
  value text not null,
  unique (pole, key)
);

-- ---------- sécurité : même règle pour toutes les tables des pôles ----------
do $$
declare t text;
begin
  foreach t in array array['members','activities','checklist','incidents','tasks','announcements','visuals','posts',
                           'contributions','transactions','ideas','partners','meetings','attendance','minutes','decisions','settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists touch on public.%I', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);

    execute format('drop policy if exists "lecture conseil" on public.%I', t);
    execute format('create policy "lecture conseil" on public.%I for select using (public.is_council() and (visible or public.is_supervisor() or pole = public.my_pole()))', t);

    execute format('drop policy if exists "ecriture du pole" on public.%I', t);
    execute format('create policy "ecriture du pole" on public.%I for insert with check (pole = public.my_pole())', t);

    execute format('drop policy if exists "modification du pole" on public.%I', t);
    execute format('create policy "modification du pole" on public.%I for update using (pole = public.my_pole()) with check (pole = public.my_pole())', t);

    execute format('drop policy if exists "suppression du pole" on public.%I', t);
    execute format('create policy "suppression du pole" on public.%I for delete using (pole = public.my_pole())', t);

    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------- accès : seuls les comptes connectés passent, les règles ci-dessus filtrent ----------
-- Explicit grants, so the app works even when "Automatically expose new tables" is disabled.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
grant execute on function public.my_pole(), public.is_supervisor(), public.is_council() to authenticated;

-- ---------- données réelles de départ ----------
insert into public.activities (title, month, status)
select * from (values
  ('Intégrations communales', '2026-10', 'preparation'),
  ('XXXX — nom à trouver', '2026-11', 'preparation'),
  ('Kermesse de Noël', '2026-12', 'preparation'),
  ('Feu d’artifice + fête du nouvel an', '2027-01', 'preparation'),
  ('Saint-Valentin avec CLAC', '2027-02', 'preparation'),
  ('Royal Ndogou', '2027-03', 'preparation'),
  ('Ngalakh Time', '2027-04', 'preparation'),
  ('Semaine polytechnicienne', '2027-05', 'preparation'),
  ('Soirées polytechniciennes', '2027-06', 'preparation'),
  ('Bye Bye Campus', '2027-07', 'preparation')
) as v(title, month, status)
where not exists (select 1 from public.activities);

insert into public.members (name, role, member_poles)
select * from (values
  ('Jacques Sambou', 'president', array['logistique', 'communication', 'finance']),
  ('Mohamed Faye', 'adjoint', array['logistique', 'communication', 'finance']),
  ('Cheikh Beye', 'secretaire', array['secretariat']),
  ('Pape Samba Ba', 'chef_pole', array['communication']),
  ('Aïcha Diagana', 'chef_pole', array['logistique']),
  ('Viviane Gnacadja', 'chef_pole', array['finance'])
) as v(name, role, member_poles)
where not exists (select 1 from public.members);

insert into public.settings (pole, key, value) values
  ('finance', 'wave_number', ''),
  ('finance', 'rates', '{"membre":1000,"chef_pole":1500,"secretaire":1500,"president":2000,"adjoint":2000}'),
  ('finance', 'publish_rate', 'false')
on conflict (pole, key) do nothing;
