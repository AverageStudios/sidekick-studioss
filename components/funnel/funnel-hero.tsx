import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Reveal } from "@/components/ui/reveal";
import { FUNNEL_TEMPLATES_HREF, FUNNEL_TRIAL_HREF } from "@/components/funnel/funnel-links";

export function FunnelHero() {
  return (
    <section className="relative overflow-hidden pt-8 sm:pt-14">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[54rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.16),transparent_62%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-5xl">
            <BrowserFrame url="app.sidekickstudioss.com/home" className="mx-auto max-w-4xl">
              <div className="relative aspect-[2678/1642] w-full bg-[#f7f7fb]">
                <Image
                  src="/funnel-software/home-overview.png"
                  alt="SideKick operational overview screen"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 960px"
                  className="object-cover object-top"
                />
              </div>
            </BrowserFrame>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-[var(--public-muted-soft)]">
            See the actual SideKick workspace your campaigns run inside.
          </p>
        </Reveal>

        <Reveal delay={0.12} className="mt-6 sm:mt-8">
          <h1 className="font-heading text-balance text-[clamp(2.35rem,1.7rem+3.4vw,4.35rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-[var(--public-text)]">
            Launch Meta-style campaigns in{" "}
            <span className="bg-[linear-gradient(180deg,#6558f6,#8f7dff)] bg-clip-text text-transparent">
              3 simple steps.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="site-lead mx-auto mt-5 max-w-2xl">
            Pick your industry, choose a ready-to-go campaign template, and send new leads into your CRM/outreach flow — without building everything from scratch.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={FUNNEL_TRIAL_HREF} className="site-cta-primary w-full sm:w-auto">
              Start Your 14-Day Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={FUNNEL_TEMPLATES_HREF} className="site-cta-secondary w-full sm:w-auto">
              See Templates
            </Link>
          </div>
          <p className="mt-5 text-sm text-[var(--public-muted-soft)]">
            14-day trial • Cancel anytime • Built for small service businesses
          </p>
        </Reveal>
      </div>
    </section>
  );
}
