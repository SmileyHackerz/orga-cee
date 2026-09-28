-- Mise à jour 004 : sécurité renforcée.
-- À exécuter une fois dans le SQL Editor. Relançable sans risque.
--
-- 1. Session limitée à 1 h après la connexion, vérifiée par la base elle-même
--    (claim « amr » du jeton signé par Supabase : heure réelle de l'authentification).
-- 2. Tant que le mot de passe provisoire n'est pas changé, aucune donnée n'est accessible
--    (on ne peut plus contourner l'écran « Bienvenue » en appelant l'API directement).
-- 3. Caisse : la présidente Finance décide si le président et l'adjoint peuvent la consulter.
-- 4. Barème et numéro Wave réservés au pôle Finance et aux superviseurs.

-- ---------- session fraîche (< 1 h depuis l'authentification) ----------
create or replace function public.session_fresh() returns boolean
language sql stable set search_path = public as $$
  select coalesce(
    (select max((a ->> 'timestamp')::bigint)
       from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as a)
      > extract(epoch from now()) - 3600,
    false)
$$;

-- ---------- rôles : valables seulement si session fraîche ET mot de passe personnel ----------
create or replace function public.my_pole() returns text
language sql stable security definer set search_path = public as $$
  select pole from public.profiles
  where id = auth.uid() and kind = 'president' and not must_change_password and public.session_fresh()
$$;

create or replace function public.is_supervisor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and kind = 'supervisor' and not must_change_password and public.session_fresh()
  )
$$;

create or replace function public.is_council() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and not must_change_password and public.session_fresh()
  )
$$;

create or replace function public.finance_flag(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true' from public.settings where pole = 'finance' and key = k limit 1), false)
$$;

revoke all on function public.session_fresh(), public.my_pole(), public.is_supervisor(), public.is_council(), public.finance_flag(text) from public, anon;
grant execute on function public.session_fresh(), public.my_pole(), public.is_supervisor(), public.is_council(), public.finance_flag(text) to authenticated;

-- ---------- premier accès : le verrou ne se lève que si le mot de passe n'est plus passer123 ----------
drop function if exists public.password_changed();
create function public.password_changed() returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare still_default boolean;
begin
  select crypt('passer123', encrypted_password) = encrypted_password into still_default
  from auth.users where id = auth.uid();
  if coalesce(still_default, true) then
    return false;
  end if;
  update public.profiles set must_change_password = false where id = auth.uid();
  return true;
end $$;
revoke all on function public.password_changed() from public, anon;
grant execute on function public.password_changed() to authenticated;

-- ---------- profils : chacun lit toujours le sien (écran « Bienvenue »), le conseil lit les autres ----------
drop policy if exists "profil personnel" on public.profiles;
create policy "profil personnel" on public.profiles for select using (id = auth.uid());

-- ---------- caisse : les superviseurs ne la voient que si la Finance l'autorise ----------
drop policy if exists "lecture conseil" on public.transactions;
create policy "lecture conseil" on public.transactions for select using (
  public.is_council() and (
    visible
    or pole = public.my_pole()
    or (public.is_supervisor() and public.finance_flag('caisse_supervisors'))
  )
);

insert into public.settings (pole, key, value, visible)
values ('finance', 'caisse_supervisors', 'true', true)
on conflict (pole, key) do nothing;

-- ---------- barème et Wave : pas publiés au conseil ----------
update public.settings set visible = false where pole = 'finance' and key in ('rates', 'wave_number');

-- ---------- vérification ----------
select key, value, visible from public.settings where pole = 'finance' and key in ('caisse_supervisors', 'rates', 'wave_number');
