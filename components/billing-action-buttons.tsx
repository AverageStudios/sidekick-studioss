"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSafeRelativePath } from "@/lib/safe-redirect";

async function postForRedirect(url: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "That request could not be completed.");
  }

  window.location.href = payload.url;
}

function resolveLoggedOutTrialHref(nextPath?: string) {
  if (nextPath === "checkout") {
    return "/signup?next=%2Fdashboard";
  }

  const next = getSafeRelativePath(nextPath, "/dashboard");
  return `/signup?next=${encodeURIComponent(next)}`;
}

export function StartTrialButton({
  loggedIn,
  nextPath,
  returnTo,
  campaignId,
  autoStart = false,
  className,
  label = "Activate trial",
  pendingLabel = "Starting trial...",
}: {
  loggedIn: boolean;
  nextPath?: string;
  returnTo?: string;
  campaignId?: string | null;
  autoStart?: boolean;
  className?: string;
  label?: string;
  pendingLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const autoStartTriggeredRef = useRef(false);

  useEffect(() => {
    if (!autoStart || !loggedIn || autoStartTriggeredRef.current) return;
    autoStartTriggeredRef.current = true;

    startTransition(async () => {
      try {
        setError(null);
        await postForRedirect("/api/billing/create-checkout-session", { returnTo, campaignId });
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Trial checkout could not be started.");
      }
    });
  }, [autoStart, campaignId, loggedIn, returnTo]);

  if (!loggedIn) {
    return (
      <Button asChild className={className}>
        <a href={resolveLoggedOutTrialHref(nextPath)}>
          {label}
          <ArrowRight className="h-4 w-4" />
        </a>
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        className={className}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setError(null);
              await postForRedirect("/api/billing/create-checkout-session", { returnTo, campaignId });
            } catch (fetchError) {
              setError(fetchError instanceof Error ? fetchError.message : "Trial checkout could not be started.");
            }
          })
        }
      >
        {isPending ? pendingLabel : label}
        <ArrowRight className="h-4 w-4" />
      </Button>
      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}

export function ManageBillingButton({
  label = "Manage billing",
  className,
  variant = "outline",
}: {
  label?: string;
  className?: string;
  variant?: "primary" | "outline";
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setError(null);
              await postForRedirect("/api/billing/create-portal-session");
            } catch (fetchError) {
              setError(fetchError instanceof Error ? fetchError.message : "Billing portal could not be opened.");
            }
          })
        }
      >
        <CreditCard className="h-4 w-4" />
        {isPending ? "Opening billing..." : label}
      </Button>
      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
