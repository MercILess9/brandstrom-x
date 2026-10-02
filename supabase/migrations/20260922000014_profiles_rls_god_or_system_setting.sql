-- profiles is the most sensitive table in the platform (profiles.level
-- is the definition of who's "god"), but Test/CB's UPDATE/DELETE
-- policies were qual=true — any authenticated user could set their own
-- level to 'god' or delete any other profile via a direct API call,
-- bypassing the UI entirely. BX had real restrictions (god-only for
-- UPDATE, god-or-system_setting for DELETE, plus a literal duplicate
-- "god can delete" policy) but its own UPDATE policy was ALSO wrong —
-- missing the system_setting=true case that DELETE already had, even
-- though system/setting.html's guardSystemSetting()/guardAfterLoad()
-- let BOTH god and system_setting=true admins into the page that calls
-- .from('profiles').update(...). A system_setting-only admin on BX could
-- reach the Users & Access page but any edit they made would silently
-- fail at the DB — a real, previously-unreported bug.
--
-- Checked the whole codebase first: system/setting.html is the ONLY
-- place that ever calls .from('profiles').update/.delete — always
-- behind that same god-or-system_setting gate — so restricting the DB
-- to match doesn't break any legitimate path anywhere.
--
-- Replaces every profiles UPDATE/DELETE policy on all 3 projects with
-- one clean pair, both using the correct god-OR-system_setting check.
-- SELECT stays open to authenticated (every page needs to read the
-- roster for display). Written against system_access (post-rename
-- name); applied against BX/CB today using their still-current
-- setting_project name.
drop policy if exists "profiles_delete_authenticated" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_authenticated" on public.profiles;
drop policy if exists "God can delete any profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "authenticated can read all profiles" on public.profiles;
drop policy if exists "god can delete profiles" on public.profiles;
drop policy if exists "god can update all profiles" on public.profiles;
drop policy if exists "system_setting can delete profiles" on public.profiles;
drop policy if exists "profiles_update_god_or_system_setting" on public.profiles;
drop policy if exists "profiles_delete_god_or_system_setting" on public.profiles;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_god_or_system_setting"
  on public.profiles for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.level = 'god')
    or exists (
      select 1 from public.system_access sa
      join public.profiles p on p.codename = sa.codename
      where p.id = auth.uid() and sa.system_setting = true
    )
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.level = 'god')
    or exists (
      select 1 from public.system_access sa
      join public.profiles p on p.codename = sa.codename
      where p.id = auth.uid() and sa.system_setting = true
    )
  );

create policy "profiles_delete_god_or_system_setting"
  on public.profiles for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.level = 'god')
    or exists (
      select 1 from public.system_access sa
      join public.profiles p on p.codename = sa.codename
      where p.id = auth.uid() and sa.system_setting = true
    )
  );
