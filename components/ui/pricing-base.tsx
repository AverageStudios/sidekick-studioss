import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const coreFeatures = [
  "Full template library for your industry",
  "Campaign launch to Facebook and Instagram",
  "Lead management with status tracking",
  "Follow-up prompts and next-step tracking",
  "Email alerts and CSV export",
  "Send leads to supported CRMs like Pipedrive, Zoho CRM, monday CRM, Keap, and Close",
];

export function PricingBase() {
  return (
    <section className="site-container pb-24 pt-36 sm:pb-28 sm:pt-44">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="site-h2 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">
          One plan. Everything included.
        </h1>
        <p className="site-lead mx-auto mt-5">
          No tiers to decode and nothing held back. Try the whole platform free
          for 14 days, then keep it if it earns its place.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-md sm:mt-16">
        <div className="relative overflow-hidden rounded-[20px] border border-[rgba(15,17,22,0.12)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.05),0_28px_64px_-20px_rgba(21,16,31,0.18)]">
          <div className="px-8 pb-8 pt-9 text-center">
            <p className="text-sm font-semibold text-[rgba(15,17,22,0.55)]">Core</p>
            <p className="mt-3 font-heading text-6xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              $39
              <span className="ml-1.5 text-lg font-medium tracking-normal text-[rgba(15,17,22,0.5)]">
                /month
              </span>
            </p>
            <p className="mt-3 text-sm text-[rgba(15,17,22,0.55)]">
              14-day free trial. Cancel anytime before billing.
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

            <Link href="/signup" className="site-cta-primary mt-8 w-full">
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-[rgba(15,17,22,0.5)]">
          No long-term contract. Built for local businesses.
        </p>
      </div>
    </section>
  );
}
