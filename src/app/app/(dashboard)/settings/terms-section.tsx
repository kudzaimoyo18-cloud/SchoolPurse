"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarRange, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTermDates } from "./actions";

interface TermRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

function TermRowEditor({ term }: { term: TermRow }) {
  const router = useRouter();
  const [start, setStart] = React.useState(term.start_date ?? "");
  const [end, setEnd] = React.useState(term.end_date ?? "");
  const [pending, startTransition] = React.useTransition();
  const dirty = start !== (term.start_date ?? "") || end !== (term.end_date ?? "");

  function save() {
    if (!start || !end) {
      toast.error("Both dates are required.");
      return;
    }
    if (end < start) {
      toast.error("End date can't be before the start date.");
      return;
    }
    startTransition(async () => {
      const res = await updateTermDates({
        id: term.id,
        start_date: start,
        end_date: end,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${term.name} dates updated`);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-end sm:gap-4">
      <div className="min-w-0 sm:w-36 sm:self-center">
        <p className="text-sm font-medium">
          {term.name}
          {term.is_current ? (
            <span className="ml-2 rounded-full bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-primary/20">
              current
            </span>
          ) : null}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`start-${term.id}`} className="text-xs">
            Start
          </Label>
          <Input
            id={`start-${term.id}`}
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            disabled={pending}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`end-${term.id}`} className="text-xs">
            End
          </Label>
          <Input
            id={`end-${term.id}`}
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            disabled={pending}
            className="h-9"
          />
        </div>
      </div>
      <Button
        size="sm"
        onClick={save}
        disabled={pending || !dirty}
        className="sm:ml-auto sm:self-end"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Save
      </Button>
    </li>
  );
}

/**
 * Dates-only editor for the school's terms. Lets admins correct the term
 * start/end dates that were auto-seeded at onboarding so invoice due dates and
 * term-scoped views line up with the real school calendar. Renaming, choosing
 * the current term, and adding/removing terms are out of scope here.
 */
export function TermsSection({ terms }: { terms: TermRow[] }) {
  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        <div className="flex size-8 items-center justify-center rounded-md bg-sp-card-alt">
          <CalendarRange className="size-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-[14.5px] font-semibold leading-tight">
            Term dates
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Set each term&apos;s start and end dates so invoice due dates and
            term reports match your real calendar.
          </p>
        </div>
      </div>

      {terms.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          No terms yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {terms.map((t) => (
            <TermRowEditor key={t.id} term={t} />
          ))}
        </ul>
      )}
    </>
  );
}
