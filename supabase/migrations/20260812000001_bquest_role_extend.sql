-- Extend "b-quest-role" with the metadata Settings needs to manage roles
-- (icon, capacity, manual ordering) ahead of swapping its primary key to a
-- stable id in the next migration.

alter table public."b-quest-role" add column icon text;
alter table public."b-quest-role" add column max_capacity numeric;
alter table public."b-quest-role" add column sort_order integer;

-- Fold the old dedicated capacity table's data in here; "b_quest_capacity"
-- itself is left in place for now — app code (Settings, Dashboard) still
-- reads it and will be migrated off it in a follow-up pass.
update public."b-quest-role" r
set max_capacity = c.max_capacity
from public.b_quest_capacity c
where r.name = c.role;

update public."b-quest-role" set sort_order = 1 where name = 'Designer';
update public."b-quest-role" set sort_order = 2 where name = 'Creative';
