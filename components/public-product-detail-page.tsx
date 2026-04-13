import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  ChevronRight,
  Layers3,
  Link2,
  Megaphone,
  Send,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";
import { Button } from "@/components/ui/button";
import { PublicProductItem } from "@/data/public-product-pages";

function HeroVisual({ item }: { item: PublicProductItem }) {
  switch (item.previewKind) {
    case "templates":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {["Roofing estimate", "Cleaning promo"].map((label) => (
            <div key={label} className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
              <div className="rounded-[18px] border border-[rgba(143,124,255,0.14)] bg-[linear-gradient(145deg,rgba(143,124,255,0.12),rgba(255,255,255,0.86))] p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-[var(--public-line)] bg-white/84 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                    Template
                  </span>
                  <Layers3 className="h-4 w-4 text-[var(--public-accent)]" />
                </div>
                <div className="mt-5 space-y-2.5">
                  <div className="h-3 w-2/3 rounded-full bg-[rgba(17,18,22,0.14)]" />
                  <div className="h-2.5 w-full rounded-full bg-[rgba(17,18,22,0.08)]" />
                  <div className="h-2.5 w-5/6 rounded-full bg-[rgba(17,18,22,0.08)]" />
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--public-text)]">{label}</p>
              <p className="mt-1 text-xs public-text-soft">Industry-ready starting point</p>
            </div>
          ))}
        </div>
      );
    case "ads":
      return (
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
            <div className="rounded-[20px] border border-[rgba(143,124,255,0.14)] bg-[linear-gradient(145deg,rgba(143,124,255,0.12),rgba(255,255,255,0.86))] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[var(--public-line)] bg-white/84 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                  Ad setup
                </span>
                <Megaphone className="h-4 w-4 text-[var(--public-accent)]" />
              </div>
              <p className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                Clear offer. Cleaner launch path.
              </p>
              <div className="mt-4 space-y-2.5">
                <div className="h-2.5 w-full rounded-full bg-[rgba(17,18,22,0.08)]" />
                <div className="h-2.5 w-11/12 rounded-full bg-[rgba(17,18,22,0.08)]" />
                <div className="h-2.5 w-4/5 rounded-full bg-[rgba(17,18,22,0.07)]" />
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {["Offer angle", "Campaign page", "Lead flow"].map((step, index) => (
              <div key={step} className="rounded-[20px] border border-[var(--public-line)] bg-white/82 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] public-text-faint">
                  Stage 0{index + 1}
                </p>
                <p className="mt-2.5 text-sm font-semibold text-[var(--public-text)]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "leadCapture":
      return (
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
            <p className="text-sm font-semibold text-[var(--public-text)]">Inquiry form</p>
            <div className="mt-4 space-y-3">
              {["Name", "Phone", "Service interested in", "Message"].map((field) => (
                <div
                  key={field}
                  className="rounded-[16px] border border-[var(--public-line)] bg-white/88 px-4 py-3 text-sm text-[rgba(17,18,22,0.48)]"
                >
                  {field}
                </div>
              ))}
              <div className="rounded-[16px] border border-[rgba(143,124,255,0.18)] bg-[rgba(143,124,255,0.08)] px-4 py-3 text-sm font-semibold text-[var(--public-accent)]">
                Submit inquiry
              </div>
            </div>
          </div>
          <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
            <p className="text-sm font-semibold text-[var(--public-text)]">Campaign page preview</p>
            <div className="mt-4 rounded-[20px] border border-[rgba(143,124,255,0.14)] bg-[linear-gradient(145deg,rgba(143,124,255,0.1),rgba(255,255,255,0.82))] p-4">
              <div className="h-3 w-2/3 rounded-full bg-[rgba(17,18,22,0.14)]" />
              <div className="mt-3 h-2.5 w-full rounded-full bg-[rgba(17,18,22,0.08)]" />
              <div className="mt-2 h-2.5 w-5/6 rounded-full bg-[rgba(17,18,22,0.08)]" />
              <div className="mt-5 grid gap-2">
                {["Offer", "Benefits", "Form CTA"].map((item) => (
                  <div key={item} className="rounded-[14px] border border-[var(--public-line)] bg-white/84 px-3 py-2 text-xs text-[rgba(17,18,22,0.72)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    case "leadManagement":
      return (
        <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
          <div className="grid gap-3">
            {[
              { name: "Alex Morgan", status: "New" },
              { name: "Jordan Lee", status: "Contacted" },
              { name: "Taylor West", status: "Booked" },
            ].map((lead) => (
              <div key={lead.name} className="flex items-center justify-between rounded-[18px] border border-[var(--public-line)] bg-white/82 px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--public-text)]">{lead.name}</p>
                  <p className="mt-1 text-xs public-text-soft">Lead tied to campaign source</p>
                </div>
                <span className="rounded-full border border-[var(--public-line)] bg-[rgba(143,124,255,0.06)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    case "outreach":
      return (
        <div className="grid gap-3">
          {[
            { label: "Lead comes in", body: "New inquiry lands inside SideKick." },
            { label: "Follow-up starts", body: "Next-step outreach stays tied to the lead." },
            { label: "Conversation keeps moving", body: "The team sees what needs action next." },
          ].map((row, index) => (
            <div key={row.label} className="flex gap-4 rounded-[22px] border border-[var(--public-line)] bg-white/84 px-4 py-4">
              <div className="flex flex-col items-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(143,124,255,0.16)] bg-[rgba(143,124,255,0.08)] text-sm font-semibold text-[var(--public-accent)]">
                  0{index + 1}
                </div>
                {index < 2 ? <div className="mt-2 h-full w-px bg-[var(--public-line)]" /> : null}
              </div>
              <div className="pb-1">
                <p className="text-sm font-semibold text-[var(--public-text)]">{row.label}</p>
                <p className="mt-1.5 text-sm leading-6 public-text-soft">{row.body}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "integrations":
      return (
        <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
            {[
              { label: "Meta / Facebook", icon: Megaphone },
              { label: "SideKick lead flow", icon: Blocks },
              { label: "Email + outreach", icon: Send },
            ].map((node, index) => {
              const Icon = node.icon;
              return (
                <div key={node.label} className="contents">
                  <div className="rounded-[20px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(143,124,255,0.08),rgba(255,255,255,0.76))] px-4 py-5 text-center">
                    <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-white/82 text-[var(--public-accent)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-[var(--public-text)]">{node.label}</p>
                  </div>
                  {index < 2 ? (
                    <div className="hidden items-center justify-center sm:flex">
                      <Link2 className="h-5 w-5 text-[var(--public-accent)]" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      );
  }
}

function InsideVisual({ item }: { item: PublicProductItem }) {
  switch (item.previewKind) {
    case "templates":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {["Roofing", "Cleaning", "Landscaping", "Med spa"].map((industry) => (
            <div key={industry} className="rounded-[18px] border border-[var(--public-line)] bg-white/82 px-4 py-4">
              <p className="text-sm font-semibold text-[var(--public-text)]">{industry}</p>
              <p className="mt-1.5 text-xs public-text-soft">Template path ready to customize</p>
            </div>
          ))}
        </div>
      );
    case "ads":
      return (
        <div className="rounded-[20px] border border-[var(--public-line)] bg-white/84 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--public-text)]">Campaign launch board</p>
            <span className="rounded-full border border-[var(--public-line)] bg-[rgba(143,124,255,0.06)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
              Launch-ready
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            {["Offer selected", "Page matched", "Lead path ready"].map((line) => (
              <div key={line} className="rounded-[14px] border border-[var(--public-line)] bg-white/84 px-3 py-2 text-xs text-[rgba(17,18,22,0.74)]">
                {line}
              </div>
            ))}
          </div>
        </div>
      );
    case "leadCapture":
      return (
        <div className="rounded-[20px] border border-[var(--public-line)] bg-white/84 p-4">
          <p className="text-sm font-semibold text-[var(--public-text)]">Capture checkpoints</p>
          <div className="mt-4 grid gap-2">
            {["Clear headline", "Focused form", "Lead enters SideKick"].map((line) => (
              <div key={line} className="rounded-[14px] border border-[var(--public-line)] bg-white/84 px-3 py-2 text-xs text-[rgba(17,18,22,0.74)]">
                {line}
              </div>
            ))}
          </div>
        </div>
      );
    case "leadManagement":
      return (
        <div className="rounded-[20px] border border-[var(--public-line)] bg-white/84 p-4">
          <p className="text-sm font-semibold text-[var(--public-text)]">Lead status view</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["New", "Contacted", "Booked", "Closed"].map((status) => (
              <span key={status} className="rounded-full border border-[var(--public-line)] bg-white/84 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--public-muted)]">
                {status}
              </span>
            ))}
          </div>
        </div>
      );
    case "outreach":
      return (
        <div className="rounded-[20px] border border-[var(--public-line)] bg-white/84 p-4">
          <p className="text-sm font-semibold text-[var(--public-text)]">Outreach queue</p>
          <div className="mt-4 grid gap-2">
            {["Reply needed", "Reminder set", "Conversation active"].map((line) => (
              <div key={line} className="rounded-[14px] border border-[var(--public-line)] bg-white/84 px-3 py-2 text-xs text-[rgba(17,18,22,0.74)]">
                {line}
              </div>
            ))}
          </div>
        </div>
      );
    case "integrations":
      return (
        <div className="rounded-[20px] border border-[var(--public-line)] bg-white/84 p-4">
          <p className="text-sm font-semibold text-[var(--public-text)]">Connected stack</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Meta / Facebook", "Supabase", "Resend", "Future hooks"].map((label) => (
              <span key={label} className="rounded-full border border-[var(--public-line)] bg-white/84 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--public-muted)]">
                {label}
              </span>
            ))}
          </div>
        </div>
      );
  }
}

export function PublicProductDetailPage({ item }: { item: PublicProductItem }) {
  const Icon = item.icon;

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="page-section pt-34 sm:pt-40">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,124,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(143,124,255,0.08),transparent_32%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12">
            <div className="max-w-2xl">
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                {item.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl md:text-[4.1rem] md:leading-[0.98]">
                {item.headline}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 public-text-muted sm:text-base">
                {item.subheadline}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.28)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
                >
                  <Link href="/signup">
                    {item.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
                >
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>

            <div className="public-surface-card-strong rounded-[32px] p-5 sm:p-6">
              <div className="rounded-[28px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,255,0.82))] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--public-line)] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[rgba(17,18,22,0.88)]">{item.frameTitle}</p>
                      <p className="mt-1 text-sm public-text-soft">{item.description}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[var(--public-line)] bg-white/74 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--public-accent)]">
                    {item.frameLabel}
                  </span>
                </div>

                <div className="mt-5">
                  <HeroVisual item={item} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {item.frameSteps.map((step, index) => (
                    <div key={step} className="rounded-[22px] border border-[var(--public-line)] bg-white/74 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">
                        0{index + 1}
                      </p>
                      <p className="mt-3 text-base font-semibold text-[var(--public-text)]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-[var(--public-line)] py-4 text-sm public-text-soft sm:gap-x-10">
          {item.highlights.map((highlight) => (
            <span key={highlight} className="font-medium text-[rgba(17,18,22,0.76)]">
              {highlight}
            </span>
          ))}
        </div>
      </section>

      <section className="page-section marketing-section pt-10 sm:pt-12">
        <div className="max-w-2xl">
          <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
            Why it matters
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
            The part of SideKick that keeps this clearer
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {item.pillars.map((pillar, index) => (
            <InteractiveGlowCard
              key={pillar}
              className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] p-5 sm:p-6"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">
                0{index + 1}
              </p>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
                {pillar}
              </h2>
              <p className="mt-3 text-sm leading-7 public-text-muted">{item.pillarDetails[index]}</p>
            </InteractiveGlowCard>
          ))}
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,124,255,0.12),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
            <div>
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                {item.workflowLabel}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
                {item.workflowTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 public-text-muted sm:text-base">
                {item.workflowDescription}
              </p>

              <div className="mt-8 grid gap-4">
                {item.workflowSteps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[24px] border border-[var(--public-line)] bg-white/78 px-5 py-5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(143,124,255,0.16)] bg-[rgba(143,124,255,0.08)] text-sm font-semibold text-[var(--public-accent)]">
                        0{index + 1}
                      </span>
                      <div>
                        <p className="text-base font-semibold text-[var(--public-text)]">{step}</p>
                        <p className="mt-2 text-sm leading-7 public-text-muted">
                          {item.workflowStepDetails[index]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="public-surface-card rounded-[30px] p-5 sm:p-6">
              <div className="rounded-[24px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,245,255,0.84))] p-5">
                <p className="text-sm font-semibold text-[var(--public-text)]">{item.includesTitle}</p>
                <p className="mt-2 text-sm leading-7 public-text-soft">{item.includesDescription}</p>
                <div className="mt-5">
                  <InsideVisual item={item} />
                </div>
                <div className="mt-5 grid gap-2">
                  {item.includes.map((line) => (
                    <div key={line} className="flex items-center gap-3 rounded-[16px] border border-[var(--public-line)] bg-white/82 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-[var(--public-accent)]" />
                      <p className="text-sm font-medium text-[var(--public-text)]">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,124,255,0.14),transparent_34%)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                Get started
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
                See how the full platform fits together
              </h2>
              <p className="mt-5 text-sm leading-7 public-text-muted sm:text-base">
                Start with SideKick to choose a template, launch faster, manage leads, and keep outreach moving in one place.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.28)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
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
                <Link href="/product">
                  See Product Overview
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
