"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveAttendance } from "./actions";

type Status = "present" | "absent" | "late" | "excused";

const STATUSES: { value: Status; label: string; active: string }[] = [
  { value: "present", label: "Present", active: "bg-sp-green text-white" },
  { value: "absent", label: "Absent", active: "bg-sp-red text-white" },
  { value: "late", label: "Late", active: "bg-sp-amber text-white" },
  { value: "excused", label: "Excused", active: "bg-primary text-white" },
];

interface ClassOption {
  id: string;
  name: string;
}
interface StudentOption {
  id: string;
  first_name: string;
  last_name: string;
}

export function RegisterMarker({
  classes,
  classId,
  date,
  students,
  initialStatus,
}: {
  classes: ClassOption[];
  classId: string;
  date: string;
  students: StudentOption[];
  initialStatus: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [statuses, setStatuses] = React.useState<Record<string, Status>>(() => {
    const m: Record<string, Status> = {};
    for (const s of students) {
      const init = initialStatus[s.id];
      m[s.id] =
        init === "absent" || init === "late" || init === "excused"
          ? init
          : "present";
    }
    return m;
  });

  function navigate(nextClass: string, nextDate: string) {
    const params = new URLSearchParams();
    if (nextClass) params.set("class", nextClass);
    params.set("date", nextDate);
    router.push(`/app/attendance?${params.toString()}`);
  }

  function setAll(status: Status) {
    const m: Record<string, Status> = {};
    for (const s of students) m[s.id] = status;
    setStatuses(m);
  }

  function save() {
    const marks = students.map((s) => ({
      student_id: s.id,
      status: statuses[s.id] ?? "present",
    }));
    if (marks.length === 0) {
      toast.error("No students to mark.");
      return;
    }
    startTransition(async () => {
      const res = await saveAttendance({
        class_id: classId || null,
        date,
        marks,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Register saved — ${res.count} marked.`);
      router.refresh();
    });
  }

  const present = students.filter(
    (s) => statuses[s.id] === "present" || statuses[s.id] === "late",
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reg-class">Class</Label>
          <select
            id="reg-class"
            value={classId}
            onChange={(e) => navigate(e.target.value, date)}
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
          <Label htmlFor="reg-date">Date</Label>
          <Input
            id="reg-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => navigate(classId, e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {!classId ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 size-5 opacity-60" />
          Pick a class to mark its register.
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No active students in this class.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {present}/{students.length}
              </span>{" "}
              present
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAll("present")}
                disabled={pending}
                className="h-7 px-2 text-xs"
              >
                All present
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAll("absent")}
                disabled={pending}
                className="h-7 px-2 text-xs"
              >
                All absent
              </Button>
            </div>
          </div>

          <ul className="divide-y divide-border rounded-lg border border-border">
            {students.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium">
                  {s.first_name} {s.last_name}
                </span>
                <div className="flex gap-1">
                  {STATUSES.map((st) => {
                    const isActive = statuses[s.id] === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() =>
                          setStatuses((m) => ({ ...m, [s.id]: st.value }))
                        }
                        disabled={pending}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-[11.5px] font-semibold transition",
                          isActive
                            ? st.active + " border-transparent"
                            : "border-border bg-card text-muted-foreground hover:bg-sp-card-alt",
                        )}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-end">
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save register
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
