import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { FUNNEL_TEMPLATES_HREF, FUNNEL_TRIAL_HREF } from "@/components/funnel/funnel-links";

export function FunnelCTA({
  title = "Stop rebuilding every campaign from scratch.",
  subtitle = "Choose a template, launch faster, and start capturing leads with SideKick.",
  trust = "14-day trial • No long-term contract • Built for small businesses",
}: {
  title?: string;
  subtitle?: string;
  trust?: string;
}) {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <Reveal amount={0.35} className="mx-auto max-w-4xl">
        <div className="site-sheen relative overflow-hidden rounded-[24px] bg-[var(--site-ink-panel)] px-6 py-14 text-center sm:px-12 sm:py-18">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[-14rem] h-[26rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.32),transparent_64%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-heading text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.028em] text-white sm:text-[2.6rem]">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-[44ch] text-balance text-[1.0625rem] leading-relaxed text-white/70">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={FUNNEL_TRIAL_HREF} className="site-cta-on-dark w-full sm:w-auto">
                Start Your 14-Day Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={FUNNEL_TEMPLATES_HREF} className="site-cta-ghost-on-dark w-full sm:w-auto">
                See Templates
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/45">{trust}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
