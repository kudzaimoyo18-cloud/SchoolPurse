-- =============================================================================
-- Daily attendance register
-- =============================================================================
-- One mark per student per day. Statuses: present / absent / late / excused.
-- Feeds the report card's attendance figures (present + late count as present).
-- =============================================================================

create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  date date not null,
  status text not null check (status in ('present','absent','late','excused')),
  marked_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists attendance_student_date_uidx
  on public.attendance(student_id, date);
create index if not exists attendance_school_date_idx
  on public.attendance(school_id, date);
create index if not exists attendance_class_date_idx
  on public.attendance(class_id, date);

alter table public.attendance enable row level security;

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select using (auth_school_id() = school_id);
drop policy if exists attendance_write on public.attendance;
create policy attendance_write on public.attendance
  for all using (auth_school_id() = school_id and is_school_staff())
  with check (auth_school_id() = school_id and is_school_staff());
