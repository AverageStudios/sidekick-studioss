"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SyncPhase = "syncing" | "failed";

const ACTIVATION_SUCCESS_MESSAGE = "Your 14-day trial is active.";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function BillingCheckoutSyncState({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<SyncPhase>("syncing");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasStartedRef = useRef(false);

  const syncBilling = useCallback(async () => {
    setPhase("syncing");
    setError(null);

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const response = await fetch("/api/billing/sync-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId }),
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string; billingStatus?: { hasAccess?: boolean; subscriptionStatus?: string } }
          | null;

        if (response.ok && payload?.billingStatus?.hasAccess) {
          router.replace(`/dashboard?success=${encodeURIComponent(ACTIVATION_SUCCESS_MESSAGE)}`);
          return;
        }

        if (response.status === 400 || response.status === 403) {
          setError(payload?.error || "Trial activation could not be verified.");
          setPhase("failed");
          return;
        }
      } catch {
        // Continue retry loop for transient network or server issues.
      }

      if (attempt < 4) {
        await delay(1200);
      }
    }

    setError("We could not finish activating your trial.");
    setPhase("failed");
  }, [router, sessionId]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    startTransition(() => {
      void syncBilling();
    });
  }, [syncBilling]);

  return (
    <Card className="overflow-hidden border-[var(--line)] bg-[rgba(255,255,255,0.88)] p-7 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-8">
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(109,94,248,0.18)] bg-[rgba(109,94,248,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          <RefreshCcw className={`h-3.5 w-3.5 ${phase === "syncing" || isPending ? "animate-spin" : ""}`} />
          Billing update
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-[2.15rem]">
            {phase === "syncing" ? "Activating your trial…" : "Trial activation needs attention"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">
            {phase === "syncing"
              ? "Stripe checkout finished successfully. SideKick is syncing your billing now so the dashboard can unlock."
              : error || "We could not finish activating your trial."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {phase === "failed" ? (
            <Button
              type="button"
              onClick={() =>
                startTransition(() => {
                  void syncBilling();
                })
              }
              disabled={isPending}
            >
              Retry activation
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" disabled>
              Activating…
              <RefreshCcw className="h-4 w-4 animate-spin" />
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/support/new?from=/dashboard-billing-activation">Contact support</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
