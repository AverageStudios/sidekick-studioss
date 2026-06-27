"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

// Lightweight count-up for a single number (e.g. the hero "3"). Animates on
// mount — the hero number is above the fold, so it's visible immediately.
// Respects prefers-reduced-motion (jumps straight to the value).
export function AnimatedNumber({
  to,
  duration = 1.3,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, to, {
      duration: reduceMotion ? 0 : duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [to, duration, reduceMotion]);

  return (
    <span className={className}>
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
