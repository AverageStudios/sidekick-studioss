import { Reveal } from "@/components/ui/reveal";
import { AnimatedStatCard, type AnimatedStatCardProps } from "@/components/funnel/animated-stat-card";

const STATS: AnimatedStatCardProps[] = [
  {
    value: 10,
    prefix: "$",
    suffix: "/day",
    label: "A small daily ad budget can start putting your offer in front of local people.",
    eyebrow: "Example starter budget",
  },
  {
    value: "300–1,000+",
    label: "Estimated daily impressions at common local CPM ranges.",
    eyebrow: "Example reach math",
  },
  {
    value: 7,
    suffix: "days",
    label: "Test an offer for a week without committing to a huge campaign.",
    eyebrow: "Fast local test",
  },
  {
    value: 3,
    suffix: "steps",
    label: "Choose your industry, pick a campaign template, launch your offer.",
    eyebrow: "SideKick launch flow",
  },
  {
    value: "Same-day",
    label: "Move from offer idea to campaign-ready faster than building manually.",
    eyebrow: "Launch speed",
  },
  {
    value: "CRM-ready",
    label: "Capture lead info and route it into your CRM/outreach flow.",
    eyebrow: "Lead handoff",
  },
];

export function FunnelStats() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="site-h2">See what $10/day can actually do.</h2>
          <p className="site-lead mx-auto mt-4">
            Meta ads can put your offer in front of local buyers fast. SideKick helps you launch the campaign, capture the lead, and move it into your follow-up system.
          </p>
        </Reveal>

        <Reveal delay={0.04} className="mx-auto mt-6 max-w-3xl text-center sm:mt-7">
          <p className="text-sm leading-6 text-[var(--public-muted)] sm:text-[15px]">
            Most businesses do not lose because their service is bad. They lose because the offer never gets launched, the local reach stays too small, or the lead has nowhere clear to go next.
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

        <Reveal delay={0.08} className="mx-auto mt-10 max-w-2xl text-center sm:mt-12">
          <div className="overflow-hidden rounded-[24px] border border-[rgba(15,17,22,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,246,255,0.92))] px-5 py-6 text-left shadow-[0_20px_48px_-28px_rgba(21,16,31,0.2)] sm:px-7 sm:py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
              Example $10/day test
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-[rgba(15,17,22,0.08)] bg-white px-4 py-3">
                <p className="font-heading text-[1.25rem] font-semibold tracking-[-0.03em] text-[var(--public-text)]">$10/day × 7 days</p>
                <p className="mt-1 text-sm text-[var(--public-muted)]">$70 test budget</p>
              </div>
              <div className="rounded-[18px] border border-[rgba(15,17,22,0.08)] bg-white px-4 py-3">
                <p className="font-heading text-[1.25rem] font-semibold tracking-[-0.03em] text-[var(--public-text)]">2,800–7,000</p>
                <p className="mt-1 text-sm text-[var(--public-muted)]">rough estimated impressions at a $10–$25 CPM</p>
              </div>
              <div className="rounded-[18px] border border-[rgba(15,17,22,0.08)] bg-white px-4 py-3">
                <p className="font-heading text-[1.25rem] font-semibold tracking-[-0.03em] text-[var(--public-text)]">28–210</p>
                <p className="mt-1 text-sm text-[var(--public-muted)]">estimated visits if 1%–3% click</p>
              </div>
              <div className="rounded-[18px] border border-[rgba(15,17,22,0.08)] bg-white px-4 py-3">
                <p className="font-heading text-[1.25rem] font-semibold tracking-[-0.03em] text-[var(--public-text)]">Lead-ready</p>
                <p className="mt-1 text-sm text-[var(--public-muted)]">SideKick gives those visits a focused place to become leads</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--public-muted-soft)]">
              Example estimates only. Actual reach, clicks, and leads depend on market, audience, offer, creative, budget, competition, and Meta delivery.
            </p>
          </div>
          <p className="mt-6 font-heading text-[1.12rem] font-semibold leading-snug tracking-[-0.02em] text-[var(--public-text)] sm:text-[1.28rem]">
            A campaign that launches faster gives every dollar a better chance to become attention, clicks, and real opportunities.
          </p>
          <p className="mt-4 text-xs leading-5 text-[var(--public-muted-soft)] sm:text-[13px]">
            Example budget math is directional only and not guaranteed SideKick results.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
