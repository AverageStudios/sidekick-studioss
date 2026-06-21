"use client";

import { AsyncSubmitButton } from "@/components/ui/async-submit-button";

export function AuthSubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  return <AsyncSubmitButton label={label} pendingLabel={pendingLabel} size="lg" className="w-full" />;
}
