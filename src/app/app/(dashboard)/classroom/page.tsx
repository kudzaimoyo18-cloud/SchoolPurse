import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { normalizePlan } from "@/lib/plan";
import { SectionCard } from "@/components/section-card";
import { AiUpgradeNotice } from "@/components/ai-upgrade-notice";
import { ClassroomList } from "./classroom-list";

export const metadata = { title: "Classroom — SchoolPurse" };

export default async function ClassroomPage() {
  const me = await requireRole(["school_admin", "platform_admin", "teacher"]);
  const supabase = await createClient();

  // AI-plan feature.
  const { data: schoolRow } = await supabase
    .from("schools")
    .select("plan")
    .limit(1)
    .maybeSingle();
  if (normalizePlan((schoolRow as { plan?: string } | null)?.plan) !== "ai") {
    return (
      <AiUpgradeNotice
        title="Online classroom"
        description="Run live video rooms for your classes, staff, and admins — pupils join from a link with no login."
      />
    );
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .order("name");
  const isAdmin = me.role === "school_admin" || me.role === "platform_admin";

  return (
    <div className="space-y-6">
      <SectionCard
        title="Online classroom"
        subtitle="Start a live video room for a class, all staff, or just admins. Open a class room, then share its student link — pupils join with no login."
      >
        <ClassroomList
          classes={(classes ?? []) as { id: string; name: string }[]}
          isAdmin={isAdmin}
        />
      </SectionCard>
    </div>
  );
}
