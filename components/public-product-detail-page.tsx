import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { HomeFinalCta } from "@/components/home-final-cta";
import { FlowDiagram } from "@/components/home-crm-flow";
import {
  AdPreviewCard,
  FollowUpMockup,
  LaunchMockup,
  LeadsMockup,
  TemplatesMockup,
} from "@/components/home-mockups";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Reveal } from "@/components/ui/reveal";
import { TiltFrame } from "@/components/ui/scroll-motion";
import { PublicProductItem } from "@/data/public-product-pages";

function HeroVisual({ item }: { item: PublicProductItem }) {
  switch (item.previewKind) {
    case "templates":
      return (
        <BrowserFrame>
          <TemplatesMockup />
        </BrowserFrame>
      );
    case "ads":
      return (
        <BrowserFrame>
          <LaunchMockup />
        </BrowserFrame>
      );
    case "leadCapture":
      return (
        <div className="mx-auto max-w-[24rem]">
          <AdPreviewCard className="shadow-[0_1px_2px_rgba(15,17,22,0.05),0_32px_72px_-20px_rgba(21,16,31,0.28)]" />
        </div>
      );
    case "leadManagement":
      return (
        <BrowserFrame>
          <LeadsMockup />
        </BrowserFrame>
      );
    case "outreach":
      return (
        <BrowserFrame>
          <FollowUpMockup />
        </BrowserFrame>
      );
    case "integrations":
      return (
        <div className="rounded-[20px] border border-[rgba(15,17,22,0.08)] bg-white p-6 shadow-[0_1px_2px_rgba(15,17,22,0.04),0_30px_70px_-24px_rgba(21,16,31,0.22)]">
          <FlowDiagram />
          <p className="mt-2 text-center text-sm text-[rgba(15,17,22,0.55)] sm:hidden">
            Meta lead form → SideKick → email alerts, CSV export, and your CRM.
          </p>
        </div>
      );
    default:
      return (
        <BrowserFrame>
          <LaunchMockup />
        </BrowserFrame>
      );
  }
}

export function PublicProductDetailPage({ item }: { item: PublicProductItem }) {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="overflow-hidden pb-20 pt-36 sm:pb-24 sm:pt-44">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center justify-center gap-1.5 text-[13px] text-[rgba(15,17,22,0.5)]"
            >
              <Link href="/product" className="font-medium transition-colors hover:text-[var(--public-text)]">
                Product
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-[rgba(15,17,22,0.65)]">{item.shortTitle}</span>
            </nav>

            <h1 className="site-h2 mt-5 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">{item.headline}</h1>
            <p className="site-lead mx-auto mt-5">{item.subheadline}</p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="site-cta-primary">
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/product" className="site-cta-secondary">
                All product areas
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-3xl sm:mt-20">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.12),transparent_64%)]"
              aria-hidden="true"
            />
            <TiltFrame>
              <HeroVisual item={item} />
            </TiltFrame>
          </div>

          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {item.highlights.map((highlight) => (
              <span key={highlight} className="flex items-center gap-2 text-sm font-medium text-[rgba(15,17,22,0.72)]">
                <Check className="h-3.5 w-3.5 text-[var(--public-accent)]" strokeWidth={3} />
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container py-16 sm:py-20">
        <div className="mx-auto grid max-w-4xl gap-10 border-t border-[rgba(15,17,22,0.08)] pt-12 sm:grid-cols-3 sm:gap-12">
          {item.pillars.map((pillar, index) => (
            <Reveal key={pillar} delay={index * 0.08}>
              <div>
                <h2 className="site-h3 text-[17px]">{pillar}</h2>
                <p className="site-body mt-2.5">{item.pillarDetails[index]}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="site-container py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="site-h2 text-3xl sm:text-4xl">{item.workflowTitle}</h2>
            <p className="site-lead mx-auto mt-4">{item.workflowDescription}</p>
          </Reveal>
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <ol className="space-y-0">
            {item.workflowSteps.map((step, index) => (
              <Reveal key={step} delay={index * 0.08}>
                <li className="flex gap-5 pb-10 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(101,88,246,0.1)] font-heading text-sm font-semibold text-[var(--public-accent-strong)]">
                      {index + 1}
                    </span>
                    {index < item.workflowSteps.length - 1 ? (
                      <span className="mt-2 w-px flex-1 bg-[rgba(15,17,22,0.1)]" />
                    ) : null}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-[16px] font-semibold text-[var(--public-text)]">{step}</h3>
                    <p className="site-body mt-1.5">{item.workflowStepDetails[index]}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-container py-16 sm:py-20">
        <div className="mx-auto max-w-4xl border-t border-[rgba(15,17,22,0.08)] pt-12">
          <Reveal>
            <h2 className="site-h2 text-3xl sm:text-4xl">{item.includesTitle}</h2>
            <p className="site-lead mt-4">{item.includesDescription}</p>
          </Reveal>
          <div className="mt-9 grid gap-x-12 gap-y-4 sm:grid-cols-2">
            {item.includes.map((feature, index) => (
              <Reveal key={feature} delay={Math.min(index, 4) * 0.05}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)]">
                    <Check className="h-3 w-3 text-[#5646ec]" strokeWidth={3} />
                  </span>
                  <p className="site-body text-[rgba(15,17,22,0.78)]">{feature}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <HomeFinalCta
        title={`Put ${item.shortTitle.toLowerCase()} to work this week.`}
        subtitle="Start the trial, pick a template for your industry, and see the full flow on a real campaign."
      />

      <PublicSiteFooter />
    </main>
  );
}
