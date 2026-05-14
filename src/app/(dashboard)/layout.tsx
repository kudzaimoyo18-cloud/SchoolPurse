import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
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
  const [termRes, arrears] = await Promise.all([
    supabase
      .from("terms")
      .select("name, academic_years(name)")
      .eq("is_current", true)
      .limit(1)
      .maybeSingle(),
    fetchArrears(),
  ]);

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
      />
      <div className="flex flex-1 flex-col pl-[218px]">
        <TopBar hasNotifications={arrears.length > 0} />
        <main className="flex-1 px-7 pb-10 pt-6">{children}</main>
      </div>
    </div>
  );
}
