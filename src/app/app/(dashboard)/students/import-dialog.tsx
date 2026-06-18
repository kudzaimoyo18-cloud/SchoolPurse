"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { importStudentsCsv } from "./actions";

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await importStudentsCsv(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Imported ${res.count} student${res.count === 1 ? "" : "s"}`);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns:{" "}
            <code className="text-foreground">first_name, last_name, class, dob, gender, enrollment_date, opening_balance</code>
            . Only <code className="text-foreground">first_name</code> and{" "}
            <code className="text-foreground">last_name</code> are required.
            Class names must match existing classes exactly.{" "}
            <code className="text-foreground">opening_balance</code> is optional —
            the amount a student already owes (carried over from before
            SchoolPurse); it creates a carry-over invoice for that balance.
            You can also include optional{" "}
            <code className="text-foreground">parent_name, parent_phone, parent_email, home_address</code>{" "}
            columns — <code className="text-foreground">parent_phone</code> is
            where fee reminders are sent. Column order doesn&apos;t matter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="file">CSV file</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              disabled={pending}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-foreground hover:file:opacity-90"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Example row: <br />
            <code>Jane,Doe,Form 1,2014-03-12,female,2026-01-15,200</code>
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
