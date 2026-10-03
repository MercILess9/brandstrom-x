-- system_access.bdashboard has been dead since the Dashboard project was
-- cut from PROJECTS/PROJECT_LIST (2026-09-25) — confirmed via full-repo
-- grep (no .html/.js/.sql file references it) 2026-10-03. Documented as
-- dead in CLAUDE.md's DB schema table; dropping it per explicit request.

alter table public.system_access drop column if exists bdashboard;
