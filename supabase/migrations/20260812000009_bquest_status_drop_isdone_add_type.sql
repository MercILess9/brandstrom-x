-- "is_done" on b-quest-status was never wired into any actual filter logic
-- (the List page's Progress/Done bucket still compares status text directly)
-- and isn't needed — drop it.
alter table public."b-quest-status" drop column is_done;

-- "b-quest-type" — Type list (New Task / Revise 1-5), managed from Settings
-- instead of hardcoded in B_QUEST_CONFIG.listTypes.
create table public."b-quest-type" (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    sort_order integer,
    active boolean not null default true
);

alter table public."b-quest-type" enable row level security;

create policy "b-quest-type_all_authenticated"
    on public."b-quest-type" for all
    to authenticated
    using (true)
    with check (true);

insert into public."b-quest-type" (name, sort_order) values
    ('New Task', 1), ('Revise 1', 2), ('Revise 2', 3), ('Revise 3', 4), ('Revise 4', 5), ('Revise 5', 6);
