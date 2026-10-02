-- Full RLS policy audit across Test/BX/CB (2026-09-22) found two classes
-- of accumulated cruft, per the standing rule in
-- feedback-schema-object-cleanup-on-change: policy names that never
-- followed their table through a rename (e.g. "b-quest-list_all_authenticated"
-- surviving the 2026-08-27 snake_case rename, "setting_project_select_authenticated"
-- surviving nothing yet but about to via 20260922000007), and redundant
-- SELECT+ALL policy pairs on several tables where ALL already covers
-- SELECT — the separate SELECT policy adds nothing, just doubles the
-- policy count.
--
-- Standard convention going forward, one policy per table unless a table
-- genuinely needs per-command logic (currently only `profiles`, already
-- handled in 20260922000014):
--   {table}_all_authenticated                for normal tables
--   {table}_select_anon + {table}_all_authenticated   for tables anon
--                                                       needs pre-login
--                                                       read access to
--                                                       (currently only
--                                                       system_department,
--                                                       for signup.html)
--
-- Written against Test's current (already-renamed) table names. BX/CB
-- get the equivalent treatment applied directly against their
-- still-current table names — not written here since the exact stale
-- policy names differ per instance (BX and CB each drifted differently).
-- Once Group 1's table renames actually land on BX/CB, whatever policies
-- land on setting_project/departments/b_quest_config at that point will
-- also need a follow-up rename to match — noted in the sync checklist,
-- not handled by this file.
alter policy "b-account-setting_all_authenticated" on public.b_account_setting rename to "b_account_setting_all_authenticated";
alter policy "b_opp_config_all_authenticated" on public.b_opportunity_config rename to "b_opportunity_config_all_authenticated";
alter policy "b-quest-list_all_authenticated" on public.b_quest_list rename to "b_quest_list_all_authenticated";
alter policy "b-quest-member-role_all_authenticated" on public.b_quest_member_role rename to "b_quest_member_role_all_authenticated";
alter policy "b-quest-member_all_authenticated" on public.b_quest_member rename to "b_quest_member_all_authenticated";
alter policy "b-quest-role_all_authenticated" on public.b_quest_role rename to "b_quest_role_all_authenticated";
alter policy "b-quest-config_all_authenticated" on public.b_quest_setting rename to "b_quest_setting_all_authenticated";
alter policy "b-quest-status_all_authenticated" on public.b_quest_status rename to "b_quest_status_all_authenticated";
alter policy "b-quest-task-role_all_authenticated" on public.b_quest_task_role rename to "b_quest_task_role_all_authenticated";
alter policy "b-quest-type_all_authenticated" on public.b_quest_type rename to "b_quest_type_all_authenticated";
alter policy "b-quest-work_all_authenticated" on public.b_quest_work rename to "b_quest_work_all_authenticated";

drop policy if exists "holiday_select_authenticated" on public.holiday;
drop policy if exists "holiday_write_authenticated" on public.holiday;
drop policy if exists "holiday_all_authenticated" on public.holiday;
create policy "holiday_all_authenticated" on public.holiday for all to authenticated using (true) with check (true);

drop policy if exists "setting_project_select_authenticated" on public.system_access;
drop policy if exists "setting_project_write_authenticated" on public.system_access;
drop policy if exists "system_access_all_authenticated" on public.system_access;
create policy "system_access_all_authenticated" on public.system_access for all to authenticated using (true) with check (true);

drop policy if exists "system_config_select_authenticated" on public.system_setting;
drop policy if exists "system_config_write_authenticated" on public.system_setting;
drop policy if exists "system_setting_all_authenticated" on public.system_setting;
create policy "system_setting_all_authenticated" on public.system_setting for all to authenticated using (true) with check (true);

alter policy "departments_select_anon" on public.system_department rename to "system_department_select_anon";
drop policy if exists "departments_select_authenticated" on public.system_department;
drop policy if exists "departments_write_authenticated" on public.system_department;
drop policy if exists "system_department_all_authenticated" on public.system_department;
create policy "system_department_all_authenticated" on public.system_department for all to authenticated using (true) with check (true);
