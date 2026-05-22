-- ============================================================
-- Announcements: platform-wide notifications from developer to users
-- ============================================================

-- 1. Announcements table (platform-wide, not school-scoped)
CREATE TABLE public.announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  type        text NOT NULL DEFAULT 'info'
                CHECK (type IN ('info', 'warning', 'success', 'update')),
  active      boolean NOT NULL DEFAULT true,
  email_sent  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast "latest active" lookup
CREATE INDEX idx_announcements_active_created
  ON public.announcements (active, created_at DESC)
  WHERE active = true;

-- 2. Dismissals: tracks which user dismissed which announcement
CREATE TABLE public.announcement_dismissals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  dismissed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, announcement_id)
);

CREATE INDEX idx_dismissals_user ON public.announcement_dismissals (user_id);

-- 3. RLS policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active announcements
CREATE POLICY "Authenticated users can read announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (true);

-- Only platform_admin can manage announcements (via admin client which bypasses RLS)

-- Users can read their own dismissals
CREATE POLICY "Users can read own dismissals"
  ON public.announcement_dismissals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own dismissals
CREATE POLICY "Users can dismiss announcements"
  ON public.announcement_dismissals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
