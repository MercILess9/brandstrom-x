-- fn_cascade_codename_rename() never covered b_opportunity_list
-- (owner/am/sub_am/create_by/update_by) or b_account_list.update_by —
-- only b_account_list.create_by was included. Renaming a codename left
-- these columns pointing at the old string, silently splitting one
-- person into "old codename" and "new codename" rows anywhere Opportunity
-- data is grouped by owner (e.g. the B-Account Dashboard Sales
-- Performance table). Found while auditing cascade coverage against the
-- live schema, not from a reported incident.

create or replace function public.fn_cascade_codename_rename() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
begin
  if new.codename is distinct from old.codename and old.codename is not null then
    update public.setting_project set codename = new.codename where codename = old.codename;
    update public.b_account_setting set codename = new.codename where codename = old.codename;
    update public.b_finance_setting set codename = new.codename where codename = old.codename;
    update public.b_quest_member_role set codename = new.codename where codename = old.codename;
    update public.b_quest_member set codename = new.codename where codename = old.codename;
    update public.b_quest_task_role set assign = new.codename where assign = old.codename;
    update public.b_quest_list set owner = new.codename where owner = old.codename;
    update public.b_account_list set create_by = new.codename where create_by = old.codename;
    update public.b_account_list set update_by = new.codename where update_by = old.codename;
    update public.b_opportunity_list set owner = new.codename where owner = old.codename;
    update public.b_opportunity_list set am = new.codename where am = old.codename;
    update public.b_opportunity_list set sub_am = new.codename where sub_am = old.codename;
    update public.b_opportunity_list set create_by = new.codename where create_by = old.codename;
    update public.b_opportunity_list set update_by = new.codename where update_by = old.codename;
  end if;
  return new;
end;
$$;
