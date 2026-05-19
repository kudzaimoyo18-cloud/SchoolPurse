-- =============================================================================
-- Contact submissions from the public marketing site
-- =============================================================================
-- Run this once via the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/vranahcabvbpbgrajafx/sql/new
--
-- Stores leads from the marketing landing page contact form.
-- Inserts happen via a service-role server action (since visitors are
-- anonymous), so the table has RLS enabled with NO insert policy for the
-- anon role — the service-role client bypasses RLS.
-- Only platform_admin can read submissions back via SELECT.
-- =============================================================================

create table if not exists public.contact_submissions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  school        text,
  message       text not null,
  source        text default 'marketing_site',
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

alter table public.contact_submissions enable row level security;

-- Read policy: only platform_admin users can see submissions.
drop policy if exists "contact_submissions_select_platform_admin"
  on public.contact_submissions;
create policy "contact_submissions_select_platform_admin"
  on public.contact_submissions
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'platform_admin'
    )
  );

-- No anon/authed insert policy — inserts must use the service-role
-- client from a trusted server action.

grant select on public.contact_submissions to authenticated;
