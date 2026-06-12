"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

const hairline = "border-[rgba(15,17,22,0.08)]";
const mutedText = "text-[rgba(15,17,22,0.55)]";

function PickTemplateVignette() {
  return (
    <div aria-hidden="true" className="space-y-3">
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
      <div className="rounded-xl border border-[#6558f6] bg-white p-3.5 shadow-[0_0_0_3px_rgba(101,88,246,0.12)]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-[#0f1116]">Spring Detail Special</p>
          <span className="rounded-full bg-[rgba(101,88,246,0.1)] px-2 py-0.5 text-[9px] font-semibold text-[#5646ec]">
            Selected
          </span>
        </div>
        <p className={cn("mt-1 text-[11px]", mutedText)}>Ad copy, creative slots, and lead form included</p>
      </div>
      <div className={cn("rounded-xl border bg-white p-3.5 opacity-60", hairline)}>
        <p className="text-[13px] font-semibold text-[#0f1116]">Interior Cleanup Push</p>
        <p className={cn("mt-1 text-[11px]", mutedText)}>Seasonal offer · Lead form</p>
      </div>
    </div>
  );
}

function BudgetAreaVignette() {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className={cn("rounded-xl border bg-white p-4", hairline)}>
        <div className="flex items-baseline justify-between">
          <p className="text-[12px] font-semibold text-[#0f1116]">Daily budget</p>
          <p className="text-[14px] font-bold text-[#0f1116]">$25</p>
        </div>
        <div className="relative mt-3 h-1.5 rounded-full bg-[rgba(15,17,22,0.08)]">
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[#6558f6]" />
          <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#6558f6] bg-white" />
        </div>
      </div>
      <div className={cn("rounded-xl border bg-white p-4", hairline)}>
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[#0f1116]">Service area</p>
          <p className={cn("text-[11px] font-medium", mutedText)}>Mesa, AZ · 15 mi</p>
        </div>
        <div className="relative mt-3 h-[72px] overflow-hidden rounded-lg bg-[linear-gradient(rgba(15,17,22,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,17,22,0.05)_1px,transparent_1px),linear-gradient(180deg,#eef0f6,#f6f7fb)] bg-[size:20px_20px,20px_20px,100%_100%]">
          <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(101,88,246,0.35)] bg-[rgba(101,88,246,0.12)]" />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#5646ec] shadow" />
        </div>
      </div>
    </div>
  );
}

function GoLiveVignette() {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className={cn("flex items-center justify-between rounded-xl border bg-white px-4 py-3", hairline)}>
        <p className="text-[12px] font-semibold text-[#0f1116]">Spring Detail Special</p>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <div className={cn("rounded-xl border bg-white p-4", hairline)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)] text-[9px] font-bold text-[#5646ec]">
              AM
            </span>
            <p className="text-[12px] font-semibold text-[#0f1116]">Alex Morgan</p>
          </div>
          <span className="rounded-full bg-[rgba(101,88,246,0.1)] px-2 py-0.5 text-[9px] font-semibold text-[#5646ec]">
            New lead
          </span>
        </div>
        <p className={cn("mt-2 text-[11px]", mutedText)}>&ldquo;Could you fit me in this Saturday?&rdquo;</p>
      </div>
      <div className={cn("flex items-center justify-between rounded-xl border bg-white px-4 py-3 opacity-70", hairline)}>
        <p className="text-[12px] font-semibold text-[#0f1116]">Jordan Lee</p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">Contacted</span>
      </div>
    </div>
  );
}

const steps = [
  {
    number: "01",
    title: "Pick your template",
    description:
      "Choose your industry and start from a campaign written for it: ad copy, creative slots, targeting, and the lead form, all set.",
    vignette: PickTemplateVignette,
  },
  {
    number: "02",
    title: "Set budget and area",
    description:
      "Tell SideKick what you spend per day and how far you travel. It assembles the Meta campaign behind the scenes.",
    vignette: BudgetAreaVignette,
  },
  {
    number: "03",
    title: "Go live and get leads",
    description:
      "Publish to Facebook and Instagram. Leads arrive in SideKick the moment someone submits the form.",
    vignette: GoLiveVignette,
  },
];

