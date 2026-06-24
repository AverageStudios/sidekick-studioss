"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { SITE_EASE } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export type AnimatedStatCardProps = {
  /** Number => counts up from 0 on scroll. String => shown as-is (no count-up). */
  value: number | string;
  /** Unit shown next to a numeric value, e.g. "steps", "days", "%". */
  suffix?: string;
  /** Supporting line under the number. */
  label: string;
  /** Optional small source/disclaimer line (e.g. for benchmark stats). */
  source?: string;
  /** Quieter styling for secondary/benchmark cards. */
  muted?: boolean;
  delay?: number;
};

export function AnimatedStatCard({
  value,
  suffix,
  label,
  source,
  muted = false,
  delay = 0,
}: AnimatedStatCardProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  const isNumber = typeof value === "number";
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isNumber || !inView) return;
    const target = value as number;
    // Reduced motion (or a zero target) jumps straight to the value via a
    // zero-duration tween — keeps all state updates inside the async callback.
    const controls = animate(0, target, {
      duration: reduceMotion || target === 0 ? 0 : 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, isNumber, value, reduceMotion]);

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: SITE_EASE }}
      className={cn(
        "group relative h-full overflow-hidden rounded-[24px] border bg-white p-6 shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition duration-300 sm:p-7",
        "hover:-translate-y-1 hover:shadow-[0_28px_64px_-26px_rgba(21,16,31,0.24)]",
        muted ? "border-[rgba(15,17,22,0.08)]" : "border-[rgba(15,17,22,0.1)]",
      )}
    >
      {/* Subtle violet glow */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full blur-2xl transition-opacity duration-500",
          muted ? "bg-[rgba(101,88,246,0.05)]" : "bg-[rgba(101,88,246,0.10)]",
          "opacity-80 group-hover:opacity-100",
        )}
      />

      <div className="relative">
        {isNumber ? (
          <p className="font-heading leading-none">
            <span
              className={cn(
                "align-baseline text-[clamp(2.75rem,2rem+3vw,3.85rem)] font-semibold tracking-[-0.03em]",
                muted ? "text-[var(--public-text)]" : "text-[var(--public-text)]",
              )}
            >
              {display}
            </span>
            {suffix ? (
              <span className="ml-1.5 align-baseline text-[1.35rem] font-semibold tracking-[-0.01em] text-[var(--public-accent)]">
                {suffix}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="font-heading text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[var(--public-text)]">
            {value}
          </p>
        )}

        <p className="mt-3 text-[15px] leading-relaxed text-[var(--public-muted)]">{label}</p>

        {source ? (
          <p className="mt-3 text-[11px] leading-snug text-[var(--public-muted-soft)]">{source}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
