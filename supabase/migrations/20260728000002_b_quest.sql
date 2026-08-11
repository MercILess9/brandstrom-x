-- =========================================================
-- STEP 2/4 — B-QUEST tables
-- "b-quest-list", "b-quest-work", b_quest_capacity, "b-quest-setting"
-- =========================================================

-- ---------------------------------------------------------
-- "b-quest-list"  (hyphenated name — must stay quoted)
-- ---------------------------------------------------------
create table public."b-quest-list" (
  id uuid primary key default gen_random_uuid(),
  account_name text,
  opportunity_name text,
  task_name text,
  detail text,
  link text,
  publish_date date,
  owner text,
  last_update timestamptz default now(),

  designer text,
  designer_type text,
  designer_weight numeric,
  designer_day text,
  designer_deadline date,
  designer_assign text,
  designer_status text,

  creative text,
  creative_type text,
  creative_weight numeric,
  creative_day text,
  creative_deadline date,
  creative_assign text,
  creative_status text
);

alter table public."b-quest-list" enable row level security;

create policy "b-quest-list_all_authenticated"
  on public."b-quest-list" for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- "b-quest-work"
-- ---------------------------------------------------------
create table public."b-quest-work" (
  role text not null,
  work text not null,
  day text,
  weight numeric,
  primary key (role, work)
);

alter table public."b-quest-work" enable row level security;

create policy "b-quest-work_all_authenticated"
  on public."b-quest-work" for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- b_quest_capacity
-- ---------------------------------------------------------
create table public.b_quest_capacity (
  role text primary key,
  max_capacity numeric
);

alter table public.b_quest_capacity enable row level security;

create policy "b_quest_capacity_all_authenticated"
  on public.b_quest_capacity for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- "b-quest-setting"  (per-member permissions for B-QUEST)
-- ---------------------------------------------------------
create table public."b-quest-setting" (
  codename text primary key,
  ae boolean not null default false,
  creative boolean not null default false,
  designer boolean not null default false,
  new boolean not null default false,
  edit boolean not null default false,
  delete boolean not null default false,
  assign boolean not null default false,
  setting boolean not null default false
);

alter table public."b-quest-setting" enable row level security;

create policy "b-quest-setting_all_authenticated"
  on public."b-quest-setting" for all
  to authenticated
  using (true)
  with check (true);
