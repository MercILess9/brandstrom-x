-- The plain "designer"/"creative" columns (work name, e.g. "Banner Design")
-- were missed in the original data migration to "b-quest-task-role".

alter table public."b-quest-task-role" add column work text;

update public."b-quest-task-role" tr
set work = bl.designer
from public."b-quest-list" bl
where tr.quest_id = bl.id and tr.role = 'Designer';

update public."b-quest-task-role" tr
set work = bl.creative
from public."b-quest-list" bl
where tr.quest_id = bl.id and tr.role = 'Creative';
