-- Naming cleanup: align table names with what the UI actually calls these
-- things ("Setting" tab everywhere), and stop implying setting_project is
-- a member-roster table (it isn't — after 20260922000006 dropped its dead
-- bquest/baccount/bfinance columns, it only ever held 3 narrow access
-- flags, never roles/permissions like the real *_member tables).
--
-- b_quest_config -> b_quest_setting: safe despite the platform's history
-- with "setting" as a table-name word — a *different* table once named
-- "b-quest-setting" held per-member permissions and was deliberately
-- renamed to "b-quest-member" (20260812000005) specifically because
-- "setting" was the wrong word for member data. That table doesn't exist
-- anymore. This table holds actual rule/value settings (Data Visibility
-- mode, etc.) — "setting" is the *correct* word for what's in here.
alter table public.b_quest_config rename to b_quest_setting;

-- setting_project -> system_access: "member" was considered and rejected
-- for the same reason above (this table isn't a member roster); "access"
-- matches what it actually gates (system_setting page access +
-- bdashboard/bcommission reservations for projects not live yet).
alter table public.setting_project rename to system_access;

-- system_config -> system_setting: matches the "Setting" tab in
-- system/setting.html that Branding (its only current data) lives under.
alter table public.system_config rename to system_setting;

-- fn_cascade_codename_rename() hardcodes "public.setting_project" (still
-- named that as of its latest version, 20260922000001) — without this
-- replacement, the codename-rename cascade would break the next time
-- anyone's codename changes, since it would try to UPDATE a table that
-- no longer exists under that name. Body is otherwise byte-for-byte
-- identical to 20260922000001 (including that migration's parent-before-
-- child ordering fix) — only the setting_project -> system_access
-- reference changes.
create or replace function public.fn_cascade_codename_rename() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
begin
  if new.codename is distinct from old.codename and old.codename is not null then
    update public.system_access set codename = new.codename where codename = old.codename;
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
