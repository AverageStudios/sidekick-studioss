"use client";

import { ScrollFillText } from "@/components/ui/scroll-motion";

export function HomeStatement() {
  return (
    <section className="site-container py-24 sm:py-36">
      <ScrollFillText
        text="Most ad tools hand you four hundred settings. SideKick hands you a finished campaign."
        accentWords={["finished", "campaign"]}
        className="mx-auto max-w-4xl text-center font-heading text-[clamp(1.9rem,1.2rem+3vw,3.4rem)] font-semibold leading-[1.16] tracking-[-0.026em] text-[var(--public-text)]"
      />
    </section>
  );
}
