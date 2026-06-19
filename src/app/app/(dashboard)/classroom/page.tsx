import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { SectionCard } from "@/components/section-card";
import { ClassroomList } from "./classroom-list";

export const metadata = { title: "Classroom — SchoolPurse" };

export default async function ClassroomPage() {
  const me = await requireRole(["school_admin", "platform_admin", "teacher"]);
  const supabase = await createClient();
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
