import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { HomeProductShowcase } from "@/components/home-product-showcase";
import { HomeTrialCta } from "@/components/home-trial-cta";
import { WhySidekickSection } from "@/components/why-sidekick-section";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { Button } from "@/components/ui/button";
import { publicFaqs } from "@/data/public-faqs";
import { getTemplates } from "@/lib/data";

const featureCards = [
  {
    title: "Choose your industry",
    description:
      "Start with the type of business you run, then jump into a template that already fits that offer.",
    points: ["Industry-first setup", "Ready from day one", "No blank page"],
  },
  {
    title: "Launch from one system",
    description:
      "Templates, campaign pages, lead management, and follow-up stay connected so launch feels cleaner.",
    points: ["Campaign page included", "Lead management built in", "Simple outreach flow"],
  },
  {
    title: "Manage leads in one place",
    description:
      "Track inquiries, update status, and keep the next step moving without adding another tool.",
    points: ["Lead list", "Status updates", "Next-step outreach"],
  },
];

const steps = [
  {
    number: "01",
    title: "Choose your industry",
    description: "Start with the kind of business and offer you want to launch.",
  },
  {
    number: "02",
    title: "Pick a template",
    description: "Choose a ready-to-go template instead of building the whole setup from scratch.",
  },
  {
    number: "03",
    title: "Launch and manage leads",
    description: "Go live, manage leads, and keep outreach moving from the same platform.",
  },
];

export default async function HomePage() {
  const templates = await getTemplates();
  const featuredTemplates = templates.slice(0, 3);
  const featuredFaqs = publicFaqs.slice(0, 4);

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <HeroGeometric />

      <section id="features" className="page-section marketing-section pt-8 sm:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
            Product
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl md:text-5xl">
            One clearer system for small-business launch
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 public-text-muted sm:text-base">
            Choose your industry, pick a ready-to-go template, launch faster, and manage leads and outreach without stitching together a stack of extra tools.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-11 lg:grid-cols-3">
          {featureCards.map((card) => (
            <InteractiveGlowCard
              key={card.title}
                className="h-full rounded-[32px] border border-[var(--public-line)] bg-[var(--public-surface)] p-6 sm:p-7"
            >
              <div className="flex h-full flex-col">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
                  {card.title}
                </h3>
                <p className="mt-4 text-sm leading-7 public-text-muted">{card.description}</p>
                <div className="mt-6 space-y-3.5">
                  {card.points.map((point) => (
                    <div key={point} className="flex items-center gap-3 text-sm text-[rgba(17,18,22,0.88)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--public-accent)]" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </InteractiveGlowCard>
          ))}
        </div>
      </section>

      <WhySidekickSection />

      <section className="page-section marketing-section">
        <div className="public-section-shell overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="max-w-xl">
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
                Three steps from first click to live system
              </h2>
              <p className="mt-5 text-sm leading-7 public-text-muted sm:text-base">
                The point is clarity: choose the business type, pick the template, then launch and manage leads from one platform.
              </p>
            </div>

            <div className="grid flex-1 gap-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="public-surface-card-strong rounded-[28px] px-5 py-5 sm:px-6 sm:py-[1.375rem]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                    <div className="inline-flex w-fit rounded-full border border-[var(--public-line)] bg-white/72 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-[var(--public-accent)]">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--public-text)]">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 public-text-muted">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              Templates
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
              Start from templates that already fit the business
            </h2>
            <p className="mt-5 text-sm leading-7 public-text-muted sm:text-base">
              Choose your industry, then start from a ready-to-go template instead of a blank setup.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
          >
            <Link href="/product/templates">
              See all templates
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-11 lg:grid-cols-3">
          {featuredTemplates.map((template) => (
            <InteractiveGlowCard
              key={template.slug}
                className="h-full rounded-[32px] border border-[var(--public-line)] bg-[var(--public-surface)] p-6"
            >
              <div className="flex h-full flex-col">
                <div className="rounded-[24px] border border-[var(--public-line)] bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,244,255,0.78))] p-5">
                  <div className="rounded-[20px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.82)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-[var(--public-line)] bg-white/72 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--public-muted)]">
                        {template.category}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] public-text-faint">
                        Industry-ready
                      </span>
                    </div>
                    <div className="mt-8 space-y-3">
                      <div className="h-3 w-2/3 rounded-full bg-[rgba(17,18,22,0.14)]" />
                      <div className="h-2.5 w-full rounded-full bg-[rgba(17,18,22,0.08)]" />
                      <div className="h-2.5 w-5/6 rounded-full bg-[rgba(17,18,22,0.08)]" />
                      <div className="h-2.5 w-3/4 rounded-full bg-[rgba(17,18,22,0.06)]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                    {template.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 public-text-muted">
                    {template.description}
                  </p>
                  <p className="mt-4 text-sm leading-7 public-text-soft">
                    {template.positioning}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {template.benefits.slice(0, 2).map((benefit) => (
                      <span
                        key={benefit}
                        className="rounded-full border border-[var(--public-line)] bg-white/72 px-3 py-1 text-xs text-[rgba(17,18,22,0.74)]"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                  <Button
                    asChild
                    className="mt-6 w-full rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
                  >
                    <Link href="/product/templates">
                      Explore this template
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </InteractiveGlowCard>
          ))}
        </div>
      </section>

      <HomeProductShowcase />

      <section id="faq" className="page-section marketing-section pt-0">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              FAQ
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
              The quick answers people actually need
            </h2>
            <Button
              asChild
              variant="outline"
              className="mt-6 border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
            >
              <Link href="/faq">
                See all questions
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 lg:col-span-2">
            {featuredFaqs.map((item) => (
              <div
                key={item.question}
                className="public-surface-card rounded-[28px] border border-[var(--public-line)] px-5 py-5 sm:px-6 sm:py-[1.375rem]"
              >
                <h3 className="text-lg font-semibold text-[var(--public-text)]">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 public-text-muted">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeTrialCta />

      <PublicSiteFooter />
    </main>
  );
}
