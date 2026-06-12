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

/*
 * Shared scroll-driven motion primitives for the marketing site.
 * Every effect degrades to a static render under prefers-reduced-motion.
 */

/**
 * Apple-style product reveal: the frame starts tilted back in 3D and settles
 * flat as it scrolls toward the center of the viewport.
 */
export function TiltFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 105%", "center 58%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.6 });
  const rotateX = useTransform(progress, [0, 1], [24, 0]);
  const scale = useTransform(progress, [0, 1], [0.94, 1]);
  const y = useTransform(progress, [0, 1], [28, 0]);

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("[perspective:1300px]", className)}>
      <motion.div style={{ rotateX, scale, y, transformStyle: "preserve-3d", willChange: "transform" }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Moves children vertically at a different rate than the scroll, creating
 * depth. `distance` is the total travel in px while the target crosses the
 * viewport; negative values drift upward.
 */
export function Parallax({
  children,
  distance = -40,
  className,
}: {
  children: React.ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-distance / 2, distance / 2]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduceMotion ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/**
 * Large statement that "fills in" word by word as the user scrolls through
 * the section, in the style of Apple's scroll-driven copy.
 */
export function ScrollFillText({
  text,
  accentWords = [],
  className,
}: {
  text: string;
  accentWords?: string[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 88%", "start 30%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.5 });
  const words = text.split(" ");

  return (
    <div ref={ref} className={className}>
      <p className="sr-only">{text}</p>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <FillWord
            key={`${word}-${index}`}
            word={word}
            index={index}
            total={words.length}
            progress={progress}
            accent={accentWords.includes(word.replace(/[.,]/g, ""))}
            instant={Boolean(reduceMotion)}
          />
        ))}
      </span>
    </div>
  );
}

function FillWord({
  word,
  index,
  total,
  progress,
  accent,
  instant,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  accent: boolean;
  instant: boolean;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);

  return (
    <motion.span
      style={instant ? undefined : { opacity }}
      className={cn("inline", accent && "text-[var(--public-accent)]")}
    >
      {word}
      {index < total - 1 ? " " : ""}
    </motion.span>
  );
}
