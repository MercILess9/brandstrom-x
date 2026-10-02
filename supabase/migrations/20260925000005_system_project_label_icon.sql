-- Lets an admin rename a project's display label and pick its icon from
-- Settings, instead of both being fixed by index.html's hardcoded
-- PROJECTS array. Nullable, no backfill — null means "use the hardcoded
-- default" (same absent-row-is-default convention as status/sort_order),
-- so nothing needs seeding for existing rows or newly-added projects.
alter table public.system_project add column if not exists label text;
alter table public.system_project add column if not exists icon text;
