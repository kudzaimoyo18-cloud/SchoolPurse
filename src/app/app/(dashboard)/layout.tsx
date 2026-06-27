import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { getLogoUrl } from "@/lib/storage";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { AssistantFab } from "@/components/assistant-fab";
import { PostHogIdentify } from "@/components/posthog-identify";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { normalizePlan } from "@/lib/plan";
import { fetchArrears } from "@/lib/queries/arrears";
import { getActiveTerm, termLabel } from "@/lib/queries/term";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // The auth lookup, the sidebar cookie read, and the layout data batch are all
  // independent, so run them concurrently instead of gating the queries behind
  // getCurrentUser(). getCurrentUser() and fetchArrears() are React-cached, so
  // the page re-using them later in the same render costs nothing extra.
  const [user, cookieStore, activeTerm, batch] = await Promise.all([
    getCurrentUser(),
    cookies(),
    getActiveTerm(),
    Promise.all([
      fetchArrears(),
      supabase.from("classes").select("id, name, level").order("name"),
      supabase
        .from("fee_items")
        .select(
          "id, name, type, amount_usd, applicable_class_ids, active, include_on_registration",
        )
        .eq("active", true)
        .or("include_on_registration.eq.true,type.eq.uniform")
        .order("name"),
      supabase.from("schools").select("logo_path, plan").limit(1).maybeSingle(),
      // Latest active announcement
      supabase
        .from("announcements")
        .select("id, title, body, type, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]),
  ]);
  const [arrears, classesRes, feeItemsRes, schoolRes, announcementRes] = batch;

  // Remember whether the user collapsed the sidebar last time (Notion-style).
  // shadcn writes "sidebar_state" on toggle; default to open when unset.
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const schoolData = schoolRes.data as {
    logo_path?: string | null;
    plan?: string | null;
  } | null;
  const logoUrl = await getLogoUrl(schoolData?.logo_path ?? null);

  // The AI assistant is a floating widget on every page. Show it to finance
  // roles; the panel itself gates AI-plan access (upgrade card otherwise).
  const hasAiAccess = normalizePlan(schoolData?.plan) === "ai";
  const showAssistant =
    user.role === "platform_admin" ||
    user.role === "school_admin" ||
    user.role === "bursar";

  // Active term (cookie selection, else the current term) drives the sidebar
  // label, the global term selector, and the New Registration dialog's default
  // enrolment date.
  const termLabelStr = termLabel(activeTerm.active);
  const termStartDate = activeTerm.active?.start_date ?? undefined;
  const termOptions = activeTerm.terms.map((t) => ({
    id: t.id,
    name: t.name,
    year: t.year,
    is_current: t.is_current,
  }));

  // Resolve the latest active announcement (skip if user already dismissed it)
  const rawAnnouncement = announcementRes.data as {
    id: string;
    title: string;
    body: string;
    type: "info" | "warning" | "success" | "update";
    created_at: string;
  } | null;

  let announcement = rawAnnouncement;
  if (rawAnnouncement) {
    const { data: dismissal } = await supabase
      .from("announcement_dismissals")
      .select("id")
      .eq("announcement_id", rawAnnouncement.id)
      .maybeSingle();
    if (dismissal) announcement = null;
  }

  const classes = (classesRes.data ?? []) as {
    id: string;
    name: string;
    level: "ecd" | "primary" | "secondary" | "college";
  }[];
  const feeItems = (feeItemsRes.data ?? []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    name: f.name as string,
    type: f.type as string,
    amount_usd: Number(f.amount_usd),
    applicable_class_ids: (f.applicable_class_ids as string[]) ?? [],
  }));

  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      style={
        {
          // Match the previous fixed sidebar width so other screens still feel
          // familiar even with the new collapsible block.
          "--sidebar-width": "218px",
          "--sidebar-width-icon": "3.25rem",
        } as React.CSSProperties
      }
    >
      <Sidebar
        user={{
          name: user.name,
          role: user.role,
          schoolName: user.schoolName,
        }}
        termLabel={termLabelStr}
        arrearsCount={arrears.length}
        logoUrl={logoUrl}
        hasAi={hasAiAccess}
      />
      <SidebarInset className="flex min-h-svh flex-col">
        <TopBar
          hasNotifications={arrears.length > 0}
          classes={classes}
          feeItems={feeItems}
          termStartDate={termStartDate}
          terms={termOptions}
          activeTermId={activeTerm.active?.id ?? null}
        />
        <AnnouncementBanner announcement={announcement} />
        {/* pb-24 on mobile clears the fixed bottom tab bar; lg has no bar. */}
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-7 sm:pt-6 lg:pb-10">
          {children}
        </main>
        <MobileTabBar role={user.role} arrearsCount={arrears.length} />
        {showAssistant ? (
          <AssistantFab
            firstName={user.name.split(" ")[0]}
            hasAccess={hasAiAccess}
          />
        ) : null}
        <PostHogIdentify
          id={user.id}
          email={user.email}
          role={user.role}
          schoolName={user.schoolName}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
