import { notFound } from "next/navigation";
import { JitsiEmbed } from "@/components/jitsi-embed";

export const metadata = { title: "Join class — SchoolPurse" };

const SLUG = /^[a-z0-9-]+$/i;

// Public student guest-join page. The slug is the access capability; no login.
export default async function PublicRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();

  return (
    <main className="min-h-svh bg-background p-4">
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold tracking-tight">
            School<span className="text-primary">Purse</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              live class
            </span>
          </span>
        </div>
        <JitsiEmbed slug={slug} />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Allow camera and microphone to join, and type your name when asked.
        </p>
      </div>
    </main>
  );
}
