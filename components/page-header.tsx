import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  badge,
  title,
  description,
  actions,
  className,
  variant = "card",
}: {
  badge?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: "card" | "plain";
}) {
  if (variant === "plain") {
    return (
      <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
        <div className="space-y-3">
          {badge ? <Badge>{badge}</Badge> : null}
          <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.055em] text-[var(--ink)] sm:text-[2.3rem]">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">{description}</p>
        </div>
        {actions ? <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">{actions}</div> : null}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-6 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-7",
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          {badge ? <Badge>{badge}</Badge> : null}
          <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.055em] text-[var(--ink)] sm:text-[2.35rem]">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-strong)] sm:text-[15px]">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">{actions}</div> : null}
      </div>
    </Card>
  );
}
