-- Special/global permissions (e.g. access to the Settings page) don't carry
-- any extra per-permission data (unlike per-role permissions, which need
-- new/edit/delete/assign each), so a plain array is enough — no need for
-- a master list + junction table pair. The valid permission keys are
-- defined in app code (each one requires a matching code check to mean
-- anything), not enumerated in the DB.

alter table public."b-quest-member" add column permissions text[] not null default '{}';

update public."b-quest-member" set permissions = array['setting'] where setting = true;
