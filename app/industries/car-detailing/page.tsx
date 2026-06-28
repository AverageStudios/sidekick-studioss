import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Circle, Clock, Inbox, Layers3, MapPin, Send, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { AnimatedNumber } from "@/components/funnel/animated-number";
import { getCurrentUser } from "@/lib/auth";
import { getUserBillingStatus } from "@/lib/billing";
import { getTemplates } from "@/lib/data";
import type { TemplateSeed } from "@/types";

export const metadata: Metadata = {
  title: "Car Detailing Campaigns | SideKick Studioss",
  description:
    "Keep your detailing bays booked. Launch ready-to-go Facebook and Instagram campaigns, capture every lead, and keep follow-up tight — without becoming a Facebook Ads expert.",
};

const problemCards = [
  {
    title: "Missed DMs",
    detail: "Leads come in while your hands are in a wheel well.",
  },
  {
    title: "Slow replies",
    detail: "Price shoppers move on in minutes, not hours.",
  },
  {
    title: "Buried proof",
    detail: "Your best ceramic job dies three posts down the feed.",
  },
  {
    title: "Blank-page ads",
    detail: "Every campaign starts from a scary empty screen.",
  },
  {
    title: "Forgotten follow-up",
    detail: "Hot leads cool off because nobody circled back.",
  },
  {
    title: "Empty days",
    detail: "Gaps in the calendar you feel in your bank account.",
  },
];

const systemCards = [
  {
    title: "Pick a detailing template",
    detail: "Full detail, interior, ceramic coating, paint correction, or a maintenance plan — written and designed for you.",
    icon: Layers3,
  },
  {
    title: "Launch on Meta",
    detail: "Set your budget and service area, then go live with a ready-to-run Facebook and Instagram campaign.",
    icon: Send,
  },
  {
    title: "Catch every lead",
    detail: "New, contacted, booked, won, and lost — every inquiry lands in one workspace so none slip through.",
    icon: Inbox,
  },
];

const heroTemplateCards = [
  {
    slug: "membership-detailing-always-ready",
    fallbackTitle: "Always Ready Plan",
    kicker: "Maintenance plan",
  },
  {
    slug: "premium-car-detailing",
    fallbackTitle: "Premium Car Detail",
    kicker: "Full detail",
  },
  {
    slug: "premium-exterior-detail",
    fallbackTitle: "Head-Turning Detail",
    kicker: "Exterior detail",
  },
] as const;

const productMetrics = [
  {
    value: 184,
    label: "Leads",
    trend: "+28%",
    direction: "up",
    prefix: "",
  },
  {
    value: 18420,
    label: "Impressions",
    trend: "+41%",
    direction: "up",
    prefix: "",
  },
  {
    value: 21,
    label: "Cost per lead",
    trend: "-19%",
    direction: "down",
    prefix: "$",
  },
] as const;

const stepHighlights = [
  { icon: Sparkles, label: "Ready-made ads" },
  { icon: MapPin, label: "Your local area" },
  { icon: Clock, label: "Live in minutes" },
];

const beforeItems = [
  "Random posts, hoping someone books",
  "Leads lost in your DMs",
  "Messy, forgotten follow-up",
  "Building every ad from scratch",
];

const afterItems = [
  "Proven campaign templates",
  "Every lead captured in one place",
  "Clear status on each lead",
  "Clean handoff to your CRM",
];

const pricingFeatures = [
  "Unlimited workspaces",
  "Detailing campaign templates",
  "Meta campaign launch flow",
  "Lead capture workspace",
  "Lead status tracking",
  "Email alerts",
  "CSV export",
  "CRM integrations",
];

