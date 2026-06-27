-- =============================================================================
-- Performance: RLS init-plan — evaluate auth.uid() once per query, not per row
-- =============================================================================
-- Supabase advisor: auth_rls_initplan. These policies referenced auth.uid()
-- directly, so Postgres re-evaluated it for every row scanned. Wrapping it in a
-- scalar subselect (select auth.uid()) turns it into an InitPlan computed once
-- per statement. Semantically identical (same value, same access) — purely a
-- speed change that compounds on large tables. Only the USING / WITH CHECK
-- expressions change; each policy's command and roles are preserved.
-- (The app's other policies use STABLE SECURITY DEFINER helpers — auth_school_id(),
-- is_admin(), etc. — which are already evaluated once per statement.)
-- Applied to prod (school-purse-eu / vranahcabvbpbgrajafx) 2026-06-26.

alter policy "Users can dismiss announcements" on public.announcement_dismissals
  with check (user_id = (select auth.uid()));

alter policy "Users can read own dismissals" on public.announcement_dismissals
  using (user_id = (select auth.uid()));

alter policy "contact_submissions_select_platform_admin" on public.contact_submissions
  using (exists (
    select 1 from users u
    where u.id = (select auth.uid()) and u.role = 'platform_admin'::user_role
  ));

alter policy "reads_all" on public.conversation_reads
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "messages_insert" on public.messages
  with check (sender_id = (select auth.uid()) and can_post_conversation(conversation_id));

alter policy "outbound read own school" on public.outbound_messages
  using (school_id in (select u.school_id from users u where u.id = (select auth.uid())));

alter policy "Users can view own school subscription" on public.whop_subscriptions
  using (school_id in (select users.school_id from users where users.id = (select auth.uid())));
