"use client";

import type { HTMLAttributes, MouseEvent } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type InteractiveGlowCardProps = HTMLAttributes<HTMLDivElement> & {
  glowClassName?: string;
};

export function InteractiveGlowCard({
  className,
  glowClassName,
  children,
  onMouseMove,
  onMouseLeave,
  ...props
}: InteractiveGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
      node.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
    }

    onMouseMove?.(event);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (node) {
      node.style.setProperty("--glow-x", "50%");
      node.style.setProperty("--glow-y", "50%");
    }

    onMouseLeave?.(event);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "public-surface-card group relative overflow-hidden rounded-[30px]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100",
          glowClassName,
        )}
        style={{
          background:
            "radial-gradient(460px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(101,88,246,0.085), transparent 42%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,17,22,0.1),transparent)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
