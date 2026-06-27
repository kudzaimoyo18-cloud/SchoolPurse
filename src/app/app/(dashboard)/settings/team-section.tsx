"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  inviteTeammate,
  removeTeammate,
  changeTeammateRole,
} from "./team-actions";

interface Teammate {
  id: string;
  name: string;
  email: string;
  role: "platform_admin" | "school_admin" | "bursar" | "teacher";
  status: "active" | "invited" | string;
}

const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Platform Admin",
  school_admin: "Head / Admin",
  bursar: "Bursar",
  teacher: "Teacher",
};

export function TeamSection({
  teammates,
  currentUserId,
}: {
  teammates: Teammate[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [openInvite, setOpenInvite] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await inviteTeammate(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Teammate invited");
      formRef.current?.reset();
      setOpenInvite(false);
      router.refresh();
    });
  }

  function handleRemove(t: Teammate) {
    if (
      !confirm(
        `Remove ${t.name} (${t.email}) from this school? They'll lose access immediately.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await removeTeammate(t.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${t.name} removed`);
      router.refresh();
    });
  }

  function handleRoleChange(
    t: Teammate,
    role: "school_admin" | "bursar" | "teacher",
  ) {
    if (t.role === role) return;
    startTransition(async () => {
      const res = await changeTeammateRole(t.id, role);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${t.name} is now ${ROLE_LABELS[role] ?? role}`);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <h2 className="text-[14.5px] font-semibold leading-tight">Team</h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            People who can sign in and see this school&apos;s data. Invitees
            sign in with the same email via Google.
          </p>
        </div>
        {!openInvite ? (
          <Button size="sm" onClick={() => setOpenInvite(true)}>
            <UserPlus className="size-3.5" />
            Invite teammate
          </Button>
        ) : null}
      </div>

      {openInvite ? (
        <form
          ref={formRef}
          onSubmit={handleInvite}
          className="space-y-3 border-b border-border bg-sp-card-alt px-5 py-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                placeholder="bursar@school.example"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                name="name"
                required
                placeholder="Their full name"
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                name="role"
                defaultValue="bursar"
                disabled={pending}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="school_admin">Head / Admin (full access)</option>
                <option value="bursar">Bursar (finance ops)</option>
                <option value="teacher">Teacher (read-only)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpenInvite(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Send invite
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            They&apos;ll be able to sign in immediately at{" "}
            <code className="text-foreground">/login</code> by clicking
            &quot;Continue with Google&quot; with this exact email.
          </p>
        </form>
      ) : null}

      {/* Mobile: stacked teammate cards instead of a side-scrolling table. */}
      <ul className="divide-y divide-border md:hidden">
        {teammates.map((t) => {
          const isMe = t.id === currentUserId;
          return (
            <li key={t.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.name}
                    {isMe ? (
                      <span className="ml-2 text-[10.5px] font-normal text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {t.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge
                    label={t.status === "active" ? "Active" : t.status}
                    variant={t.status === "active" ? "success" : "neutral"}
                  />
                  {!isMe ? (
                    <button
                      type="button"
                      onClick={() => handleRemove(t)}
                      disabled={pending}
                      aria-label={`Remove ${t.name}`}
                      title="Remove"
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-red-soft hover:text-sp-red disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-2">
                {isMe ? (
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[t.role] ?? t.role}
                  </span>
                ) : (
                  <select
                    value={t.role}
                    onChange={(e) =>
                      handleRoleChange(
                        t,
                        e.target.value as
                          | "school_admin"
                          | "bursar"
                          | "teacher",
                      )
                    }
                    disabled={pending}
                    className="flex h-8 w-full rounded-md border border-input bg-card px-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="school_admin">Head / Admin</option>
                    <option value="bursar">Bursar</option>
                    <option value="teacher">Teacher</option>
                  </select>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: the full table. */}
      <div className="hidden overflow-x-auto md:block">
      <Table>
        <TableHeader className="bg-sp-card-alt">
          <TableRow>
            <TableHead className="pl-5">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-5 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teammates.map((t) => {
            const isMe = t.id === currentUserId;
            return (
              <TableRow key={t.id}>
                <TableCell className="pl-5 font-medium">
                  {t.name}
                  {isMe ? (
                    <span className="ml-2 text-[10.5px] font-normal text-muted-foreground">
                      (you)
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.email}
                </TableCell>
                <TableCell>
                  {isMe ? (
                    <span className="text-sm">
                      {ROLE_LABELS[t.role] ?? t.role}
                    </span>
                  ) : (
                    <select
                      value={t.role}
                      onChange={(e) =>
                        handleRoleChange(
                          t,
                          e.target.value as
                            | "school_admin"
                            | "bursar"
                            | "teacher",
                        )
                      }
                      disabled={pending}
                      className="flex h-7 rounded-md border border-input bg-card px-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="school_admin">Head / Admin</option>
                      <option value="bursar">Bursar</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={t.status === "active" ? "Active" : t.status}
                    variant={t.status === "active" ? "success" : "neutral"}
                  />
                </TableCell>
                <TableCell className="pr-5 text-right">
                  {isMe ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemove(t)}
                      disabled={pending}
                      aria-label={`Remove ${t.name}`}
                      title="Remove"
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-sp-red-soft hover:text-sp-red disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
