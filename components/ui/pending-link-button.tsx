"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PendingLinkButton({
  href,
  label,
  pendingLabel,
  icon,
  variant = "primary",
  size = "md",
  className,
  disabled = false,
}: {
  href: string;
  label: string;
  pendingLabel: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const isDisabled = disabled || pending;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={pending}
      onClick={() => {
        if (isDisabled) return;
        setPending(true);
        window.location.assign(href);
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}
