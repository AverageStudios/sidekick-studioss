import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Layers3,
  MousePointerClick,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";
import { Button } from "@/components/ui/button";
import { TemplateSeed } from "@/types";

const reassuranceItems = [
  "Faster setup",
  "Cleaner launch flow",
  "Built for small businesses",
];

const beforeItems = [
  "Blank-canvas setup",
  "Disconnected tools",
  "Slower launch",
  "Messy handoffs",
];

const afterItems = [
  "Ready-to-go templates",
  "Cleaner campaign structure",
  "Faster setup",
  "Simpler lead flow",
];

const useCases = [
  "Detailing offers",
  "Roofing estimates",
  "Cleaning promos",
  "Landscaping campaigns",
  "Med spa consultations",
  "Fitness offers",
];

const steps = [
  {
    title: "Choose your industry",
    description: "Start with the kind of business and offer you want to launch.",
    icon: Layers3,
  },
  {
    title: "Pick a template",
    description: "Choose a ready-to-go template instead of building your setup from zero.",
    icon: WandSparkles,
  },
  {
    title: "Launch and manage leads",
    description: "Go live with lead management and a simpler outreach path already in place.",
    icon: MousePointerClick,
  },
];

const templateIncludes = [
  {
    title: "Industry-ready copy",
    description: "Offer-led messaging that gives you a stronger starting point.",
    icon: Sparkles,
  },
  {
    title: "Campaign page",
    description: "A focused page that supports the campaign instead of slowing it down.",
    icon: Layers3,
  },
  {
    title: "Lead management",
    description: "A clear inquiry step and lead path built into the same flow.",
    icon: MousePointerClick,
  },
  {
    title: "Follow-up flow",
    description: "Simple outreach steps so the lead does not stall after capture.",
    icon: Send,
  },
];

