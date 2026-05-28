"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import {
  NewChildDialog,
  type ClassOption,
  type RegistrationFee,
} from "./new-child-dialog";

interface Props {
  classes: ClassOption[];
  feeItems: RegistrationFee[];
  termStartDate?: string;
}

export function NewChildButton({ classes, feeItems, termStartDate }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New Registration"
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-2 text-[12.5px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 sm:px-3.5"
      >
        <UserPlus className="size-3.5" strokeWidth={2.5} />
        {/* Full label on tablet+, just "Add" on phone to keep the topbar
            from wrapping next to the title + bell. */}
        <span className="hidden sm:inline">New Registration</span>
        <span className="sm:hidden">Add</span>
      </button>

      <NewChildDialog
        open={open}
        onOpenChange={setOpen}
        classes={classes}
        feeItems={feeItems}
        termStartDate={termStartDate}
      />
    </>
  );
}
