-- "Max Per Day" — caps how much of this work item's weight can be scheduled
-- on a single day, alongside the existing day/weight fields.
alter table public."b-quest-work" add column max_per_day numeric;
