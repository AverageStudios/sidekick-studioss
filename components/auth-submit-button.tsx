"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function AuthSubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
