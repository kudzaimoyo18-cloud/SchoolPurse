-- =============================================================================
-- Performance: covering indexes for unindexed foreign keys + hot-path indexes
-- =============================================================================
-- Sourced from the Supabase performance advisor (unindexed_foreign_keys) plus
-- the dashboard's actual query patterns. All idempotent; safe to re-run.
-- Applied to prod (school-purse-eu / vranahcabvbpbgrajafx) 2026-06-26.

-- 1. Covering indexes for the foreign keys the advisor flagged.
create index if not exists idx_announcement_dismissals_announcement on public.announcement_dismissals (announcement_id);
create index if not exists idx_conversation_reads_user on public.conversation_reads (user_id);
create index if not exists idx_meeting_rooms_class on public.meeting_rooms (class_id);
create index if not exists idx_meeting_rooms_created_by on public.meeting_rooms (created_by);
create index if not exists idx_messages_sender on public.messages (sender_id);
create index if not exists idx_report_card_lines_school on public.report_card_lines (school_id);
create index if not exists idx_report_card_lines_subject on public.report_card_lines (subject_id);
create index if not exists idx_report_cards_class on public.report_cards (class_id);
create index if not exists idx_report_cards_created_by on public.report_cards (created_by);
create index if not exists idx_report_cards_term on public.report_cards (term_id);

-- 2. Hot-path composite / partial indexes (match the dashboard queries).
-- Overview "today / this month / last month" + recent payments + monthly P&L
-- all filter status = 'completed' scoped by school and range/order by paid_at.
create index if not exists idx_payments_school_status_paid_at
  on public.payments (school_id, status, paid_at desc);
-- Arrears pulls open/partial invoices per school; partial keeps the index tiny.
create index if not exists idx_invoices_open_partial
  on public.invoices (school_id)
  where status in ('open', 'partial');
-- Overview/reports aggregate expenses by month within a school.
create index if not exists idx_expenses_school_date
  on public.expenses (school_id, expense_date);

-- 3. Drop a redundant duplicate index (identical to attendance_class_date_idx).
drop index if exists public.idx_attendance_class_date;
