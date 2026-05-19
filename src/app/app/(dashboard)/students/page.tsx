import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStudentPhotoUrls } from "@/lib/storage";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { sanitizeOrLiteral } from "@/lib/security";
import { StudentsToolbar } from "./students-toolbar";
import { StudentRowActions } from "./row-actions";

export const metadata = { title: "Students — SchoolPurse" };

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
  dob: string | null;
  gender: string | null;
  enrollment_date: string;
  status: "active" | "withdrawn";
  photo_path: string | null;
  classes: { name: string } | { name: string }[] | null;
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

function classNameOf(row: StudentRow): string | null {
  if (!row.classes) return null;
  if (Array.isArray(row.classes)) return row.classes[0]?.name ?? null;
  return row.classes.name ?? null;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const [{ data: classes }, studentsRes] = await Promise.all([
    supabase.from("classes").select("id, name").order("name"),
    (async () => {
      let query = supabase
        .from("students")
        .select(
          "id, first_name, last_name, class_id, dob, gender, enrollment_date, status, photo_path, classes(name)",
        )
        .order("last_name", { ascending: true })
        .limit(500);
      if (q && q.trim()) {
        const term = sanitizeOrLiteral(q);
        if (term) {
          query = query.or(
            `first_name.ilike.%${term}%,last_name.ilike.%${term}%`,
          );
        }
      }
      return query;
    })(),
  ]);

  const students = (studentsRes.data ?? []) as StudentRow[];
  const classOptions = (classes ?? []) as { id: string; name: string }[];

  // Batch sign all photo URLs in a single Supabase call. Falls back to
  // an empty Map if nobody has a photo yet.
  const photoPaths = students
    .map((s) => s.photo_path)
    .filter((p): p is string => !!p);
  const photoUrls = await getStudentPhotoUrls(photoPaths);

  return (
    <div className="space-y-6">
      <StudentsToolbar classes={classOptions} />

      <SectionCard
        title={`Students (${students.length})`}
        subtitle="The full roster. Add students manually or import a CSV."
        bodyClassName="p-0"
      >
        {students.length === 0 ? (
          <div className="px-5 py-2">
            <EmptyState
              icon={Users}
              title="No students yet"
              description={
                q
                  ? "No students match your search."
                  : "Add your first student or import a CSV to get started."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sp-card-alt">
                <TableRow>
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const className = classNameOf(s);
                  const photoUrl = s.photo_path
                    ? (photoUrls.get(s.photo_path) ?? null)
                    : null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="pl-5 font-medium">
                        <Link
                          href={`/students/${s.id}`}
                          className="flex items-center gap-2.5 hover:underline"
                        >
                          <span className="inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sp-card-alt text-[10.5px] font-semibold text-muted-foreground">
                            {photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photoUrl}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              getInitials(s.first_name, s.last_name)
                            )}
                          </span>
                          <span>
                            {s.first_name} {s.last_name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {className ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {s.gender ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(s.enrollment_date)}
                      </TableCell>
                      <TableCell>
                        {s.status === "active" ? (
                          <StatusBadge label="Active" variant="success" />
                        ) : (
                          <StatusBadge label="Withdrawn" variant="neutral" />
                        )}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <StudentRowActions
                          classes={classOptions}
                          student={{
                            id: s.id,
                            first_name: s.first_name,
                            last_name: s.last_name,
                            class_id: s.class_id,
                            dob: s.dob,
                            gender: s.gender,
                            enrollment_date: s.enrollment_date,
                            status: s.status,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