function PinnedStep({
  step,
  index,
  progress,
}: {
  step: (typeof steps)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const count = steps.length;
  const start = index / count;
  const end = (index + 1) / count;
  const fade = 0.045;

  const domain = [start, start + fade, end - fade, end];
  const isFirst = index === 0;
  const isLast = index === count - 1;
  const opacity = useTransform(progress, domain, [isFirst ? 1 : 0, 1, 1, isLast ? 1 : 0]);
  const y = useTransform(progress, domain, [isFirst ? 0 : 28, 0, 0, isLast ? 0 : -22]);
  const Vignette = step.vignette;

  return (
    <motion.div
      style={{ opacity, y }}
      className={cn(
        "absolute inset-0 grid items-center gap-14 lg:grid-cols-[0.46fr_0.54fr]",
        !isFirst && "pointer-events-none",
      )}
    >
      <div>
        <p className="font-heading text-sm font-semibold tracking-[0.08em] text-[var(--public-accent)]">
          {step.number}
        </p>
        <h3 className="font-heading mt-4 text-4xl font-semibold leading-[1.06] tracking-[-0.028em] text-[var(--public-text)]">
          {step.title}
        </h3>
        <p className="site-lead mt-5 max-w-[40ch]">{step.description}</p>
      </div>
      <div className="mx-auto w-full max-w-md rounded-[20px] border border-[rgba(15,17,22,0.08)] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,22,0.04),0_30px_70px_-24px_rgba(21,16,31,0.25)]">
        <Vignette />
      </div>
    </motion.div>
  );
}

function PinnedSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={sectionRef} className="relative h-[320vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="site-container w-full">
          <div className="max-w-2xl">
            <h2 className="site-h2">From industry to live campaign</h2>
          </div>

          <div className="relative mt-12 h-[26rem]">
            {steps.map((step, index) => (
              <PinnedStep key={step.number} step={step} index={index} progress={progress} />
            ))}
          </div>

          <div className="mt-10 h-px w-full max-w-xs overflow-hidden rounded-full bg-[rgba(15,17,22,0.1)]">
            <motion.div
              style={{ scaleX: railScale }}
              className="h-full w-full origin-left bg-[var(--public-accent)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StackedSequence() {
  return (
    <div className="site-container py-20 sm:py-24">
      <Reveal className="max-w-2xl">
        <h2 className="site-h2">From industry to live campaign</h2>
      </Reveal>

      <div className="mt-12 space-y-14">
        {steps.map((step, index) => {
          const Vignette = step.vignette;

          return (
            <Reveal key={step.number} delay={index * 0.08}>
              <div className="grid gap-7 sm:grid-cols-[0.52fr_0.48fr] sm:items-center sm:gap-10">
                <div>
                  <p className="font-heading text-sm font-semibold tracking-[0.08em] text-[var(--public-accent)]">
                    {step.number}
                  </p>
                  <h3 className="site-h3 mt-3 text-2xl">{step.title}</h3>
                  <p className="site-body mt-3 max-w-[40ch]">{step.description}</p>
                </div>
                <div className="rounded-[18px] border border-[rgba(15,17,22,0.08)] bg-white p-4 shadow-[0_1px_2px_rgba(15,17,22,0.04),0_20px_48px_-20px_rgba(21,16,31,0.2)]">
                  <Vignette />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

export function HomeHowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works">
      {reduceMotion ? (
        <StackedSequence />
      ) : (
        <>
          <div className="hidden lg:block">
            <PinnedSequence />
          </div>
          <div className="lg:hidden">
            <StackedSequence />
          </div>
        </>
      )}
    </section>
  );
}
