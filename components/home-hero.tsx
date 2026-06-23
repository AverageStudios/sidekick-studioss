"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { SITE_EASE } from "@/components/ui/reveal";
import { TiltFrame, Parallax } from "@/components/ui/scroll-motion";
import { LaunchMockup } from "@/components/home-mockups";

const HEADLINE = ["Ready-to-launch campaigns", "for small businesses."];

function HeadlineLine({ line, lineIndex, instant }: { line: string; lineIndex: number; instant: boolean }) {
  const words = line.split(" ");

  return (
    <span className="block">
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`}>
          <span className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-top">
            <motion.span
              className="inline-block"
              initial={instant ? { opacity: 0 } : { y: "108%" }}
              animate={instant ? { opacity: 1 } : { y: 0 }}
              transition={{
                duration: instant ? 0.5 : 0.8,
                delay: 0.08 + (lineIndex * words.length + wordIndex) * 0.045,
                ease: SITE_EASE,
              }}
            >
              {word}
            </motion.span>
          </span>
          {wordIndex < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

function FloatingLeadCard() {
  return (
    <div className="w-[15rem] rounded-2xl border border-[rgba(15,17,22,0.08)] bg-white/95 p-3.5 shadow-[0_1px_2px_rgba(15,17,22,0.05),0_24px_48px_-12px_rgba(21,16,31,0.25)] backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)]">
          <BellRing className="h-3.5 w-3.5 text-[#5646ec]" />
        </span>
        <div>
          <p className="text-[12px] font-semibold text-[#0f1116]">New lead</p>
          <p className="text-[10px] text-[rgba(15,17,22,0.55)]">Spring Detail Special · just now</p>
        </div>
      </div>
      <p className="mt-2.5 rounded-lg bg-[rgba(15,17,22,0.035)] px-2.5 py-2 text-[11px] leading-snug text-[rgba(15,17,22,0.65)]">
        &ldquo;Could you fit me in this Saturday?&rdquo;
      </p>
    </div>
  );
}

function FloatingLivePill() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[rgba(15,17,22,0.08)] bg-white/95 py-2 pl-3 pr-4 shadow-[0_1px_2px_rgba(15,17,22,0.05),0_18px_40px_-12px_rgba(21,16,31,0.22)] backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[12px] font-semibold text-[#0f1116]">Campaign live on Meta</span>
    </div>
  );
}

export function HomeHero() {
  const reduceMotion = useReducedMotion();
  const copyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: copyRef,
    offset: ["start start", "end start"],
  });
  const copyOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -48]);

  const fadeUp = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: SITE_EASE },
  });

  return (
    <section className="relative overflow-hidden pb-16 pt-36 sm:pb-24 sm:pt-48">
      <div className="site-hero-grid absolute inset-x-0 top-0 h-[46rem]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[34rem] h-[36rem] w-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.14),transparent_62%)]"
        aria-hidden="true"
      />

      <div className="site-container relative">
        <motion.div
          ref={copyRef}
          style={reduceMotion ? undefined : { opacity: copyOpacity, y: copyY }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="site-h1">
            {HEADLINE.map((line, index) => (
              <HeadlineLine key={line} line={line} lineIndex={index} instant={Boolean(reduceMotion)} />
            ))}
          </h1>

          <motion.p {...fadeUp(0.5)} className="site-lead mx-auto mt-6 max-w-[36rem] text-balance">
            SideKick helps you launch Facebook and Instagram campaigns, capture leads, and keep follow-up organized from one simple workspace.
          </motion.p>

          <motion.div {...fadeUp(0.62)} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/pricing?startTrial=1" className="site-cta-primary">
              Start 14-day free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/product/templates" className="site-cta-secondary">
              View templates
            </Link>
          </motion.div>

          <motion.p {...fadeUp(0.72)} className="mt-5 text-sm text-[rgba(15,17,22,0.55)]">
            14-day free trial. Payment method required. Ad spend billed separately by Meta.
          </motion.p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 80 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: SITE_EASE }}
          className="relative mx-auto mt-16 max-w-4xl sm:mt-24"
        >
          <TiltFrame>
            <BrowserFrame className="shadow-[0_1px_2px_rgba(15,17,22,0.06),0_40px_90px_-20px_rgba(21,16,31,0.3)]">
              <LaunchMockup />
            </BrowserFrame>
          </TiltFrame>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3, ease: SITE_EASE }}
            className="pointer-events-none absolute -right-10 -top-8 z-10 hidden lg:block xl:-right-24"
            aria-hidden="true"
          >
            <Parallax distance={-70}>
              <FloatingLeadCard />
            </Parallax>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.45, ease: SITE_EASE }}
            className="pointer-events-none absolute -left-8 bottom-16 z-10 hidden lg:block xl:-left-20"
            aria-hidden="true"
          >
            <Parallax distance={-36}>
              <FloatingLivePill />
            </Parallax>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
