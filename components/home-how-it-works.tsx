"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, SITE_EASE } from "@/components/ui/reveal";

const hairline = "border-[rgba(15,17,22,0.08)]";
const mutedText = "text-[rgba(15,17,22,0.55)]";

function PickTemplateVignette() {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      <div className="flex gap-1.5">
        {["Auto detailing", "Cleaning", "Beauty"].map((chip, index) => (
          <span
            key={chip}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-semibold",
              index === 0
                ? "bg-[#0f1116] text-white"
                : cn("border bg-white text-[rgba(15,17,22,0.55)]", hairline),
            )}
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-[#6558f6] bg-white p-3 shadow-[0_0_0_3px_rgba(101,88,246,0.12)]">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[#0f1116]">Spring Detail Special</p>
          <span className="rounded-full bg-[rgba(101,88,246,0.1)] px-2 py-0.5 text-[9px] font-semibold text-[#5646ec]">
            Selected
          </span>
        </div>
        <p className={cn("mt-1 text-[10px]", mutedText)}>Ad copy, creative slots, and lead form included</p>
      </div>
    </div>
  );
}

function BudgetAreaVignette() {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      <div className={cn("rounded-xl border bg-white p-3", hairline)}>
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold text-[#0f1116]">Daily budget</p>
          <p className="text-[13px] font-bold text-[#0f1116]">$25</p>
        </div>
        <div className="relative mt-2.5 h-1.5 rounded-full bg-[rgba(15,17,22,0.08)]">
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[#6558f6]" />
          <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#6558f6] bg-white" />
        </div>
      </div>
      <div className={cn("flex items-center justify-between rounded-xl border bg-white px-3 py-2.5", hairline)}>
        <p className="text-[11px] font-semibold text-[#0f1116]">Service area</p>
        <p className={cn("text-[10px] font-medium", mutedText)}>Mesa, AZ · 15 mi</p>
      </div>
    </div>
  );
}

function GoLiveVignette() {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      <div className={cn("flex items-center justify-between rounded-xl border bg-white px-3 py-2.5", hairline)}>
        <p className="text-[11px] font-semibold text-[#0f1116]">Spring Detail Special</p>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <div className={cn("rounded-xl border bg-white p-3", hairline)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)] text-[9px] font-bold text-[#5646ec]">
              AM
            </span>
            <p className="text-[11px] font-semibold text-[#0f1116]">Alex Morgan</p>
          </div>
          <span className="rounded-full bg-[rgba(101,88,246,0.1)] px-2 py-0.5 text-[9px] font-semibold text-[#5646ec]">
            New lead
          </span>
        </div>
        <p className={cn("mt-1.5 text-[10px]", mutedText)}>&ldquo;Could you fit me in this Saturday?&rdquo;</p>
      </div>
    </div>
  );
}

const steps = [
  {
    number: "1",
    title: "Pick your template",
    description:
      "Choose your industry and start from a campaign written for it: ad copy, creative slots, targeting, and the lead form, all set.",
    vignette: PickTemplateVignette,
  },
  {
    number: "2",
    title: "Set budget and area",
    description:
      "Tell SideKick what you spend per day and how far you travel. It assembles the Meta campaign behind the scenes.",
    vignette: BudgetAreaVignette,
  },
  {
    number: "3",
    title: "Go live and get leads",
    description:
      "Publish to Facebook and Instagram. Leads arrive in SideKick the moment someone submits the form.",
    vignette: GoLiveVignette,
  },
];

export function HomeHowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="site-container pb-24 pt-20 sm:pb-32 sm:pt-24" id="how-it-works">
      <Reveal className="max-w-2xl">
        <h2 className="site-h2">From industry to live campaign in three steps</h2>
        <p className="site-lead mt-4">
          No objectives to decode, no pixel setup, no ad account archaeology. The
          template carries the campaign; you supply the details only you know.
        </p>
      </Reveal>

      <div className="relative mt-12 sm:mt-16">
        <div className="absolute left-4 top-4 hidden h-px right-4 lg:block" aria-hidden="true">
          <motion.div
            className="h-px origin-left bg-[rgba(15,17,22,0.14)]"
            initial={reduceMotion ? { opacity: 0 } : { scaleX: 0 }}
            whileInView={reduceMotion ? { opacity: 1 } : { scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, ease: SITE_EASE }}
          />
        </div>

        <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
          {steps.map((step, index) => {
            const Vignette = step.vignette;

            return (
              <Reveal key={step.number} delay={index * 0.14} className="relative">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(15,17,22,0.14)] bg-white font-heading text-sm font-semibold text-[#0f1116] shadow-[0_1px_2px_rgba(15,17,22,0.06)]">
                  {step.number}
                </div>
                <div className="mt-6 rounded-2xl border border-[rgba(15,17,22,0.08)] bg-[#fdfcfe] p-4 shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
                  <Vignette />
                </div>
                <h3 className="site-h3 mt-6">{step.title}</h3>
                <p className="site-body mt-2.5 max-w-[34ch]">{step.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
