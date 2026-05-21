-- =============================================================================
-- Security hardening based on Supabase advisor findings (pre-Monday ship)
-- =============================================================================
--
-- Four findings addressed by this migration:
--
--   1. sync_invoice_line_paid + sync_invoice_lines_for_payment exposed as
--      REST RPC. They're trigger-only — never meant to be invoked directly.
--   2. enforce_class_level_in_school_levels had a mutable search_path.
--   3. school-logos bucket allowed `select * from storage.objects` listing,
--      leaking every school's UUID.
--
-- The remaining advisor warnings are 11 SECURITY DEFINER functions callable
-- by `authenticated` (next_receipt_number, allocate_payment_to_invoice,
-- provision_*, seed_school_defaults, plus 5 read-only helpers used by RLS).
-- Each one has an internal auth_school_id() + role check audited Friday,
-- so they're documented noise rather than a real gap. Leaving as-is to
-- avoid breaking RLS policies that depend on these helpers.
-- =============================================================================

-- 1. Trigger functions are exposed via PostgREST because they're in `public`.
--    Revoke EXECUTE so anon/authenticated can't call them as RPC. Triggers
--    still fire because Postgres invokes trigger functions internally with
--    the table owner's permissions, not the caller's.
revoke execute on function public.sync_invoice_line_paid()
  from anon, authenticated, public;
revoke execute on function public.sync_invoice_lines_for_payment()
  from anon, authenticated, public;

-- 2. Pin search_path on the class-level guard. SECURITY INVOKER + an explicit
--    search_path is defence-in-depth against schema shadowing.
create or replace function public.enforce_class_level_in_school_levels()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  enabled school_level[];
begin
  select levels into enabled from public.schools where id = new.school_id;
  if enabled is null then
    raise exception 'School % does not exist', new.school_id;
  end if;
  if array_position(enabled, new.level) is null then
    raise exception
      'Class level % is not enabled for school % (enabled levels: %)',
      new.level, new.school_id, enabled;
  end if;
  return new;
end;
$$;

-- 3. Tighten the school-logos storage SELECT policy. The original allowed
--    anyone to enumerate the bucket (`select * from storage.objects where
--    bucket_id = 'school-logos'`) which would leak every school's UUID via
--    object paths like `<school_id>/logo-<ts>.jpg`.
--
--    The replacement still permits anonymous fetch-by-exact-key (so receipts
--    render with the logo for anyone holding the link) and lets a school
--    admin enumerate their own school's logos for the Settings UI.
drop policy if exists "anyone read school logos" on storage.objects;
create policy "school logos public read by key"
  on storage.objects
  for select
  to public
  using (
    bucket_id = 'school-logos'
    and (
      (auth.uid() is not null
       and (storage.foldername(name))[1] = public.auth_school_id()::text)
      or current_setting('request.jwt.claim.role', true) is null
    )
  );
