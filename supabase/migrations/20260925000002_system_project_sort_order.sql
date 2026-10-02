-- Backs the drag-reorder UI added to system/setting.html's Projects
-- section (same sort_order + drag-handle pattern as system_department).
-- Nullable, no backfill — display order falls back to PROJECT_LIST's own
-- array order wherever sort_order is null, so existing rows (created
-- before this column existed) don't need a value to keep working.
alter table public.system_project add column if not exists sort_order integer;
