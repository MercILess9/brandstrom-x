-- "b-quest-work" still has the legacy "role" text column (not null) from
-- before the role_id migration. Settings' Add Work now only sets role_id,
-- so new rows have no way to satisfy that not-null constraint anymore —
-- confirmed live: "null value in column role... violates not-null
-- constraint" when adding a Work item from Settings.
-- role_id (not null, FK'd) is already the real reference; role (text) is
-- kept only for any remaining legacy reads, so it just needs to stop being
-- required, not be dropped outright yet.
alter table public."b-quest-work" alter column role drop not null;
