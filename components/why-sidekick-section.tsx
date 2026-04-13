"use client";

import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Metric = {
  value: number;
  suffix?: string;
  label: string;
  detail: string;
  uplift: string;
  featured?: boolean;
};

const metrics: Metric[] = [
  {
    value: 5,
    suffix: "x",
    label: "faster setup",
    detail: "Choose your industry, start from a template, and skip the usual blank-page setup drag.",
    uplift: "Launch faster",
  },
  {
    value: 3,
    suffix: "x",
    label: "higher-intent lead flow",
    detail: "Cleaner pages and built-in capture help turn interest into leads you can actually work.",
    uplift: "Better lead quality",
    featured: true,
  },
  {
    value: 18,
    suffix: "%",
    label: "lower CPM",
    detail: "A tighter system helps keep messaging cleaner from ad click through lead follow-up.",
    uplift: "Stronger reach",
  },
];

const revealUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

function CountUpNumber({
  value,
  suffix,
  active,
  duration = 900,
}: {
  value: number;
  suffix?: string;
  active: boolean;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    let start: number | null = null;

    const tick = (time: number) => {
      if (start === null) {
        start = time;
      }

      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [active, duration, value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

function MetricCard({
  metric,
  index,
}: {
  metric: Metric;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.55 });

  return (
    <motion.div
      ref={ref}
      custom={0.1 + index * 0.1}
      variants={revealUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      className={[
        "public-surface-card rounded-[30px] p-5 sm:p-6",
        metric.featured
          ? "border-[rgba(109,94,248,0.18)] bg-[linear-gradient(180deg,rgba(109,94,248,0.1),rgba(255,255,255,0.88))]"
          : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {metric.uplift}
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-600/20 bg-emerald-500/12 text-emerald-700">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-6xl font-semibold tracking-[-0.09em] text-[var(--public-text)] sm:text-7xl">
          <CountUpNumber value={metric.value} suffix={metric.suffix} active={inView} />
        </span>
      </div>

      <p className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
        {metric.label}
      </p>
      <p className="mt-2.5 max-w-[22rem] text-sm leading-7 public-text-muted">
        {metric.detail}
      </p>
    </motion.div>
  );
}

export function WhySidekickSection() {
  return (
    <section className="page-section marketing-section">
      <div className="public-section-shell relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,124,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(143,124,255,0.08),transparent_34%)]" />

        <div className="relative">
          <motion.div
            custom={0}
            variants={revealUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            className="max-w-3xl"
          >
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              Why SideKick
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl md:text-[2.8rem] md:leading-[1.04]">
              Less setup drag. Better momentum.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 public-text-muted sm:text-base">
              One clearer system to choose a template, launch, capture leads, and keep follow-up moving.
            </p>
          </motion.div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-5">
            {metrics.map((metric, index) => (
              <MetricCard key={metric.label} metric={metric} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
