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
        "inline-flex items-center justify-center rounded-full font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:pointer-events-none disabled:opacity-60",
        variant === "primary" &&
          "bg-[var(--brand)] px-5 text-white shadow-[0_14px_28px_rgba(80,70,180,0.24)] hover:-translate-y-0.5 hover:bg-[color-mix(in_oklab,var(--brand)_86%,white)]",
        variant === "secondary" &&
          "bg-white text-[var(--ink)] shadow-[0_14px_28px_rgba(14,23,47,0.08)] hover:-translate-y-0.5",
        variant === "outline" &&
          "border border-[var(--line)] bg-white/60 text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]",
        variant === "ghost" &&
          "text-[var(--muted-strong)] hover:bg-white/70 hover:text-[var(--ink)]",
        size === "sm" && "h-10 px-4 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        className,
      )}
      {...props}
    />
  );
}

