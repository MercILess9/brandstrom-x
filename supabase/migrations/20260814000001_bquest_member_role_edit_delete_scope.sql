-- Scope narrows WHO's tasks an Edit/Delete grant applies to, independent of
-- the boolean grant itself. Two values, 'own' | 'all', but 'own' means
-- something stricter for delete than for edit (decided in-app, not
-- constrained here):
--   edit_scope 'own'   = tasks they created (full), or are assigned to
--                        (limited to that role's fields)
--   delete_scope 'own' = tasks they created ONLY — being merely assigned
--                        isn't enough, since deleting removes the whole
--                        task, not just their role's slice of it
--   'all' (either)     = every task that has this role, regardless of
--                        whether they're the owner or assigned to it
-- Defaults to 'own' (least-privilege) — a grant only reaches beyond the
-- member's own/assigned work once someone deliberately widens it to 'all'.
alter table public."b-quest-member-role" add column edit_scope text not null default 'own';
alter table public."b-quest-member-role" add column delete_scope text not null default 'own';
