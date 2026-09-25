-- Upgrades system_project's on/off boolean into a 3-state switch, per the
-- corrected spec: Active (normal) / Disable (grayed out, still shown to
-- anyone with permission) / Hide (invisible to a regular user even with
-- permission — same as no system_project row existed, except GOD never
-- gets this: a Hidden project still renders for GOD, downgraded to the
-- same grayed treatment as Disable, so the admin managing this switch
-- never loses sight of what it's actually set to).
alter table public.system_project add column status text;

update public.system_project
set status = case when active then 'active' else 'disabled' end;

alter table public.system_project alter column status set not null;
alter table public.system_project alter column status set default 'active';
alter table public.system_project add constraint system_project_status_check
  check (status in ('active', 'disabled', 'hidden'));

alter table public.system_project drop column active;
