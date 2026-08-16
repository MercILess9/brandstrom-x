-- Drop the "ae" bypass flag — permissions are now purely per-role via
-- "b-quest-member-role"; there's no special-cased "position" that grants
-- access regardless of role. Anyone needing broad access gets explicit
-- permission rows per role instead.
--
-- This also removes the "auto-filter List to my own owned tasks" behavior
-- that was tied to this flag (app code will be updated separately).

alter table public."b-quest-member" drop column ae;
