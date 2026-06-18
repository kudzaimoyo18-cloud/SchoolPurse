"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createStudent, updateStudent } from "./actions";

interface ClassOption {
  id: string;
  name: string;
}

interface StudentInitial {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
  dob: string | null;
  gender: string | null;
  enrollment_date: string;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  home_address: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: ClassOption[];
  initial?: StudentInitial | null;
}

export function StudentDialog({ open, onOpenChange, classes, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const isEdit = !!initial;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = isEdit
        ? await updateStudent(initial!.id, formData)
        : await createStudent(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Student updated" : "Student added");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit student" : "Add student"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this student's details."
              : "Enrol a new student. You can assign a class later."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                name="first_name"
                required
                defaultValue={initial?.first_name ?? ""}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                name="last_name"
                required
                defaultValue={initial?.last_name ?? ""}
                disabled={pending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="class_id">Class</Label>
            <select
              id="class_id"
              name="class_id"
              defaultValue={initial?.class_id ?? ""}
              disabled={pending}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— No class —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                defaultValue={initial?.dob ?? ""}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                defaultValue={initial?.gender ?? ""}
                disabled={pending}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enrollment_date">Enrollment date</Label>
            <Input
              id="enrollment_date"
              name="enrollment_date"
              type="date"
              required
              defaultValue={
                initial?.enrollment_date ?? new Date().toISOString().slice(0, 10)
              }
              disabled={pending}
            />
          </div>

          {/* Guardian contact — parent_phone is where fee reminders go. */}
          <div className="space-y-3 rounded-lg border border-border bg-sp-card-alt/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sp-text-sub">
              Parent / guardian
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="parent_name">Name</Label>
                <Input
                  id="parent_name"
                  name="parent_name"
                  defaultValue={initial?.parent_name ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parent_phone">
                  Phone <span className="text-muted-foreground">· reminders</span>
                </Label>
                <Input
                  id="parent_phone"
                  name="parent_phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+263 77 123 4567"
                  defaultValue={initial?.parent_phone ?? ""}
                  disabled={pending}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parent_email">Email (optional)</Label>
              <Input
                id="parent_email"
                name="parent_email"
                type="email"
                defaultValue={initial?.parent_email ?? ""}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="home_address">Home address</Label>
              <Input
                id="home_address"
                name="home_address"
                defaultValue={initial?.home_address ?? ""}
                disabled={pending}
              />
            </div>
          </div>

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
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Add student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
