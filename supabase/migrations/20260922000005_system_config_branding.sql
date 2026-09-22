-- New key-value settings table (same shape as b_quest_config: rule/value)
-- for platform-wide settings that don't belong to any one project. First
-- use: system/setting.html's new "Branding" section (logo URLs + theme
-- color hex values). No rows are seeded — an absent key means "still
-- using the hardcoded default" in app code.
create table if not exists public.system_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.system_config enable row level security;

-- Same "UI-side gated, DB-level permissive for authenticated" posture as
-- setting_project/departments — system/setting.html's own
-- guardSystemSetting() is what actually restricts who can reach this UI.
create policy "system_config_select_authenticated"
  on public.system_config for select
  to authenticated
  using (true);

create policy "system_config_write_authenticated"
  on public.system_config for all
  to authenticated
  using (true)
  with check (true);

-- Storage bucket for uploaded brand assets (logo images). Public read so
-- the uploaded logo can be used directly as an <img src> without auth,
-- matching how BX's existing "Brandbox" bucket already works.
insert into storage.buckets (id, name, public)
values ('Brandbox', 'Brandbox', true)
on conflict (id) do nothing;

create policy "brandbox_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'Brandbox');

create policy "brandbox_bucket_authenticated_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'Brandbox');

create policy "brandbox_bucket_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'Brandbox')
  with check (bucket_id = 'Brandbox');

create policy "brandbox_bucket_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'Brandbox');
