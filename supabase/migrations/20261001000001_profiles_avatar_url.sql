-- Adds the column system/profile-modal.js's Edit Profile avatar upload
-- actually writes to (previously the upload was preview-only — nothing
-- in the schema even existed to save it to). Uploaded file itself goes
-- to the existing "Brandbox" Storage bucket (public read, authenticated
-- write — see 20260922000005_system_config_branding.sql) under
-- avatars/<user.id>.jpg; this column just holds that file's public URL.
alter table public.profiles
  add column if not exists avatar_url text;
