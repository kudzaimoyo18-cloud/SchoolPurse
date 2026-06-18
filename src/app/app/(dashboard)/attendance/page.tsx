import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { SectionCard } from "@/components/section-card";
import { RegisterMarker } from "./register-marker";

export const metadata = { title: "Attendance — SchoolPurse" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string }>;
}) {
  await requireRole(["school_admin", "platform_admin", "teacher"]);
  const sp = await searchParams;
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const date = sp.date && ISO_DATE.test(sp.date) ? sp.date : today;
  const classId = sp.class ?? "";

  const { data: classesRaw } = await supabase
    .from("classes")
    .select("id, name")
    .order("name");
  const classes = (classesRaw ?? []) as { id: string; name: string }[];

  let students: { id: string; first_name: string; last_name: string }[] = [];
  const initialStatus: Record<string, string> = {};
  if (classId) {
    const [{ data: studs }, { data: marks }] = await Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("class_id", classId)
        .eq("status", "active")
        .order("last_name"),
      supabase
        .from("attendance")
        .select("student_id, status")
        .eq("class_id", classId)
        .eq("date", date),
    ]);
    students = (studs ?? []) as typeof students;
    for (const m of (marks ?? []) as { student_id: string; status: string }[]) {
      initialStatus[m.student_id] = m.status;
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Attendance register"
        subtitle="Mark who's present each day. Feeds the report cards automatically."
      >
        <RegisterMarker
          key={`${classId}-${date}`}
          classes={classes}
          classId={classId}
          date={date}
          students={students}
          initialStatus={initialStatus}
        />
      </SectionCard>
    </div>
  );
}
