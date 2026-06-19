"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  averageMark,
  defaultScheme,
  ECD_RATINGS,
  ECD_SKILL_AREAS,
  gradeFor,
  type EcdRating,
  type GradingScheme,
} from "@/lib/grading";
import { saveReportCard } from "./actions";

export interface ClassOption {
  id: string;
  name: string;
  level: "ecd" | "primary" | "secondary" | "college";
}
export interface StudentOption {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
}
export interface SubjectOption {
  id: string;
  name: string;
}
export interface ExistingLine {
  subject_id: string | null;
  subject_name: string;
  marks: number | null;
  rating: string | null;
  comment: string | null;
}
export interface ExistingReport {
  id: string;
  teacher_comment: string | null;
  head_comment: string | null;
  attendance_present: number | null;
  attendance_total: number | null;
  lines: ExistingLine[];
}

interface Props {
  classes: ClassOption[];
  students: StudentOption[];
  subjects: SubjectOption[];
  termName: string | null;
  /** Existing current-term reports keyed by student_id, for editing. */
  existing: Record<string, ExistingReport>;
  /** Per-student attendance from the register, to prefill the report. */
  attendanceSummary: Record<string, { present: number; total: number }>;
}

const SCHEME_LABEL: Record<GradingScheme, string> = {
  ecd: "ECD — competency descriptors",
  primary: "Primary — % + ZIMSEC unit (1–9)",
  olevel: "O-Level — A–U (C is a pass)",
  alevel: "A-Level — A–U with points",
  college: "College — Distinction / Credit / Pass / Fail",
};

export function ReportBuilder({
  classes,
  students,
  subjects,
  termName,
  existing,
  attendanceSummary,
}: Props) {
  const [classId, setClassId] = React.useState("");
  const [studentId, setStudentId] = React.useState("");

  const studentsInClass = React.useMemo(
    () => students.filter((s) => s.class_id === classId),
    [students, classId],
  );
  const selectedClass = classes.find((c) => c.id === classId) ?? null;
  const selectedStudent = students.find((s) => s.id === studentId) ?? null;
  const scheme: GradingScheme = selectedClass
    ? defaultScheme(selectedClass.level, selectedClass.name)
    : "primary";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rc-class">Class</Label>
          <select
            id="rc-class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setStudentId("");
            }}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Pick a class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rc-student">Student</Label>
          <select
            id="rc-student"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={!classId}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="">
              {classId ? "— Pick a student —" : "Pick a class first"}
            </option>
            {studentsInClass.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name}
                {existing[s.id] ? " ✓" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass ? (
        <p className="text-[12px] text-muted-foreground">
          Grading scheme:{" "}
          <span className="font-medium text-foreground">
            {SCHEME_LABEL[scheme]}
          </span>
          {termName ? ` · ${termName}` : " · no current term"}
        </p>
      ) : null}

      {selectedStudent ? (
        <StudentReportForm
          key={selectedStudent.id}
          student={selectedStudent}
          scheme={scheme}
          subjects={subjects}
          initial={existing[selectedStudent.id] ?? null}
          attendance={attendanceSummary[selectedStudent.id]}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          <GraduationCap className="mx-auto mb-2 size-5 opacity-60" />
          Pick a class and student to build their report card.
        </div>
      )}
    </div>
  );
}

