-- account_id padding was 5 digits in the schema since day one
-- (20260728000003) but never actually exercised — every real account
-- row on Test (163 of them) was bulk-imported from BX with pre-formatted
-- 4-digit ids, bypassing the default entirely; CB's b_account_list has
-- zero rows. BX's default has always been 4 digits and is the only one
-- with real production data proving it out. Standardizing on 4 digits
-- everywhere (not 5) since that's what's actually been used, rather than
-- migrating real data to match an untested default. BX needs no change —
-- already 4 digits.
alter table public.b_account_list
  alter column account_id set default ('AC-' || lpad(nextval('public.b_account_id_seq')::text, 4, '0'));
