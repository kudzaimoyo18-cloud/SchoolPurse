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
}

export function NewChildButton({ classes, feeItems }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        <UserPlus className="size-3.5" strokeWidth={2.5} />
        New Registration
      </button>

      <NewChildDialog
        open={open}
        onOpenChange={setOpen}
        classes={classes}
        feeItems={feeItems}
      />
    </>
  );
}
