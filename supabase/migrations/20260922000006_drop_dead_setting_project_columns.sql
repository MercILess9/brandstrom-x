-- setting_project.bquest/baccount/bfinance are dead — access for these 3
-- live projects has been fully migrated to each project's own member
-- table (b_quest_member/b_account_setting/b_finance_setting), read via
-- system.js's guardProjectAccess() and displayed as read-only badges in
-- system/setting.html's Users & Access (see PROJECT_MEMBER_TABLE /
-- memberSets there). Confirmed via grep: nothing in the codebase reads
-- or writes these 3 columns anymore (system/setting.html's own saveAll()
-- comment already says so explicitly).
--
-- bdashboard/bcommission/system_setting are NOT touched — Dashboard and
-- Commission aren't live projects yet (no member table to point at
-- instead), and system_setting has no member-table equivalent at all.

alter table public.setting_project
  drop column if exists bquest,
  drop column if exists baccount,
  drop column if exists bfinance;
