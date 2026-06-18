"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSubject, deleteSubject } from "./actions";

interface SubjectRow {
  id: string;
  name: string;
}

export function SubjectsSection({ subjects }: { subjects: SubjectRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [newOpen, setNewOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  function addNew() {
    if (!newName.trim()) {
      toast.error("Type a subject name first.");
      return;
    }
    const fd = new FormData();
    fd.set("name", newName.trim());
    startTransition(async () => {
      const res = await createSubject(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Subject added.");
      setNewName("");
      setNewOpen(false);
      router.refresh();
    });
  }

  function remove(s: SubjectRow) {
    if (
      !confirm(
        `Delete "${s.name}"? Existing report cards keep their saved marks.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteSubject(s.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Subject deleted.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14.5px] font-semibold">Subjects</p>
          <p className="text-[11px] text-muted-foreground">
            Used on the E-Report Book. Teachers enter a mark per subject each
            term.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setNewOpen(!newOpen);
            setNewName("");
          }}
          disabled={pending}
          className="h-7 px-2 text-xs"
        >
          <Plus className="size-3" />
          Add subject
        </Button>
      </div>

      {newOpen ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-primary/5 px-3 py-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Mathematics"
            disabled={pending}
            autoFocus
            className="h-8 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNew();
              } else if (e.key === "Escape") {
                setNewOpen(false);
                setNewName("");
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={addNew}
            disabled={pending}
            className="h-8"
          >
            {pending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Check className="size-3" />
            )}
          </Button>
          <button
            type="button"
            onClick={() => {
              setNewOpen(false);
              setNewName("");
            }}
            disabled={pending}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {subjects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          No subjects yet. Add your first subject.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <li
              key={s.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
            >
              <span className="font-medium">{s.name}</span>
              <button
                type="button"
                onClick={() => remove(s)}
                disabled={pending}
                className="text-muted-foreground transition hover:text-sp-red"
                aria-label={`Delete ${s.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
