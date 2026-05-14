"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  };
}

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
      toast.success(next === "active" ? "Student reinstated" : "Student withdrawn");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Row actions"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-card-alt hover:text-foreground"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpenEdit(true)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleStatus} disabled={pending}>
            {student.status === "active" ? (
              <>
                <UserX className="size-4" />
                Withdraw
              </>
            ) : (
              <>
                <UserCheck className="size-4" />
                Reinstate
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <StudentDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        classes={classes}
        initial={student}
      />
    </>
  );
}
