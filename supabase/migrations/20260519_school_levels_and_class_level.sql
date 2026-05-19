-- =============================================================================
-- School levels (Primary / Secondary / Tertiary)
-- =============================================================================
--
-- Why: SchoolPurse needs to serve every kind of Zim school — a single primary
-- school, an all-through campus running ECD → A-Level, and even tertiary
-- colleges. We add:
--
--   1. school_level enum (primary | secondary | tertiary)
--   2. schools.levels school_level[]  — which sections THIS school operates
--   3. classes.level  school_level     — which section EACH class belongs to
--
-- Backfill rule: every existing school and every existing class is treated as
-- "primary" since that's the only level the app shipped with. Admins can
-- expand by toggling Secondary/Tertiary in Settings later.
-- =============================================================================

-- 1. Enum -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'school_level') then
    create type school_level as enum ('primary', 'secondary', 'tertiary');
  end if;
end$$;

-- 2. schools.levels -----------------------------------------------------------
-- Stored as an array so a single school can enable any combination. Default
-- '{primary}' so existing rows keep working without manual backfill.
alter table public.schools
  add column if not exists levels school_level[]
    not null default array['primary']::school_level[];

-- Guarantee at least one level is enabled. A school with no levels would
-- break the UI (no classes can be created).
alter table public.schools
  drop constraint if exists schools_levels_nonempty_chk;
alter table public.schools
  add constraint schools_levels_nonempty_chk
  check (array_length(levels, 1) >= 1);

-- 3. classes.level ------------------------------------------------------------
-- Nullable first so the migration succeeds on a populated table, then we
-- backfill, then we enforce NOT NULL.
alter table public.classes
  add column if not exists level school_level;

update public.classes
  set level = 'primary'
  where level is null;

alter table public.classes
  alter column level set not null;

alter table public.classes
  alter column level set default 'primary';

-- 4. Helpful index for filtering classes by level within a school.
create index if not exists classes_school_level_idx
  on public.classes (school_id, level);

-- 5. Trigger: every class must belong to a level the school actually has
--    enabled. Prevents creating a "Form 1" class for a school whose levels
--    are just ['primary']. App code already filters the dropdowns, but this
--    is the cheap database-level safety net.
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
  if not (new.level = any(enabled)) then
    raise exception
      'Class level % is not enabled for school % (enabled levels: %)',
      new.level, new.school_id, enabled;
  end if;
  return new;
end;
$$;

drop trigger if exists classes_level_within_school_trg on public.classes;
create trigger classes_level_within_school_trg
  before insert or update of level, school_id
  on public.classes
  for each row
  execute function public.enforce_class_level_in_school_levels();
