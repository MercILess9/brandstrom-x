-- =========================================================
-- STEP 1/4 — Core / System tables
-- departments, profiles, setting_project
-- =========================================================

-- ---------------------------------------------------------
-- departments
-- ---------------------------------------------------------
create table public.departments (
  name text primary key
);

alter table public.departments enable row level security;

create policy "departments_select_authenticated"
  on public.departments for select
  to authenticated
  using (true);

create policy "departments_write_authenticated"
  on public.departments for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- profiles
-- 1 row per auth.users row, created automatically on signup
-- ---------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  codename text,
  employee_id text,
  nick_name text,
  full_name text,
  email text,
  department text references public.departments (name) on update cascade,
  level text not null default 'user',   -- 'user' | 'god'
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- internal tool: any authenticated user can read the full directory
-- (permission gating for what they can DO with it lives in the JS layer,
--  per each project's own <project>-setting table)
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_authenticated"
  on public.profiles for update
  to authenticated
  using (true)
  with check (true);

create policy "profiles_delete_authenticated"
  on public.profiles for delete
  to authenticated
  using (true);

-- Auto-create a profiles row whenever a new auth.users row is created
-- (signup.html only writes to auth via supabase.auth.signUp — there is no
--  client-side insert into profiles anywhere in the codebase, so this
--  trigger must be what populates it)
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();


-- ---------------------------------------------------------
-- setting_project
-- per-project access toggles, keyed by codename
-- ---------------------------------------------------------
create table public.setting_project (
  codename text primary key,
  bquest boolean not null default false,
  bdashboard boolean not null default false,
  baccount boolean not null default false,
  bcommission boolean not null default false,
  bfinance boolean not null default false,
  system_setting boolean not null default false
);

alter table public.setting_project enable row level security;

create policy "setting_project_select_authenticated"
  on public.setting_project for select
  to authenticated
  using (true);

create policy "setting_project_write_authenticated"
  on public.setting_project for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- shared trigger fn used by later steps (b_account_list,
-- b_opportunity_list, etc. — tables with create_date/update_date)
-- created here once, attached per-table in later steps
-- ---------------------------------------------------------
create or replace function public.fn_set_update_date()
returns trigger
language plpgsql
as $$
begin
  new.update_date := now();
  return new;
end;
$$;
