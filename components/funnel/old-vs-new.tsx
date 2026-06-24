import { Check, X } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const OLD_WAY = [
  "Start with a blank page",
  "Build your own funnel",
  "Connect random tools",
  "Guess what offer to run",
  "Lose momentum before launching",
];

const SIDEKICK_WAY = [
  "Choose your industry",
  "Pick a proven campaign structure",
  "Customize the offer",
  "Launch faster",
  "Capture leads in one cleaner system",
];

export function OldVsNew() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="site-h2">The old way vs. the SideKick way.</h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:mt-14 lg:grid-cols-2">
          {/* Old way */}
          <Reveal>
            <div className="h-full rounded-[24px] border border-[rgba(15,17,22,0.1)] bg-[rgba(15,17,22,0.02)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--public-muted-soft)]">
                The old way
              </p>
              <ul className="mt-5 space-y-3">
                {OLD_WAY.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[rgba(15,17,22,0.05)] text-[rgba(15,17,22,0.45)]">
                      <X className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="text-[15px] font-medium text-[var(--public-muted)] line-through decoration-[rgba(15,17,22,0.2)]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* SideKick way */}
          <Reveal delay={0.1}>
            <div className="relative h-full overflow-hidden rounded-[24px] border border-[rgba(101,88,246,0.28)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,255,0.92))] p-6 shadow-[0_24px_60px_-30px_rgba(101,88,246,0.4)] sm:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[rgba(101,88,246,0.12)] blur-2xl"
              />
              <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
                The SideKick way
              </p>
              <ul className="relative mt-5 space-y-3">
                {SIDEKICK_WAY.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--public-accent)] text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] font-semibold text-[var(--public-text)]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Microcopy leading into the final CTA */}
        <Reveal delay={0.05} className="mx-auto mt-12 max-w-2xl text-center sm:mt-14">
          <p className="font-heading text-[1.25rem] font-semibold leading-snug tracking-[-0.02em] text-[var(--public-text)] sm:text-[1.45rem]">
            Most businesses don&rsquo;t lose because they&rsquo;re bad at what they do. They lose
            because they move too slowly.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
