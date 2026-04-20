import { cn } from "@/lib/utils";

export function InitialsAvatar({
  initials,
  label,
  size = "md",
  tone = "subtle",
  className,
}: {
  initials: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  tone?: "subtle" | "brand";
  className?: string;
}) {
  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition-colors",
        size === "sm" && "h-8 w-8 text-[11px]",
        size === "md" && "h-9 w-9 text-[12px]",
        size === "lg" && "h-11 w-11 text-sm",
        tone === "subtle" && "bg-[var(--soft-panel)] text-[var(--ink)]",
        tone === "brand" && "bg-[var(--brand)] text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}
