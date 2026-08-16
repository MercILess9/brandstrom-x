-- =========================================================
-- B-QUEST human-readable quest_id (BQ-0001, BQ-0002, ...)
-- Adds alongside the existing UUID "id" — id keeps being the
-- FK target for "b-quest-task-role", quest_id is just for
-- display/search.
-- =========================================================

create sequence public.bquest_id_seq;

-- create_date already exists on the live DB (added by hand via the SQL
-- Editor at some point, never tracked in a migration until now) — add it
-- here too, so a fresh install ends up with the same column this backfill
-- relies on below.
alter table public."b-quest-list" add column if not exists create_date timestamptz not null default now();

-- add nullable first, no default yet, so ADD COLUMN is metadata-only (fast)
alter table public."b-quest-list" add column quest_id text;

-- backfill existing rows in creation order (starts from NULL, no uniqueness conflict)
with ordered as (
  select id, row_number() over (order by create_date, id) as rn
  from public."b-quest-list"
)
update public."b-quest-list" t
set quest_id = 'BQ-' || lpad(o.rn::text, 4, '0')
from ordered o
where t.id = o.id;

-- now that data is unique, enforce it + set default for future inserts
alter table public."b-quest-list" add constraint "b-quest-list_quest_id_key" unique (quest_id);

alter table public."b-quest-list"
  alter column quest_id set default ('BQ-' || lpad(nextval('public.bquest_id_seq')::text, 4, '0'));

-- move the sequence past the backfilled rows so new inserts continue correctly
select setval('public.bquest_id_seq', (select count(*) from public."b-quest-list"));
