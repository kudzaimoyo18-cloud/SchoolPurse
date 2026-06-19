"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClass, deleteClass, updateClass } from "./actions";
import type { Level } from "./school-levels-section";

interface ClassRow {
  id: string;
  name: string;
  level: Level;
}

const LEVEL_LABEL: Record<Level, string> = {
  ecd: "ECD",
  primary: "Primary",
  secondary: "Secondary",
  college: "College",
};

export function ClassesSection({
  classes,
  enabledLevels,
}: {
  classes: ClassRow[];
  enabledLevels: Level[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [editingLevel, setEditingLevel] = React.useState<Level>("primary");
  const [newOpen, setNewOpen] = React.useState<Level | null>(null);
  const [newName, setNewName] = React.useState("");

  // Group classes by level so the admin sees Primary / Secondary / Tertiary
  // as separate buckets — this is exactly what the user asked for.
  const grouped = React.useMemo(() => {
    const map: Record<Level, ClassRow[]> = {
      ecd: [],
      primary: [],
      secondary: [],
      college: [],
    };
    for (const c of classes) {
      map[c.level].push(c);
    }
    for (const level of Object.keys(map) as Level[]) {
      map[level].sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [classes]);

  function startEdit(c: ClassRow) {
    setEditingId(c.id);
    setEditingName(c.name);
    setEditingLevel(c.level);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  function saveEdit(id: string) {
    if (!editingName.trim()) {
      toast.error("Class name can't be empty.");
      return;
    }
    const fd = new FormData();
    fd.set("name", editingName.trim());
    fd.set("level", editingLevel);
    startTransition(async () => {
      const res = await updateClass(id, fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Class updated.");
      cancelEdit();
      router.refresh();
    });
  }

  function remove(c: ClassRow) {
    if (
      !confirm(
        `Delete "${c.name}"? This won't delete students, but they'll lose their class assignment.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteClass(c.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Class deleted.");
      router.refresh();
    });
  }

  function addNew(level: Level) {
    if (!newName.trim()) {
      toast.error("Type a class name first.");
      return;
    }
    const fd = new FormData();
    fd.set("name", newName.trim());
    fd.set("level", level);
    startTransition(async () => {
      const res = await createClass(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Class added.");
      setNewName("");
      setNewOpen(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 px-5 py-4">
      <div>
        <p className="text-[14.5px] font-semibold">Classes</p>
        <p className="text-[11px] text-muted-foreground">
          Manage the class list per level. Students and fee items reference
          these names. Levels without a checkmark in the &ldquo;School
          levels&rdquo; section above won&rsquo;t accept new classes.
        </p>
      </div>

      {(Object.keys(grouped) as Level[]).map((level) => {
        const rows = grouped[level];
        const enabled = enabledLevels.includes(level);
        // Hide sections entirely if the level is disabled AND has no existing
        // classes — there's nothing to show and nothing the admin can add.
        if (!enabled && rows.length === 0) return null;
        return (
          <div
            key={level}
            className="overflow-hidden rounded-lg border border-border"
          >
            <div className="flex items-center justify-between border-b border-border bg-sp-card-alt px-4 py-2.5">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold">
                  {LEVEL_LABEL[level]}
                </p>
                {!enabled ? (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    disabled
                  </span>
                ) : null}
                <span className="text-[11px] text-muted-foreground">
                  · {rows.length} class{rows.length === 1 ? "" : "es"}
                </span>
              </div>
              {enabled ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewOpen(newOpen === level ? null : level);
                    setNewName("");
                  }}
                  disabled={pending}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="size-3" />
                  Add class
                </Button>
              ) : null}
            </div>

            {/* Inline "add new" row appears only when admin clicked "Add class" */}
            {newOpen === level ? (
              <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-4 py-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`e.g. ${
                    level === "ecd"
                      ? "Nursery"
                      : level === "primary"
                        ? "Grade 8"
                        : level === "secondary"
                          ? "Form 4 Blue"
                          : "Year 2"
                  }`}
                  disabled={pending}
                  autoFocus
                  className="h-8 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addNew(level);
                    } else if (e.key === "Escape") {
                      setNewOpen(null);
                      setNewName("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addNew(level)}
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
                    setNewOpen(null);
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

            {rows.length === 0 ? (
              <p className="px-4 py-5 text-center text-xs text-muted-foreground">
                No classes yet. Click &ldquo;Add class&rdquo; or enable this
                level above to seed defaults.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <li
                      key={c.id}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2",
                        isEditing && "bg-primary/5",
                      )}
                    >
                      {isEditing ? (
                        <>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            disabled={pending}
                            autoFocus
                            className="h-8 flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEdit(c.id);
                              } else if (e.key === "Escape") {
                                cancelEdit();
                              }
                            }}
                          />
                          <select
                            value={editingLevel}
                            onChange={(e) =>
                              setEditingLevel(e.target.value as Level)
                            }
                            disabled={pending}
                            className="h-8 rounded-md border border-input bg-card px-2 text-xs"
                          >
                            {enabledLevels.map((l) => (
                              <option key={l} value={l}>
                                {LEVEL_LABEL[l]}
                              </option>
                            ))}
                            {!enabledLevels.includes(c.level) ? (
                              <option value={c.level}>
                                {LEVEL_LABEL[c.level]} (disabled)
                              </option>
                            ) : null}
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveEdit(c.id)}
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
                            onClick={cancelEdit}
                            disabled={pending}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Cancel"
                          >
                            <X className="size-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="flex-1 truncate text-sm font-medium">
                            {c.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            disabled={pending}
                            className="text-muted-foreground transition hover:text-foreground"
                            aria-label={`Edit ${c.name}`}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(c)}
                            disabled={pending}
                            className="text-muted-foreground transition hover:text-sp-red"
                            aria-label={`Delete ${c.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
