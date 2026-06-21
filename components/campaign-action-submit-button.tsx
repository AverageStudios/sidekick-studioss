"use client";

import { AsyncSubmitButton } from "@/components/ui/async-submit-button";

export function CampaignActionSubmitButton({
  label,
  pendingLabel,
  variant = "outline",
  className,
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
}) {
  return (
    <AsyncSubmitButton label={label} pendingLabel={pendingLabel} variant={variant} className={className} />
  );
}
