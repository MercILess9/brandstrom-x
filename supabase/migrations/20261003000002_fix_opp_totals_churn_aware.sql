-- fn_update_opp_totals() (20260905000002) summed EVERY b_opportunity_qt_item
-- row regardless of qt_type ('original'/'churn'), so a churned opportunity's
-- top-of-card Amount/GP never reflected the churn at all — it kept showing
-- the full original Sign total even when 100% churned (Churn ALL), since
-- the original QT rows are deliberately kept as history, never deleted.
-- Partial churn was arguably worse: original (full) + churn (remaining)
-- got ADDED together, inflating the total above the real deal size.
--
-- The separate "Churn Amt/GP" badge (b-opportunity-list.html/
-- b-opportunity-modal.js) already computes the real lost amount correctly
-- (Sign total − Churn remaining total) — this migration makes the
-- top-level total_amount/total_gp columns status-aware instead, so they
-- show "current remaining value" consistently: Churn churn-remaining total
-- (0 when ALL) for a churned opportunity, Sign total otherwise. Item-level
-- data (both original and churn QTs) is untouched — only how the rollup
-- columns are computed changes.
--
-- Also adds a second trigger on b_opportunity_list itself (status change)
-- — the original trigger only fires on b_opportunity_qt_item writes, so
-- flipping status to Churn+ALL when there were never any churn QT rows to
-- begin with (nothing to delete, so the item-level trigger never fires)
-- would leave the stale Sign-based total on screen. Recomputing on every
-- status change closes that gap.
create or replace function public.fn_recompute_opp_totals(p_opp_id text) returns void
    language plpgsql
    as $$
DECLARE v_status TEXT; v_type_filter TEXT;
BEGIN
    SELECT status INTO v_status FROM b_opportunity_list WHERE opportunity_id = p_opp_id;
    v_type_filter := CASE WHEN v_status = 'Churn' THEN 'churn' ELSE 'original' END;
    UPDATE b_opportunity_list SET
        total_amount = COALESCE((
            SELECT SUM(i.amount) FROM b_opportunity_qt_item i JOIN b_opportunity_qt q ON i.qt_id = q.qt_id
            WHERE q.opportunity_id = p_opp_id AND q.qt_type = v_type_filter
        ), 0),
        total_gp = COALESCE((
            SELECT SUM(i.gp) FROM b_opportunity_qt_item i JOIN b_opportunity_qt q ON i.qt_id = q.qt_id
            WHERE q.opportunity_id = p_opp_id AND q.qt_type = v_type_filter
        ), 0)
    WHERE opportunity_id = p_opp_id;
END; $$;

create or replace function public.fn_update_opp_totals() returns trigger
    language plpgsql
    as $$
DECLARE v_opp_id TEXT;
BEGIN
    SELECT opportunity_id INTO v_opp_id FROM b_opportunity_qt WHERE qt_id = COALESCE(NEW.qt_id, OLD.qt_id);
    IF v_opp_id IS NOT NULL THEN
        PERFORM public.fn_recompute_opp_totals(v_opp_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END; $$;

create or replace function public.fn_opp_status_change_totals() returns trigger
    language plpgsql
    as $$
BEGIN
    PERFORM public.fn_recompute_opp_totals(NEW.opportunity_id);
    RETURN NEW;
END; $$;

drop trigger if exists trg_opp_status_change_totals on public.b_opportunity_list;
create trigger trg_opp_status_change_totals
    after update of status on public.b_opportunity_list
    for each row
    when (NEW.status is distinct from OLD.status)
    execute function public.fn_opp_status_change_totals();

-- One-time backfill — recompute every existing opportunity's totals under
-- the new status-aware rule (fixes any already-churned deal currently
-- showing its stale pre-churn total).
do $$
declare r record;
begin
  for r in select opportunity_id from public.b_opportunity_list loop
    perform public.fn_recompute_opp_totals(r.opportunity_id);
  end loop;
end $$;
