import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLogoUrl } from "@/lib/storage";
import {
  averageMark,
  defaultScheme,
  ECD_RATINGS,
  gradeFor,
} from "@/lib/grading";
import { PrintButton } from "../print-button";

export const metadata = { title: "Report Card — SchoolPurse" };

type LineRow = {
  subject_name: string;
  marks: number | string | null;
  rating: string | null;
  comment: string | null;
};

function first<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

const ECD_LABEL = new Map<string, string>(
  ECD_RATINGS.map((r) => [r.value, r.label]),
);

export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [reportRes, schoolRes] = await Promise.all([
    supabase
      .from("report_cards")
      .select(
        "id, teacher_comment, head_comment, attendance_present, attendance_total, students(first_name, last_name, classes(name, level)), terms(name), report_card_lines(subject_name, marks, rating, comment)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("schools")
      .select("name, address, phone, logo_path")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!reportRes.data) notFound();
  const r = reportRes.data as Record<string, unknown>;

  const studentField = first(
    r.students as
      | { first_name?: string; last_name?: string; classes?: unknown }
      | Array<{ first_name?: string; last_name?: string; classes?: unknown }>
      | null,
  );
  const classField = first(
    studentField?.classes as
      | { name?: string; level?: "ecd" | "primary" | "secondary" | "college" }
      | Array<{
          name?: string;
          level?: "ecd" | "primary" | "secondary" | "college";
        }>
      | null,
  );
  const termField = first(
    r.terms as { name?: string } | Array<{ name?: string }> | null,
  );

  const studentName = studentField
    ? `${studentField.first_name ?? ""} ${studentField.last_name ?? ""}`.trim()
    : "—";
  const className = classField?.name ?? null;
  const scheme = defaultScheme(classField?.level ?? null, className ?? "");
  const isEcd = scheme === "ecd";
  const termName = termField?.name ?? null;
  const year = new Date().getFullYear();

  const lines = (r.report_card_lines as LineRow[] | null) ?? [];
  const numeric = lines
    .map((l) => ({
      subject: l.subject_name,
      marks: l.marks === null ? null : Number(l.marks),
    }))
    .filter((x) => x.marks !== null) as { subject: string; marks: number }[];
  const average = isEcd ? null : averageMark(numeric);
  const overall =
    average !== null && scheme !== "ecd" ? gradeFor(scheme, average) : null;

  const present = r.attendance_present as number | null;
  const total = r.attendance_total as number | null;

  const school = (schoolRes.data ?? {
    name: "SchoolPurse",
    address: null,
    phone: null,
    logo_path: null,
  }) as {
    name: string;
    address: string | null;
    phone: string | null;
    logo_path: string | null;
  };
  const logoUrl = await getLogoUrl(school.logo_path);

  return (
    <div className="min-h-svh bg-sp-card-alt py-8 print:bg-white print:py-0">
      <style>{`@media print { @page { margin: 12mm; } .no-print { display: none !important; } }`}</style>

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 print:px-0">
        <div className="no-print flex items-center justify-between">
          <a
            href="/app/report-cards"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Back to report cards
          </a>
          <PrintButton />
        </div>

        <div className="rounded-lg border border-border bg-white p-10 text-foreground shadow-sm print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`${school.name} logo`}
                  className="max-h-14 max-w-[140px] object-contain"
                />
              ) : (
                <div className="inline-flex size-10 items-center justify-center rounded-md bg-sidebar text-primary">
                  <Briefcase className="size-5" strokeWidth={2.2} />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {school.name}
                </h1>
                {school.address ? (
                  <p className="text-xs text-muted-foreground">
                    {school.address}
                  </p>
                ) : null}
                {school.phone ? (
                  <p className="text-xs text-muted-foreground">
                    Tel: {school.phone}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                Term Report
              </p>
              <p className="mt-1 text-sm font-semibold">
                {termName ? `${termName} ${year}` : year}
              </p>
            </div>
          </div>

          {/* Student strip */}
          <div className="grid grid-cols-2 gap-4 border-b border-border py-4 sm:grid-cols-4">
            <Field label="Student" value={studentName} />
            <Field label="Class" value={className ?? "—"} />
            <Field
              label="Attendance"
              value={
                present != null && total != null ? `${present} / ${total}` : "—"
              }
            />
            <Field
              label="Average"
              value={
                average !== null
                  ? `${average}%${overall ? ` (${overall.symbol})` : ""}`
                  : "—"
              }
            />
          </div>

          {/* Body */}
          <div className="py-5">
            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No subjects recorded on this report.
              </p>
            ) : isEcd ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-wide text-sp-text-sub">
                    <th className="py-2">Skill area</th>
                    <th className="py-2 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-2 font-medium">{l.subject_name}</td>
                      <td className="py-2 text-right">
                        {l.rating ? (ECD_LABEL.get(l.rating) ?? l.rating) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-wide text-sp-text-sub">
                    <th className="py-2">Subject</th>
                    <th className="py-2 text-right">Mark</th>
                    <th className="py-2 text-right">Grade</th>
                    <th className="py-2 text-right">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => {
                    const m = l.marks === null ? null : Number(l.marks);
                    // In this branch `scheme` is already narrowed to non-ECD.
                    const g = m !== null ? gradeFor(scheme, m) : null;
                    return (
                      <tr key={i} className="border-b border-border/60">
                        <td className="py-2 font-medium">{l.subject_name}</td>
                        <td className="py-2 text-right tabular-nums">
                          {m !== null ? `${m}%` : "—"}
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {g ? g.symbol : "—"}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {g ? g.remark : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Comments */}
          {r.teacher_comment ? (
            <div className="border-t border-border py-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                Class teacher&apos;s comment
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {String(r.teacher_comment)}
              </p>
            </div>
          ) : null}
          {r.head_comment ? (
            <div className="border-t border-border py-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sp-text-sub">
                Head&apos;s comment
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {String(r.head_comment)}
              </p>
            </div>
          ) : null}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8">
            <Signature label="Class teacher" />
            <Signature label="Head" />
          </div>

          <p className="mt-6 border-t border-border pt-4 text-center text-[10.5px] text-muted-foreground">
            Computer-generated report. Grading: {SCHEME_NOTE[scheme]}.
          </p>
        </div>
      </div>
    </div>
  );
}

const SCHEME_NOTE: Record<string, string> = {
  ecd: "ECD competency descriptors",
  primary: "% with ZIMSEC units (1 best – 9)",
  olevel: "ZIMSEC O-Level A–U (C is a pass)",
  alevel: "ZIMSEC A-Level A–U with points",
  college: "Distinction / Credit / Pass / Fail",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-sp-text-sub">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div>
      <div className="mt-6 border-b border-foreground/40" />
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
