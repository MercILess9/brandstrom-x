-- fn_generate_opportunity_id() computed the next sequence number as
-- COUNT(*) + 1 per account_id — correct only as long as no opportunity in
-- the middle of that account's sequence is ever deleted. Once one is
-- (confirmed live on BX: AC-0092 has OP-0092-001..004,006..008, 005
-- deleted — 7 rows but highest used number is 8), COUNT undercounts and
-- the next insert recomputes an id that already exists, failing with
-- "duplicate key value violates unique constraint b_opportunity_list_pkey"
-- — and permanently so, since a failed insert doesn't change the count,
-- the exact same collision recomputes on every retry. This is a DIFFERENT
-- root cause than 20260921000001_fix_opportunity_id_race_condition.sql's
-- concurrent-double-click race (that fix, the advisory lock, is correct
-- and kept as-is below) — found live on BX 2026-10-03 while investigating
-- a reported "Create Opportunity" failure.
--
-- Fix: derive the next number from the MAX existing sequence number for
-- that account instead of a row count, so a gap from a past delete can
-- never cause a future collision. Confirmed via a full-table scan that at
-- least 4 BX accounts (AC-0092, AC-0103, AC-0088, AC-0111) currently have
-- such a gap and would hit this on their next "New Opportunity" — this
-- fix resolves all of them without needing any data backfill, since new
-- ids are computed from existing data at insert time either way.
CREATE OR REPLACE FUNCTION public.fn_generate_opportunity_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE v_acct_num TEXT; v_seq INT;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.account_id));
    v_acct_num := SUBSTRING(NEW.account_id FROM 4);
    SELECT COALESCE(MAX((regexp_match(opportunity_id, '-(\d+)$'))[1]::int), 0) + 1
      INTO v_seq
      FROM b_opportunity_list
      WHERE account_id = NEW.account_id;
    NEW.opportunity_id := 'OP-' || v_acct_num || '-' || LPAD(v_seq::TEXT, 3, '0');
    RETURN NEW;
END; $function$;
