"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AdPreviewCard } from "@/components/home-mockups";
import { Reveal, SITE_EASE } from "@/components/ui/reveal";

const annotations = [
  {
    number: 1,
    title: "Copy written for your industry",
    detail: "Primary text that has already sold this service. No blank text box.",
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
  "Objective, placements, and service-area targeting are set behind the scenes",
  "You edit your offer, photos, and area; nothing else needs configuring",
  "Every template is built and reviewed by the SideKick team before it ships",
];

export function HomeWhyTemplates() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="overflow-x-clip border-y border-[rgba(15,17,22,0.07)] bg-[rgba(255,255,255,0.55)]">
      <div className="site-container grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div>
          <Reveal>
            <h2 className="site-h2">Why templates beat a blank Ads Manager</h2>
            <p className="site-lead mt-4">
              Most local campaigns die in setup: the wrong objective, vague copy, an
              audience that&rsquo;s too broad. A SideKick template starts from a campaign
              that already worked for a business like yours, and leaves you only the
              decisions no one else can make.
            </p>
          </Reveal>

          <ul className="mt-8 space-y-4">
            {proofPoints.map((point, index) => (
              <Reveal key={point} delay={0.1 + index * 0.1}>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)]">
                    <Check className="h-3 w-3 text-[#5646ec]" strokeWidth={3} />
                  </span>
                  <span className="site-body max-w-[52ch] text-[rgba(15,17,22,0.78)]">{point}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,22rem)_1fr] sm:gap-0">
          <Reveal className="relative mx-auto w-full max-w-[22rem]" amount={0.4}>
            <div
              className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.1),transparent_68%)]"
              aria-hidden="true"
            />
            <div className="relative">
              <AdPreviewCard className="shadow-[0_1px_2px_rgba(15,17,22,0.05),0_24px_56px_-16px_rgba(21,16,31,0.2)]" />
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
          </Reveal>

          <div className="flex flex-col justify-center gap-6 sm:pl-10">
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
      </div>
    </section>
  );
}
