import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl space-y-4", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-ink)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-[-0.055em] text-[var(--ink)] sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="max-w-[42rem] text-sm leading-7 text-[var(--muted-strong)] sm:text-base">{description}</p> : null}
    </div>
  );
}
