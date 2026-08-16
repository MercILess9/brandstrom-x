alter table public."b-quest-role" add column color text;

update public."b-quest-role" set color = '#3b82f6' where name = 'Designer';
update public."b-quest-role" set color = '#8b5cf6' where name = 'Creative';
