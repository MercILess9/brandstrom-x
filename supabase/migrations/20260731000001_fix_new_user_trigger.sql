-- fn_handle_new_user originally only copied id/email, dropping the
-- codename/employee_id/nick_name/full_name/department fields that
-- auth/signup.html submits via signUp({ options: { data: metadata } }).
-- Those fields land in auth.users.raw_user_meta_data — read them there.
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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
end;
$$;

-- Matches auth/auth.js's expectation that a duplicate codename/employee_id
-- fails signup with a DB error ("Employee ID or codename may already be
-- taken") — enforce it at the DB level.
alter table public.profiles add constraint profiles_codename_key unique (codename);
alter table public.profiles add constraint profiles_employee_id_key unique (employee_id);

-- Backfill the two signups that landed before this fix (their submitted
-- data is preserved in auth.users.raw_user_meta_data).
update public.profiles p
set codename    = u.raw_user_meta_data ->> 'codename',
    employee_id = u.raw_user_meta_data ->> 'employee_id',
    nick_name   = u.raw_user_meta_data ->> 'nick_name',
    full_name   = u.raw_user_meta_data ->> 'full_name',
    department  = u.raw_user_meta_data ->> 'department'
from auth.users u
where p.id = u.id
  and p.codename is null
  and u.raw_user_meta_data ? 'codename';
