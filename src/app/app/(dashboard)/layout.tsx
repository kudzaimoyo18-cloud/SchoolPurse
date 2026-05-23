import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { getLogoUrl } from "@/lib/storage";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { AnnouncementBanner } from "@/components/announcement-banner";
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

  const supabase = await createClient();
  const [termRes, arrears, classesRes, feeItemsRes, schoolRes, announcementRes] =
    await Promise.all([
      supabase
        .from("terms")
        .select("name, academic_years(name)")
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
      supabase.from("schools").select("logo_path").limit(1).maybeSingle(),
      // Latest active announcement
      supabase
        .from("announcements")
        .select("id, title, body, type, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
  const logoUrl = await getLogoUrl(
    (schoolRes.data as { logo_path?: string | null } | null)?.logo_path ??
      null,
  );

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
    level: "primary" | "secondary" | "tertiary";
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
      defaultOpen
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
      />
      <SidebarInset className="flex min-h-svh flex-col">
        <TopBar
          hasNotifications={arrears.length > 0}
          classes={classes}
          feeItems={feeItems}
          /* Teachers can't generate invoices — hide the shortcut for them. */
          canCreateInvoice={
            user.role === "school_admin" ||
            user.role === "bursar" ||
            user.role === "platform_admin"
          }
        />
        <AnnouncementBanner announcement={announcement} />
        <main className="flex-1 px-4 pb-10 pt-5 sm:px-7 sm:pt-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
