"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  removeStudentPhoto,
  uploadStudentPhoto,
} from "../photo-actions";

interface Props {
  studentId: string;
  initialUrl: string | null;
  initials: string;
}

export function StudentPhotoUpload({ studentId, initialUrl, initials }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(initialUrl);

  React.useEffect(() => {
    setPreview(initialUrl);
  }, [initialUrl]);

  function pickFile(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Photo must be 4 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.set("photo", file);
    startTransition(async () => {
      const res = await uploadStudentPhoto(studentId, formData);
      if (!res.ok) {
        setPreview(initialUrl);
        toast.error(res.error);
        return;
      }
      toast.success("Photo updated");
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeStudentPhoto(studentId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPreview(null);
      toast.success("Photo removed");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border border-border bg-sp-card-alt">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Student photo"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold text-muted-foreground">
              {initials}
            </span>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={pending}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={pending}
          aria-label="Change photo"
          className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-sp-card-alt disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
        </button>
      </div>
      {preview ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={handleRemove}
        >
          <Trash2 className="size-3.5" />
          Remove photo
        </Button>
      ) : null}
    </div>
  );
}
