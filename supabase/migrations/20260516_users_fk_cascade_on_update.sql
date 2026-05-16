-- =============================================================================
-- Switch every FK pointing at public.users.id to ON UPDATE CASCADE
-- =============================================================================
--
-- Background: when a Gmail user signs in for the first time but a seeded
-- public.users row exists with a different (placeholder) id matching their
-- email, getCurrentUser falls back to email-lookup and now needs to sync
-- public.users.id = auth.uid() so RLS works for them.
--
-- The original FKs all had ON UPDATE NO ACTION which made that sync
-- impossible. This migration switches every FK to ON UPDATE CASCADE.
-- ON DELETE behaviour (SET NULL on all of these) is preserved.
-- =============================================================================

alter table public.classes
  drop constraint classes_class_teacher_id_fkey,
  add constraint classes_class_teacher_id_fkey
    foreign key (class_teacher_id) references public.users(id)
    on update cascade on delete set null;

alter table public.class_subjects
  drop constraint class_subjects_teacher_id_fkey,
  add constraint class_subjects_teacher_id_fkey
    foreign key (teacher_id) references public.users(id)
    on update cascade on delete set null;

alter table public.payments
  drop constraint payments_recorded_by_fkey,
  add constraint payments_recorded_by_fkey
    foreign key (recorded_by) references public.users(id)
    on update cascade on delete set null;

alter table public.payments
  drop constraint payments_voided_by_fkey,
  add constraint payments_voided_by_fkey
    foreign key (voided_by) references public.users(id)
    on update cascade on delete set null;

alter table public.expenses
  drop constraint expenses_recorded_by_fkey,
  add constraint expenses_recorded_by_fkey
    foreign key (recorded_by) references public.users(id)
    on update cascade on delete set null;

alter table public.tests
  drop constraint tests_recorded_by_fkey,
  add constraint tests_recorded_by_fkey
    foreign key (recorded_by) references public.users(id)
    on update cascade on delete set null;

alter table public.test_scores
  drop constraint test_scores_recorded_by_fkey,
  add constraint test_scores_recorded_by_fkey
    foreign key (recorded_by) references public.users(id)
    on update cascade on delete set null;

alter table public.term_reports
  drop constraint term_reports_published_by_fkey,
  add constraint term_reports_published_by_fkey
    foreign key (published_by) references public.users(id)
    on update cascade on delete set null;

alter table public.attendance
  drop constraint attendance_recorded_by_fkey,
  add constraint attendance_recorded_by_fkey
    foreign key (recorded_by) references public.users(id)
    on update cascade on delete set null;

alter table public.audit_log
  drop constraint audit_log_user_id_fkey,
  add constraint audit_log_user_id_fkey
    foreign key (user_id) references public.users(id)
    on update cascade on delete set null;
