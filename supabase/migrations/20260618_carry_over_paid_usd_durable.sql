-- =============================================================================
-- Durable carry-over prior payments
-- =============================================================================
--
-- Bug:
--   A carry-over invoice line seeds `paid_usd` with the amount the student paid
--   BEFORE SchoolPurse (e.g. $300 of a $500 term fee → balance $200). That
--   prior payment has no `payment_allocations` row — it never passed through
--   SchoolPurse. The paid-sync triggers recompute `paid_usd = SUM(allocations)`,
--   so the moment a real payment is recorded the trigger OVERWRITES the seeded
--   $300 with just the new allocation. Balance silently jumps back up.
--
--   Repro: carry-over $500 fee, $300 already paid (balance $200). Parent pays
--   $100 → trigger sets paid_usd = 100 → balance shown as $400 instead of $100.
--
-- Fix:
--   Give the carried amount its own durable column, `carry_over_paid_usd`, and
--   make both paid-sync triggers compute:
--       paid_usd = carry_over_paid_usd + SUM(non-void allocations)
--   `paid_usd` stays the single source of truth every reader already uses, so
--   no application read path changes — only the writers (enroll-action) and the
--   triggers. The balance helpers are patched to match (defensive; currently
--   unused by the app).
-- =============================================================================

-- 1. Durable home for the pre-SchoolPurse paid amount.
alter table public.invoice_lines
  add column if not exists carry_over_paid_usd numeric not null default 0;

-- 2. Allocation sync — preserve the carry-over base instead of clobbering it.
create or replace function public.sync_invoice_line_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line_id uuid;
  v_total numeric;
  v_base numeric;
begin
  v_line_id := coalesce(new.invoice_line_id, old.invoice_line_id);

  select coalesce(sum(pa.amount_usd), 0)
    into v_total
    from public.payment_allocations pa
    join public.payments p on p.id = pa.payment_id
   where pa.invoice_line_id = v_line_id
     and p.status <> 'void';

  select coalesce(carry_over_paid_usd, 0)
    into v_base
    from public.invoice_lines
   where id = v_line_id;

  update public.invoice_lines
     set paid_usd = coalesce(v_base, 0) + v_total
   where id = v_line_id;

  return null;
end;
$$;

-- 3. Void / un-void sync — same base-preserving formula on both branches.
create or replace function public.sync_invoice_lines_for_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    update public.invoice_lines il
       set paid_usd = coalesce(il.carry_over_paid_usd, 0) + coalesce(sub.total, 0)
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

    -- Lines that lost their only allocation because of the void fall back to
    -- the carry-over base (NOT zero — the prior payment still stands).
    update public.invoice_lines il
       set paid_usd = coalesce(il.carry_over_paid_usd, 0)
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

-- 4. Carry-over-aware balance helpers (defensive — not on the app's hot path,
--    but keep them correct so any future caller can't reintroduce the bug).
create or replace function public.invoice_balance(p_invoice_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
           (select sum(amount_usd) from invoice_lines where invoice_id = p_invoice_id),
           0
         )
       - coalesce(
           (select sum(carry_over_paid_usd) from invoice_lines where invoice_id = p_invoice_id),
           0
         )
       - coalesce(
           (
             select sum(pa.amount_usd)
             from payment_allocations pa
             join invoice_lines il on il.id = pa.invoice_line_id
             join payments p on p.id = pa.payment_id
             where il.invoice_id = p_invoice_id
               and p.status = 'completed'
           ),
           0
         );
$$;

create or replace function public.allocate_payment_to_invoice(p_payment_id uuid, p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining numeric(12,2);
  v_line record;
  v_line_balance numeric(12,2);
  v_apply numeric(12,2);
  v_total numeric(12,2);
  v_paid numeric(12,2);
  v_school_id uuid;
begin
  select amount_usd, school_id into v_remaining, v_school_id
  from payments where id = p_payment_id;
  if v_remaining is null then raise exception 'payment not found'; end if;

  if not (
    auth_school_id() = v_school_id and
    coalesce(auth_role() in ('school_admin', 'bursar', 'platform_admin'), false)
  ) then
    raise exception 'permission denied';
  end if;

  v_remaining := v_remaining - coalesce(
    (select sum(amount_usd) from payment_allocations where payment_id = p_payment_id),
    0
  );
  if v_remaining <= 0 then return; end if;

  -- already_paid now includes the carry-over base so we never over-allocate a
  -- line that was partially settled before SchoolPurse.
  for v_line in
    select il.id, il.amount_usd,
           coalesce(il.carry_over_paid_usd, 0) + coalesce(
             (select sum(pa.amount_usd) from payment_allocations pa
              join payments p2 on p2.id = pa.payment_id
              where pa.invoice_line_id = il.id and p2.status = 'completed'),
             0
           ) as already_paid
    from invoice_lines il
    where il.invoice_id = p_invoice_id
    order by il.id
  loop
    v_line_balance := v_line.amount_usd - v_line.already_paid;
    if v_line_balance <= 0 then continue; end if;
    v_apply := least(v_line_balance, v_remaining);
    insert into payment_allocations (payment_id, invoice_line_id, amount_usd)
    values (p_payment_id, v_line.id, v_apply);
    v_remaining := v_remaining - v_apply;
    exit when v_remaining <= 0;
  end loop;

  select total_usd into v_total from invoices where id = p_invoice_id;
  v_paid := v_total - invoice_balance(p_invoice_id);
  update invoices set
    status = case
      when v_paid >= v_total then 'paid'::invoice_status
      when v_paid > 0 then 'partial'::invoice_status
      else 'open'::invoice_status
    end
  where id = p_invoice_id;
end;
$$;

-- 6. Backfill existing carry-over lines created before this column existed.
--    The OLD enroll path seeded the prior payment straight into `paid_usd`.
--    The portion of `paid_usd` not explained by live allocations IS that prior
--    payment — move it into the durable column so the next real payment can't
--    clobber it. `paid_usd` is unchanged (carry_over + allocations == old
--    paid_usd), so NO balance shifts. The `= 0` guard keeps it idempotent.
update public.invoice_lines il
   set carry_over_paid_usd = greatest(
     il.paid_usd - coalesce((
       select sum(pa.amount_usd)
         from public.payment_allocations pa
         join public.payments p on p.id = pa.payment_id
        where pa.invoice_line_id = il.id
          and p.status <> 'void'
     ), 0), 0)
 where il.invoice_id in (select id from public.invoices where is_carry_over = true)
   and il.carry_over_paid_usd = 0;
