-- =========================================================
-- b_finance_qt.created_at / updated_at — found live on BX's
-- production DB (added directly, no migration ever recorded)
-- while syncing BX's data into Brandbox-Test on 2026-09-09.
-- Backfilling the migration so core's schema actually matches
-- what's live, per the standing "check for undocumented drift"
-- note in the fork-per-customer-architecture memory.
-- =========================================================
alter table public.b_finance_qt
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create or replace function public.fn_finance_qt_updated_at()
returns trigger
language plpgsql
as $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

drop trigger if exists trg_finance_qt_updated_at on public.b_finance_qt;
create trigger trg_finance_qt_updated_at
  before update on public.b_finance_qt
  for each row execute function public.fn_finance_qt_updated_at();
