"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { removeSchoolLogo, uploadSchoolLogo } from "./logo-actions";

interface Props {
  /** Public URL of the existing logo, or null if not yet uploaded. */
  logoUrl: string | null;
}

export function LogoSection({ logoUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(logoUrl);

  React.useEffect(() => {
    setPreview(logoUrl);
  }, [logoUrl]);

  function pickFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.set("logo", file);
    startTransition(async () => {
      const res = await uploadSchoolLogo(formData);
      if (!res.ok) {
        setPreview(logoUrl); // revert
        toast.error(res.error);
        return;
      }
      toast.success("Logo updated");
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeSchoolLogo();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPreview(null);
      toast.success("Logo removed");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-sp-card-alt">
        {preview ? (
          // Using <img> rather than next/image because the source may be a
          // data: URL during preview and a Supabase signed/public URL after
          // upload — next/image's strict remotePatterns would require config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="School logo"
            className="size-full object-contain p-1"
          />
        ) : (
          <Briefcase className="size-8 text-muted-foreground" strokeWidth={1.8} />
        )}
      </div>

      <div className="flex-1 space-y-2">
        <Label htmlFor="logo-input" className="block">
          School logo
        </Label>
        <p className="text-xs text-muted-foreground">
          PNG, JPEG, WebP, or SVG. Max 2 MB. Shown on receipts, invoices, and
          the sidebar.
        </p>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            id="logo-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            disabled={pending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => fileInput.current?.click()}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {preview ? "Replace" : "Upload logo"}
          </Button>
          {preview ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={handleRemove}
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
