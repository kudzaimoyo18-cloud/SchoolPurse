"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, UserX, UserCheck, Loader2 } from "lucide-react";
import { StudentDialog } from "./student-dialog";
import { setStudentStatus } from "./actions";

interface ClassOption {
  id: string;
  name: string;
}

interface Props {
  classes: ClassOption[];
  student: {
    id: string;
    first_name: string;
    last_name: string;
    class_id: string | null;
    dob: string | null;
    gender: string | null;
    enrollment_date: string;
    status: "active" | "withdrawn";
    parent_name: string | null;
    parent_phone: string | null;
    parent_email: string | null;
    home_address: string | null;
  };
}

/**
 * Inline icon buttons for each student row. Switched away from a dropdown
 * menu because base-ui's Menu.Item.onSelect closes the menu and races with
 * the Dialog mount, so the edit dialog never opens.
 */
export function StudentRowActions({ classes, student }: Props) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function toggleStatus() {
    const next = student.status === "active" ? "withdrawn" : "active";
    startTransition(async () => {
      const res = await setStudentStatus(student.id, next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        next === "active" ? "Student reinstated" : "Student withdrawn",
      );
      router.refresh();
    });
  }

  const isActive = student.status === "active";

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
        <button
          type="button"
          onClick={() => setOpenEdit(true)}
          aria-label="Edit student"
          title="Edit"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={pending}
          aria-label={isActive ? "Withdraw student" : "Reinstate student"}
          title={isActive ? "Withdraw" : "Reinstate"}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : isActive ? (
            <UserX className="size-3.5" />
          ) : (
            <UserCheck className="size-3.5" />
          )}
        </button>
      </div>
      <StudentDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        classes={classes}
        initial={student}
      />
    </>
  );
}
