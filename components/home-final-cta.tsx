"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function HomeFinalCta({
  title = "Get more booked details from one campaign system.",
  subtitle = "Apply for Done-For-You and we can help set up the workflow, or start Self-Serve if you want to run it yourself.",
  secondaryLabel = "See pricing",
  secondaryHref = "/pricing",
}: {
  title?: string;
  subtitle?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="site-container py-24 sm:py-32">
      <Reveal amount={0.35}>
        <div className="site-sheen relative overflow-hidden rounded-[24px] bg-[var(--site-ink-panel)] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[-14rem] h-[26rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.32),transparent_64%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-heading text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.028em] text-white sm:text-5xl">
              {title}
            </h2>
            <p className="mx-auto mt-5 max-w-[44ch] text-balance text-[1.0625rem] leading-relaxed text-white/70">
              {subtitle}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/done-for-you" className="site-cta-on-dark">
                Apply for Done-For-You
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={secondaryHref} className="site-cta-ghost-on-dark">
                {secondaryLabel}
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/45">
              Done for you or self-serve. Ad spend is paid separately to Meta.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
