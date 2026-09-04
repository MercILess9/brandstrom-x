-- =========================================================
-- holiday — company holiday list, system-level (not project-
-- specific), managed from system/setting.html's new Holidays
-- tab. Feeds B-Quest's "Skip Holidays" toggle in a later phase
-- (not wired yet — this migration only creates the data store).
-- =========================================================
create table public.holiday (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  date_from date not null,
  date_to date not null,
  description text,
  day_type text not null default 'full' check (day_type in ('full', 'half'))
);

alter table public.holiday enable row level security;

create policy "holiday_select_authenticated"
  on public.holiday for select
  to authenticated
  using (true);

create policy "holiday_write_authenticated"
  on public.holiday for all
  to authenticated
  using (true)
  with check (true);
