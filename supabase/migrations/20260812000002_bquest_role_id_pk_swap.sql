-- Swap "b-quest-role"'s primary key from name (mutable) to a stable id,
-- so renaming a role from Settings never has to touch any other table.
-- "role" (text) columns on task-role/work are left in place for now —
-- app code still reads them and will be cut over to role_id in a
-- follow-up pass, after which the text columns can be dropped.

alter table public."b-quest-role" add column id uuid not null default gen_random_uuid();

alter table public."b-quest-task-role" add column role_id uuid;
update public."b-quest-task-role" tr
set role_id = r.id
from public."b-quest-role" r
where tr.role = r.name;

alter table public."b-quest-work" add column role_id uuid;
update public."b-quest-work" w
set role_id = r.id
from public."b-quest-role" r
where w.role = r.name;

alter table public."b-quest-task-role" drop constraint "b-quest-task-role_role_fkey";
alter table public."b-quest-role" drop constraint "b-quest-role_pkey";
alter table public."b-quest-role" add constraint "b-quest-role_pkey" primary key (id);
alter table public."b-quest-role" add constraint "b-quest-role_name_key" unique (name);

alter table public."b-quest-task-role" alter column role_id set not null;
alter table public."b-quest-task-role"
  add constraint "b-quest-task-role_role_id_fkey" foreign key (role_id) references public."b-quest-role"(id);

alter table public."b-quest-work" alter column role_id set not null;
alter table public."b-quest-work"
  add constraint "b-quest-work_role_id_fkey" foreign key (role_id) references public."b-quest-role"(id);
