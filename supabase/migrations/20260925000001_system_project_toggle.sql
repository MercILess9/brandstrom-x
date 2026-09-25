-- Lets an admin turn an already-built project on/off platform-wide
-- (maintenance, holding back a launch) without a code deploy — separate
-- from system_access, which is per-USER permission, not a global switch.
-- No rows are seeded: an absent row means "on" (matches system_setting's
-- own no-seed convention) so a newly-added project in index.html's
-- PROJECTS array is live by default, never silently hidden just because
-- nobody remembered to insert a row for it. Same RLS shape as every
-- other admin-config table (open to any authenticated user — access
-- control is UI-side only).
create table public.system_project (
  key    text primary key,
  active boolean not null default true
);

alter table public.system_project enable row level security;

create policy "system_project_all_authenticated"
  on public.system_project for all
  to authenticated
  using (true)
  with check (true);
