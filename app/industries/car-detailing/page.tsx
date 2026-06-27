import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, ChevronRight, CircleDashed, Clock3, Inbox, Layers3, Send, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { StartTrialButton } from "@/components/billing-action-buttons";
import { getCurrentUser } from "@/lib/auth";
import { getUserBillingStatus } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Car Detailing Campaigns | SideKick Studioss",
  description:
    "Launch ready-to-go Facebook and Instagram campaigns for your detailing business, capture new leads, and keep follow-up organized with SideKick.",
};

const painPoints = [
  "Your best before-and-afters are buried in old Instagram posts.",
  "Leads come in while you're polishing, coating, or driving.",
  "Customers ask \"how much?\" and disappear.",
  "You forget to follow up because you're busy doing the actual work.",
  "Your premium services look like random posts instead of a real offer.",
];

const mechanismCards = [
  {
    title: "Ready-to-launch detailing campaigns",
    description:
      "Start with templates for full details, ceramic coatings, interior details, paint correction, and maintenance plans.",
    icon: Sparkles,
  },
  {
    title: "Lead capture built in",
    description:
      "Capture name, phone, email, service interest, and vehicle details without building a funnel from scratch.",
    icon: Inbox,
  },
  {
    title: "Simple follow-up workspace",
    description: "Track who is new, contacted, booked, won, or lost so leads do not disappear.",
    icon: Clock3,
  },
  {
    title: "CRM integrations",
    description: "Send leads to Pipedrive, Zoho CRM, monday CRM, Keap, or Close.",
    icon: Send,
  },
  {
    title: "Meta campaign launch",
    description: "Launch Facebook and Instagram lead campaigns without getting buried inside Ads Manager.",
    icon: Layers3,
  },
];

const beforeItems = [
  "Random Instagram posts",
  "Leads spread across DMs, texts, and forms",
  "Forgetting who followed up",
  "Starting ads from scratch",
  "Looking like every other detailer",
];

const afterItems = [
  "Clear campaign offers",
  "Leads organized in one workspace",
  "Status tracking for every lead",
  "Ready-to-launch templates",
  "Cleaner, more premium presentation",
];

const campaignCards = [
  {
    title: "Full Detail Promo",
    description: "Fill the calendar with general detailing jobs.",
  },
  {
    title: "Interior Detail Promo",
    description: "Great for dirty interiors, family cars, pet hair, spills, and odor removal.",
  },
  {
    title: "Ceramic Coating Promo",
    description: "Position higher-ticket protection packages.",
  },
  {
    title: "Paint Correction Promo",
    description: "Turn transformation shots into premium leads.",
  },
  {
    title: "Monthly Maintenance Promo",
    description: "Turn one-time customers into repeat clients.",
  },
];

const pricingFeatures = [
  "Unlimited workspaces",
  "Ready-to-launch Meta campaign templates",
  "Car detailing campaign templates",
  "Facebook and Instagram campaign launch",
  "Lead capture workspace",
  "Lead status tracking",
  "Follow-up tools",
  "Email alerts",
  "CSV export",
  "CRM integrations",
  "Cancel anytime",
];

const faqs = [
  {
    question: "Do I need to know Facebook Ads?",
    answer:
      "No. SideKick gives you ready-to-launch campaign templates so you are not starting from a blank Ads Manager screen.",
  },
  {
    question: "Is this only for car detailers?",
    answer:
      "SideKick works for small businesses, but this page is built specifically for detailers using detailing-focused templates.",
  },
  {
    question: "Does SideKick do the marketing for me?",
    answer:
      "SideKick gives you the software, templates, lead capture, and follow-up workspace. You still control your business, offers, ad spend, and customer conversations.",
  },
  {
    question: "Does this include ad spend?",
    answer: "No. Your SideKick subscription is $97/month. Meta ad spend is paid separately to Meta.",
  },
  {
    question: "Can I cancel?",
    answer: "Yes. You can cancel anytime from your billing settings.",
  },
  {
    question: "What happens after the free trial?",
    answer:
      "After 14 days, your subscription continues at $97/month unless you cancel before the trial ends.",
  },
];

