-- BX drifted from Local/Test/CB's NOT NULL constraints on a set of
-- boolean permission/access columns and a couple of profile fields —
-- found via a full 3-way schema diff (BX vs CB vs Test) 2026-09-22. CB
-- already matches Test on every column below (it was built against the
-- current schema fresh rather than migrated from BX's old flat data),
-- so this is a BX-specific catch-up, not a new platform-wide rule.
-- Included for Test/CB too since re-applying an already-satisfied NOT
-- NULL is a harmless no-op — keeps every instance on the same migration
-- set regardless of which one actually needed the change.
--
-- Checked first: zero NULL rows across all 14 columns on BX, so this
-- applies cleanly with no data cleanup needed.
alter table public.b_account_list alter column status set not null;

alter table public.b_account_setting alter column ae set not null;
alter table public.b_account_setting alter column delete set not null;
alter table public.b_account_setting alter column edit set not null;
alter table public.b_account_setting alter column new set not null;
alter table public.b_account_setting alter column setting set not null;

alter table public.b_finance_setting alter column edit set not null;
alter table public.b_finance_setting alter column setting set not null;
alter table public.b_finance_setting alter column view set not null;

alter table public.profiles alter column created_at set not null;
alter table public.profiles alter column level set not null;

-- Uses system_access (this migration's number sorts after 20260922000007,
-- the rename migration, so any instance replaying the full sequence in
-- order will already have renamed setting_project by the time it gets
-- here). Applied directly against BX today ahead of that rename with the
-- then-current name (setting_project) instead — harmless: when BX later
-- actually runs 20260922000007, the constraint added today survives the
-- rename intact, and replaying this file at that point is then a no-op.
alter table public.system_access alter column bcommission set not null;
alter table public.system_access alter column bdashboard set not null;
alter table public.system_access alter column system_setting set not null;
