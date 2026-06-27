-- =============================================================================
-- Performance: trigram index for student name search
-- =============================================================================
-- The students toolbar and the AI find_student tool search with ILIKE '%q%',
-- which a btree index cannot serve (leading wildcard). A trigram GIN index
-- makes those searches index-backed instead of a full table scan once a school
-- has a large roster. Applied to prod 2026-06-26.

create extension if not exists pg_trgm;

create index if not exists idx_students_first_name_trgm
  on public.students using gin (first_name gin_trgm_ops);
create index if not exists idx_students_last_name_trgm
  on public.students using gin (last_name gin_trgm_ops);
