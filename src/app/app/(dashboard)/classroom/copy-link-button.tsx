"use client";

import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({
  path,
  label = "Copy student link",
}: {
  path: string;
  label?: string;
}) {
  function copy() {
    const url = `${window.location.origin}${path}`;
    if (!navigator.clipboard) {
      toast.error("Clipboard not available — copy from the address bar.");
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Student join link copied"))
      .catch(() => toast.error("Couldn't copy the link"));
  }

  return (
    <Button type="button" variant="outline" onClick={copy}>
      <Link2 className="size-4" />
      {label}
    </Button>
  );
}
