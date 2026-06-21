"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, CreditCard } from "lucide-react";
import { ConfirmationModal } from "@/components/account-management-actions";
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
}: {
  loggedIn: boolean;
  nextPath?: string;
  autoStart?: boolean;
  className?: string;
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
          Start 14-day free trial
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
        {isPending ? "Starting trial..." : "Start 14-day free trial"}
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

export function CancelSubscriptionPortalButton({
  hasActiveBilling = false,
}: {
  hasActiveBilling?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900"
        onClick={() => setOpen(true)}
      >
        <CreditCard className="h-4 w-4" />
        Cancel subscription
      </Button>
      <ConfirmationModal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Billing"
        title="Cancel subscription?"
        description="You’ll be taken to the Stripe billing portal, where you can cancel the trial or subscription for this account."
        note={
          hasActiveBilling
            ? "Your cancellation settings are handled securely in Stripe."
            : "If this account has billing set up, Stripe is where you can cancel it safely."
        }
        tone="warning"
        cancelLabel="Go back"
        submitLabel="Open billing portal"
        pendingLabel="Opening portal..."
        pendingOverride={isPending}
        onSubmit={() =>
          startTransition(async () => {
            try {
              setError(null);
              await postForRedirect("/api/billing/create-portal-session");
            } catch (fetchError) {
              setError(fetchError instanceof Error ? fetchError.message : "Billing portal could not be opened.");
            }
          })
        }
      />
      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
