-- Per-role task permissions: a member can now have different New/Edit/
-- Delete/Assign rights on each role they're tagged into (e.g. can edit
-- Creative tasks but not delete them, while having full rights on
-- Designer tasks). This supersedes the flat "roles" array added in
-- 20260812000005 — a plain tag can't carry 4 booleans per role, so it's
-- replaced by a proper per-(member, role) table.
--
-- "ae" and "setting" stay as-is on "b-quest-member" — they're genuinely
-- global (ae bypasses per-role checks entirely; setting is access to the
-- whole Settings page), not scoped to any one role.

create table public."b-quest-member-role" (
    id uuid primary key default gen_random_uuid(),
    codename text not null references public."b-quest-member"(codename) on delete cascade,
    role_id uuid not null references public."b-quest-role"(id) on delete cascade,
    new boolean not null default false,
    edit boolean not null default false,
    delete boolean not null default false,
    assign boolean not null default false,
    unique (codename, role_id)
);

alter table public."b-quest-member-role" enable row level security;

create policy "b-quest-member-role_all_authenticated"
    on public."b-quest-member-role" for all
    to authenticated
    using (true)
    with check (true);

-- Backfill: every role a member was tagged with (via the now-superseded
-- roles[] array) gets a permission row carrying that member's old global
-- new/edit/delete/assign flags.
insert into public."b-quest-member-role" (codename, role_id, new, edit, delete, assign)
select m.codename, r.id, m.new, m.edit, m.delete, m.assign
from public."b-quest-member" m
cross join unnest(m.roles) as tagged_role_id
join public."b-quest-role" r on r.id = tagged_role_id;

alter table public."b-quest-member" drop column roles;
alter table public."b-quest-member" drop column new;
alter table public."b-quest-member" drop column edit;
alter table public."b-quest-member" drop column delete;
alter table public."b-quest-member" drop column assign;
