import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <input
      className={cn(
        "h-12 w-full appearance-none rounded-[20px] border border-[var(--line)] bg-white/92 px-[1.125rem] text-sm text-[var(--ink)] shadow-[var(--shadow-soft)] outline-none transition-all duration-200 placeholder:text-[var(--muted)] hover:border-[color-mix(in_oklab,var(--brand)_14%,white)] focus:bg-white focus:ring-2 focus:ring-[var(--soft-brand)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]",
        invalid
          ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
          : "focus:border-[color-mix(in_oklab,var(--brand)_34%,white)]",
        className,
      )}
      {...props}
    />
  );
}
