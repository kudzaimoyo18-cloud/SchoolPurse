import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-[14.5px] font-semibold leading-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div>{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-5 py-5", bodyClassName)}>{children}</div>
    </section>
  );
}
