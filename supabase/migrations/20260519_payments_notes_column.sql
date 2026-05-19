-- =============================================================================
-- payments.notes — bursar memo field
-- =============================================================================
-- The New Payment form has had a free-text "Notes" input since the original
-- ship, but the server action never persisted it. This adds the column so
-- the value the bursar types lands somewhere queryable (and can be surfaced
-- on the receipt in a follow-up change).
-- =============================================================================

alter table public.payments add column if not exists notes text;
