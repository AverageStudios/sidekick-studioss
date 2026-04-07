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
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="text-base leading-7 text-[var(--muted-strong)]">{description}</p> : null}
    </div>
  );
}

