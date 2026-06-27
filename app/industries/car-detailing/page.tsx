import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Circle, CircleDashed, Inbox, Layers3, Send } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { StartTrialButton } from "@/components/billing-action-buttons";
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

const templateCards = [
  {
    slug: "ceramic-coating-promo",
    title: "Ceramic Coating Promo",
    detail: "Position protection packages.",
    leadType: "Higher-ticket inquiries",
  },
  {
    slug: "full-detail-promo",
    title: "Full Detail Promo",
    detail: "Fill the calendar fast.",
    leadType: "General detailing jobs",
  },
  {
    slug: "interior-detail-promo",
    title: "Interior Detail Promo",
    detail: "Great for dirty interiors.",
    leadType: "Family cars and odor jobs",
  },
  {
    slug: "paint-correction-promo",
    title: "Paint Correction Promo",
    detail: "Turn transformations into leads.",
    leadType: "Premium correction work",
  },
  {
    slug: "monthly-maintenance-promo",
    title: "Monthly Maintenance Promo",
    detail: "Stay in front of past clients.",
    leadType: "Repeat-service inquiries",
  },
];

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

function ProductMockup() {
  return (
    <div className="rounded-[32px] border border-[rgba(109,94,248,0.14)] bg-white p-3 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.32)] sm:p-4">
      <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[linear-gradient(180deg,#fcfbff_0%,#f5f2ff_100%)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 sm:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">Campaign</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)] sm:text-base">Ceramic Coating Promo</p>
          </div>
          <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            Ready to launch
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-[1.1fr_0.9fr] sm:p-5">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-[var(--line)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Leads captured</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">18</p>
              </div>
              <div className="rounded-[20px] border border-[var(--line)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">CRM</p>
                <p className="mt-2 text-base font-semibold text-[var(--ink)]">Pipedrive connected</p>
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--line)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">New lead</p>
              <p className="mt-2 text-base font-semibold text-[var(--ink)]">2022 BMW M4 - Ceramic Coating</p>
              <p className="mt-1 text-sm text-[var(--muted-strong)]">Service interest captured and ready for follow-up.</p>
            </div>

            <div className="rounded-[20px] border border-[var(--line)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Lead status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["New", "Contacted", "Booked"].map((item, index) => (
                  <span
                    key={item}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      index === 0
                        ? "bg-[var(--brand)] text-white"
                        : "border border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]",
                    ].join(" ")}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--line)] bg-[#151228] p-4 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-white/55">Workspace</p>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/75">
                Meta ready
              </span>
            </div>
            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">Campaign flow</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Template selected", done: true },
                  { label: "Creative ready", done: true },
                  { label: "Lead capture on", done: true },
                  { label: "CRM handoff ready", done: false },
                ].map((step) => (
                  <div key={step.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/82">{step.label}</span>
                    {step.done ? (
                      <Check className="h-4 w-4 text-[rgba(216,203,255,0.95)]" strokeWidth={2.8} />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-white/40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateShowcaseCard({
  item,
  template,
  wide = false,
}: {
  item: (typeof templateCards)[number];
  template?: TemplateSeed;
  wide?: boolean;
}) {
  const imageUrl = template?.creativeAssets?.imageUrls?.[0] || template?.previewImage || null;

  return (
    <div
      className={[
        "overflow-hidden rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,#ffffff_0%,#faf8ff_100%)] shadow-[0_14px_35px_-28px_rgba(15,23,42,0.18)]",
        wide ? "lg:col-span-3" : "lg:col-span-2",
      ].join(" ")}
    >
      <div className="relative aspect-[16/9] border-b border-[var(--line)] bg-[linear-gradient(135deg,#f3efff_0%,#ece7ff_100%)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.18),transparent_45%),linear-gradient(180deg,#f7f3ff_0%,#ece6ff_100%)] p-5">
            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
              Preview
            </span>
          </div>
        )}
        <div className="absolute right-4 top-4">
          <span className="shrink-0 rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
            Ready to launch
          </span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{template?.name || item.title}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{item.detail}</p>

        <div className="mt-5 rounded-[20px] border border-[rgba(109,94,248,0.08)] bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Lead type</p>
          <p className="mt-1 text-sm font-medium text-[var(--ink)]">{item.leadType}</p>
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
  const detailingTemplates = templates.filter((template) => template.industry === "Car Detailing");
  const showcaseTemplates = templateCards.map((item) => ({
    item,
    template:
      detailingTemplates.find((template) => template.slug === item.slug) ||
      detailingTemplates.find((template) => template.name === item.title),
  }));

  return (
    <main className="public-site min-h-screen bg-[var(--surface)]">
      <MarketingNav />

      <section className="border-b border-[rgba(109,94,248,0.1)] bg-[linear-gradient(180deg,#faf8ff_0%,#f4f1fb_100%)] pb-18 pt-32 sm:pb-22 sm:pt-40">
        <div className="site-container">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
            <Link href="/product/templates" className="transition-colors hover:text-[var(--ink)]">
              Templates
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--muted-strong)]">Car Detailing</span>
          </nav>

          <div className="mt-8 grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="max-w-xl">
              <p className="inline-flex rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                For car detailers
              </p>
              <h1 className="mt-5 text-[clamp(2.6rem,1.8rem+3vw,4.7rem)] font-semibold tracking-[-0.07em] text-[var(--ink)]">
                Turn detailing leads into booked jobs.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[var(--muted-strong)]">
                Launch ready-to-go Facebook and Instagram campaigns, capture leads, and keep follow-up organized from one clean workspace.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryCta
                  loggedIn={loggedIn}
                  hasAccess={hasAccess}
                  label="Start 14-day trial"
                  className="site-cta-primary inline-flex justify-center"
                />
                <TemplatesCta hasAccess={hasAccess} />
              </div>

              <p className="mt-4 text-sm text-[var(--muted)]">
                $97/month after trial. Ad spend paid separately to Meta.
              </p>
            </div>

            <ProductMockup />
          </div>
        </div>
      </section>

      <section className="bg-white py-18 sm:py-22">
        <div className="site-container">
          <div className="max-w-2xl">
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

      <section className="bg-[var(--background)] py-18 sm:py-22">
        <div className="site-container">
          <div className="max-w-2xl">
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

      <section className="bg-white py-18 sm:py-22">
        <div className="site-container">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <SectionEyebrow>Template showcase</SectionEyebrow>
              <h2 className="mt-3 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
                Detailing campaigns ready from day one.
              </h2>
            </div>
            <TemplatesCta hasAccess={hasAccess} />
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-6">
            {showcaseTemplates.map(({ item, template }, index) => (
              <TemplateShowcaseCard
                key={item.slug}
                item={item}
                template={template}
                wide={index === 0 || index === 3}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--background)] py-18 sm:py-22">
        <div className="site-container">
          <div className="max-w-2xl">
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

      <section className="bg-white py-18 sm:py-22">
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

      <section className="bg-[linear-gradient(180deg,#16122d_0%,#1c1637_100%)] py-18 text-white sm:py-22">
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
