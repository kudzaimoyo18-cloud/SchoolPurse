-- =============================================================================
-- School logos + student photos
-- =============================================================================
--
-- Adds two storage buckets and the columns that point at the uploaded files.
--
--   school-logos   PUBLIC  — printed on receipts/invoices and shown in the
--                            sidebar. School-admin only can upload/replace.
--   student-photos PRIVATE — shown on student profile + students table.
--                            School-admin and bursar can upload; everyone in
--                            the same school can read via signed URLs.
--
-- All policies are school-scoped via auth_school_id(). Object names follow
-- the convention `<school_id>/<file>` so the bucket prefix doubles as the
-- tenant boundary.
-- =============================================================================

-- 1. Columns ----------------------------------------------------------------
alter table public.schools
  add column if not exists logo_path text;

alter table public.students
  add column if not exists photo_path text;

-- 2. Buckets ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('school-logos', 'school-logos', true),
  ('student-photos', 'student-photos', false)
on conflict (id) do nothing;

-- 3. Drop any old policies so this migration is idempotent ------------------
drop policy if exists "school_admin manage own logo"    on storage.objects;
drop policy if exists "anyone read school logos"        on storage.objects;
drop policy if exists "school finance manage photos"    on storage.objects;
drop policy if exists "school staff read student photos" on storage.objects;

-- 4. Logo policies ----------------------------------------------------------
-- Read: open to everyone (logos are public branding, also embedded in
-- printable receipts that parents may view without an account).
create policy "anyone read school logos"
  on storage.objects
  for select
  using (bucket_id = 'school-logos');

-- Write: only this school's school_admin (or platform_admin) can upload,
-- and only into a path that starts with their own school_id.
create policy "school_admin manage own logo"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'school-logos'
    and (storage.foldername(name))[1] = public.auth_school_id()::text
    and public.is_admin()
  )
  with check (
    bucket_id = 'school-logos'
    and (storage.foldername(name))[1] = public.auth_school_id()::text
    and public.is_admin()
  );

-- 5. Student photo policies -------------------------------------------------
-- Read: any authed staff member from the same school.
create policy "school staff read student photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = public.auth_school_id()::text
  );

-- Write: school_admin or bursar of this school (is_finance_user covers both).
create policy "school finance manage photos"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = public.auth_school_id()::text
    and public.is_finance_user()
  )
  with check (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = public.auth_school_id()::text
    and public.is_finance_user()
  );

-- =============================================================================
-- After running:
--   - schools.logo_path holds the storage path, e.g. 'a1b2.../logo.png'.
--   - students.photo_path holds the storage path, e.g. 'a1b2.../<sid>.jpg'.
--   - The Next.js server actions upload to these buckets and persist the
--     returned path. Signed URLs are generated server-side for private reads.
-- =============================================================================
