-- B-Account Member settings redesign (ref B-Quest's own b-quest-members.html
-- pattern): b_account_setting gets the same flat-permission-column shape
-- B-Quest's Dashboard/Duplicate/Share toggles use, split into Setting+Member
-- (mirrors system_access's Setting-is-superset-of-Member rule), plus an
-- Own/All scope for Edit and Delete specifically.
--
-- `ae` is dropped — confirmed dead in the codebase (no canBaccount('ae')
-- call anywhere), a leftover from this table being copied from an older
-- flat version of B-Quest's own permission scheme.

alter table public.b_account_setting
  drop column if exists ae,
  add column if not exists dashboard boolean not null default false,
  add column if not exists account boolean not null default false,
  add column if not exists duplicate boolean not null default false,
  add column if not exists share boolean not null default false,
  add column if not exists member boolean not null default false,
  add column if not exists edit_scope text not null default 'own',
  add column if not exists delete_scope text not null default 'own';

alter table public.b_account_setting
  add constraint b_account_setting_edit_scope_check check (edit_scope in ('own', 'all'));
alter table public.b_account_setting
  add constraint b_account_setting_delete_scope_check check (delete_scope in ('own', 'all'));

-- No backfill — per explicit instruction, existing new/edit/delete/setting
-- values stay exactly as they are, and every newly-added column (dashboard/
-- account/duplicate/share/member/edit_scope/delete_scope) starts at its
-- plain default for every row, existing or new, to be configured by hand
-- on the Member page. This does mean Dashboard/Account/Duplicate/Share
-- access is effectively revoked for everyone the moment this lands (those
-- 4 were previously ungated or riding on 'edit') until re-granted — a
-- deliberate, known tradeoff of this choice, not an oversight.
