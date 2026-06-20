-- =============================================================================
-- Outbound message queue (WhatsApp / SMS)
-- =============================================================================
-- Provider-agnostic log of every message SchoolPurse tries to send to a parent.
-- Rows are written and updated server-side via the admin client (the send
-- service), so authenticated users get SELECT only — for delivery visibility.
-- A row's lifecycle: queued -> sent | failed | skipped (no provider configured).
-- =============================================================================

create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  to_phone text not null,
  body text not null,
  channel text not null default 'whatsapp',
  kind text not null default 'manual',
  ref_id uuid,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider text,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists outbound_messages_school_created_idx
  on public.outbound_messages (school_id, created_at desc);

alter table public.outbound_messages enable row level security;

-- Staff can read their own school's outbound log. Writes are server-side only
-- (admin client), so no insert/update/delete policy is granted here.
drop policy if exists "outbound read own school" on public.outbound_messages;
create policy "outbound read own school"
  on public.outbound_messages for select
  to authenticated
  using (
    school_id in (
      select u.school_id from public.users u where u.id = auth.uid()
    )
  );
