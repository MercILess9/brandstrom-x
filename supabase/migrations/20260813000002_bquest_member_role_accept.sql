-- "Accept" — a member's eligibility to RECEIVE work assigned to them in a
-- role, distinct from "Assign" (the authority to hand work to others).
-- Someone can have Assign without Accept (a lead who delegates but doesn't
-- take direct assignments) or Accept without Assign (a regular contributor).
alter table public."b-quest-member-role" add column accept boolean not null default false;
