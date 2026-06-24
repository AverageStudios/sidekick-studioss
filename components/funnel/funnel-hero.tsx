import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Reveal } from "@/components/ui/reveal";
import { FUNNEL_TEMPLATES_HREF, FUNNEL_TRIAL_HREF } from "@/components/funnel/funnel-links";

export function FunnelHero() {
  return (
    <section className="relative overflow-hidden pt-10 sm:pt-16">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.14),transparent_62%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl px-5 text-center sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
            Built for small service businesses
          </p>
        </Reveal>

        {/* ===========================================================
            >>> VIDEO PLACEHOLDER <<<
            Swap the inner content of this card for your real VSL later:
              <iframe className="absolute inset-0 h-full w-full" src="https://www.youtube.com/embed/VIDEO_ID" ... />
              or <video className="absolute inset-0 h-full w-full object-cover" src="/walkthrough.mp4" poster="..." controls playsInline />
            =========================================================== */}
        <Reveal delay={0.08} className="mt-6">
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

        <Reveal delay={0.12} className="mt-4">
          <p className="text-sm text-[var(--public-muted-soft)]">
            Watch how SideKick helps small businesses launch lead campaigns without starting from scratch.
          </p>
        </Reveal>

        <Reveal delay={0.16} className="mt-8">
          <h1 className="site-h2 text-[clamp(2rem,1.4rem+3vw,3.1rem)]">
            Launch your next campaign without building everything from scratch.
          </h1>
        </Reveal>

        <Reveal delay={0.22}>
          <p className="site-lead mx-auto mt-4">
            SideKick helps small businesses choose an industry, pick a ready-to-go template, capture
            leads, and manage the launch from one clean system.
          </p>
        </Reveal>

        <Reveal delay={0.28}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={FUNNEL_TRIAL_HREF} className="site-cta-primary w-full sm:w-auto">
              Start Free Trial
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
