import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ManageBillingButton, StartTrialButton } from "@/components/billing-action-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getUserBillingStatus } from "@/lib/billing";

function buildReason(status: Awaited<ReturnType<typeof getUserBillingStatus>>) {
  switch (status.subscriptionStatus) {
    case "canceled":
      return "This account no longer has an active SideKick subscription.";
    case "incomplete":
    case "incomplete_expired":
      return "Billing setup was started but never completed.";
    case "unpaid":
      return "This account is currently unpaid.";
    case "paused":
      return "This account is paused and needs billing attention.";
    case "past_due":
      return "Your last payment needs attention before SideKick can unlock product access again.";
    default:
      return "Start your SideKick plan to unlock campaign launch, performance, and CRM handoff across all workspaces on this account.";
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
  const hasCustomer = Boolean(billingStatus.stripeCustomerId);

  return (
    <AppShell currentPath="/settings">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
        <Card className="rounded-[28px] border-[var(--line)] bg-white p-8 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Billing required</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            Finish billing to keep using SideKick
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {buildReason(billingStatus)}
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
                <p className="mt-1 text-base font-semibold capitalize text-[var(--ink)]">
                  {billingStatus.subscriptionStatus.replaceAll("_", " ")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {hasCustomer ? (
              <ManageBillingButton label="Manage billing" />
            ) : (
              <StartTrialButton loggedIn nextPath={safeReturnTo} className="sm:min-w-56" />
            )}
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
