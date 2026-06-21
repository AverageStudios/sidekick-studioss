"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AdPreviewCard } from "@/components/home-mockups";
import { Parallax } from "@/components/ui/scroll-motion";
import { Reveal, SITE_EASE } from "@/components/ui/reveal";

const annotations = [
  {
    number: 1,
    title: "Copy written for your industry",
    detail: "Primary text written around real small-business offers. No blank text box.",
    position: "top-[27%]",
  },
  {
    number: 2,
    title: "Creative slot for your photos",
    detail: "Use your own work, or launch with the template layout as-is.",
    position: "top-[55%]",
  },
  {
    number: 3,
    title: "Lead form preconfigured",
    detail: "Name, phone, and service interest, synced straight into SideKick.",
    position: "top-[88%]",
  },
];

const proofPoints = [
  "Objective, placements, and targeting set behind the scenes",
  "You edit your offer, photos, and area; nothing else",
  "Every template reviewed by the SideKick team before it ships",
];

export function HomeWhyTemplates() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="overflow-x-clip">
      <div className="site-container py-24 sm:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="site-h2">Why templates beat a blank Ads Manager</h2>
          <p className="site-lead mx-auto mt-5">
            Most local campaigns die in setup: the wrong objective, vague copy, an
            audience that&rsquo;s too broad. A SideKick template starts from a campaign
            that already worked for a business like yours.
          </p>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-3xl gap-8 sm:mt-20 sm:grid-cols-[minmax(0,22rem)_1fr] sm:gap-0">
          <Reveal className="relative mx-auto w-full max-w-[22rem]" amount={0.4}>
            <div
              className="pointer-events-none absolute -inset-10 rounded-[32px] bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.12),transparent_66%)]"
              aria-hidden="true"
            />
            <Parallax distance={-32}>
              <div className="relative">
                <AdPreviewCard className="shadow-[0_1px_2px_rgba(15,17,22,0.05),0_32px_72px_-20px_rgba(21,16,31,0.28)]" />
                {annotations.map((annotation, index) => (
                  <motion.span
                    key={annotation.number}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                    whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.9 }}
                    transition={{ duration: 0.45, delay: 0.4 + index * 0.18, ease: SITE_EASE }}
                    className={`absolute -right-3 ${annotation.position} z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#5646ec] text-[11px] font-bold text-white shadow-[0_0_0_4px_rgba(101,88,246,0.18)]`}
                    aria-hidden="true"
                  >
                    {annotation.number}
                  </motion.span>
                ))}
              </div>
            </Parallax>
          </Reveal>

          <div className="flex flex-col justify-center gap-7 sm:pl-14">
            {annotations.map((annotation, index) => (
              <Reveal key={annotation.number} delay={0.45 + index * 0.18} amount={0.5}>
                <div className="flex items-start gap-3 sm:block">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[rgba(101,88,246,0.35)] bg-white text-[11px] font-bold text-[#5646ec] sm:mb-2">
                    {annotation.number}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold leading-snug text-[var(--public-text)]">
                      {annotation.title}
                    </p>
                    <p className="site-body mt-1 max-w-[30ch]">{annotation.detail}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 border-t border-[rgba(15,17,22,0.08)] pt-10 sm:mt-20 sm:grid-cols-3 sm:gap-10">
          {proofPoints.map((point, index) => (
            <Reveal key={point} delay={index * 0.1}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)]">
                  <Check className="h-3 w-3 text-[#5646ec]" strokeWidth={3} />
                </span>
                <p className="site-body text-[rgba(15,17,22,0.78)]">{point}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
