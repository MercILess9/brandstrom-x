-- B-Account Settings redesign (ref B-Quest's Role/Status/Type pattern):
-- b_opportunity_config needs id/color/active/sort_order to support
-- per-item color, active-toggle, and drag-reorder in the UI.
-- Written per the approved plan — NOT applied yet (UI ships first against
-- the current schema; this runs only when the user explicitly asks).

alter table public.b_opportunity_config
  add column if not exists id uuid not null default gen_random_uuid(),
  add column if not exists color text,
  add column if not exists active boolean not null default true,
  add column if not exists sort_order integer;

-- backfill sort_order per type group from current alphabetical (value) order
with ordered as (
  select type, value, row_number() over (partition by type order by value) as rn
  from public.b_opportunity_config
)
update public.b_opportunity_config c
set sort_order = ordered.rn
from ordered
where c.type = ordered.type and c.value = ordered.value;

alter table public.b_opportunity_config alter column sort_order set not null;

-- New stable identity: id. Keep (type, value) unique so every existing
-- consumer that still filters/joins by value keeps working unchanged.
-- Renaming a value's cascade into b_opportunity_list/qt/qt_item's plain-text
-- references is explicitly OUT of scope for this pass.
alter table public.b_opportunity_config drop constraint b_opp_config_pkey;
alter table public.b_opportunity_config add primary key (id);
alter table public.b_opportunity_config add constraint b_opportunity_config_type_value_key unique (type, value);
