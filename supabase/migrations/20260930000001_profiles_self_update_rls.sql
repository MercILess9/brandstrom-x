-- Lets a logged-in user update their OWN profiles row (nick_name,
-- full_name, department, avatar_url) from the new self-service Edit
-- Profile modal (system/profile-modal.js), without granting them the
-- rest of what profiles_update_god_or_system_setting already covers
-- (that policy stays as-is — this is a second, additive policy for the
-- "own row" case, not a replacement).
--
-- Row-level RLS alone isn't enough here: it only gates *which row*, not
-- *which columns*. A user with a valid session could otherwise call
-- .from('profiles').update({level:'god'}).eq('id', myId) directly from
-- devtools, bypassing the UI (which only ever sends the safe fields) —
-- RLS has no concept of "this column is off-limits". The trigger below
-- is the actual column-level guard: non-admins get blocked from
-- changing employee_id/level outright, and codename may only change to
-- the value the app itself computes from nick_name (same buildCodename()
-- formula system/setting.html's admin edit flow already uses:
-- "{nick_name} ({employee_id})") — never to an arbitrary value. This
-- keeps codename edits flowing through the existing cascade-rename
-- trigger (trg_profiles_cascade_codename) exactly like an admin edit
-- does, just gated to only the legitimate nick_name-driven case for a
-- self-edit.
drop policy if exists "profiles_update_self" on public.profiles;

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.fn_profiles_guard_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
  expected_codename text;
begin
  select
    (p.level = 'god')
    or coalesce((
      select sa.system_setting
      from public.system_access sa
      where sa.codename = p.codename
    ), false)
  into is_admin
  from public.profiles p
  where p.id = auth.uid();

  if is_admin then
    return new;
  end if;

  if new.employee_id is distinct from old.employee_id then
    raise exception 'employee_id can only be changed by an administrator';
  end if;

  if new.level is distinct from old.level then
    raise exception 'level can only be changed by an administrator';
  end if;

  if new.codename is distinct from old.codename then
    expected_codename := case
      when old.employee_id is not null and btrim(old.employee_id) <> ''
        then btrim(new.nick_name) || ' (' || btrim(old.employee_id) || ')'
      else btrim(new.nick_name)
    end;

    if new.codename is distinct from expected_codename then
      raise exception 'codename can only change as a computed result of nick_name (self-edit)';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_self_update on public.profiles;

create trigger trg_profiles_guard_self_update
  before update on public.profiles
  for each row
  execute function public.fn_profiles_guard_self_update();
