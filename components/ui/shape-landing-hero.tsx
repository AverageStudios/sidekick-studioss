"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-violet-500/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-[rgba(109,94,248,0.12)]",
            "shadow-[0_8px_32px_0_rgba(109,94,248,0.08)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(109,94,248,0.08),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function HeroGeometric({
  badge = "Templates, leads, and outreach in one place",
  title1 = "Choose your industry.",
  title2 = "Launch faster",
}: {
  badge?: string;
  title1?: string;
  title2?: string;
}) {
  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
      },
    }),
  };

  const title2Parts = title2.trim().split(/\s+/);
  const accentWord = title2Parts.pop() ?? "";
  const title2Lead = title2Parts.join(" ");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(101,88,246,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(101,88,246,0.04),transparent_28%)]" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-violet-500/[0.14]"
          className="left-[-10%] top-[15%] md:left-[-5%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-violet-500/[0.1]"
          className="right-[-5%] top-[70%] md:right-[0%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.09]"
          className="bottom-[5%] left-[5%] md:bottom-[10%] md:left-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-violet-400/[0.08]"
          className="right-[15%] top-[10%] md:right-[20%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-violet-300/[0.06]"
          className="left-[20%] top-[5%] md:left-[25%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 container mx-auto flex min-h-screen items-center px-4 pb-24 pt-34 sm:pb-28 sm:pt-40 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--public-line)] bg-white/78 px-4 py-1.5 shadow-[0_10px_28px_rgba(15,17,22,0.035)]"
          >
            <Sparkles className="h-4 w-4 text-[var(--public-accent)]" />
            <span className="text-sm font-medium tracking-wide text-[var(--public-muted)]">
              {badge}
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-6 text-balance text-5xl font-semibold tracking-[-0.065em] sm:text-6xl md:text-[5.4rem] md:leading-[0.96]"
          >
            <span className="text-[var(--public-text)]">
              {title1}
            </span>
            <br />
            <span className="text-[var(--public-text)]">
              {title2Lead ? `${title2Lead} ` : ""}
            </span>
            <span className="text-[var(--public-accent)]">
              {accentWord}
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto mb-10 max-w-[42rem] text-lg leading-relaxed text-[var(--public-muted)] md:text-[1.15rem]"
          >
            Pick a ready-to-go template, launch from one system, and manage leads
            and follow-up without stitching extra tools together.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-6 flex flex-col items-center justify-center gap-4 sm:mb-8 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.28)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
            >
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
            >
              <Link href="/product/templates">See Templates</Link>
            </Button>
          </motion.div>

        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(248,247,243,0.92)] via-transparent to-[rgba(248,247,243,0.5)]" />
    </div>
  );
}

export { HeroGeometric };
