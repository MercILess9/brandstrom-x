-- The previous backfill (20260811000001) synced setting_project and
-- "b-quest-setting" but missed "b-quest-list".designer_assign /
-- creative_assign — existing tasks assigned before a member's codename
-- picked up an emoji still point at the old, now-orphaned string.
do $$
declare
  r record;
  new_codename text;
begin
  for r in select distinct designer_assign as codename from public."b-quest-list" where designer_assign is not null loop
    select p.codename into new_codename
      from public.profiles p
      where p.employee_id = substring(r.codename from '\(([^)]+)\)$')
      limit 1;
    if new_codename is not null and new_codename <> r.codename then
      update public."b-quest-list" set designer_assign = new_codename where designer_assign = r.codename;
    end if;
  end loop;

  for r in select distinct creative_assign as codename from public."b-quest-list" where creative_assign is not null loop
    select p.codename into new_codename
      from public.profiles p
      where p.employee_id = substring(r.codename from '\(([^)]+)\)$')
      limit 1;
    if new_codename is not null and new_codename <> r.codename then
      update public."b-quest-list" set creative_assign = new_codename where creative_assign = r.codename;
    end if;
  end loop;
end $$;
