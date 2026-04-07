import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--soft-brand)] px-3 py-1 text-xs font-semibold text-[var(--brand)]",
        className,
      )}
      {...props}
    />
  );
}

