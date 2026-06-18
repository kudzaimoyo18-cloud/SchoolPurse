-- =============================================================================
-- Parent / guardian contact on the student record
-- =============================================================================
--
-- Adds guardian contact + home address to students. `parent_phone` is the
-- target for fee/payment reminders (WhatsApp). All nullable so existing rows
-- are unaffected.
-- =============================================================================

alter table public.students
  add column if not exists parent_name text,
  add column if not exists parent_phone text,
  add column if not exists parent_email text,
  add column if not exists home_address text;
