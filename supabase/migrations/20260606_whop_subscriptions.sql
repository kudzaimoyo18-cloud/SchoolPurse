-- Add subscription tier tracking to schools
alter table public.schools
  add column if not exists subscription_tier text not null default 'free'
  check (subscription_tier in ('free', 'starter', 'standard', 'plus'));

-- Whop subscription records — links Whop memberships to schools by email
create table if not exists public.whop_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  school_id     uuid references public.schools(id) on delete set null,
  membership_id text not null unique,
  product_id    text not null,
  tier          text not null check (tier in ('starter', 'standard', 'plus')),
  status        text not null default 'active' check (status in ('active', 'cancelled', 'past_due')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_whop_subs_email on public.whop_subscriptions(email);
create index if not exists idx_whop_subs_school on public.whop_subscriptions(school_id);

-- RLS: only service-role (webhook handler) writes; school admins can read their own
alter table public.whop_subscriptions enable row level security;

create policy "Users can view own school subscription"
  on public.whop_subscriptions for select
  using (
    school_id in (
      select school_id from public.users where id = auth.uid()
    )
  );

-- Trigger to keep updated_at current
create or replace function public.whop_sub_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_whop_sub_updated_at
  before update on public.whop_subscriptions
  for each row execute function public.whop_sub_updated_at();
