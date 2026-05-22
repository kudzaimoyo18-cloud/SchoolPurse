"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Megaphone, Send, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAnnouncement,
  deactivateAnnouncement,
} from "../announcements-actions";

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  type: string;
  active: boolean;
  email_sent: boolean;
  created_at: string;
}

interface Props {
  announcements: AnnouncementRow[];
}

const TYPE_OPTIONS = [
  { value: "update", label: "Update", color: "bg-violet-100 text-violet-700" },
  { value: "info", label: "Info", color: "bg-blue-100 text-blue-700" },
  { value: "success", label: "Success", color: "bg-emerald-100 text-emerald-700" },
  { value: "warning", label: "Warning", color: "bg-amber-100 text-amber-700" },
];

export function AnnouncementsSection({ announcements }: Props) {
  const [showForm, setShowForm] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const res = await createAnnouncement(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const emailMsg = res.emailsSent > 0
        ? ` — ${res.emailsSent} email${res.emailsSent > 1 ? "s" : ""} sent`
        : "";
      toast.success(`Announcement published${emailMsg}`);
      form.reset();
      setShowForm(false);
    });
  }

  function handleDeactivate(id: string) {
    startTransition(async () => {
      const res = await deactivateAnnouncement(id);
      if (!res.ok) {
        toast.error(typeof res.error === "string" ? res.error : "Failed");
        return;
      }
      toast.success("Announcement deactivated");
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Announcements</h3>
            <p className="text-[11px] text-muted-foreground">
              Broadcast updates to all school admins. Active announcements appear as a banner.
            </p>
          </div>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} disabled={pending}>
            <Send className="size-3.5" />
            New announcement
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border-b border-border bg-sp-card-alt p-5">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                name="title"
                required
                placeholder="e.g. New feature: Uniform billing"
                disabled={pending}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-body">Message (optional)</Label>
              <textarea
                id="ann-body"
                name="body"
                rows={3}
                placeholder="Tell your users what changed or what they need to know..."
                disabled={pending}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ann-type">Type</Label>
                <select
                  id="ann-type"
                  name="type"
                  disabled={pending}
                  defaultValue="update"
                  className="flex h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="ann-email"
                  name="send_email"
                  className="size-4"
                  disabled={pending}
                />
                <Label htmlFor="ann-email" className="text-sm font-normal">
                  Also send email to all users
                </Label>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Publish
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* List existing announcements */}
      <div className="divide-y divide-border">
        {announcements.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-muted-foreground">
            No announcements yet. Click &quot;New announcement&quot; to broadcast your first update.
          </p>
        ) : (
          announcements.map((a) => {
            const typeOpt = TYPE_OPTIONS.find((t) => t.value === a.type);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-3 px-5 py-3 ${!a.active ? "opacity-50" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        typeOpt?.color ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {typeOpt?.label ?? a.type}
                    </span>
                    {a.email_sent && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Mail className="size-3" /> emailed
                      </span>
                    )}
                    {!a.active && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        inactive
                      </span>
                    )}
                  </div>
                  {a.body && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {a.body}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {a.active && (
                  <button
                    type="button"
                    onClick={() => handleDeactivate(a.id)}
                    disabled={pending}
                    className="mt-1 rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    title="Deactivate"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
