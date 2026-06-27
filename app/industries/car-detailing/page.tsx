import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Circle, CircleDashed, Inbox, Layers3, Send, TrendingDown, TrendingUp } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { StartTrialButton } from "@/components/billing-action-buttons";
import { AnimatedNumber } from "@/components/funnel/animated-number";
import { getCurrentUser } from "@/lib/auth";
import { getUserBillingStatus } from "@/lib/billing";
import { getTemplates } from "@/lib/data";
import type { TemplateSeed } from "@/types";

export const metadata: Metadata = {
  title: "Car Detailing Campaigns | SideKick Studioss",
  description:
    "Launch ready-to-go Facebook and Instagram campaigns for your detailing business, capture leads, and keep follow-up organized with SideKick.",
};

const problemCards = [
  {
    title: "Missed DMs",
    detail: "Leads come in while you're working.",
  },
  {
    title: "Slow replies",
    detail: "Price shoppers disappear fast.",
  },
  {
    title: "Buried proof",
    detail: "Your best work gets lost in the feed.",
  },
  {
    title: "Blank-page ads",
    detail: "Every campaign starts from scratch.",
  },
  {
    title: "Forgotten follow-up",
    detail: "Hot leads cool off quietly.",
  },
  {
    title: "Empty days",
    detail: "The calendar has gaps you feel.",
  },
];

const systemCards = [
  {
    title: "Pick a detailing template",
    detail: "Full detail, interior, coating, correction, or maintenance.",
    icon: Layers3,
  },
  {
    title: "Launch on Meta",
    detail: "Use ready-to-go Facebook and Instagram campaign flows.",
    icon: Send,
  },
  {
    title: "Track every lead",
    detail: "See new, contacted, booked, won, and lost leads in one place.",
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
    slug: "premium-car-detail",
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
    detail: "Captured and organized in one place.",
    trend: "+28%",
    direction: "up",
    prefix: "",
  },
  {
    value: 18420,
    label: "Impressions",
    detail: "Steady local visibility across Meta.",
    trend: "+41%",
    direction: "up",
    prefix: "",
  },
  {
    value: 21,
    label: "Cost per lead",
    detail: "Cleaner tracking makes spend easier to judge.",
    trend: "-19%",
    direction: "down",
    prefix: "$",
  },
] as const;

const beforeItems = [
  "Random posts",
  "Missed DMs",
  "Messy follow-up",
  "Starting from scratch",
];

