import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  phase: string;
}

export function PagePlaceholder({
  title,
  description,
  phase,
}: PagePlaceholderProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-16 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Construction className="size-5" />
      </span>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <p className="rounded-full bg-sp-card-alt px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sp-text-sub">
        {phase}
      </p>
    </Card>
  );
}
