-- Mise à jour 002 : infos des membres (niveau, département) et type de réunion (liens Meet).
-- À exécuter une fois dans le SQL Editor, avant import_membres.sql. Relançable sans risque.

alter table public.members add column if not exists level text;
alter table public.members add column if not exists department text;

alter table public.meetings add column if not exists audience text not null default 'conseil';
alter table public.meetings drop constraint if exists meetings_audience_check;
alter table public.meetings add constraint meetings_audience_check
  check (audience in ('conseil', 'commission', 'logistique', 'communication', 'finance'));
