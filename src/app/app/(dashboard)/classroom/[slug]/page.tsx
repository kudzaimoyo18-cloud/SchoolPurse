import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/current-user";
import { JitsiEmbed } from "@/components/jitsi-embed";
import { CopyLinkButton } from "../copy-link-button";

export const metadata = { title: "Classroom — SchoolPurse" };

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const me = await requireRole(["school_admin", "platform_admin", "teacher"]);
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("meeting_rooms")
    .select("label, scope, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!room) notFound();
  const r = room as { label: string; scope: string; slug: string };
  if (
    r.scope === "admins" &&
    me.role !== "school_admin" &&
    me.role !== "platform_admin"
  ) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/app/classroom"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <h1 className="text-lg font-bold tracking-tight">{r.label}</h1>
        </div>
        {r.scope === "class" ? (
          <CopyLinkButton path={`/room/${r.slug}`} />
        ) : null}
      </div>

      <JitsiEmbed slug={r.slug} />

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Powered by Jitsi Meet. Allow camera and microphone when prompted. To
        start a room you may be asked to sign in to Jitsi once. For class rooms,
        share the student link above — pupils join with no login.
      </p>
    </div>
  );
}