export function PublicTemplatesPage({ templates }: { templates: TemplateSeed[] }) {
  const featuredTemplates = templates.slice(0, 6);

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="page-section pt-34 sm:pt-40">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,124,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(143,124,255,0.08),transparent_34%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                Templates
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl md:text-[4rem] md:leading-[0.98]">
                Ready-to-go templates for faster launch
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 public-text-muted sm:text-base">
                Choose your industry, pick a ready-to-go template, and launch from a system that already includes lead management and follow-up.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
                >
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
                >
                  <Link href="#template-library">See template library</Link>
                </Button>
              </div>
            </div>

            <div className="public-surface-card-strong rounded-[32px] p-5 sm:p-6">
              <div className="rounded-[28px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,255,0.82))] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--public-line)] pb-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--public-text)]">
                      Template system preview
                    </p>
                    <p className="mt-1 text-sm public-text-soft">
                      Pick the business type, then start from a structure that already fits it.
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--public-line)] bg-white/78 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                    Ready now
                  </span>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
                  <div className="rounded-[24px] border border-[var(--public-line)] bg-white/82 p-4">
                    <div className="rounded-[20px] border border-[rgba(143,124,255,0.14)] bg-[linear-gradient(140deg,rgba(143,124,255,0.12),rgba(255,255,255,0.88))] p-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-[var(--public-line)] bg-white/84 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                          Template
                        </span>
                        <Clock3 className="h-4 w-4 text-[var(--public-accent)]" />
                      </div>
                      <div className="mt-5 space-y-2.5">
                        <div className="h-3 w-2/3 rounded-full bg-[rgba(17,18,22,0.14)]" />
                        <div className="h-2.5 w-full rounded-full bg-[rgba(17,18,22,0.08)]" />
                        <div className="h-2.5 w-5/6 rounded-full bg-[rgba(17,18,22,0.08)]" />
                        <div className="h-2.5 w-3/4 rounded-full bg-[rgba(17,18,22,0.06)]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--public-text)]">
                          Industry-ready launch page
                        </p>
                        <p className="mt-1 text-xs public-text-soft">Built for a faster launch path</p>
                      </div>
                      <span className="rounded-full border border-[var(--public-line)] bg-[rgba(143,124,255,0.06)] px-3 py-1 text-[11px] font-medium text-[var(--public-accent)]">
                        Plug-and-play
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {[
                      "Offer structure already in place",
                      "Lead management built into the flow",
                      "Simple outreach path from the start",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[20px] border border-[var(--public-line)] bg-white/78 px-4 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                          <p className="text-sm font-semibold text-[var(--public-text)]">{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-[var(--public-line)] py-4 text-sm public-text-soft sm:gap-x-10">
          {reassuranceItems.map((item) => (
            <span key={item} className="font-medium text-[rgba(17,18,22,0.74)]">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="page-section marketing-section pt-10 sm:pt-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <InteractiveGlowCard className="rounded-[32px] border border-[rgba(17,18,22,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,249,251,0.92))] p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] public-text-faint">
              Before SideKick
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)]">
              Too much setup drag
            </h2>
            <div className="mt-6 space-y-3.5">
              {beforeItems.map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-[rgba(17,18,22,0.08)] bg-white/76 px-4 py-3.5 text-sm font-medium text-[rgba(17,18,22,0.74)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </InteractiveGlowCard>

          <InteractiveGlowCard className="rounded-[32px] border border-[rgba(143,124,255,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,255,0.95))] p-6 sm:p-7">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              With SideKick
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)]">
              A cleaner way to launch
            </h2>
            <div className="mt-6 space-y-3.5">
              {afterItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[18px] border border-[rgba(143,124,255,0.12)] bg-white/82 px-4 py-3.5"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[rgba(143,124,255,0.16)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-[var(--public-text)]">{item}</p>
                </div>
              ))}
            </div>
          </InteractiveGlowCard>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              Use cases
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
              Choose the template that fits your industry
            </h2>
            <p className="mt-4 text-sm leading-7 public-text-muted sm:text-base">
              Start from the kind of campaign structure your business actually needs to launch.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {useCases.map((item) => (
            <InteractiveGlowCard
              key={item}
              className="rounded-[28px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                  <Layers3 className="h-4.5 w-4.5" />
                </span>
                <p className="text-sm font-semibold text-[var(--public-text)]">{item}</p>
              </div>
            </InteractiveGlowCard>
          ))}
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="public-section-shell px-6 py-9 sm:px-8 sm:py-10">
          <div className="max-w-2xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              How templates work
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
              Three simple steps to get moving
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <InteractiveGlowCard
                  key={step.title}
                  className="rounded-[28px] border border-[var(--public-line)] bg-[var(--public-surface)] p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] public-text-faint">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 public-text-muted">{step.description}</p>
                </InteractiveGlowCard>
              );
            })}
          </div>
        </div>
      </section>

      <section id="template-library" className="page-section marketing-section pt-0">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              Template library
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
              Preview the template library
            </h2>
            <p className="mt-4 text-sm leading-7 public-text-muted sm:text-base">
              Every template gives you a ready-to-go starting point, then leaves room for your offer, brand, lead management, and follow-up flow.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
          >
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
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
                <div className="rounded-[24px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,244,255,0.82))] p-4">
                  <div className="rounded-[20px] border border-[rgba(143,124,255,0.13)] bg-[linear-gradient(145deg,rgba(143,124,255,0.12),rgba(255,255,255,0.84))] p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-[var(--public-line)] bg-white/82 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                        {template.category}
                      </span>
                      <span className="text-[11px] public-text-faint">Campaign preview</span>
                    </div>
                    <div className="mt-5 space-y-2.5">
                      <div className="h-3 w-2/3 rounded-full bg-[rgba(17,18,22,0.14)]" />
                      <div className="h-2.5 w-full rounded-full bg-[rgba(17,18,22,0.08)]" />
                      <div className="h-2.5 w-5/6 rounded-full bg-[rgba(17,18,22,0.08)]" />
                    </div>
                    <div className="mt-5 grid gap-2">
                      {template.benefits.slice(0, 2).map((benefit) => (
                        <div
                          key={benefit}
                          className="rounded-[14px] border border-[var(--public-line)] bg-white/78 px-3 py-2 text-xs text-[rgba(17,18,22,0.74)]"
                        >
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col">
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                    {template.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 public-text-muted">{template.description}</p>
                  <p className="mt-4 text-sm leading-7 public-text-soft">{template.positioning}</p>
                  <Button
                    asChild
                    className="mt-6 w-full rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.22)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
                  >
                    <Link href="/signup">
                      Start with this template
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </InteractiveGlowCard>
          ))}
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="public-section-shell px-6 py-9 sm:px-8 sm:py-10">
          <div className="max-w-2xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              What comes with each template
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
              More than a layout
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {templateIncludes.map((item) => {
              const Icon = item.icon;

              return (
                <InteractiveGlowCard
                  key={item.title}
                  className="rounded-[28px] border border-[var(--public-line)] bg-[var(--public-surface)] p-5 sm:p-6"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 public-text-muted">{item.description}</p>
                </InteractiveGlowCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,124,255,0.1),transparent_36%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                Start with the right structure
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
                Launch faster without starting from zero
              </h2>
              <p className="mt-4 text-sm leading-7 public-text-muted sm:text-base">
                Use SideKick templates to tighten the campaign flow before you ever hit publish.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
            >
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
