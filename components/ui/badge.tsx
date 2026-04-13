import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[color-mix(in_oklab,var(--brand)_14%,white)] bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]",
        className,
      )}
      {...props}
    />
  );
}
