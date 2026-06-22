import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { ManageBillingButton, StartTrialButton } from "@/components/billing-action-buttons";

const doneForYouFeatures = [
  "Everything in Self-Serve",
  "Workspace setup",
  "Logo and branding setup",
  "Campaign setup",
  "Campaign launch support",
  "Lead flow monitoring",
  "Dashboard visibility",
  "Built for car detailers who want the system handled for them",
];

const selfServeFeatures = [
  "Ready-to-launch campaign templates",
  "Facebook and Instagram campaign launch",
  "Lead capture workspace",
  "Simple lead status tracking",
  "CRM integrations",
  "Email alerts and CSV export",
  "Unlimited workspaces",
  "Workspace branding",
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
          Choose how hands-on you want to be.
        </h1>
        <p className="site-lead mx-auto mt-5">
          Run the SideKick system yourself, or let us set up the campaign workflow for you.
        </p>
        {checkoutCancelled ? (
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Checkout was canceled. You can start your trial whenever you&apos;re ready.
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-[1.05fr_0.95fr] sm:mt-16">
        <div className="relative overflow-hidden rounded-[24px] border border-[rgba(86,70,236,0.24)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.05),0_30px_70px_-22px_rgba(86,70,236,0.28)]">
          <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-[rgba(86,70,236,0.2)] bg-[rgba(86,70,236,0.08)] px-3 py-1 text-xs font-semibold text-[#5646ec]">
            <Sparkles className="h-3.5 w-3.5" />
            Recommended
          </div>
          <div className="px-8 pb-8 pt-9 text-center">
            <p className="text-sm font-semibold text-[#5646ec]">Done-For-You</p>
            <p className="mt-3 font-heading text-6xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              $297
              <span className="ml-1.5 text-lg font-medium tracking-normal text-[rgba(15,17,22,0.5)]">
                /month
              </span>
            </p>
            <p className="mt-3 text-sm text-[rgba(15,17,22,0.55)]">
              Founding client pricing.
            </p>
            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[rgba(15,17,22,0.7)]">
              We set up your system, launch your campaign, and monitor incoming leads. You get full visibility without having to learn another tool.
            </p>
          </div>

          <div className="border-t border-[rgba(15,17,22,0.08)] px-8 py-7">
            <ul className="space-y-3.5">
              {doneForYouFeatures.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-[rgba(15,17,22,0.78)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)]">
                    <Check className="h-3 w-3 text-[#5646ec]" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/done-for-you" className="site-cta-primary inline-flex w-full items-center justify-center gap-2">
                Apply for Done-For-You
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-[rgba(15,17,22,0.12)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.05),0_22px_54px_-24px_rgba(21,16,31,0.18)]">
          <div className="px-8 pb-8 pt-9 text-center">
            <p className="text-sm font-semibold text-[rgba(15,17,22,0.55)]">Self-Serve</p>
            <p className="mt-3 font-heading text-6xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              $97
              <span className="ml-1.5 text-lg font-medium tracking-normal text-[rgba(15,17,22,0.5)]">
                /month
              </span>
            </p>
            <p className="mt-3 text-sm text-[rgba(15,17,22,0.55)]">
              14-day free trial.
            </p>
            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[rgba(15,17,22,0.7)]">
              For detailers who want the SideKick platform and prefer to launch campaigns themselves.
            </p>
          </div>

          <div className="border-t border-[rgba(15,17,22,0.08)] px-8 py-7">
            <ul className="space-y-3.5">
              {selfServeFeatures.map((item) => (
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
        <p>Payment method required for the Self-Serve trial.</p>
        <p>Ad spend is paid directly to Meta and is separate from SideKick.</p>
        <p>Done-For-You is founding pricing and may change later.</p>
      </div>
    </section>
  );
}
