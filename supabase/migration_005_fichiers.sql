-- Mise à jour 005 : fichiers joints.
-- À exécuter une fois dans le SQL Editor, après la 004. Relançable sans risque.
--
-- Logistique : fiches de chaque activité (photos, PDF, Word, PowerPoint…).
-- Secrétariat : PV et documents de chaque réunion.
-- Les fichiers sont privés : on ne les ouvre qu'avec un lien temporaire (1 h),
-- et seulement si l'on a le droit de voir la ligne correspondante.

-- ---------- table des fichiers ----------
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  pole text not null check (pole in ('logistique', 'secretariat')),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  parent_table text not null check (parent_table in ('activities', 'meetings')),
  parent_id uuid not null,
  name text not null check (length(name) between 1 and 200),
  path text not null unique,
  size bigint,
  mime text,
  -- une activité appartient à la Logistique, une réunion au Secrétariat ; le fichier est rangé dans le dossier du pôle
  constraint attachments_owner check (
    (parent_table = 'activities' and pole = 'logistique') or (parent_table = 'meetings' and pole = 'secretariat')
  ),
  constraint attachments_path check (split_part(path, '/', 1) = pole and split_part(path, '/', 2) = parent_table and split_part(path, '/', 3) = parent_id::text)
);

create index if not exists attachments_parent on public.attachments (parent_table, parent_id);

alter table public.attachments enable row level security;
drop trigger if exists touch on public.attachments;
create trigger touch before update on public.attachments for each row execute function public.touch_updated_at();

drop policy if exists "lecture conseil" on public.attachments;
create policy "lecture conseil" on public.attachments for select
  using (public.is_council() and (visible or public.is_supervisor() or pole = public.my_pole()));

drop policy if exists "ecriture du pole" on public.attachments;
create policy "ecriture du pole" on public.attachments for insert with check (pole = public.my_pole());

drop policy if exists "modification du pole" on public.attachments;
create policy "modification du pole" on public.attachments for update
  using (pole = public.my_pole()) with check (pole = public.my_pole());

drop policy if exists "suppression du pole" on public.attachments;
create policy "suppression du pole" on public.attachments for delete using (pole = public.my_pole());

grant select, insert, update, delete on public.attachments to authenticated;
revoke all on public.attachments from anon;

do $$
begin
  alter publication supabase_realtime add table public.attachments;
exception when duplicate_object then null;
end $$;

-- ---------- espace de stockage privé ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fichiers', 'fichiers', false, 52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation', 'application/vnd.oasis.opendocument.spreadsheet',
    'text/plain', 'text/markdown', 'text/csv', 'application/rtf',
    'video/mp4', 'video/quicktime',
    'audio/mpeg', 'audio/mp4', 'audio/ogg'
  ]
)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Lire un fichier : seulement si sa ligne dans « attachments » est lisible (publiée, ou de son pôle, ou superviseur).
drop policy if exists "fichiers lecture" on storage.objects;
create policy "fichiers lecture" on storage.objects for select to authenticated using (
  bucket_id = 'fichiers' and public.is_council() and exists (
    select 1 from public.attachments a
    where a.path = storage.objects.name
      and (a.visible or public.is_supervisor() or a.pole = public.my_pole())
  )
);

-- Déposer ou retirer un fichier : seulement dans le dossier de son propre pôle.
drop policy if exists "fichiers depot" on storage.objects;
create policy "fichiers depot" on storage.objects for insert to authenticated with check (
  bucket_id = 'fichiers' and (storage.foldername(name))[1] = public.my_pole()
);

drop policy if exists "fichiers retrait" on storage.objects;
create policy "fichiers retrait" on storage.objects for delete to authenticated using (
  bucket_id = 'fichiers' and (storage.foldername(name))[1] = public.my_pole()
);

-- ---------- vérification ----------
select id, public, file_size_limit from storage.buckets where id = 'fichiers';
