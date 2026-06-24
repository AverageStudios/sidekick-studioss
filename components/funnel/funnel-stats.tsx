import { Reveal } from "@/components/ui/reveal";
import { AnimatedStatCard, type AnimatedStatCardProps } from "@/components/funnel/animated-stat-card";

// Truthful, benchmark-style numbers. The first five describe how the product
// actually works (no results/ROI claims). The last is an attributed industry
// benchmark used only to reinforce why fast, mobile-first funnels matter.
const STATS: AnimatedStatCardProps[] = [
  { value: 3, suffix: "steps", label: "Choose your industry, pick a template, launch your campaign." },
  { value: 0, suffix: "blank pages", label: "Start from ready-to-go templates instead of building from scratch." },
  { value: 1, suffix: "workspace", label: "Campaigns, lead capture, and launch tools in one cleaner system." },
  { value: 14, suffix: "days", label: "Start with a free trial before committing." },
  { value: "Minutes, not weeks", label: "Move from idea to live campaign faster." },
  {
    value: 53,
    suffix: "%",
    label: "of mobile visits are abandoned when pages take longer than 3 seconds to load.",
    source: "Source: Google mobile page speed research.",
    muted: true,
  },
];

export function FunnelStats() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
            Small changes. Big difference.
          </p>
          <h2 className="site-h2 mt-3">Your next campaign should not take weeks to launch.</h2>
          <p className="site-lead mx-auto mt-4">
            SideKick gives small businesses a faster path from offer to live campaign — without
            starting from a blank page.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((stat, index) => (
            <AnimatedStatCard
              key={typeof stat.value === "string" ? stat.value : `${stat.value}-${stat.suffix}`}
              {...stat}
              delay={Math.min(index % 3, 2) * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
