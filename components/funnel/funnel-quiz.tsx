"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { SITE_EASE } from "@/components/ui/reveal";
import { FUNNEL_TEMPLATES_HREF, FUNNEL_TRIAL_HREF } from "@/components/funnel/funnel-links";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  prompt: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  {
    id: "industry",
    prompt: "What kind of business are you launching for?",
    options: ["Home services", "Beauty / wellness", "Automotive", "Local service business", "Other"],
  },
  {
    id: "goal",
    prompt: "What do you want more of?",
    options: ["More booked jobs", "More quote requests", "More leads from ads", "A cleaner campaign setup"],
  },
  {
    id: "blocker",
    prompt: "What's slowing you down most?",
    options: [
      "I don't know what campaign to run",
      "I don't have time to build pages/forms",
      "My tools are messy",
      "I want something simple I can launch fast",
    ],
  },
];

export function FunnelQuiz() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0); // 0..2 = questions, 3 = result
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const totalQuestions = QUESTIONS.length;
  const isResult = step >= totalQuestions;
  const progress = Math.min(step / totalQuestions, 1) * 100;

  function select(question: Question, value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    // Brief feedback, then advance — Perspective-style one-tap flow.
    window.setTimeout(() => setStep((s) => s + 1), 220);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.38, ease: SITE_EASE };

  return (
    <section className="px-5 sm:px-6">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[24px] border border-[rgba(15,17,22,0.1)] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,22,0.04),0_24px_56px_-24px_rgba(21,16,31,0.18)] sm:p-7">
          {/* Header: label + progress */}
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
              <Sparkles className="h-3.5 w-3.5" />
              Find your launch path
            </p>
            <span className="text-xs font-medium text-[var(--public-muted-soft)]">
              {isResult ? "Done" : `${step + 1} / ${totalQuestions}`}
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(15,17,22,0.08)]">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#6558f6,#8f7dff)]"
              initial={false}
              animate={{ width: `${isResult ? 100 : progress}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: SITE_EASE }}
            />
          </div>

          {/* Body */}
          <div className="relative mt-6 min-h-[19rem]">
            <AnimatePresence mode="wait" initial={false}>
              {!isResult ? (
                <motion.div
                  key={QUESTIONS[step].id}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
                  transition={transition}
                >
                  <h3 className="site-h3 text-[1.35rem]">{QUESTIONS[step].prompt}</h3>
                  <div className="mt-5 grid gap-3">
                    {QUESTIONS[step].options.map((option) => {
                      const selected = answers[QUESTIONS[step].id] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => select(QUESTIONS[step], option)}
                          aria-pressed={selected}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] font-semibold tracking-[-0.01em] transition",
                            "active:scale-[0.99]",
                            selected
                              ? "border-[var(--public-accent)] bg-[rgba(101,88,246,0.08)] text-[var(--public-text)] shadow-[0_0_0_1px_rgba(101,88,246,0.5)]"
                              : "border-[rgba(15,17,22,0.1)] bg-white text-[var(--public-text)] hover:border-[rgba(101,88,246,0.5)]",
                          )}
                        >
                          {option}
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-full transition",
                              selected ? "bg-[var(--public-accent)] text-white" : "border border-[rgba(15,17,22,0.18)] text-transparent",
                            )}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={back}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--public-muted-soft)] transition-colors hover:text-[var(--public-text)]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: SITE_EASE }}
                  className="flex flex-col items-center py-2 text-center"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[rgba(101,88,246,0.1)] text-[var(--public-accent)]">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                    Your best next step
                  </p>
                  <h3 className="site-h3 mt-2 text-[1.45rem]">
                    Start with a ready-to-go SideKick template.
                  </h3>
                  <p className="site-body mt-2 max-w-sm">
                    {answers.industry && answers.industry !== "Other"
                      ? `For ${answers.industry.toLowerCase()}, skip the blank page — pick a template, set your budget and area, and go live.`
                      : "Skip the blank page — pick a template, set your budget and area, and go live."}
                  </p>

                  <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link href={FUNNEL_TRIAL_HREF} className="site-cta-primary w-full sm:w-auto">
                      Start Your 14-Day Trial
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href={FUNNEL_TEMPLATES_HREF} className="site-cta-secondary w-full sm:w-auto">
                      Browse Templates
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={restart}
                    className="mt-5 text-sm font-medium text-[var(--public-muted-soft)] transition-colors hover:text-[var(--public-text)]"
                  >
                    Start over
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
