import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { getLogoUrl } from "@/lib/storage";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { fetchArrears } from "@/lib/queries/arrears";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  const supabase = await createClient();
  const [termRes, arrears, classesRes, feeItemsRes, schoolRes] =
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
    <div className="flex min-h-svh">
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
      <div className="flex flex-1 flex-col pl-[218px]">
        <TopBar
          hasNotifications={arrears.length > 0}
          classes={classes}
          feeItems={feeItems}
        />
        <main className="flex-1 px-7 pb-10 pt-6">{children}</main>
      </div>
    </div>
  );
}
