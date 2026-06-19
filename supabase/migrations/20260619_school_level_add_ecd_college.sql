-- =============================================================================
-- School levels: add ECD and College
-- =============================================================================
-- ECD becomes its own level (was folded into primary); `tertiary` is migrated
-- to `college` and retired from the UI. Two migrations are required because
-- Postgres can't use a newly-added enum value in the same transaction that
-- adds it — see 20260619_migrate_ecd_and_college_levels.sql for the data move.
-- =============================================================================

alter type school_level add value if not exists 'ecd' before 'primary';
alter type school_level add value if not exists 'college' after 'tertiary';
