import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Best-effort fetch of the current term label for the sidebar header.
  // RLS auto-scopes to the user's school.
  const supabase = await createClient();
  const { data: term } = await supabase
    .from("terms")
    .select("name, academic_years(name)")
    .eq("is_current", true)
    .limit(1)
    .maybeSingle();

  const termLabel = term
    ? `${term.name}${
        (term.academic_years as { name?: string } | null)?.name
          ? " · " + (term.academic_years as { name?: string }).name
          : ""
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
      />
      <div className="flex flex-1 flex-col pl-[218px]">
        <TopBar />
        <main className="flex-1 px-7 pb-10 pt-6">{children}</main>
      </div>
    </div>
  );
}
