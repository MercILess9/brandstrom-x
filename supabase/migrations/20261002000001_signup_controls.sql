-- Adds real, non-bypassable enforcement for 2 admin-configurable signup
-- controls, both driven by key-value rows in the existing system_setting
-- table (same table Branding already uses) and checked inside
-- fn_handle_new_user() — the AFTER INSERT trigger on auth.users that
-- already runs on every signup. Raising an exception in here rolls back
-- the entire auth.users insert (not just the profiles insert below), so
-- this can't be bypassed by calling supabaseClient.auth.signUp() directly
-- from devtools, unlike a client-side-only toggle would be.
--
-- signup_allow_new ('true'/'false', absent = open) — lets an admin close
-- registration entirely, e.g. if a signup link leaked.
-- signup_domain_lock_enabled ('true'/'false', absent = off) +
-- signup_allowed_domains (comma-separated domain list, e.g.
-- 'brandboxplatform.com,cloudbound.co.th') — when the lock is on, only
-- emails ending in one of the listed domains may register.
--
-- A 3rd control ("Email Confirm") was considered but deliberately left
-- out — whether Supabase requires email confirmation is decided inside
-- Supabase Auth's own internal flow before this trigger ever runs, so
-- there's nothing here that could enforce or even detect it.
--
-- Pure superset of the current fn_handle_new_user() (from
-- 20260922000012_unify_signup_and_delete_auth_user.sql) — the existing
-- profiles insert and its unique_violation handler are unchanged.
create or replace function public.fn_handle_new_user() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
declare
  v_allow_new text;
  v_lock_enabled text;
  v_allowed_domains text;
begin
  select value into v_allow_new from public.system_setting where key = 'signup_allow_new';
  if v_allow_new = 'false' then
    raise exception 'Signups are currently closed. Please contact your administrator.';
  end if;

  select value into v_lock_enabled from public.system_setting where key = 'signup_domain_lock_enabled';
  if v_lock_enabled = 'true' then
    select value into v_allowed_domains from public.system_setting where key = 'signup_allowed_domains';
    if v_allowed_domains is not null and not (
      lower(split_part(new.email, '@', 2)) = any (
        string_to_array(lower(regexp_replace(v_allowed_domains, '\s', '', 'g')), ',')
      )
    ) then
      raise exception 'Your email domain is not allowed to register. Please contact your administrator.';
    end if;
  end if;

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
