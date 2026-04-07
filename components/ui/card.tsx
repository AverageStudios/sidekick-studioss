import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--line)] bg-white/85 shadow-[0_18px_40px_rgba(18,24,40,0.06)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

