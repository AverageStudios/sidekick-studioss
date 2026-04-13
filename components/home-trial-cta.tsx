"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const timelineSteps = [
  {
    label: "Today",
    title: "Choose your industry",
    description: "Get access instantly, explore templates, and see how the system fits your business.",
  },
  {
    label: "Mid-trial",
    title: "Run the full flow",
    description: "Test launch, lead management, and follow-up from the same SideKick workspace.",
  },
  {
    label: "Day 14",
    title: "Decide with clarity",
    description: "Keep your setup if it fits, or cancel anytime before billing.",
  },
];

export function HomeTrialCta() {
  return (
    <section className="page-section marketing-section pt-0">
      <motion.div
        className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(101,88,246,0.1),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(101,88,246,0.05),transparent_28%)]" />

        <div className="relative">
          <motion.div
            className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"
            variants={itemVariants}
          >
            <div className="max-w-2xl">
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                Free trial
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl md:text-[2.9rem] md:leading-[1.02]">
                Become a marketing expert for free.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 public-text-muted sm:text-base">
                Learn how to choose a template, launch faster, manage leads, and keep outreach moving during your 14-day trial.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.28)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
              >
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="mt-8 rounded-[30px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,245,255,0.84))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.98)] sm:mt-10 sm:p-6"
            variants={itemVariants}
          >
            <div className="flex flex-col gap-3 border-b border-[var(--public-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--public-text)]">
                  Your 14-day trial, made simple
                </p>
                <p className="mt-1 text-sm public-text-soft">
                  Enough time to learn the full SideKick flow before you decide.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-[var(--public-line)] bg-white/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                14 days
              </span>
            </div>

            <div className="relative mt-6 grid gap-4 lg:grid-cols-3">
              <div className="pointer-events-none absolute left-[calc(16.666%-0.25rem)] right-[calc(16.666%-0.25rem)] top-5 hidden h-px bg-[linear-gradient(90deg,rgba(101,88,246,0.06),rgba(101,88,246,0.18),rgba(101,88,246,0.06))] lg:block" />
              {timelineSteps.map((step, index) => (
                <motion.div
                  key={step.label}
                  variants={itemVariants}
                  className="relative rounded-[24px] border border-[var(--public-line)] bg-white/84 px-5 py-5 shadow-[0_12px_28px_rgba(15,17,22,0.035)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(101,88,246,0.16)] bg-[rgba(101,88,246,0.08)] text-sm font-semibold text-[var(--public-accent)]">
                      0{index + 1}
                    </span>
                    <span className="rounded-full border border-[var(--public-line)] bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--public-muted)]">
                      {step.label}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-[var(--public-text)]">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-7 public-text-muted">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
