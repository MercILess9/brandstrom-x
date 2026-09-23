-- Full FK audit across Test/BX/CB (2026-09-22) found BX missing 2 foreign
-- keys that Test and CB both already have correctly:
--
-- b_finance_qt.qt_id -> b_opportunity_qt(qt_id) ON DELETE CASCADE: BX had
-- a UNIQUE(qt_id, sub_index) instead of a real FK, so deleting an
-- Opportunity's QT never cleaned up its Finance billing rows. Confirmed
-- live: user had created + deleted test Opportunities on BX, found 6
-- orphaned b_finance_qt rows left behind as a result (5 confirmed test
-- data, 1 real historical record whose parent Opportunity was deleted
-- with no trace left anywhere else in the DB) — all 6 manually cleaned
-- up before adding this constraint back.
--
-- b_opportunity_list.account_id -> b_account_list(account_id): plain
-- missing, no orphans found (0 rows) so added directly, no cleanup
-- needed.
--
-- Both confirmed present on Test and CB already — this brings BX to
-- parity, not a new platform-wide addition.
alter table public.b_finance_qt
  add constraint b_finance_qt_qt_id_fkey
  foreign key (qt_id) references public.b_opportunity_qt(qt_id) on delete cascade;

alter table public.b_finance_qt drop constraint if exists b_finance_qt_qt_id_sub_index_key;

alter table public.b_opportunity_list
  add constraint b_opportunity_list_account_id_fkey
  foreign key (account_id) references public.b_account_list(account_id);
