import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ManageBillingButton, StartTrialButton } from "@/components/billing-action-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { formatBillingDate, getBillingDisplayState, getUserBillingStatus } from "@/lib/billing";

function getBillingRequiredHeadline(key: ReturnType<typeof getBillingDisplayState>["key"]) {
  switch (key) {
    case "canceled":
      return "Restart your subscription";
    case "payment_issue_grace":
    case "payment_required":
    case "paused":
      return "Update your billing";
    default:
      return "Start your 14-day free trial";
  }
}

export default async function BillingRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  await requireUser();
  const user = await getCurrentUser();
  const [{ returnTo }, billingStatus] = await Promise.all([
    searchParams,
    user ? getUserBillingStatus(user.id) : Promise.resolve(null),
  ]);

  if (!user || !billingStatus) {
    return null;
  }

  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/dashboard";
  const billingDisplayState = getBillingDisplayState(billingStatus);
  const headline = getBillingRequiredHeadline(billingDisplayState.key);
  const primaryAction =
    billingDisplayState.primaryActionType === "portal" && billingStatus.stripeCustomerId
      ? (
        <ManageBillingButton label={billingDisplayState.primaryActionLabel} variant="primary" />
      )
      : (
        <StartTrialButton
          loggedIn
          nextPath={safeReturnTo}
          label={billingDisplayState.primaryActionLabel}
          pendingLabel="Opening checkout..."
          className="sm:min-w-56"
        />
      );

  return (
    <AppShell currentPath="/settings">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
        <Card className="rounded-[28px] border-[var(--line)] bg-white p-8 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Billing required</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            {headline}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {billingDisplayState.key === "not_started"
              ? "Start your 14-day free trial to unlock SideKick across unlimited workspaces."
              : billingDisplayState.description}
          </p>

          <div className="mt-6 rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Plan</p>
                <p className="mt-1 text-base font-semibold text-[var(--ink)]">SideKick Core</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Price</p>
                <p className="mt-1 text-base font-semibold text-[var(--ink)]">$97/month</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Workspaces</p>
                <p className="mt-1 text-base font-semibold text-[var(--ink)]">Unlimited</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Status</p>
                <p className="mt-1 text-base font-semibold text-[var(--ink)]">{billingDisplayState.label}</p>
              </div>
            </div>
            {billingDisplayState.importantDateLabel && billingDisplayState.importantDateValue ? (
              <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-[var(--ink)]">{billingDisplayState.importantDateLabel}</span>
                  <span className="text-[var(--muted)]">{formatBillingDate(billingDisplayState.importantDateValue)}</span>
                </div>
                {billingDisplayState.countdownLabel ? (
                  <p className="mt-1 text-sm font-medium text-[var(--muted-strong)]">{billingDisplayState.countdownLabel}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {primaryAction}
            <Button asChild variant="outline">
              <Link href="/support/new?from=/billing-required">Contact support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm text-[var(--muted)]">
            Payment method required. You will not be charged until your 14-day trial ends. Ad spend is billed separately by Meta.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
