import { Sparkles, Lock } from "lucide-react";

// Shown in place of an AI-only feature (video classroom, in-app messaging)
// when the school isn't on the AI plan. Server component — safe to render
// from a page guard.
const AI_CHECKOUT = process.env.NEXT_PUBLIC_WHOP_AI_CHECKOUT;

export function AiUpgradeNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-xl py-10">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-sp-card-alt to-background p-8 text-center shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-2xl"
        />
        <span className="relative inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-6" strokeWidth={2} />
        </span>
        <h1 className="relative mt-4 text-xl font-bold tracking-tight">{title}</h1>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description} It&apos;s part of the{" "}
          <span className="font-medium text-foreground">AI plan</span>.
        </p>
        <a
          href={AI_CHECKOUT ?? "/#pricing"}
          {...(AI_CHECKOUT ? { target: "_blank", rel: "noreferrer" } : {})}
          className="relative mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Lock className="size-4" strokeWidth={2.2} />
          Upgrade to AI
        </a>
      </div>
    </div>
  );
}
