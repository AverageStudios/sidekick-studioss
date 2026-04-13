import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  badge,
  title,
  description,
  actions,
  className,
}: {
  badge?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden bg-[linear-gradient(135deg,#fffefc_0%,#f4f1ff_58%,#edf6f4_100%)] p-6 sm:p-7 lg:p-8", className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-[0.875rem]">
          {badge ? <Badge>{badge}</Badge> : null}
          <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted-strong)] sm:text-base">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-col gap-[0.625rem] sm:flex-row sm:items-center">{actions}</div> : null}
      </div>
    </Card>
  );
}
