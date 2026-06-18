-- =============================================================================
-- One term-tuition invoice per student per term (backstop)
-- =============================================================================
--
-- The term fee could be billed twice: a carry-over invoice for the term plus a
-- freshly generated term invoice, leaving the student owing double. The app
-- guards against it (generateInvoicesForCurrentTerm skips students already
-- covered), but app-level SELECT-then-INSERT is racy and was bypassed when the
-- dedup key (term_id) didn't line up.
--
-- This partial unique index is the hard backstop: at most ONE non-registration
-- invoice per (student_id, term_id). Carry-over OR generated — not both.
--   - Registration invoices (is_registration = true) are exempt: a student can
--     hold both a registration invoice and a term invoice for the same term.
--   - Term-less carry-overs (term_id IS NULL) are exempt — they aren't tied to
--     a billable term.
-- =============================================================================

create unique index if not exists invoices_one_term_invoice_per_student
  on public.invoices (student_id, term_id)
  where is_registration = false and term_id is not null;
