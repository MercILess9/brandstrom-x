-- "b-quest-status" — list of statuses, managed from Settings (same shape
-- as "b-quest-role": id-keyed so renaming a status is safe everywhere).
-- is_done marks which status(es) count as "task complete" for the
-- Progress/Done bucket filter and card completion badge.

create table public."b-quest-status" (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    color text,
    is_done boolean not null default false,
    sort_order integer,
    active boolean not null default true
);

alter table public."b-quest-status" enable row level security;

create policy "b-quest-status_all_authenticated"
    on public."b-quest-status" for all
    to authenticated
    using (true)
    with check (true);

insert into public."b-quest-status" (name, color, is_done, sort_order) values
    ('Progress', '#bdc432', false, 1),
    ('Done', '#94a3b8', true, 2);

-- "status" (text) on task-role is left in place for now — app code still
-- reads it and will be cut over to status_id in a follow-up pass.
alter table public."b-quest-task-role" add column status_id uuid;

update public."b-quest-task-role" tr
set status_id = s.id
from public."b-quest-status" s
where tr.status = s.name;

update public."b-quest-task-role" tr
set status_id = (select id from public."b-quest-status" where name = 'Progress')
where tr.status_id is null;

alter table public."b-quest-task-role" alter column status_id set not null;
alter table public."b-quest-task-role"
    add constraint "b-quest-task-role_status_id_fkey" foreign key (status_id) references public."b-quest-status"(id);
