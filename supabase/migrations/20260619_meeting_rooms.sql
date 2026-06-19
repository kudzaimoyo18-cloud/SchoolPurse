-- =============================================================================
-- Online classrooms (meeting rooms)
-- =============================================================================
-- One room per (school, scope[, class]). The slug is an unguessable capability
-- used as the video room name and the student share link.
-- =============================================================================

create table if not exists public.meeting_rooms (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  scope text not null check (scope in ('class','staff','admins')),
  class_id uuid references public.classes(id) on delete cascade,
  label text not null,
  slug text not null unique,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists meeting_rooms_school_idx on public.meeting_rooms(school_id);
create unique index if not exists meeting_rooms_unique_scope
  on public.meeting_rooms(
    school_id, scope,
    coalesce(class_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

alter table public.meeting_rooms enable row level security;

drop policy if exists meeting_rooms_select on public.meeting_rooms;
create policy meeting_rooms_select on public.meeting_rooms
  for select using (auth_school_id() = school_id);
drop policy if exists meeting_rooms_write on public.meeting_rooms;
create policy meeting_rooms_write on public.meeting_rooms
  for all using (auth_school_id() = school_id and is_school_staff())
  with check (auth_school_id() = school_id and is_school_staff());
