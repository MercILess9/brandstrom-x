-- fn_cascade_codename_rename() updated b_quest_member_role (child, FK'd
-- to b_quest_member.codename) before b_quest_member (parent) — since
-- that FK isn't deferrable, Postgres checks it immediately on the child
-- UPDATE and fails, because the parent doesn't have the new codename
-- yet. Found live: renaming a codename via system/setting.html threw
-- "insert or update on table b_quest_member_role violates foreign key
-- constraint b-quest-member-role_codename_fkey" for a user who's a
-- b_quest_member_role holder. Fix is just reordering the two updates —
-- parent (b_quest_member) before child (b_quest_member_role) — no
-- other statement in this function has a matching parent/child pair
-- to worry about.
create or replace function public.fn_cascade_codename_rename() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
begin
  if new.codename is distinct from old.codename and old.codename is not null then
    update public.setting_project set codename = new.codename where codename = old.codename;
    update public.b_account_setting set codename = new.codename where codename = old.codename;
    update public.b_finance_setting set codename = new.codename where codename = old.codename;
    update public.b_quest_member set codename = new.codename where codename = old.codename;
    update public.b_quest_member_role set codename = new.codename where codename = old.codename;
    update public.b_quest_task_role set assign = new.codename where assign = old.codename;
    update public.b_quest_list set owner = new.codename where owner = old.codename;
    update public.b_account_list set create_by = new.codename where create_by = old.codename;
    update public.b_account_list set update_by = new.codename where update_by = old.codename;
    update public.b_opportunity_list set owner = new.codename where owner = old.codename;
    update public.b_opportunity_list set am = new.codename where am = old.codename;
    update public.b_opportunity_list set sub_am = new.codename where sub_am = old.codename;
    update public.b_opportunity_list set create_by = new.codename where create_by = old.codename;
    update public.b_opportunity_list set update_by = new.codename where update_by = old.codename;
  end if;
  return new;
end;
$$;
