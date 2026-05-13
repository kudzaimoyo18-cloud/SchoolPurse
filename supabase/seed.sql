-- =============================================================================
-- SchoolPurse — first-time bootstrap
-- =============================================================================
--
-- This script creates the first school in the database and links an existing
-- Supabase Auth user as the school_admin.
--
-- STEPS (one-time, before running this SQL):
--   1. Sign in to https://supabase.com/dashboard/project/vranahcabvbpbgrajafx
--   2. Go to Authentication → Users → "Add user" → "Create new user"
--   3. Email:    kudzaimoyo18@gmail.com
--      Password: (pick something strong — you'll use this to log in)
--      Auto Confirm User: YES (toggle on)
--   4. After creating, click the new user and copy their UUID (the "id" field)
--   5. Paste that UUID below in the :user_id_value variable
--   6. Open Supabase SQL Editor and run this file
--
-- After it runs you can log in to SchoolPurse with kudzaimoyo18@gmail.com.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EDIT THIS LINE: paste the UUID you copied from Supabase Auth → Users
-- ---------------------------------------------------------------------------
\set user_id_value '00000000-0000-0000-0000-000000000000'

-- ---------------------------------------------------------------------------
-- School & admin defaults (edit the school details to suit your real school)
-- ---------------------------------------------------------------------------
\set school_name 'Demo School'
\set school_slug 'demo-school'
\set admin_name  'Kudzai Moyo'
\set admin_email 'kudzaimoyo18@gmail.com'
\set admin_phone ''

-- ---------------------------------------------------------------------------
-- 1. Create the school + the linked school_admin user record.
--    provision_school() handles: insert into schools, insert into users with
--    role='school_admin', create receipt_sequence row, return the school_id.
-- ---------------------------------------------------------------------------
do $$
declare
  v_user_id    uuid := :'user_id_value';
  v_school_id  uuid;
begin
  if v_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception
      'Edit seed.sql first: replace user_id_value with the UUID of your auth user.';
  end if;

  -- Call provision_school. It may return the new school_id, or null
  -- depending on its signature — we fall back to a slug lookup if so.
  begin
    select public.provision_school(
      p_user_id     => v_user_id,
      p_school_name => :'school_name',
      p_school_slug => :'school_slug',
      p_admin_email => :'admin_email',
      p_admin_name  => :'admin_name',
      p_admin_phone => :'admin_phone'
    ) into v_school_id;
  exception
    when others then
      raise notice 'provision_school threw: %', sqlerrm;
      raise;
  end;

  if v_school_id is null then
    select id into v_school_id
      from public.schools where slug = :'school_slug';
  end if;

  if v_school_id is null then
    raise exception 'School with slug % was not created — check provision_school.', :'school_slug';
  end if;

  raise notice 'Provisioned school % (id=%)', :'school_name', v_school_id;

  -- 2. Seed default classes, fee items, expense categories, current academic
  --    year, current term, etc.
  perform public.seed_school_defaults(p_school_id => v_school_id);

  raise notice 'Seeded defaults for school %', v_school_id;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. Sanity checks — confirm the rows exist.
-- ---------------------------------------------------------------------------
select id, name, slug, status, currency, receipt_prefix, created_at
  from public.schools
 where slug = :'school_slug';

select u.id, u.name, u.email, u.role, u.status, s.name as school
  from public.users u
  join public.schools s on s.id = u.school_id
 where u.email = :'admin_email';

select id, name, type, amount_usd, recurrence, active
  from public.fee_items
 where school_id = (select id from public.schools where slug = :'school_slug')
 order by created_at;

select id, name, level
  from public.classes
 where school_id = (select id from public.schools where slug = :'school_slug')
 order by name;
