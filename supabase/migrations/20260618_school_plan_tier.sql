-- =============================================================================
-- Plan tier on the school (freemium)
-- =============================================================================
--
-- free  — up to 100 students, 1 user (acquisition tier)
-- pro   — unlimited students, multi-user, P&L, statements
-- ai    — pro + AI dashboard chat + WhatsApp reminders
--
-- New schools default to 'free'. Every school that exists at migration time is
-- grandfathered to 'pro' so the new free-tier caps never lock a current school.
-- =============================================================================

alter table public.schools
  add column if not exists plan text not null default 'free';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'schools_plan_check') then
    alter table public.schools
      add constraint schools_plan_check check (plan in ('free','pro','ai'));
  end if;
end $$;

update public.schools set plan = 'pro' where plan = 'free';
