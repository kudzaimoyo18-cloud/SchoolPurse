"use client";

import * as React from "react";
import { X, Info, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { dismissAnnouncement } from "@/app/app/(dashboard)/announcements-actions";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "success" | "update";
  created_at: string;
}

interface Props {
  announcement: Announcement | null;
}

const TYPE_CONFIG: Record<
  Announcement["type"],
  { icon: React.ElementType; bg: string; border: string; text: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-900 dark:text-amber-100",
    iconColor: "text-amber-500",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-900 dark:text-emerald-100",
    iconColor: "text-emerald-500",
  },
  update: {
    icon: Sparkles,
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-900 dark:text-violet-100",
    iconColor: "text-violet-500",
  },
};

export function AnnouncementBanner({ announcement }: Props) {
  const [dismissed, setDismissed] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  if (!announcement || dismissed) return null;

  const config = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  const Icon = config.icon;

  function handleDismiss() {
    setDismissed(true);
    startTransition(async () => {
      await dismissAnnouncement(announcement!.id);
    });
  }

  return (
    <div
      className={`flex items-start gap-3 border-b px-7 py-3 ${config.bg} ${config.border} ${config.text}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${config.iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">{announcement.title}</p>
        {announcement.body && (
          <p className="mt-0.5 text-[12px] opacity-80">{announcement.body}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        disabled={pending}
        aria-label="Dismiss announcement"
        className="mt-0.5 shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
