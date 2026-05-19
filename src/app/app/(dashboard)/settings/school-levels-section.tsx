"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, GraduationCap } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateSchoolLevels } from "./actions";

export type Level = "primary" | "secondary" | "tertiary";

const LEVEL_DETAILS: Record<
  Level,
  { label: string; blurb: string }
> = {
  primary: {
    label: "Primary",
    blurb: "ECD A&B through Grade 7.",
  },
  secondary: {
    label: "Secondary",
    blurb: "Form 1–6 (Lower / Upper 6).",
  },
  tertiary: {
    label: "Tertiary",
    blurb: "Colleges, vocational programmes, Year 1–4.",
  },
};

export function SchoolLevelsSection({
  enabledLevels,
}: {
  enabledLevels: Level[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [selected, setSelected] = React.useState<Set<Level>>(
    new Set(enabledLevels),
  );

  // Track whether the form is dirty so we can disable Save until something
  // actually changes.
  const isDirty = React.useMemo(() => {
    const a = [...selected].sort().join(",");
    const b = [...enabledLevels].sort().join(",");
    return a !== b;
  }, [selected, enabledLevels]);

  function toggle(level: Level) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.size === 0) {
      toast.error("Pick at least one level.");
      return;
    }
    const formData = new FormData();
    for (const level of selected) formData.append("levels", level);

    startTransition(async () => {
      const res = await updateSchoolLevels(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.seeded > 0) {
        toast.success(
          `Levels saved — ${res.seeded} default class${res.seeded === 1 ? "" : "es"} added.`,
        );
      } else {
        toast.success("Levels saved.");
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {(Object.keys(LEVEL_DETAILS) as Level[]).map((level) => {
          const isOn = selected.has(level);
          const wasOn = enabledLevels.includes(level);
          return (
            <label
              key={level}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition",
                isOn
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-foreground/20",
                pending && "pointer-events-none opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => toggle(level)}
                disabled={pending}
                className="mt-0.5 size-4 cursor-pointer"
                aria-label={`Enable ${LEVEL_DETAILS[level].label}`}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-semibold">
                  <GraduationCap className="size-3.5 text-primary" />
                  {LEVEL_DETAILS[level].label}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {LEVEL_DETAILS[level].blurb}
                </p>
                {!wasOn && isOn ? (
                  <p className="mt-1 text-[10.5px] font-medium text-primary">
                    Will seed default classes
                  </p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-muted-foreground">
          Toggling a level off keeps existing students &amp; classes but
          prevents new classes of that level from being added.
        </p>
        <Button type="submit" disabled={pending || !isDirty}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save levels
        </Button>
      </div>

      {/* Hidden label so the field has an accessible group name even though
          checkboxes carry their own aria-label. */}
      <Label className="sr-only">School levels</Label>
    </form>
  );
}
