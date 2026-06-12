"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { SITE_EASE } from "@/components/ui/reveal";
import { LaunchMockup } from "@/components/home-mockups";

const HEADLINE = ["Your next Meta campaign", "is already built."];

function HeadlineLine({ line, lineIndex, instant }: { line: string; lineIndex: number; instant: boolean }) {
  const words = line.split(" ");

  return (
    <span className="block">
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-top">
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
          {wordIndex < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

export function HomeHero() {
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  });
  const frameY = useTransform(scrollYProgress, [0, 1], [36, -36]);

  const fadeUp = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: SITE_EASE },
  });

  return (
    <section className="relative overflow-hidden pb-10 pt-36 sm:pb-14 sm:pt-44">
      <div className="site-hero-grid absolute inset-x-0 top-0 h-[46rem]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[30rem] h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(101,88,246,0.13),transparent_62%)]"
        aria-hidden="true"
      />

      <div className="site-container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="site-h1">
            {HEADLINE.map((line, index) => (
              <HeadlineLine key={line} line={line} lineIndex={index} instant={Boolean(reduceMotion)} />
            ))}
          </h1>

          <motion.p {...fadeUp(0.5)} className="site-lead mx-auto mt-6 max-w-[36rem] text-balance">
            SideKick turns proven campaign templates into live Facebook and Instagram
            ads for your local business. Pick one, set your budget and area, and
            watch leads land in one place.
          </motion.p>

          <motion.div {...fadeUp(0.62)} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="site-cta-primary">
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/product/templates" className="site-cta-secondary">
              Browse templates
            </Link>
          </motion.div>

          <motion.p {...fadeUp(0.72)} className="mt-5 text-sm text-[rgba(15,17,22,0.55)]">
            14-day free trial. Cancel anytime before billing.
          </motion.p>
        </div>

        <motion.div
          ref={frameRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 64, scale: 0.97, filter: "blur(6px)" }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.55, ease: SITE_EASE }}
          className="relative mx-auto mt-14 max-w-4xl sm:mt-20"
        >
          <motion.div style={reduceMotion ? undefined : { y: frameY }}>
            <BrowserFrame>
              <LaunchMockup />
            </BrowserFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
