"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  Shield,
  GraduationCap,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureRoom } from "./actions";

interface ClassOption {
  id: string;
  name: string;
}

export function ClassroomList({
  classes,
  isAdmin,
}: {
  classes: ClassOption[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const [busy, setBusy] = React.useState<string | null>(null);

  function open(
    scope: "class" | "staff" | "admins",
    classId: string | null,
    key: string,
  ) {
    setBusy(key);
    startTransition(async () => {
      const res = await ensureRoom({ scope, class_id: classId });
      if (!res.ok) {
        setBusy(null);
        toast.error(res.error);
        return;
      }
      router.push(`/app/classroom/${res.slug}`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <RoomCard
          icon={Users}
          title="Staff room"
          desc="All teachers and admins"
          loading={busy === "staff"}
          disabled={busy !== null}
          onClick={() => open("staff", null, "staff")}
        />
        {isAdmin ? (
          <RoomCard
            icon={Shield}
            title="Admins room"
            desc="School admins only"
            loading={busy === "admins"}
            disabled={busy !== null}
            onClick={() => open("admins", null, "admins")}
          />
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sp-text-sub">
          Class rooms
        </p>
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No classes yet — add them in Settings.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id}>
                <RoomCard
                  icon={GraduationCap}
                  title={c.name}
                  desc="Class video room"
                  loading={busy === c.id}
                  disabled={busy !== null}
                  onClick={() => open("class", c.id, c.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RoomCard({
  icon: Icon,
  title,
  desc,
  loading,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition",
        disabled
          ? "opacity-60"
          : "hover:border-primary/30 hover:shadow-sm",
      )}
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary dark:bg-primary/20">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{desc}</span>
      </span>
      <span className="text-primary">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Video className="size-4" />
        )}
      </span>
    </button>
  );
}
