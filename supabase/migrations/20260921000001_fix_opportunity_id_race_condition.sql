-- =========================================================
-- b_opportunity_list.opportunity_id — fix race condition in
-- ID generation.
--
-- fn_generate_opportunity_id() was never tracked in a
-- migration before this (found live on BX production via the
-- Management API while investigating a real "duplicate key
-- value violates unique constraint b_opportunity_list_pkey"
-- error). It builds the id as 'OP-<account number>-<seq>',
-- where <seq> comes from `SELECT COUNT(*) + 1 ... WHERE
-- account_id = NEW.account_id` — not a real sequence, so two
-- opportunities created for the SAME account at nearly the
-- same time can both compute the same count and collide.
--
-- Fix: take a transaction-scoped advisory lock keyed on
-- account_id before counting, so concurrent inserts for the
-- same account serialize instead of racing. Id format and
-- existing data are unchanged.
-- =========================================================
CREATE OR REPLACE FUNCTION public.fn_generate_opportunity_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE v_acct_num TEXT; v_seq INT;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.account_id));
    v_acct_num := SUBSTRING(NEW.account_id FROM 4);
    SELECT COUNT(*) + 1 INTO v_seq FROM b_opportunity_list WHERE account_id = NEW.account_id;
    NEW.opportunity_id := 'OP-' || v_acct_num || '-' || LPAD(v_seq::TEXT, 3, '0');
    RETURN NEW;
END; $function$;
