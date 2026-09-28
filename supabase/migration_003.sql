-- Mise à jour 003 : un membre peut appartenir à plusieurs pôles.
-- À exécuter une fois dans le SQL Editor, après import_membres.sql. Relançable sans risque.

alter table public.members add column if not exists member_poles text[] not null default '{}';

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'members' and column_name = 'member_pole') then
    update public.members set member_poles = array[member_pole] where member_pole is not null and member_poles = '{}';
    alter table public.members drop column member_pole;
  end if;
end $$;

alter table public.members drop constraint if exists members_member_poles_check;
alter table public.members add constraint members_member_poles_check
  check (member_poles <@ array['logistique', 'communication', 'finance', 'secretariat']::text[]);

-- Président et adjoint : dans tous les pôles.
update public.members set member_poles = array['logistique', 'communication', 'finance']
where name in ('Jacques Sambou', 'Mohamed Faye');

-- Les pôles de chaque membre sont ensuite fixés par supabase/poles_membres.sql (fichier privé, hors Git)
-- ou directement dans Admin → Secrétariat → Membres.

-- Vérification : membres du pôle Logistique.
select count(*) as pole_logistique from public.members where 'logistique' = any(member_poles);
