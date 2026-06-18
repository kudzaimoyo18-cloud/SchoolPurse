import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { SectionCard } from "@/components/section-card";
import {
  ReportBuilder,
  type ExistingReport,
  type ClassOption,
  type StudentOption,
  type SubjectOption,
} from "./report-builder";

export const metadata = { title: "Report Cards — SchoolPurse" };

type ReportRow = {
  id: string;
  student_id: string;
  teacher_comment: string | null;
  head_comment: string | null;
  attendance_present: number | null;
  attendance_total: number | null;
  report_card_lines:
    | {
        subject_id: string | null;
        subject_name: string;
        marks: number | string | null;
        rating: string | null;
        comment: string | null;
      }[]
    | null;
};

export default async function ReportCardsPage() {
  await requireRole(["school_admin", "platform_admin", "teacher"]);
  const supabase = await createClient();

  const [classesRes, studentsRes, subjectsRes, termRes] = await Promise.all([
    supabase.from("classes").select("id, name, level").order("name"),
    supabase
      .from("students")
      .select("id, first_name, last_name, class_id")
      .eq("status", "active")
      .order("last_name"),
    supabase.from("subjects").select("id, name").order("name"),
    supabase
      .from("terms")
      .select("id, name, start_date, end_date")
      .eq("is_current", true)
      .maybeSingle(),
  ]);

  const term = termRes.data as {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  } | null;

  // Per-student attendance for the term, from the register. Present + late
  // count as attended; total is every marked day. Prefills the report (editable).
  const attendanceSummary: Record<string, { present: number; total: number }> =
    {};
  if (term?.id) {
    const { data: att } = await supabase
      .from("attendance")
      .select("student_id, status")
      .gte("date", term.start_date)
      .lte("date", term.end_date);
    for (const a of (att ?? []) as { student_id: string; status: string }[]) {
      const cur = attendanceSummary[a.student_id] ?? { present: 0, total: 0 };
      cur.total += 1;
      if (a.status === "present" || a.status === "late") cur.present += 1;
      attendanceSummary[a.student_id] = cur;
    }
  }

  const existing: Record<string, ExistingReport> = {};
  if (term?.id) {
    const { data: reports } = await supabase
      .from("report_cards")
      .select(
        "id, student_id, teacher_comment, head_comment, attendance_present, attendance_total, report_card_lines(subject_id, subject_name, marks, rating, comment)",
      )
      .eq("term_id", term.id);
    for (const r of (reports ?? []) as ReportRow[]) {
      existing[r.student_id] = {
        id: r.id,
        teacher_comment: r.teacher_comment,
        head_comment: r.head_comment,
        attendance_present: r.attendance_present,
        attendance_total: r.attendance_total,
        lines: (r.report_card_lines ?? []).map((l) => ({
          subject_id: l.subject_id,
          subject_name: l.subject_name,
          marks: l.marks === null ? null : Number(l.marks),
          rating: l.rating,
          comment: l.comment,
        })),
      };
    }
  }

  const classes = (classesRes.data ?? []) as ClassOption[];
  const students = (studentsRes.data ?? []) as StudentOption[];
  const subjects = (subjectsRes.data ?? []) as SubjectOption[];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Report Cards"
        subtitle={
          term
            ? `Build a ZIMSEC-style term report. Current term: ${term.name}.`
            : "Set a current term before building report cards."
        }
      >
        <ReportBuilder
          classes={classes}
          students={students}
          subjects={subjects}
          termName={term?.name ?? null}
          existing={existing}
          attendanceSummary={attendanceSummary}
        />
      </SectionCard>
    </div>
  );
}
