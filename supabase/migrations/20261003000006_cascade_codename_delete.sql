-- Deleting a user from the system (system/setting.html's Member tab,
-- confirmDeleteUser()) only ever deleted their `profiles` row + manually
-- deleted `system_access` in JS — their membership/permission row in
-- every other project's own table (b_quest_member/b_quest_member_role,
-- b_account_setting, b_finance_setting) was left behind as an orphan,
-- keyed to a codename that no longer exists anywhere else. Same codename
-- surface fn_cascade_codename_rename() already cascades RENAMES across —
-- this is the matching cascade for DELETE.
--
-- Deliberately narrower than the rename cascade: only membership/
-- permission tables are touched here. Historical data-reference columns
-- (b_quest_list.owner, b_quest_task_role.assign, b_account_list.create_by/
-- update_by, b_opportunity_list.owner/am/sub_am/create_by/update_by) are
-- NOT cleared — removing someone's system access shouldn't erase the
-- historical record of work they created/owned/were assigned.

create or replace function public.fn_cascade_codename_delete() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
begin
  delete from public.system_access where codename = old.codename;
  delete from public.b_account_setting where codename = old.codename;
  delete from public.b_finance_setting where codename = old.codename;
  delete from public.b_quest_member_role where codename = old.codename;
  delete from public.b_quest_member where codename = old.codename;
  return old;
end;
$$;

drop trigger if exists trg_profiles_cascade_codename_delete on public.profiles;
create trigger trg_profiles_cascade_codename_delete
  after delete on public.profiles
  for each row execute function public.fn_cascade_codename_delete();
