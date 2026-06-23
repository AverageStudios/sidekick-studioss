import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { ManageBillingButton, StartTrialButton } from "@/components/billing-action-buttons";

const coreFeatures = [
  "Unlimited workspaces",
  "Ready-to-launch Meta campaign templates",
  "Facebook and Instagram campaign launch",
  "Lead capture workspace",
  "Simple lead status tracking",
  "CRM integrations",
  "Email alerts and CSV export",
  "Workspace branding",
  "Ad spend billed separately by Meta",
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
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="site-h2 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">
          Simple pricing for ready-to-launch campaigns.
        </h1>
        <p className="site-lead mx-auto mt-5">
          Start SideKick Core with a 14-day free trial, launch Meta campaigns yourself, and keep every lead organized.
        </p>
        {checkoutCancelled ? (
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Checkout was canceled. You can start your trial whenever you&apos;re ready.
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-14 max-w-xl sm:mt-16">
        <div className="relative overflow-hidden rounded-[24px] border border-[rgba(86,70,236,0.24)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.05),0_30px_70px_-22px_rgba(86,70,236,0.24)]">
          <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-[rgba(86,70,236,0.2)] bg-[rgba(86,70,236,0.08)] px-3 py-1 text-xs font-semibold text-[#5646ec]">
            <Sparkles className="h-3.5 w-3.5" />
            14-day free trial
          </div>
          <div className="px-8 pb-8 pt-9 text-center">
            <p className="text-sm font-semibold text-[#5646ec]">SideKick Core</p>
            <p className="mt-3 font-heading text-6xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              $97
              <span className="ml-1.5 text-lg font-medium tracking-normal text-[rgba(15,17,22,0.5)]">
                /month
              </span>
            </p>
            <p className="mt-3 text-sm text-[rgba(15,17,22,0.55)]">
              Payment method required. Cancel anytime.
            </p>
            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[rgba(15,17,22,0.7)]">
              Launch Facebook and Instagram campaigns, capture leads, and keep follow-up organized from one simple workspace.
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
      </div>

      <div className="mx-auto mt-8 max-w-3xl space-y-2 text-center text-sm text-[rgba(15,17,22,0.5)]">
        <p>Payment method required for the 14-day trial.</p>
        <p>Ad spend is paid directly to Meta and is separate from SideKick.</p>
      </div>
    </section>
  );
}
