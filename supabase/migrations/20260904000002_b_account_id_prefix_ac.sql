-- account_id prefix: 'ACC-' -> 'AC-', to match Brandstrom-X production
-- (which already has ~380 real accounts as 'AC-xxxxx' via its own
-- long-standing generate_account_id() trigger — changing BX's real data
-- isn't worth it, so the shared default is changed to match instead).

alter table public.b_account_list
  alter column account_id set default ('AC-' || lpad(nextval('public.b_account_id_seq')::text, 5, '0'));
