-- BX's setting_project/system_access table carried 3 restrictive RLS
-- policies (admin_full via is_system_admin(), god_full, read_own) never
-- present on Test/CB, which instead use the platform's documented
-- standard for this class of table: RLS open to any authenticated user,
-- access control enforced UI-side only (see CLAUDE.md). Found via a full
-- RLS diff across all 3 projects 2026-09-22.
--
-- Decided NOT to harden Test/CB to match BX — every other admin-facing
-- table (profiles, b_quest_member_role, etc.) is still wide open at the
-- DB level, so locking down just this one table doesn't close any real
-- gap, just adds inconsistency. Simplifying BX down to the standard
-- instead. Written against system_access (this migration's number sorts
-- after 20260922000007's rename) — applied directly against BX today
-- using its still-current setting_project name; harmless no-op on
-- Test/CB, which already only have the 2 standard policies below.
drop policy if exists admin_full on public.system_access;
drop policy if exists god_full on public.system_access;
drop policy if exists read_own on public.system_access;
drop policy if exists system_access_select_authenticated on public.system_access;
drop policy if exists system_access_write_authenticated on public.system_access;
drop policy if exists setting_project_select_authenticated on public.system_access;
drop policy if exists setting_project_write_authenticated on public.system_access;

create policy "setting_project_select_authenticated"
  on public.system_access for select
  to authenticated
  using (true);

create policy "setting_project_write_authenticated"
  on public.system_access for all
  to authenticated
  using (true)
  with check (true);
