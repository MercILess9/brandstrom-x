-- Signup page (auth/signup.html) reads the departments dropdown before
-- the user is authenticated, so the anon role needs SELECT too.
create policy "departments_select_anon"
  on public.departments for select
  to anon
  using (true);
