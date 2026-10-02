-- system/setting.html grew from one page-wide gate (system_setting) into 3
-- tabs (Setting/Holiday/Member), so access needs to be per-tab now, same
-- principle as B-Quest's own Setting/Member split (b-quest-members.html):
-- each tab checks its own flag, not one blanket "can open this page" flag.
--
-- Setting stays a forced superset of Member (mirrors B-Quest's
-- onMemberSettingToggle/onMemberMemberToggle exactly): the permission
-- toggle table itself lives inside the Member tab, so a Setting-only user
-- with Member off could never reach the table to manage anyone's access,
-- despite being "top level" — turning Setting on must force Member on,
-- and turning Member off must force Setting off, enforced in JS the same
-- way B-Quest enforces it (no DB-level constraint needed, matches
-- b_quest_member's own approach).
--
-- Holiday is fully independent of both — its tab holds no permission UI,
-- so there's no dependency to enforce.
alter table public.system_access add column if not exists system_holiday boolean not null default false;
alter table public.system_access add column if not exists system_member boolean not null default false;
