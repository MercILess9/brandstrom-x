-- Rename "b-quest-setting" -> "b-quest-member" (it's a member roster with
-- per-project permissions, not a settings/config table) and replace the
-- fixed creative/designer boolean columns with a "roles" array of role
-- ids, so members can be tagged with any number of the now-unlimited
-- roles without ever needing an ALTER TABLE again.
--
-- "ae" stays a dedicated column — it's an access-level flag (bypasses
-- per-role edit checks, auto-scopes the Owner filter), not a work role.
--
-- creative/designer booleans are left in place for now — app code still
-- reads/writes them and will be cut over to "roles" in a follow-up pass.

alter table public."b-quest-setting" rename to "b-quest-member";
alter policy "b-quest-setting_all_authenticated" on public."b-quest-member"
    rename to "b-quest-member_all_authenticated";

alter table public."b-quest-member" add column roles uuid[] not null default '{}';

update public."b-quest-member" m
set roles = sub.ids
from (
    select codename, array_agg(r.id) as ids
    from public."b-quest-member" mm
    join public."b-quest-role" r on
        (mm.designer and r.name = 'Designer') or
        (mm.creative and r.name = 'Creative')
    group by codename
) sub
where m.codename = sub.codename;
