-- =========================================================
-- STEP 4/4 — B-FINANCE tables
-- b_finance_qt, b_finance_setting
-- =========================================================

-- ---------------------------------------------------------
-- b_finance_qt  (sub-invoice rows split off a single QT)
-- ---------------------------------------------------------
create table public.b_finance_qt (
  id uuid primary key default gen_random_uuid(),
  qt_id uuid not null references public.b_opportunity_qt (qt_id) on delete cascade,
  sub_index integer not null default 1,
  quotation_sub text,
  invoice text,
  actual_amount numeric,
  detail text,
  bill_date date,
  receipt_no text,
  receipt_date date,
  remark text
);

alter table public.b_finance_qt enable row level security;

create policy "b_finance_qt_all_authenticated"
  on public.b_finance_qt for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------
-- b_finance_setting  (per-member permissions for B-FINANCE)
-- ---------------------------------------------------------
create table public.b_finance_setting (
  codename text primary key,
  view boolean not null default false,
  edit boolean not null default false,
  setting boolean not null default false
);

alter table public.b_finance_setting enable row level security;

create policy "b_finance_setting_all_authenticated"
  on public.b_finance_setting for all
  to authenticated
  using (true)
  with check (true);
