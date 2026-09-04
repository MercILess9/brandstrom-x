-- fn_cascade_codename_rename still referenced the pre-rename hyphenated
-- table names ("b-quest-setting", "b-account-setting", "b-quest-list"
-- designer_assign/creative_assign) — none of which exist anymore after
-- the 2026-08 snake_case rename. Renaming a codename in profiles would
-- error out instead of cascading. Found while migrating Brandstrom-X;
-- CB's own fork had already fixed + extended this (owner, create_by) —
-- adopting that version here too.

create or replace function public.fn_cascade_codename_rename() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
begin
  if new.codename is distinct from old.codename and old.codename is not null then
    update public.setting_project set codename = new.codename where codename = old.codename;
    update public.b_account_setting set codename = new.codename where codename = old.codename;
    update public.b_finance_setting set codename = new.codename where codename = old.codename;
    update public.b_quest_member_role set codename = new.codename where codename = old.codename;
    update public.b_quest_member set codename = new.codename where codename = old.codename;
    update public.b_quest_task_role set assign = new.codename where assign = old.codename;
    update public.b_quest_list set owner = new.codename where owner = old.codename;
    update public.b_account_list set create_by = new.codename where create_by = old.codename;
  end if;
  return new;
end;
$$;
