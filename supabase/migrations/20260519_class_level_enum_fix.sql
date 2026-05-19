-- =============================================================================
-- Fix: convert pre-existing public.classes.level text column to school_level
-- =============================================================================
--
-- The earlier 20260519_school_levels_and_class_level migration used
-- "add column if not exists level school_level" — but the column already
-- existed on two production schools as a TEXT column with free-text values
-- ("primary", "PRIMARY", "PIMAY" typo). The IF NOT EXISTS guard made the
-- desired enum type a no-op, so the column stayed text. The downstream
-- trigger `enforce_class_level_in_school_levels` then errored on inserts
-- with "operator does not exist: text = school_level".
--
-- This migration:
--   1. Drops the trigger temporarily so we can change column type.
--   2. Normalizes existing text values: lowercase + trim, and any value
--      that doesn't match an enum literal falls back to 'primary'.
--   3. Drops the text default before the ALTER (Postgres can't auto-cast
--      defaults across types).
--   4. ALTERs the column TYPE with an explicit USING school_level cast.
--   5. Restores NOT NULL + default + the trigger.
--
-- Also rewrites the trigger to use array_position (polymorphic, no enum
-- cast needed) instead of `= any(enabled)` which trips PostgreSQL's
-- operator resolver between text and school_level.
-- =============================================================================

create or replace function public.enforce_class_level_in_school_levels()
returns trigger
language plpgsql
as $$
declare
  enabled school_level[];
begin
  select levels into enabled from public.schools where id = new.school_id;
  if enabled is null then
    raise exception 'School % does not exist', new.school_id;
  end if;
  -- array_position is polymorphic over the array element type, so it
  -- handles school_level enums without needing an explicit text cast.
  if array_position(enabled, new.level) is null then
    raise exception
      'Class level % is not enabled for school % (enabled levels: %)',
      new.level, new.school_id, enabled;
  end if;
  return new;
end;
$$;

drop trigger if exists classes_level_within_school_trg on public.classes;

alter table public.classes alter column level drop default;

-- Normalize existing free-text values.
update public.classes
   set level = lower(trim(level))
 where level is not null
   and lower(trim(level)) in ('primary', 'secondary', 'tertiary');

update public.classes
   set level = 'primary'
 where level is null
    or level not in ('primary', 'secondary', 'tertiary');

alter table public.classes
  alter column level type school_level
  using level::school_level;

alter table public.classes alter column level set not null;
alter table public.classes alter column level set default 'primary'::school_level;

create trigger classes_level_within_school_trg
  before insert or update of level, school_id
  on public.classes
  for each row
  execute function public.enforce_class_level_in_school_levels();
