import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Reveal } from "@/components/ui/reveal";
import { AnimatedNumber } from "@/components/funnel/animated-number";
import { FUNNEL_TEMPLATES_HREF, FUNNEL_TRIAL_HREF } from "@/components/funnel/funnel-links";

export function FunnelHero() {
  return (
    <section className="relative overflow-hidden pt-8 sm:pt-14">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[54rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.16),transparent_62%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
        {/* Pill */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(101,88,246,0.22)] bg-[rgba(101,88,246,0.07)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--public-accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--public-accent)]" />
            Built for small businesses launching campaigns
          </span>
        </Reveal>

        {/* Headline with the one big number above the fold */}
        <Reveal delay={0.06} className="mt-6 sm:mt-7">
          <h1 className="font-heading">
            <span className="block text-[clamp(1.35rem,1rem+2.2vw,2rem)] font-semibold tracking-[-0.02em] text-[var(--public-text)]">
              Launch your next campaign in
            </span>
            <span className="mt-1 flex items-baseline justify-center gap-2 sm:gap-3">
              <AnimatedNumber
                to={3}
                className="bg-[linear-gradient(180deg,#6558f6,#8f7dff)] bg-clip-text text-[clamp(5rem,2.8rem+18vw,9.5rem)] font-semibold leading-[0.85] tracking-[-0.05em] text-transparent"
              />
              <span className="text-[clamp(2.1rem,1.4rem+5vw,4.25rem)] font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                steps
              </span>
            </span>
          </h1>
        </Reveal>

        {/* Supporting micro-line */}
        <Reveal delay={0.12} className="mt-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[var(--public-muted-soft)]">
            Choose. Template. Launch.
          </p>
        </Reveal>

        {/* ===========================================================
            >>> VIDEO PLACEHOLDER <<<  (sits under the number, doesn't bury it)
            Swap the inner content of this card for your real VSL later:
              <iframe className="absolute inset-0 h-full w-full" src="https://www.youtube.com/embed/VIDEO_ID" ... />
              or <video className="absolute inset-0 h-full w-full object-cover" src="/walkthrough.mp4" poster="..." controls playsInline />
            =========================================================== */}
        <Reveal delay={0.18} className="mt-8 sm:mt-10">
          <BrowserFrame url="sidekickstudioss.com" className="mx-auto max-w-xl">
            <div className="relative aspect-video w-full">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#241a3d_0%,#37265c_55%,#5646ec_135%)]" />
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.16),transparent_60%)]"
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <button
                  type="button"
                  aria-label="Play the SideKick walkthrough"
                  className="group grid h-16 w-16 place-items-center rounded-full bg-white/95 text-[#1f1337] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] transition hover:scale-105 active:scale-95"
                >
                  <Play className="ml-0.5 h-6 w-6 fill-current" />
                </button>
                <p className="text-sm font-semibold text-white/90">2-minute SideKick walkthrough</p>
              </div>
            </div>
          </BrowserFrame>
        </Reveal>

        {/* Subheadline */}
        <Reveal delay={0.24}>
          <p className="site-lead mx-auto mt-6">
            SideKick helps small businesses turn an offer into a live campaign faster — with
            templates, lead capture, and one cleaner system.
          </p>
        </Reveal>

        {/* CTAs + trust */}
        <Reveal delay={0.3}>
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
