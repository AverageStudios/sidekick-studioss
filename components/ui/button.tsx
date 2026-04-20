import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  asChild,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex appearance-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--brand)_60%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:pointer-events-none disabled:opacity-60",
        variant === "primary" &&
          "border border-transparent bg-[var(--brand)] px-5 !font-bold !text-white shadow-[0_16px_30px_rgba(80,70,180,0.18)] hover:-translate-y-0.5 hover:bg-[color-mix(in_oklab,var(--brand)_88%,white)] hover:shadow-[0_18px_34px_rgba(80,70,180,0.22)] active:translate-y-px active:bg-[var(--brand-ink)] active:shadow-[0_10px_20px_rgba(80,70,180,0.18)] [&_svg]:!text-white",
        variant === "secondary" &&
          "border border-[var(--line)] bg-white/92 text-[var(--ink)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_16%,white)] hover:bg-white hover:shadow-[0_14px_28px_rgba(16,24,40,0.06)] active:translate-y-px active:bg-[var(--soft-panel)]",
        variant === "outline" &&
          "border border-[var(--line)] bg-white/78 text-[var(--ink)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_32%,white)] hover:bg-white hover:text-[var(--brand)] active:translate-y-px active:bg-[var(--soft-panel)]",
        variant === "ghost" &&
          "text-[var(--muted-strong)] hover:bg-white/72 hover:text-[var(--ink)] active:bg-[var(--soft-panel)]",
        size === "sm" && "h-10 px-4 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-sm sm:h-[3.25rem] sm:px-[1.625rem] sm:text-base",
        className,
      )}
      {...props}
    />
  );
}
