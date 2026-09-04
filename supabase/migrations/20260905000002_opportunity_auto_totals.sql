-- Auto-recompute b_opportunity_list.total_amount/total_gp from QT items
-- whenever they change. BX already had this as its own trigger; adding
-- it here too so Test/core matches (safe/additive — recomputes from the
-- same source of truth, doesn't conflict with any frontend calculation).

create or replace function public.fn_update_opp_totals() returns trigger
    language plpgsql
    as $$
DECLARE v_opp_id TEXT;
BEGIN
    SELECT opportunity_id INTO v_opp_id FROM b_opportunity_qt WHERE qt_id = COALESCE(NEW.qt_id, OLD.qt_id);
    IF v_opp_id IS NOT NULL THEN
        UPDATE b_opportunity_list SET
            total_amount = COALESCE((SELECT SUM(i.amount) FROM b_opportunity_qt_item i JOIN b_opportunity_qt q ON i.qt_id = q.qt_id WHERE q.opportunity_id = v_opp_id), 0),
            total_gp     = COALESCE((SELECT SUM(i.gp)     FROM b_opportunity_qt_item i JOIN b_opportunity_qt q ON i.qt_id = q.qt_id WHERE q.opportunity_id = v_opp_id), 0)
        WHERE opportunity_id = v_opp_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END; $$;

create trigger trg_update_opp_totals after insert or delete or update on public.b_opportunity_qt_item
    for each row execute function public.fn_update_opp_totals();