const afterItems = [
  "Campaign templates",
  "Captured leads",
  "Clear statuses",
  "CRM handoff",
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
    answer: "No. SideKick gives you ready-to-launch campaign flows so you are not starting from a blank Ads Manager screen.",
  },
  {
    question: "Does this include ad spend?",
    answer: "No. Meta ad spend is separate from your SideKick subscription.",
  },
  {
    question: "Can I cancel?",
    answer: "Yes. You can cancel anytime from billing settings.",
  },
  {
    question: "Is this only for detailers?",
    answer: "SideKick works for small businesses, but this page is built specifically for detailing campaigns.",
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
    <StartTrialButton
      loggedIn={loggedIn}
      nextPath="checkout"
      label={label}
      className={className}
      pendingLabel="Opening trial..."
    />
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

function HeroTemplateShowcase({
  templates,
}: {
  templates: Array<{ template?: TemplateSeed; fallbackTitle: string; kicker: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-[760px] rounded-[32px] border border-[rgba(109,94,248,0.14)] bg-white p-3 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.32)] sm:p-4">
      <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[linear-gradient(180deg,#fcfbff_0%,#f5f2ff_100%)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 sm:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">Detailing templates</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)] sm:text-base">Ready-to-launch campaign library</p>
          </div>
          <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            3 featured
          </span>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-3 md:p-5">
          {templates.map(({ template, fallbackTitle, kicker }, index) => {
            const imageUrl = template?.creativeAssets?.imageUrls?.[0] || template?.previewImage || null;

            return (
              <div
                key={template?.slug || fallbackTitle}
                className={[
                  "overflow-hidden rounded-[22px] border border-[var(--line)] bg-white shadow-[0_12px_28px_-24px_rgba(15,23,42,0.2)]",
                  index === 1 ? "md:-translate-y-1" : "",
                ].join(" ")}
              >
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
          })}
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

      <section className="border-b border-[rgba(109,94,248,0.1)] bg-[linear-gradient(180deg,#faf8ff_0%,#f4f1fb_100%)] pb-16 pt-28 sm:pb-20 sm:pt-34">
        <div className="site-container">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
            <Link href="/product/templates" className="transition-colors hover:text-[var(--ink)]">
              Templates
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--muted-strong)]">Car Detailing</span>
          </nav>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:gap-10">
            <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-[32rem]">
              <p className="inline-flex rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                For car detailers
              </p>
              <h1 className="mt-4 text-[clamp(2.6rem,1.9rem+2.5vw,4.35rem)] font-semibold leading-[0.96] tracking-[-0.075em] text-[var(--ink)]">
                Turn detailing leads into booked jobs.
              </h1>
              <p className="mt-4 max-w-lg text-lg leading-7 text-[var(--muted-strong)]">
                Launch ready-to-go Facebook and Instagram campaigns, capture leads, and keep follow-up organized from one clean workspace.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <PrimaryCta
                  loggedIn={loggedIn}
                  hasAccess={hasAccess}
                  label="Start 14-day trial"
                  className="site-cta-primary inline-flex justify-center"
                />
                <TemplatesCta hasAccess={hasAccess} />
              </div>

              <p className="mt-3 text-sm text-[var(--muted)]">
                $97/month after trial. Ad spend paid separately to Meta.
              </p>
            </div>

            <HeroTemplateShowcase templates={heroTemplates} />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Problem snapshot</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              Most detailers lose leads in the gaps.
            </h2>
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

      <section className="bg-[var(--background)] py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              SideKick gives your shop a campaign system.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {systemCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-[28px] border border-[rgba(109,94,248,0.1)] bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.22)]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--soft-brand)] text-[var(--brand)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{card.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[var(--muted-strong)]">{card.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>At a glance</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              A cleaner read on what is working.
            </h2>
          </div>
          <div className="mt-6 flex justify-center">
            <TemplatesCta hasAccess={hasAccess} />
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-3">
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
                <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--background)] py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Before / after</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              Before SideKick / After SideKick
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[30px] border border-[var(--line)] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Before</p>
              <div className="mt-5 space-y-3">
                {beforeItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3">
                    <Circle className="h-3.5 w-3.5 text-[var(--muted)] fill-current" />
                    <span className="text-sm font-medium text-[var(--muted-strong)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-[rgba(109,94,248,0.16)] bg-[linear-gradient(180deg,#17132d_0%,#211741_100%)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(221,212,255,0.9)]">After</p>
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

      <section className="bg-white py-16 sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              Less than one missed detail job.
            </h2>
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-[34px] border border-[rgba(109,94,248,0.14)] bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)] p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.28)] sm:p-10">
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--public-accent-strong)]">SideKick Core</p>
              <p className="mt-4 text-6xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                $97
                <span className="ml-2 text-lg font-medium tracking-normal text-[var(--muted)]">/month</span>
              </p>
              <p className="mt-3 text-base text-[var(--muted-strong)]">14-day free trial</p>
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
                label="Start 14-day trial"
                className="site-cta-primary inline-flex w-full justify-center"
              />
            </div>

            <p className="mt-4 text-center text-sm leading-6 text-[var(--muted)]">
              Payment method required. You won&apos;t be charged until your trial ends. Ad spend is paid separately to Meta.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#16122d_0%,#1c1637_100%)] py-16 text-white sm:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(221,212,255,0.9)]">FAQ</p>
            <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em]">
              Short answers before you launch.
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-base font-semibold tracking-[-0.02em] text-white">{faq.question}</p>
                <p className="mt-2 text-sm leading-6 text-white/72">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
