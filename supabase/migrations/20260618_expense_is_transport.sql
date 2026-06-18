-- School-bus / transport expenses tracked in their own ledger, apart from
-- general school expenses (but still part of the consolidated P&L).
alter table public.expenses
  add column if not exists is_transport boolean not null default false;
create index if not exists expenses_transport_idx
  on public.expenses(school_id, is_transport);
