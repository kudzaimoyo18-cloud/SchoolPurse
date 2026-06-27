-- =============================================================================
-- Performance: remove a duplicate index (advisor: duplicate_index)
-- =============================================================================
-- attendance had two identical UNIQUE indexes on (student_id, date):
--   * attendance_student_id_date_key  — backs the UNIQUE constraint (kept)
--   * attendance_student_date_uidx    — redundant manual index (dropped)
-- The constraint-backed index continues to enforce uniqueness.
-- Applied to prod (school-purse-eu / vranahcabvbpbgrajafx) 2026-06-26.

drop index if exists public.attendance_student_date_uidx;
