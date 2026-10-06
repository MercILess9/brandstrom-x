-- Backs the Access tab's "Force Logout" action — deletes every row in
-- auth.sessions for a user, which invalidates every refresh token tied to
-- those sessions, signing them out of every device at once (the next
-- time any of their access tokens expire, there's nothing left to refresh
-- against). SECURITY DEFINER so the admin-manage-account Edge Function
-- can call it via service_role without needing direct table-level access
-- to the auth schema — same pattern already used by
-- delete_auth_user_on_profile_delete().
create or replace function public.fn_force_logout_user(target_id uuid)
returns void
language plpgsql security definer
set search_path to 'public'
as $$
begin
  delete from auth.sessions where user_id = target_id;
end;
$$;