const faqs = [
  {
    question: "Do I need to know Facebook Ads?",
    answer: "No. SideKick gives you ready-to-launch campaign flows so you are never starting from a blank Ads Manager screen.",
  },
  {
    question: "Does this include ad spend?",
    answer: "No. Meta ad spend is separate from your SideKick subscription and paid directly to Meta.",
  },
  {
    question: "How fast can I launch?",
    answer: "Most detailers pick a template, set their budget and area, and have a campaign ready the same day.",
  },
  {
    question: "Can I cancel?",
    answer: "Yes. You can cancel anytime from billing settings — no calls, no hoops.",
  },
  {
    question: "Is this only for detailers?",
    answer: "SideKick works for many small businesses, but this page and these templates are built specifically for detailing.",
  },
  {
    question: "What happens after the trial?",
    answer: "After 14 days, the subscription continues at $97/month unless you cancel before it ends.",
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
    <Link href={loggedIn ? "/templates/new" : "/signup?next=%2Ftemplates%2Fnew"} className={className}>
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function TemplatesCta({ hasAccess }: { hasAccess: boolean }) {
  return (
    <Link
      href={hasAccess ? "/templates" : "/product/templates"}
      className="site-cta-secondary inline-flex justify-center"
    >
      View detailing templates
    </Link>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-ink)]">{children}</p>;
}

function HeroMetricsShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {productMetrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)] px-6 py-7 text-center shadow-[0_14px_35px_-28px_rgba(15,23,42,0.18)]"
        >
          <div className="flex items-center justify-center gap-2">
            {metric.direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-600" />
            )}
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              {metric.trend}
            </span>
          </div>
          <p className="mt-4 text-5xl font-semibold tracking-[-0.07em] text-[var(--ink)]">
            <AnimatedNumber to={metric.value} prefix={metric.prefix || ""} duration={0.85} />
          </p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
            {metric.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function TemplateShowcaseCard({
  template,
  fallbackTitle,
  kicker,
}: {
  template?: TemplateSeed;
  fallbackTitle: string;
  kicker: string;
}) {
  const imageUrl = template?.creativeAssets?.imageUrls?.[0] || template?.previewImage || null;

  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-white shadow-[0_12px_28px_-24px_rgba(15,23,42,0.2)]">
      <div className="relative aspect-[4/5] bg-[linear-gradient(135deg,#f3efff_0%,#ece7ff_100%)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={template?.name || fallbackTitle}
            fill
            sizes="(min-width: 768px) 30vw, 100vw"
            className="object-contain"
          />
        ) : null}
        <div className="absolute left-3 top-3 rounded-full bg-white/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
          {kicker}
        </div>
      </div>
      <div className="border-t border-[var(--line)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--ink)]">{template?.name || fallbackTitle}</p>
          <span className="rounded-full bg-[var(--soft-brand)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function CarDetailingIndustryPage() {
  const user = await getCurrentUser();
  const billingStatus = user ? await getUserBillingStatus(user.id) : null;
  const hasAccess = Boolean(billingStatus?.hasAccess);
  const loggedIn = Boolean(user);
  const templates = await getTemplates();
  const heroTemplates = heroTemplateCards.map((item) => ({
    fallbackTitle: item.fallbackTitle,
    kicker: item.kicker,
    template: templates.find((template) => template.slug === item.slug),
  }));

  return (
    <main className="public-site min-h-screen bg-[var(--surface)]">
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-[rgba(109,94,248,0.1)] bg-[linear-gradient(180deg,#faf8ff_0%,#f4f1fb_100%)] pb-16 pt-28 sm:pb-20 sm:pt-34">
        <div className="site-container">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
            <Link href="/product/templates" className="transition-colors hover:text-[var(--ink)]">
              Templates
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--muted-strong)]">Car Detailing</span>
          </nav>

          <div className="mx-auto mt-6 max-w-3xl text-center">
            <p className="inline-flex rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
              For car detailers
            </p>
            <h1 className="mt-4 text-[clamp(2.6rem,1.9rem+2.5vw,4.35rem)] font-semibold leading-[0.96] tracking-[-0.075em] text-[var(--ink)]">
              Keep your bays booked &mdash; without becoming a Facebook Ads expert.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-[var(--muted-strong)]">
              SideKick gives detailers ready-to-launch Facebook &amp; Instagram campaigns, captures every lead in one place, and keeps follow-up tight &mdash; so you spend less time chasing and more time detailing.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryCta
                loggedIn={loggedIn}
                hasAccess={hasAccess}
                label="Start free"
                className="site-cta-primary inline-flex justify-center"
              />
              <TemplatesCta hasAccess={hasAccess} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-[var(--muted-strong)]">
              {stepHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <span key={item.label} className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-[var(--brand)]" />
                    {item.label}
                  </span>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-[var(--muted)]">
              14-day free trial, then $97/month. Cancel anytime. Ad spend paid separately to Meta.
            </p>
          </div>

          {/* Hero template strip — tangible proof, above the fold */}
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {heroTemplates.map(({ template, fallbackTitle, kicker }) => (
              <TemplateShowcaseCard
                key={template?.slug || fallbackTitle}
                template={template}
                fallbackTitle={fallbackTitle}
                kicker={kicker}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Problem / agitate */}
      <section className="bg-white py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>The leak</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              While you&rsquo;re buffing a hood, your next lead is texting the other shop.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-[var(--muted-strong)]">
              The work isn&rsquo;t the problem &mdash; the gaps around it are. Here&rsquo;s where detailing jobs quietly slip away.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {problemCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[24px] border border-[var(--line)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.18)]"
              >
                <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution / how it works */}
      <section className="bg-[var(--background)] py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>The system</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              Pick. Launch. Catch every lead.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-[var(--muted-strong)]">
              Three steps replace the random posting and the blank Ads Manager screen.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {systemCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="relative rounded-[28px] border border-[rgba(109,94,248,0.1)] bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.22)]"
                >
                  <span className="absolute right-6 top-6 text-sm font-semibold tracking-[0.1em] text-[var(--muted)]">
                    0{index + 1}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--soft-brand)] text-[var(--brand)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{card.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[var(--muted-strong)]">{card.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <PrimaryCta
              loggedIn={loggedIn}
              hasAccess={hasAccess}
              label="Start free"
              className="site-cta-primary inline-flex justify-center"
            />
          </div>
        </div>
      </section>

      {/* Template showcase — done-for-you proof */}
      <section className="bg-white py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Done for you</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              Campaigns that look like you hired an agency.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-[var(--muted-strong)]">
              Written copy, designed creative, and a clear offer for every detailing service. Pick one and make it yours.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-3">
            {heroTemplates.map(({ template, fallbackTitle, kicker }) => (
              <TemplateShowcaseCard
                key={`showcase-${template?.slug || fallbackTitle}`}
                template={template}
                fallbackTitle={fallbackTitle}
                kicker={kicker}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <TemplatesCta hasAccess={hasAccess} />
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="bg-[var(--background)] py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>One dashboard</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              See leads, cost, and what&rsquo;s working &mdash; at a glance.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-[var(--muted-strong)]">
              No spreadsheets, no guessing. Your campaigns report back in plain numbers.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-5xl">
            <HeroMetricsShowcase />
            <p className="mt-5 text-center text-xs leading-5 text-[var(--muted)]">
              Example dashboard for illustration. Your results depend on your offer, service area, and ad spend.
            </p>
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="bg-white py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>The shift</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              From scattered to a system.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[30px] border border-[var(--line)] bg-[var(--soft-panel)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Before SideKick</p>
              <div className="mt-5 space-y-3">
                {beforeItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
                    <Circle className="h-3.5 w-3.5 text-[var(--muted)] fill-current" />
                    <span className="text-sm font-medium text-[var(--muted-strong)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[rgba(109,94,248,0.16)] bg-[linear-gradient(180deg,#17132d_0%,#211741_100%)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(221,212,255,0.9)]">After SideKick</p>
              <div className="mt-5 space-y-3">
                {afterItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                    <Check className="h-4 w-4 text-[rgba(216,203,255,0.95)]" strokeWidth={2.8} />
                    <span className="text-sm font-medium text-white/86">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[var(--background)] py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              One booked detail pays for the month.
            </h2>
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-[34px] border border-[rgba(109,94,248,0.14)] bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)] p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.28)] sm:p-10">
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--public-accent-strong)]">SideKick Core</p>
              <p className="mt-4 text-6xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                $97
                <span className="ml-2 text-lg font-medium tracking-normal text-[var(--muted)]">/month</span>
              </p>
              <p className="mt-3 text-base text-[var(--muted-strong)]">Starts with a 14-day free trial</p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {pricingFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[rgba(109,94,248,0.08)] bg-white px-4 py-3 text-sm text-[var(--muted-strong)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--soft-brand)]">
                    <Check className="h-3 w-3 text-[var(--public-accent-strong)]" strokeWidth={3} />
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <PrimaryCta
                loggedIn={loggedIn}
                hasAccess={hasAccess}
                label="Start free"
                className="site-cta-primary inline-flex w-full justify-center"
              />
            </div>

            <p className="mt-4 text-center text-sm leading-6 text-[var(--muted)]">
              Payment details are collected when you launch. You won&apos;t be charged until your trial ends. Ad spend is paid separately to Meta.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>FAQ</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              Quick answers before you launch.
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-[24px] border border-[var(--line)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] px-5 py-4">
                <p className="text-base font-semibold tracking-[-0.02em] text-[var(--ink)]">{faq.question}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA close */}
      <section className="bg-[linear-gradient(180deg,#16122d_0%,#1c1637_100%)] py-18 text-white sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(221,212,255,0.9)]">
              Your next job is already scrolling
            </p>
            <h2 className="mt-4 text-[clamp(2.1rem,1.6rem+2vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.06em]">
              Stop posting and hoping. Start booking.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-7 text-white/72">
              Launch your first detailing campaign today and turn local attention into booked bays.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCta
                loggedIn={loggedIn}
                hasAccess={hasAccess}
                label="Start free"
                className="site-cta-primary inline-flex justify-center !bg-white !text-[#1a1430] hover:!bg-[#f1ecff]"
              />
              <Link
                href={hasAccess ? "/templates" : "/product/templates"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                View detailing templates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-5 text-sm text-white/55">
              14-day free trial, then $97/month. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
