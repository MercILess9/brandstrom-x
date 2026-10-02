-- b_account_list.update_date is NOT NULL but was missing its
-- default now() (present on create_date, and originally specified on
-- update_date too in 20260728000003_b_account.sql — drifted on BX's live
-- DB at some point). No BEFORE INSERT trigger sets it either (only
-- trg_b_account_update_date, which is BEFORE UPDATE only), so every
-- INSERT into b_account_list (i.e. every "New Account" save) violated the
-- NOT NULL constraint and failed. Restoring the default fixes it.

alter table public.b_account_list
  alter column update_date set default now();
