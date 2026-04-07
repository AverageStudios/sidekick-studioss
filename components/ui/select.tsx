import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--soft-brand)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

