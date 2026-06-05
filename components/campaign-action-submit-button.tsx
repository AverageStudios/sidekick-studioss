"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

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
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} className={className} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}
