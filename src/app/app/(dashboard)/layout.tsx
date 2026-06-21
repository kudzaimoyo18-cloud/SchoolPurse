import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { getLogoUrl } from "@/lib/storage";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { AssistantFab } from "@/components/assistant-fab";
import { PostHogIdentify } from "@/components/posthog-identify";
import { normalizePlan } from "@/lib/plan";
import { fetchArrears } from "@/lib/queries/arrears";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Remember whether the user collapsed the sidebar last time (Notion-style).
  // shadcn writes "sidebar_state" on toggle; default to open when unset.
  const sidebarOpen =
    (await cookies()).get("sidebar_state")?.value !== "false";

  const supabase = await createClient();
  const [termRes, arrears, classesRes, feeItemsRes, schoolRes, announcementRes] =
    await Promise.all([
      supabase
        .from("terms")
        .select("name, start_date, academic_years(name)")
        .eq("is_current", true)
        .limit(1)
        .maybeSingle(),
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
    ]);
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

  const term = termRes.data;
  const termLabel = term
    ? `${(term as { name: string }).name}${
        (() => {
          const ay = (term as { academic_years?: unknown }).academic_years;
          const r = Array.isArray(ay) ? ay[0] : ay;
          return (r as { name?: string } | null)?.name
            ? " · " + (r as { name: string }).name
            : "";
        })()
      }`
    : undefined;
  // Surfaced to the New Registration dialog so the carry-over mode can
  // default the enrolment date to the term start (rather than today).
  const termStartDate = (term as { start_date?: string } | null)?.start_date;

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
        termLabel={termLabel}
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
        />
        <AnnouncementBanner announcement={announcement} />
        <main className="flex-1 px-4 pb-10 pt-5 sm:px-7 sm:pt-6">{children}</main>
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
