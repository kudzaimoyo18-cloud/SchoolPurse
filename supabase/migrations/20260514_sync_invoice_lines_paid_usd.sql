-- =============================================================================
-- Keep invoice_lines.paid_usd in sync with payment_allocations
-- =============================================================================
--
-- Problem:
--   The existing allocate_payment_to_invoice RPC inserts payment_allocations
--   rows but does NOT update invoice_lines.paid_usd. As a result, arrears,
--   the term collection rate, and any downstream code that reads paid_usd
--   gets stale values.
--
-- This migration adds two triggers + a one-time backfill to keep paid_usd
-- correct without changing the existing RPC.
--
-- Run this once in the Supabase SQL editor.
-- =============================================================================

-- 1. Trigger fn: recompute one invoice_line's paid_usd from its allocations
-- ---------------------------------------------------------------------------
create or replace function public.sync_invoice_line_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line_id uuid;
  v_total numeric;
begin
  v_line_id := coalesce(new.invoice_line_id, old.invoice_line_id);

  select coalesce(sum(pa.amount_usd), 0)
    into v_total
    from public.payment_allocations pa
    join public.payments p on p.id = pa.payment_id
   where pa.invoice_line_id = v_line_id
     and p.status <> 'void';

  update public.invoice_lines
     set paid_usd = v_total
   where id = v_line_id;

  return null;
end;
$$;

drop trigger if exists trg_payment_allocations_sync on public.payment_allocations;
create trigger trg_payment_allocations_sync
after insert or update or delete on public.payment_allocations
for each row execute function public.sync_invoice_line_paid();

-- 2. Trigger fn: when a payment is voided/un-voided, recompute every line
--    that has an allocation from that payment.
-- ---------------------------------------------------------------------------
create or replace function public.sync_invoice_lines_for_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    update public.invoice_lines il
       set paid_usd = sub.total
      from (
        select pa.invoice_line_id, coalesce(sum(pa.amount_usd), 0) as total
          from public.payment_allocations pa
          join public.payments p on p.id = pa.payment_id
         where p.status <> 'void'
           and pa.invoice_line_id in (
             select invoice_line_id
               from public.payment_allocations
              where payment_id = new.id
           )
         group by pa.invoice_line_id
      ) sub
     where il.id = sub.invoice_line_id;

    -- Also zero out lines that lost their only allocation because of the
    -- void (they wouldn't show up in `sub`).
    update public.invoice_lines il
       set paid_usd = 0
     where id in (
       select invoice_line_id
         from public.payment_allocations
        where payment_id = new.id
     )
       and not exists (
         select 1
           from public.payment_allocations pa
           join public.payments p on p.id = pa.payment_id
          where pa.invoice_line_id = il.id
            and p.status <> 'void'
       );
  end if;
  return null;
end;
$$;

drop trigger if exists trg_payments_void_sync on public.payments;
create trigger trg_payments_void_sync
after update of status on public.payments
for each row execute function public.sync_invoice_lines_for_payment();

-- 3. One-time backfill: recompute paid_usd for every line that already has
--    completed allocations. Safe to re-run.
-- ---------------------------------------------------------------------------
update public.invoice_lines il
   set paid_usd = sub.total
  from (
    select pa.invoice_line_id, coalesce(sum(pa.amount_usd), 0) as total
      from public.payment_allocations pa
      join public.payments p on p.id = pa.payment_id
     where p.status <> 'void'
     group by pa.invoice_line_id
  ) sub
 where il.id = sub.invoice_line_id;

-- 4. Optionally recompute invoice.status based on paid_usd vs amount_usd
--    aggregated across the invoice's lines. Commented out: keep this
--    behaviour opt-in until you confirm the desired semantics.
-- ---------------------------------------------------------------------------
-- update public.invoices i
--    set status = case
--                   when paid >= total - 0.001 then 'paid'::invoice_status
--                   when paid > 0 then 'partial'::invoice_status
--                   else 'open'::invoice_status
--                 end
--   from (
--     select il.invoice_id,
--            sum(il.amount_usd) as total,
--            sum(il.paid_usd)  as paid
--       from public.invoice_lines il
--      group by il.invoice_id
--   ) agg
--  where i.id = agg.invoice_id
--    and i.status <> 'void';

-- =============================================================================
-- Sanity check (informational only)
-- =============================================================================
-- After running, you should see paid_usd > 0 on the two test invoice_lines:
--   select il.id, il.description, il.amount_usd, il.paid_usd
--     from invoice_lines il
--     join invoices i on i.id = il.invoice_id
--    where exists (select 1 from payment_allocations pa where pa.invoice_line_id = il.id);
