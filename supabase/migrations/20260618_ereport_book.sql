-- =============================================================================
-- E-Report Book foundation: report cards + lines
-- =============================================================================
--
-- The `subjects` table already exists (id, school_id, name, code) with its own
-- admin-gated policies. This migration adds the report-card tables on top.
--
-- is_school_staff() grants academics write access to teachers as well as
-- finance users, since teachers own report cards.
-- =============================================================================

create or replace function public.is_school_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    auth_role() in ('school_admin','bursar','teacher','platform_admin'),
    false
  );
$$;

create table if not exists public.report_cards (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  term_id uuid references public.terms(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  teacher_comment text,
  head_comment text,
  attendance_present int,
  attendance_total int,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists report_cards_school_idx on public.report_cards(school_id);
create index if not exists report_cards_student_idx on public.report_cards(student_id);
create unique index if not exists report_cards_student_term_uidx
  on public.report_cards(student_id, term_id);

create table if not exists public.report_card_lines (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  report_card_id uuid not null references public.report_cards(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text not null,
  marks numeric,
  comment text
);
create index if not exists report_card_lines_card_idx
  on public.report_card_lines(report_card_id);

alter table public.report_cards enable row level security;
alter table public.report_card_lines enable row level security;

drop policy if exists report_cards_select on public.report_cards;
create policy report_cards_select on public.report_cards
  for select using (auth_school_id() = school_id);
drop policy if exists report_cards_write on public.report_cards;
create policy report_cards_write on public.report_cards
  for all using (auth_school_id() = school_id and is_school_staff())
  with check (auth_school_id() = school_id and is_school_staff());

drop policy if exists report_card_lines_select on public.report_card_lines;
create policy report_card_lines_select on public.report_card_lines
  for select using (auth_school_id() = school_id);
drop policy if exists report_card_lines_write on public.report_card_lines;
create policy report_card_lines_write on public.report_card_lines
  for all using (auth_school_id() = school_id and is_school_staff())
  with check (auth_school_id() = school_id and is_school_staff());
