-- The reorder in 20260922000001 wasn't actually enough: with a plain
-- (non-deferrable) FK, Postgres checks it immediately after EACH
-- statement, not once at the end of the transaction. Renaming
-- b_quest_member.codename before b_quest_member_role.codename catches
-- the FK check while the child still points at the old value ("update
-- or delete on table b_quest_member violates foreign key constraint
-- b-quest-member-role_codename_fkey") — the reverse order fails the
-- same way in the opposite direction (the version this fixed
-- previously). There's no ordering of two separate immediately-checked
-- UPDATEs that can satisfy this constraint mid-transaction; the real
-- fix is deferring the check to transaction commit, by which point
-- both tables have the new codename.
alter table public.b_quest_member_role
  alter constraint "b-quest-member-role_codename_fkey" deferrable initially deferred;
