import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[132px] w-full rounded-[24px] border border-[var(--line)] bg-white px-[1.125rem] py-[0.875rem] text-sm text-[var(--ink)] shadow-[var(--shadow-soft)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--soft-brand)]",
        className,
      )}
      {...props}
    />
  );
}
