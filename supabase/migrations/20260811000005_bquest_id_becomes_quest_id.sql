-- =========================================================
-- B-QUEST: replace UUID "id" with the human-readable quest_id
-- (BQ-0001, ...) as the real primary key — matches the
-- AC-0001 / OP-0001-001 pattern already used by B-Account.
-- =========================================================

BEGIN;

-- 1. bring "b-quest-task-role".task_id along: map from UUID to quest_id first
ALTER TABLE public."b-quest-task-role" ADD COLUMN task_quest_id text;

UPDATE public."b-quest-task-role" tr
SET task_quest_id = bl.quest_id
FROM public."b-quest-list" bl
WHERE tr.task_id = bl.id;

ALTER TABLE public."b-quest-task-role" DROP CONSTRAINT "b-quest-task-role_task_id_fkey";
ALTER TABLE public."b-quest-task-role" DROP COLUMN task_id;
ALTER TABLE public."b-quest-task-role" RENAME COLUMN task_quest_id TO task_id;
ALTER TABLE public."b-quest-task-role" ALTER COLUMN task_id SET NOT NULL;

-- 2. promote quest_id to be the real primary key on "b-quest-list"
ALTER TABLE public."b-quest-list" DROP CONSTRAINT "b-quest-list_pkey";
ALTER TABLE public."b-quest-list" DROP COLUMN id;
ALTER TABLE public."b-quest-list" RENAME COLUMN quest_id TO id;
ALTER TABLE public."b-quest-list" ADD PRIMARY KEY (id);
ALTER TABLE public."b-quest-list" ALTER COLUMN id SET DEFAULT
  ('BQ-' || lpad(nextval('public.bquest_id_seq')::text, 4, '0'));

-- 3. re-link "b-quest-task-role".task_id to the new id
ALTER TABLE public."b-quest-task-role"
  ADD CONSTRAINT "b-quest-task-role_task_id_fkey"
  FOREIGN KEY (task_id) REFERENCES public."b-quest-list"(id) ON DELETE CASCADE;

COMMIT;
