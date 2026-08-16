-- =========================================================
-- B-QUEST flexible roles (replaces hardcoded designer/creative
-- columns on "b-quest-list" with an unlimited, admin-manageable
-- set of roles)
-- =========================================================

-- ---------------------------------------------------------
-- "b-quest-role"  — list of roles, managed from Settings
-- ---------------------------------------------------------
create table public."b-quest-role" (
  name text primary key,
  active boolean not null default true
);

alter table public."b-quest-role" enable row level security;

create policy "b-quest-role_all_authenticated"
  on public."b-quest-role" for all
  to authenticated
  using (true)
  with check (true);

insert into public."b-quest-role" (name) values ('Designer'), ('Creative');


-- ---------------------------------------------------------
-- "b-quest-task-role"  — one row per role opened on a task
-- ---------------------------------------------------------
create table public."b-quest-task-role" (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public."b-quest-list"(id) on delete cascade,
  role text not null references public."b-quest-role"(name),
  weight numeric,
  type text,
  deadline date,
  assign text,
  status text
);

alter table public."b-quest-task-role" enable row level security;

create policy "b-quest-task-role_all_authenticated"
  on public."b-quest-task-role" for all
  to authenticated
  using (true)
  with check (true);
