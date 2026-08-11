-- =========================================================
-- STEP 3/4 — B-ACCOUNT tables
-- b_account_list, b_opportunity_list, b_opportunity_qt,
-- b_opportunity_qt_item, b_opp_config, "b-account-setting"
-- =========================================================

-- ---------------------------------------------------------
-- b_account_list
-- account_id format: 'ACC-00001' (via dedicated sequence)
-- ---------------------------------------------------------
create sequence public.b_account_id_seq;

create table public.b_account_list (
  account_id text primary key
    default ('ACC-' || lpad(nextval('public.b_account_id_seq')::text, 5, '0')),
  account_name text,
  company_name text,
  address text,
  tax_id text,
  contact text,
  document text,
  payment text,
  remark text,
  status text not null default 'Active',
  create_by text,
  create_date timestamptz not null default now(),
  update_by text,
  update_date timestamptz not null default now()
);

create trigger trg_b_account_list_update_date
  before update on public.b_account_list
  for each row execute function public.fn_set_update_date();

alter table public.b_account_list enable row level security;

create policy "b_account_list_all_authenticated"
  on public.b_account_list for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- b_opportunity_list
-- ---------------------------------------------------------
create table public.b_opportunity_list (
  opportunity_id uuid primary key default gen_random_uuid(),
  account_id text references public.b_account_list (account_id),
  opportunity_name text,
  business_type text,
  lead_source text,
  owner text,
  am text,
  sub_am text,
  signed_date date,
  launch_date date,
  churn_date date,
  materials text,
  proposal text,
  campaign text,
  remark text,
  total_amount numeric,
  total_gp numeric,
  status text,
  create_by text,
  create_date timestamptz not null default now(),
  update_by text,
  update_date timestamptz not null default now()
);

create trigger trg_b_opportunity_list_update_date
  before update on public.b_opportunity_list
  for each row execute function public.fn_set_update_date();

alter table public.b_opportunity_list enable row level security;

create policy "b_opportunity_list_all_authenticated"
  on public.b_opportunity_list for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- b_opportunity_qt
-- ---------------------------------------------------------
create table public.b_opportunity_qt (
  qt_id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.b_opportunity_list (opportunity_id) on delete cascade,
  qt_number text,
  company_qt text,
  qt_type text  -- 'original' | 'churn'
);

alter table public.b_opportunity_qt enable row level security;

create policy "b_opportunity_qt_all_authenticated"
  on public.b_opportunity_qt for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- b_opportunity_qt_item
-- ---------------------------------------------------------
create table public.b_opportunity_qt_item (
  item_id uuid primary key default gen_random_uuid(),
  qt_id uuid not null references public.b_opportunity_qt (qt_id) on delete cascade,
  no integer,
  bu text,
  detail text,
  qty numeric,
  price numeric,
  discount numeric,
  gp numeric,
  amount numeric
);

alter table public.b_opportunity_qt_item enable row level security;

create policy "b_opportunity_qt_item_all_authenticated"
  on public.b_opportunity_qt_item for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- b_opp_config  (dropdown option store: status / business_type /
-- company / bu / lead_source)
-- ---------------------------------------------------------
create table public.b_opp_config (
  type text not null,
  value text not null,
  primary key (type, value)
);

alter table public.b_opp_config enable row level security;

create policy "b_opp_config_all_authenticated"
  on public.b_opp_config for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- "b-account-setting"  (per-member permissions for B-ACCOUNT)
-- ---------------------------------------------------------
create table public."b-account-setting" (
  codename text primary key,
  ae boolean not null default false,
  new boolean not null default false,
  edit boolean not null default false,
  delete boolean not null default false,
  setting boolean not null default false
);

alter table public."b-account-setting" enable row level security;

create policy "b-account-setting_all_authenticated"
  on public."b-account-setting" for all
  to authenticated
  using (true)
  with check (true);