function PrimaryCta({
  loggedIn,
  hasAccess,
  label,
  className,
}: {
  loggedIn: boolean;
  hasAccess: boolean;
  label: string;
  className?: string;
}) {
  if (hasAccess) {
    return (
      <Link href="/templates/new" className={className}>
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <StartTrialButton
      loggedIn={loggedIn}
      nextPath="checkout"
      label={label}
      className={className}
      pendingLabel="Opening trial..."
    />
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(233,238,255,0.58)]">
      {children}
    </p>
  );
}

export default async function CarDetailingIndustryPage() {
  const user = await getCurrentUser();
  const billingStatus = user ? await getUserBillingStatus(user.id) : null;
  const hasAccess = Boolean(billingStatus?.hasAccess);
  const loggedIn = Boolean(user);

  return (
    <main className="public-site min-h-screen bg-[#09111f] text-white">
      <MarketingNav />

      <section className="relative overflow-hidden border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(87,162,255,0.18),transparent_30%),linear-gradient(180deg,#09111f_0%,#0d1526_52%,#11182c_100%)] pb-18 pt-32 sm:pb-24 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />
        <div className="site-container relative">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-white/50">
            <Link href="/product/templates" className="transition-colors hover:text-white">
              Templates
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/72">Car Detailing</span>
          </nav>

          <div className="mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9dc2ff]">
                Built for car detailers
              </p>
              <h1 className="mt-6 text-[clamp(2.7rem,1.8rem+3.6vw,5.3rem)] font-semibold tracking-[-0.07em] text-white">
                Your detailing work looks premium. Your marketing should too.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[rgba(233,238,255,0.78)]">
                SideKick helps car detailers launch ready-to-go Facebook and Instagram campaigns, capture new leads, and keep follow-up organized so more local customers turn into booked jobs.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryCta
                  loggedIn={loggedIn}
                  hasAccess={hasAccess}
                  label="Launch my first detailing campaign"
                  className="site-cta-primary inline-flex min-w-[260px] justify-center bg-white !text-[#0d1526] shadow-[0_18px_45px_-18px_rgba(120,183,255,0.55)]"
                />
                <Link href="#how-it-works" className="site-cta-secondary inline-flex justify-center border-white/12 bg-white/5 text-white hover:bg-white/10">
                  See how it works
                </Link>
              </div>

              <p className="mt-4 text-sm text-[rgba(233,238,255,0.58)]">
                14-day free trial. $97/month after trial. Ad spend paid separately to Meta.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(118,195,255,0.24),transparent_55%)] blur-2xl" />
              <div className="relative grid gap-4 rounded-[32px] border border-white/10 bg-[rgba(10,16,29,0.84)] p-4 shadow-[0_40px_90px_-28px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-rose-400/20 bg-[linear-gradient(180deg,rgba(49,14,21,0.9),rgba(25,10,16,0.98))] p-5">
                    <SectionLabel>Messy lead flow</SectionLabel>
                    <div className="mt-4 space-y-3">
                      {[
                        "Missed DM",
                        "Lead from Facebook",
                        "Forgot to follow up",
                        "Empty Tuesday",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white/82"
                        >
                          <span>{item}</span>
                          <CircleDashed className="h-4 w-4 text-rose-300/70" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(14,32,52,0.92),rgba(7,20,33,0.98))] p-5">
                    <SectionLabel>SideKick workflow</SectionLabel>
                    <div className="mt-4 space-y-3">
                      {[
                        "New lead captured",
                        "Campaign launched",
                        "Follow-up ready",
                        "Lead sent to CRM",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white/88"
                        >
                          <span>{item}</span>
                          <Check className="h-4 w-4 text-[#9dd8ff]" strokeWidth={2.8} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/42">
                    <span>SideKick preview</span>
                    <span>Detailing campaign workspace</span>
                  </div>
                  <Image
                    src="/Ui-preview.webp"
                    alt="SideKick product workspace preview"
                    width={1440}
                    height={900}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f3ef] py-18 text-[#111827] sm:py-24">
        <div className="site-container">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6f8e]">The pain</p>
              <h2 className="mt-4 text-[clamp(2rem,1.5rem+2vw,3.3rem)] font-semibold tracking-[-0.06em] text-[#101828]">
                The job usually gets lost before they ever see your work.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#4b5563]">
                Most detailers think they need better work to get more bookings. They don&rsquo;t. They need customers to trust them faster.
              </p>
              <p className="mt-5 text-lg leading-8 text-[#4b5563]">
                A customer sees your ad, checks your photos, compares your business to three other detailers, and decides who looks the most professional before they ever call. If your proof is scattered, your offer is unclear, or your reply comes too late, the job goes to someone else.
              </p>
              <p className="mt-6 text-lg font-semibold tracking-[-0.02em] text-[#101828]">
                That is the leak SideKick is built to fix.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#d8dce5] bg-white p-6 shadow-[0_22px_55px_-30px_rgba(15,23,42,0.25)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6b7280]">Where bookings leak</p>
              <div className="mt-5 space-y-3">
                {painPoints.map((item) => (
                  <div key={item} className="rounded-2xl border border-[#eceef4] bg-[#fbfbfd] px-4 py-3 text-sm leading-6 text-[#344054]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-18 text-[#111827] sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6f8e]">Mechanism</p>
            <h2 className="mt-4 text-[clamp(2rem,1.5rem+2vw,3.1rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              SideKick turns your proof into a campaign system.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#4b5563]">
              Instead of starting from a blank page, SideKick gives detailers ready-to-launch campaign templates built around the services customers already understand.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {mechanismCards.map((card, index) => {
              const Icon = card.icon;
              const wide = index === mechanismCards.length - 1;

              return (
                <div
                  key={card.title}
                  className={[
                    "rounded-[28px] border border-[#e8ebf2] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)]",
                    wide ? "lg:col-span-3 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center lg:gap-8" : "",
                  ].join(" ")}
                >
                  <div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf4ff] text-[#2e74b5]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#101828]">{card.title}</h3>
                  </div>
                  <p className="mt-3 text-base leading-7 text-[#4b5563] lg:mt-0">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#eef3f8] py-18 text-[#111827] sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6f8e]">Before and after</p>
            <h2 className="mt-4 text-[clamp(2rem,1.5rem+2vw,3.1rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Before SideKick vs. after SideKick
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-2">
            <div className="rounded-[30px] border border-[#d9dee9] bg-[#fbfcfe] p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b8798]">Before</p>
              <div className="mt-5 space-y-3">
                {beforeItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-[#eaedf4] bg-white px-4 py-3 text-sm text-[#475467]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#b8d7f0] bg-[linear-gradient(180deg,#0f1727_0%,#13223a_100%)] p-7 text-white shadow-[0_30px_70px_-36px_rgba(7,16,32,0.72)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a9d5ff]">After</p>
              <div className="mt-5 space-y-3">
                {afterItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/84">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-8 text-[#344054]">
            Your detailing already looks professional. SideKick helps the business around it look professional too.
          </p>
        </div>
      </section>

      <section className="bg-[#0f1727] py-18 text-white sm:py-24">
        <div className="site-container">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ebeff]">Campaign library</p>
              <h2 className="mt-4 text-[clamp(2rem,1.5rem+2vw,3.1rem)] font-semibold tracking-[-0.06em]">
                Start with the detailing campaigns that already make sense.
              </h2>
            </div>
            <PrimaryCta
              loggedIn={loggedIn}
              hasAccess={hasAccess}
              label="Launch my first detailing campaign"
              className="site-cta-primary inline-flex justify-center bg-white !text-[#0f1727]"
            />
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {campaignCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[26px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.55)]"
              >
                <p className="text-lg font-semibold tracking-[-0.03em] text-white">{card.title}</p>
                <p className="mt-3 text-sm leading-6 text-[rgba(233,238,255,0.7)]">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-18 text-[#111827] sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6f8e]">Pricing</p>
            <h2 className="mt-4 text-[clamp(2rem,1.5rem+2vw,3.1rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Launch your first detailing campaign for less than one missed detail job.
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-[34px] border border-[#dfe5ef] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.3)] sm:p-10">
            <div className="text-center">
              <p className="text-sm font-semibold text-[#2e74b5]">SideKick Core</p>
              <p className="mt-4 font-heading text-6xl font-semibold tracking-[-0.05em] text-[#101828]">
                $97
                <span className="ml-2 text-lg font-medium tracking-normal text-[#667085]">/month</span>
              </p>
              <p className="mt-3 text-base text-[#475467]">14-day free trial</p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {pricingFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#edf0f5] bg-white px-4 py-3 text-sm text-[#344054]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eaf4ff]">
                    <Check className="h-3 w-3 text-[#2e74b5]" strokeWidth={3} />
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <PrimaryCta
                loggedIn={loggedIn}
                hasAccess={hasAccess}
                label="Start my 14-day trial"
                className="site-cta-primary inline-flex w-full justify-center"
              />
            </div>

            <p className="mt-4 text-center text-sm leading-6 text-[#667085]">
              Ad spend is paid separately to Meta. Payment method required. You will not be charged until your trial ends.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f3ef] py-18 text-[#111827] sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6f8e]">Objection</p>
            <h2 className="mt-4 text-[clamp(2rem,1.5rem+2vw,3rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Can&rsquo;t I just run ads myself?
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#4b5563]">
              Yes. You can. But most detailers do not lose because they cannot click buttons inside Ads Manager. They lose because the offer is unclear, the proof is not organized, the leads come in while they are working, and the follow-up gets messy.
            </p>
            <p className="mt-6 text-lg font-semibold tracking-[-0.03em] text-[#101828]">
              SideKick is not here to replace your skill. It is here to make sure your skill turns into booked jobs.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0a1220] py-18 text-white sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8ebeff]">FAQ</p>
            <h2 className="mt-4 text-[clamp(2rem,1.5rem+2vw,3rem)] font-semibold tracking-[-0.06em]">
              Questions detailers ask before they launch.
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-4xl space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 open:bg-white/7"
              >
                <summary className="cursor-pointer list-none text-left text-lg font-medium tracking-[-0.02em] text-white">
                  <span className="flex items-center justify-between gap-4">
                    <span>{faq.question}</span>
                    <span className="text-[#8ebeff] transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[rgba(233,238,255,0.72)]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[linear-gradient(180deg,#0a1220_0%,#0c1424_100%)] py-18 text-white sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/6 px-6 py-8 text-center shadow-[0_24px_70px_-40px_rgba(0,0,0,0.65)] sm:px-10 sm:py-12">
            <h2 className="text-[clamp(2rem,1.5rem+2vw,3rem)] font-semibold tracking-[-0.06em]">
              The detailing looks premium already. Let the pipeline match it.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[rgba(233,238,255,0.72)]">
              Launch a detailing-focused campaign, capture leads in one workspace, and keep follow-up organized before another good job slips away.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryCta
                loggedIn={loggedIn}
                hasAccess={hasAccess}
                label="Launch my first detailing campaign"
                className="site-cta-primary inline-flex justify-center bg-white !text-[#0c1424]"
              />
              <Link href="/product/templates" className="site-cta-secondary inline-flex justify-center border-white/12 bg-white/5 text-white hover:bg-white/10">
                Browse templates
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
