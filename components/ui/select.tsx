import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-[20px] border border-[var(--line)] bg-white px-[1.125rem] text-sm text-[var(--ink)] shadow-[var(--shadow-soft)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--soft-brand)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