function StudentReportForm({
  student,
  scheme,
  subjects,
  initial,
  attendance,
}: {
  student: StudentOption;
  scheme: GradingScheme;
  subjects: SubjectOption[];
  initial: ExistingReport | null;
  attendance?: { present: number; total: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const isEcd = scheme === "ecd";

  // Academic marks keyed by subject id; ECD ratings keyed by skill area.
  const [marks, setMarks] = React.useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    if (initial && !isEcd) {
      for (const ln of initial.lines) {
        if (ln.subject_id && typeof ln.marks === "number") {
          m[ln.subject_id] = String(ln.marks);
        }
      }
    }
    return m;
  });
  const [ratings, setRatings] = React.useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    if (initial && isEcd) {
      for (const ln of initial.lines) {
        if (ln.rating) r[ln.subject_name] = ln.rating;
      }
    }
    return r;
  });
  const [savedId, setSavedId] = React.useState<string | null>(
    initial?.id ?? null,
  );
  const [teacherComment, setTeacherComment] = React.useState(
    initial?.teacher_comment ?? "",
  );
  const [present, setPresent] = React.useState(
    initial?.attendance_present != null
      ? String(initial.attendance_present)
      : attendance
        ? String(attendance.present)
        : "",
  );
  const [total, setTotal] = React.useState(
    initial?.attendance_total != null
      ? String(initial.attendance_total)
      : attendance
        ? String(attendance.total)
        : "",
  );

  const numericMarks = React.useMemo(
    () =>
      subjects
        .map((s) => ({ subject: s.name, marks: parseMark(marks[s.id]) }))
        .filter((x) => x.marks !== null) as {
        subject: string;
        marks: number;
      }[],
    [subjects, marks],
  );
  const average = isEcd ? null : averageMark(numericMarks);

  function handleSave() {
    const lines = isEcd
      ? ECD_SKILL_AREAS.filter((area) => ratings[area]).map((area) => ({
          subject_id: null,
          subject_name: area,
          marks: null,
          rating: ratings[area],
          comment: null,
        }))
      : subjects
          .filter((s) => parseMark(marks[s.id]) !== null)
          .map((s) => ({
            subject_id: s.id,
            subject_name: s.name,
            marks: parseMark(marks[s.id]),
            rating: null,
            comment: null,
          }));

    if (lines.length === 0) {
      toast.error(
        isEcd ? "Rate at least one skill area." : "Enter at least one mark.",
      );
      return;
    }

    startTransition(async () => {
      const res = await saveReportCard({
        student_id: student.id,
        teacher_comment: teacherComment.trim() || null,
        head_comment: null,
        attendance_present: present ? Number(present) : null,
        attendance_total: total ? Number(total) : null,
        lines,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSavedId(res.reportId);
      toast.success("Report card saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold">
          {student.first_name} {student.last_name}
        </p>
        {average !== null ? (
          <p className="text-[12px] text-muted-foreground">
            Average:{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {average}%
            </span>
          </p>
        ) : null}
      </div>

      {isEcd ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {ECD_SKILL_AREAS.map((area) => (
            <li
              key={area}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <span className="text-sm font-medium">{area}</span>
              <select
                value={ratings[area] ?? ""}
                onChange={(e) =>
                  setRatings((r) => ({ ...r, [area]: e.target.value }))
                }
                disabled={pending}
                className="h-8 w-44 rounded-md border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">—</option>
                {ECD_RATINGS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      ) : subjects.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          No subjects yet. Add subjects in Settings first.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {subjects.map((s) => {
            const m = parseMark(marks[s.id]);
            // In this branch `scheme` is already narrowed to a non-ECD scheme.
            const grade = m !== null ? gradeFor(scheme, m) : null;
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="flex-1 text-sm font-medium">{s.name}</span>
                {grade ? (
                  <span className="min-w-14 text-right text-[11px] font-semibold text-primary">
                    {grade.symbol}
                    <span className="ml-1 font-normal text-muted-foreground">
                      {grade.remark}
                    </span>
                  </span>
                ) : null}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={marks[s.id] ?? ""}
                  onChange={(e) =>
                    setMarks((mm) => ({ ...mm, [s.id]: e.target.value }))
                  }
                  disabled={pending}
                  placeholder="%"
                  className="h-8 w-20 rounded border border-input bg-card px-2 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rc-present">Days present (optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="rc-present"
              type="number"
              min={0}
              value={present}
              onChange={(e) => setPresent(e.target.value)}
              disabled={pending}
              className="h-9"
            />
            <span className="text-sm text-muted-foreground">of</span>
            <Input
              type="number"
              min={0}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              disabled={pending}
              placeholder="total"
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rc-comment">Teacher&apos;s comment</Label>
        <textarea
          id="rc-comment"
          value={teacherComment}
          onChange={(e) => setTeacherComment(e.target.value)}
          disabled={pending}
          rows={3}
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="A balanced remark on the term's performance…"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {savedId ? (
          <a
            href={`/app/report-cards/${savedId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            View / print
          </a>
        ) : null}
        <Button type="button" onClick={handleSave} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {initial ? "Update report card" : "Save report card"}
        </Button>
      </div>
    </div>
  );
}

/** Parse a mark input to a 0–100 number, or null when blank/invalid. */
function parseMark(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}
