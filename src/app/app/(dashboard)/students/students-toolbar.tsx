"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentDialog } from "./student-dialog";
import { ImportDialog } from "./import-dialog";

interface ClassOption {
  id: string;
  name: string;
}

export function StudentsToolbar({ classes }: { classes: ClassOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openAdd, setOpenAdd] = React.useState(false);
  const [openImport, setOpenImport] = React.useState(false);
  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");

  // Debounced URL update
  React.useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) {
        params.set("q", search.trim());
      } else {
        params.delete("q");
      }
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative max-w-xs flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or class"
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setOpenImport(true)}>
          <Upload className="size-4" />
          Import CSV
        </Button>
        <Button onClick={() => setOpenAdd(true)}>
          <Plus className="size-4" />
          Add student
        </Button>
      </div>

      <StudentDialog open={openAdd} onOpenChange={setOpenAdd} classes={classes} />
      <ImportDialog open={openImport} onOpenChange={setOpenImport} />
    </div>
  );
}
