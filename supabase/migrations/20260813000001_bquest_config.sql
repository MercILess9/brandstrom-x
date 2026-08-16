-- General-purpose global settings bucket for B-Quest — key/value shape since
-- the entries here vary widely (simple booleans today, richer objects like
-- "default filter dropdown" later) and are read once per page load rather
-- than filtered/joined at the DB level. Per-entity data with a fixed,
-- UI-mapped shape (b-quest-setting, setting_project, b_quest_capacity)
-- stays column-based on purpose — this table is only for loose app-wide
-- toggles that don't fit that mold.
create table public."b-quest-config" (
    rule text primary key,
    value jsonb not null
);

alter table public."b-quest-config" enable row level security;

create policy "b-quest-config_all_authenticated"
    on public."b-quest-config" for all
    to authenticated
    using (true)
    with check (true);

insert into public."b-quest-config" (rule, value) values
    ('work_day_enabled', 'true'),
    ('work_max_enabled', 'true');
