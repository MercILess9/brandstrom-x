-- Found via a full function/trigger diff across Test/BX/CB (2026-09-22):
-- two pieces of BX-only "hidden automation" never captured in any
-- migration file, plus one genuine regression between BX's old signup
-- function and the newer one everyone else runs.
--
-- fn_handle_new_user: BX's on_auth_user_created trigger still points at
-- an old, unmigrated handle_new_user() with a friendly duplicate-key
-- error message but no search_path pin; Test/CB's fn_handle_new_user()
-- has the search_path pin (SECURITY DEFINER hardening) but lost the
-- friendly error along the way. Merging both properties into
-- fn_handle_new_user and pointing every instance's trigger at it —
-- BX's old handle_new_user() is left in place but now orphaned (same
-- as generate_account_id/update_last_update_column, already dead there).
create or replace function public.fn_handle_new_user() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
begin
  insert into public.profiles (id, email, codename, employee_id, nick_name, full_name, department)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'codename',
    new.raw_user_meta_data ->> 'employee_id',
    new.raw_user_meta_data ->> 'nick_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'department'
  );
  return new;
exception
  when unique_violation then
    raise exception 'Employee ID or codename already registered';
end;
$$;

-- delete_auth_user_on_profile_delete: only existed on BX. Deleting a
-- profile without this leaves an orphaned auth.users row (can't log in
-- since it has no profile, but the account itself never gets cleaned
-- up) — confirmed missing on both Test and CB. Standardizing everywhere.
create or replace function public.delete_auth_user_on_profile_delete() returns trigger
    language plpgsql security definer
    as $$
begin
  delete from auth.users where id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_delete_auth_user on public.profiles;
create trigger trg_delete_auth_user
  after delete on public.profiles
  for each row execute function public.delete_auth_user_on_profile_delete();

-- BX's on_auth_user_created trigger still pointed at the old handle_new_user()
-- (never repointed when fn_handle_new_user was introduced) — Test/CB already
-- point at fn_handle_new_user, so recreating this there is a no-op; on BX it
-- actually fixes the trigger to run the merged function above.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();
