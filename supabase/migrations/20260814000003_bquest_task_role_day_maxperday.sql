-- b-quest-task-role never picked up "day" (task spans this many days,
-- counted back from deadline) or "max_per_day" when the flexible-role
-- migration happened — they only ever existed on the legacy
-- designer_day/creative_day columns on b-quest-list and on b-quest-work.
-- Needed now that the Modal is being cut over to write here instead of
-- those legacy columns, since capacity math depends on both.
alter table public."b-quest-task-role" add column day text;
alter table public."b-quest-task-role" add column max_per_day numeric;
