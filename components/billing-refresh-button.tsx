"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillingRefreshButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setError(null);
              const response = await fetch("/api/billing/sync-subscription", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              });

              const payload = (await response.json().catch(() => null)) as { error?: string } | null;
              if (!response.ok) {
                throw new Error(payload?.error || "Billing status could not be refreshed.");
              }

              router.refresh();
            } catch (refreshError) {
              setError(refreshError instanceof Error ? refreshError.message : "Billing status could not be refreshed.");
            }
          })
        }
      >
        <RefreshCcw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Refreshing…" : "Refresh billing status"}
      </Button>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
