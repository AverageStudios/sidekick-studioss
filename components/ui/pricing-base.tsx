import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ManageBillingButton, StartTrialButton } from "@/components/billing-action-buttons";

const coreFeatures = [
  "Full SideKick Core access during your 14-day free trial",
  "Unlimited workspaces included",
  "Campaign launch to Facebook and Instagram",
  "Campaign performance and CRM handoff in one platform",
  "Connect Pipedrive, Zoho CRM, monday CRM, Keap, and Close CRM",
  "Payment method required up front, with no charge until the trial ends",
  "Ad spend is billed separately by Meta",
  "Cancel anytime before billing",
];

export function PricingBase({
  loggedIn,
  hasProductAccess,
  autoStartTrial = false,
  checkoutCancelled = false,
  pricingActionLabel = "Start 14-day free trial",
}: {
  loggedIn: boolean;
  hasProductAccess: boolean;
  autoStartTrial?: boolean;
  checkoutCancelled?: boolean;
  pricingActionLabel?: string;
}) {
  return (
    <section className="site-container pb-24 pt-36 sm:pb-28 sm:pt-44">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="site-h2 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">
          Start your 14-day free trial
        </h1>
        <p className="site-lead mx-auto mt-5">
          SideKick Core gives you campaign launch, reporting, and CRM handoff in one plan, with nothing held back during your trial.
        </p>
        {checkoutCancelled ? (
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Checkout was canceled. You can start your trial whenever you&apos;re ready.
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-14 max-w-md sm:mt-16">
        <div className="relative overflow-hidden rounded-[20px] border border-[rgba(15,17,22,0.12)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.05),0_28px_64px_-20px_rgba(21,16,31,0.18)]">
          <div className="px-8 pb-8 pt-9 text-center">
            <p className="text-sm font-semibold text-[rgba(15,17,22,0.55)]">SideKick Core</p>
            <p className="mt-3 font-heading text-6xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              $97
              <span className="ml-1.5 text-lg font-medium tracking-normal text-[rgba(15,17,22,0.5)]">
                /month
              </span>
            </p>
            <p className="mt-3 text-sm text-[rgba(15,17,22,0.55)]">
              14-day free trial. Payment method required. You will not be charged until your trial ends.
            </p>
          </div>

          <div className="border-t border-[rgba(15,17,22,0.08)] px-8 py-7">
            <ul className="space-y-3.5">
              {coreFeatures.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-[rgba(15,17,22,0.78)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)]">
                    <Check className="h-3 w-3 text-[#5646ec]" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {hasProductAccess ? (
                <div className="space-y-3">
                  <Link href="/dashboard" className="site-cta-primary inline-flex w-full items-center justify-center gap-2">
                    Open dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <ManageBillingButton label="Manage billing" className="w-full justify-center" />
                </div>
              ) : (
                <StartTrialButton
                  loggedIn={loggedIn}
                  nextPath="checkout"
                  autoStart={autoStartTrial}
                  label={pricingActionLabel}
                  className="site-cta-primary w-full justify-center"
                />
              )}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-[rgba(15,17,22,0.5)]">
          Unlimited workspaces included. Cancel anytime before billing through the Stripe Customer Portal.
        </p>
        <p className="mt-3 text-center text-sm text-[rgba(15,17,22,0.5)]">
          Ad spend is paid directly to Meta and is separate from your SideKick subscription.
        </p>
      </div>
    </section>
  );
}
