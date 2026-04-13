import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-[20px] border border-[var(--line)] bg-white px-[1.125rem] text-sm text-[var(--ink)] shadow-[var(--shadow-soft)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--soft-brand)]",
        className,
      )}
      {...props}
    />
  );
}
