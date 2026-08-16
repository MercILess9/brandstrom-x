-- Give "b-quest-work" its own synthetic id (was a role+work composite key)
-- and add sort_order for manual reordering per role in Settings.

alter table public."b-quest-work" add column id uuid not null default gen_random_uuid();
alter table public."b-quest-work" add column sort_order integer;

update public."b-quest-work" w
set sort_order = sub.rn
from (
    select role, work, row_number() over (partition by role order by work) as rn
    from public."b-quest-work"
) sub
where w.role = sub.role and w.work = sub.work;

alter table public."b-quest-work" drop constraint "b-quest-work_pkey";
alter table public."b-quest-work" add constraint "b-quest-work_pkey" primary key (id);
alter table public."b-quest-work" add constraint "b-quest-work_role_work_key" unique (role, work);
