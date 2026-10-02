-- Adds `active` and `sort_order` to `departments`, matching the pattern
-- already used by b_quest_role/b_quest_status/b_quest_type (active flag +
-- persisted drag-reorder). Previously `departments` had only `name` (PK),
-- so system/setting.html's Department drag-reorder and Active toggle were
-- UI-only (reset to plain alphabetical on reload) — this migration is what
-- lets that persist for real.

alter table public.departments
  add column if not exists active boolean not null default true,
  add column if not exists sort_order integer;

-- Backfill existing rows with their current alphabetical position so the
-- list's on-screen order doesn't visibly change the moment this ships.
with ordered as (
  select name, row_number() over (order by name) as rn
  from public.departments
)
update public.departments d
set sort_order = ordered.rn
from ordered
where d.name = ordered.name;

alter table public.departments
  alter column sort_order set not null;
