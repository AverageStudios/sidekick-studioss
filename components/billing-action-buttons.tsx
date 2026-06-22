"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

async function postForRedirect(url: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "That request could not be completed.");
  }

  window.location.href = payload.url;
}

function resolveLoggedOutTrialHref(nextPath?: string) {
  if (nextPath === "checkout") {
    return "/signup?next=checkout";
  }

  const next = nextPath && nextPath.startsWith("/") ? nextPath : "/pricing?startTrial=1";
  return `/signup?next=${encodeURIComponent(next)}`;
}

export function StartTrialButton({
  loggedIn,
  nextPath,
  autoStart = false,
  className,
  label = "Start 14-day free trial",
  pendingLabel = "Starting trial...",
}: {
  loggedIn: boolean;
  nextPath?: string;
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
        await postForRedirect("/api/billing/create-checkout-session");
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Trial checkout could not be started.");
      }
    });
  }, [autoStart, loggedIn]);

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
              await postForRedirect("/api/billing/create-checkout-session");
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
