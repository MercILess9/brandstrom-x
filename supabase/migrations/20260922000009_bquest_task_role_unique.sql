-- b_quest_task_role never had a uniqueness guarantee on (quest_id, role_id)
-- since the table was created (20260811000003) — nothing stopped two rows
-- existing for the same role on the same task. Found live on BX: BQ-0544
-- had two separate "Designer" rows (same role_id, different status/type),
-- most likely from a double-click/slow-network double-submit in the modal
-- (b-quest-modal.js's submitForm decides insert-vs-update from an in-memory
-- map built when the modal opened, so two near-simultaneous submits both
-- see "no existing row" and both insert). The modal now guards against that
-- race directly (submit button disabled for the duration of the save) —
-- this constraint is the second line of defense at the data layer, so a
-- future bug of the same shape fails loudly instead of silently
-- duplicating a row.
--
-- Checked first: no existing duplicate (quest_id, role_id) pairs on Local/
-- Test, so this applies cleanly here. Must re-check BX/CB for their own
-- duplicates before applying there — a leftover duplicate would make this
-- statement fail outright.
alter table public.b_quest_task_role
  add constraint b_quest_task_role_quest_role_key unique (quest_id, role_id);
