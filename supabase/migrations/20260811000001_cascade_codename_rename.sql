-- codename is used as a soft join key (no FK) across setting_project,
-- "b-quest-setting", "b-account-setting", b_finance_setting, and task
-- assignment fields. Editing nick_name/employee_id in Users & Access
-- recomputes profiles.codename but nothing propagated that rename to
-- those tables, orphaning permission/assignment rows under the old
-- codename string. Add a trigger so any future codename change
-- cascades automatically, then backfill the rows already orphaned.

create or replace function public.fn_cascade_codename_rename()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.codename is distinct from old.codename and old.codename is not null then
    update public.setting_project set codename = new.codename where codename = old.codename;
    update public."b-quest-setting" set codename = new.codename where codename = old.codename;
    update public."b-account-setting" set codename = new.codename where codename = old.codename;
    update public.b_finance_setting set codename = new.codename where codename = old.codename;
    update public."b-quest-list" set designer_assign = new.codename where designer_assign = old.codename;
    update public."b-quest-list" set creative_assign = new.codename where creative_assign = old.codename;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_cascade_codename
  after update on public.profiles
  for each row execute function public.fn_cascade_codename_rename();


-- One-time backfill: match orphaned rows to their current profiles.codename
-- via the "(EMPLOYEE_ID)" suffix, which didn't change even though the
-- name/emoji in front of it did.
do $$
declare
  r record;
  new_codename text;
begin
  for r in select codename from public.setting_project loop
    select p.codename into new_codename
      from public.profiles p
      where p.employee_id = substring(r.codename from '\(([^)]+)\)$')
      limit 1;
    if new_codename is not null and new_codename <> r.codename then
      if exists (select 1 from public.setting_project where codename = new_codename) then
        delete from public.setting_project where codename = r.codename;
      else
        update public.setting_project set codename = new_codename where codename = r.codename;
      end if;
    end if;
  end loop;

  for r in select codename from public."b-quest-setting" loop
    select p.codename into new_codename
      from public.profiles p
      where p.employee_id = substring(r.codename from '\(([^)]+)\)$')
      limit 1;
    if new_codename is not null and new_codename <> r.codename then
      if exists (select 1 from public."b-quest-setting" where codename = new_codename) then
        delete from public."b-quest-setting" where codename = r.codename;
      else
        update public."b-quest-setting" set codename = new_codename where codename = r.codename;
      end if;
    end if;
  end loop;
end $$;

-- garbage row from a past JS bug (literal string "null" as codename)
delete from public.setting_project where codename = 'null';
