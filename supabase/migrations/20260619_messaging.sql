-- =============================================================================
-- In-app messaging: school chat groups
-- =============================================================================
-- Four group kinds per school:
--   staff      — every staff member (teacher/bursar/admin)        read+post: staff
--   admin      — admins/heads only                                read+post: admins
--   broadcast  — "School Notices"; admins post, all staff read    post: admins
--   class      — one per class; class teacher + admins            read+post: teacher+admin
--
-- Parents have no logins, so they are NOT members. A message flagged
-- notify_parents is fanned out to parent phones by the WhatsApp/SMS pipe
-- (built in a later increment); the flag is stored here now.
--
-- RLS reuses the existing helpers: auth_school_id(), is_admin(),
-- is_school_staff(). Access logic is centralised in two SECURITY DEFINER
-- predicates so every policy stays one line.
-- =============================================================================

create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  type        text not null check (type in ('staff','admin','broadcast','class')),
  class_id    uuid references public.classes(id) on delete cascade,
  title       text not null,
  created_at  timestamptz not null default now(),
  -- class conversations must name a class; the others must not
  constraint conversations_class_link check (
    (type = 'class' and class_id is not null)
    or (type <> 'class' and class_id is null)
  )
);

-- One staff/admin/broadcast conversation per school; one conversation per class.
create unique index if not exists ux_conversations_school_type
  on public.conversations (school_id, type)
  where type in ('staff','admin','broadcast');
create unique index if not exists ux_conversations_class
  on public.conversations (class_id)
  where type = 'class';

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.users(id) on delete cascade,
  body            text not null check (char_length(btrim(body)) > 0 and char_length(body) <= 4000),
  notify_parents  boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists idx_messages_conversation_created
  on public.messages (conversation_id, created_at);

-- Per-user read cursor for unread badges.
create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- ── Access predicates ────────────────────────────────────────────────────────
create or replace function public.can_view_conversation(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select is_school_staff() and exists (
    select 1 from conversations c
    where c.id = p_conversation_id
      and c.school_id = auth_school_id()
      and (
        c.type in ('staff','broadcast')
        or (c.type = 'admin' and is_admin())
        or (c.type = 'class' and (
              is_admin()
              or exists (select 1 from classes cl
                         where cl.id = c.class_id and cl.class_teacher_id = auth.uid())
            ))
      )
  );
$$;

create or replace function public.can_post_conversation(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select is_school_staff() and exists (
    select 1 from conversations c
    where c.id = p_conversation_id
      and c.school_id = auth_school_id()
      and (
        c.type = 'staff'
        or (c.type in ('admin','broadcast') and is_admin())
        or (c.type = 'class' and (
              is_admin()
              or exists (select 1 from classes cl
                         where cl.id = c.class_id and cl.class_teacher_id = auth.uid())
            ))
      )
  );
$$;

grant execute on function public.can_view_conversation(uuid) to authenticated;
grant execute on function public.can_post_conversation(uuid) to authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.conversations      enable row level security;
alter table public.messages           enable row level security;
alter table public.conversation_reads enable row level security;

drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select using (can_view_conversation(id));

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert with check (is_admin() and school_id = auth_school_id());

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (can_view_conversation(conversation_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid() and can_post_conversation(conversation_id)
  );

drop policy if exists reads_all on public.conversation_reads;
create policy reads_all on public.conversation_reads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Provision the standard set of conversations for the caller's school ───────
create or replace function public.ensure_school_conversations()
returns void
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_school uuid := auth_school_id();
begin
  if v_school is null then
    return;
  end if;

  insert into conversations (school_id, type, title)
  values (v_school, 'staff', 'Staff Room'),
         (v_school, 'admin', 'Admins'),
         (v_school, 'broadcast', 'School Notices')
  on conflict do nothing;

  insert into conversations (school_id, type, class_id, title)
  select v_school, 'class', cl.id, cl.name
  from classes cl
  where cl.school_id = v_school
  on conflict do nothing;
end;
$$;

grant execute on function public.ensure_school_conversations() to authenticated;

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Add messages to the realtime publication so the client gets live inserts.
-- RLS still gates which rows each subscriber receives.
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
end $$;
