-- =============================================================================
-- Migrate existing data onto the new ECD / College levels
-- =============================================================================
-- Order matters: enable the target level on a school BEFORE moving its classes,
-- or the enforce_class_level_in_school_levels() trigger rejects the move.
-- =============================================================================

-- Enable ECD for schools that already have ECD/Reception/Nursery classes.
update public.schools s
   set levels = array_append(s.levels, 'ecd'::school_level)
 where not ('ecd' = any(s.levels))
   and exists (
     select 1 from public.classes c
      where c.school_id = s.id and c.level = 'primary'
        and (c.name ilike 'ecd%' or c.name ilike 'reception%' or c.name ilike 'nursery%')
   );

-- Enable College for any school that has tertiary classes (incl. orphans whose
-- level was disabled), so the move below passes the trigger.
update public.schools s
   set levels = array_append(s.levels, 'college'::school_level)
 where not ('college' = any(s.levels))
   and exists (
     select 1 from public.classes c
      where c.school_id = s.id and c.level = 'tertiary'
   );

-- tertiary -> college in the school levels list.
update public.schools
   set levels = array_replace(levels, 'tertiary'::school_level, 'college'::school_level)
 where 'tertiary' = any(levels);

-- Move ECD-named classes from primary to the ecd level.
update public.classes
   set level = 'ecd'
 where level = 'primary'
   and (name ilike 'ecd%' or name ilike 'reception%' or name ilike 'nursery%');

-- tertiary classes -> college.
update public.classes set level = 'college' where level = 'tertiary';
