import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const ways = [
  {
    title: "Done-For-You",
    copy: "We set it up, launch the campaign, and monitor the lead flow. You get visibility without the homework.",
    href: "/done-for-you",
    cta: "Apply for Done-For-You",
    featured: true,
  },
  {
    title: "Self-Serve",
    copy: "Use the platform yourself. Pick a template, connect your accounts, and launch your campaign.",
    href: "/pricing?startTrial=1",
    cta: "Start 14-day free trial",
    featured: false,
  },
];

export function HomeTwoWays() {
  return (
    <section className="site-container py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5646ec]">Two ways to use SideKick</p>
        <h2 className="site-h2 mt-3 text-[clamp(2rem,1.4rem+2.4vw,3rem)]">Choose the support level that fits.</h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
        {ways.map((way) => (
          <div
            key={way.title}
            className={`rounded-[24px] border bg-white p-7 shadow-[0_18px_48px_rgba(15,23,42,0.05)] ${
              way.featured ? "border-[rgba(86,70,236,0.24)]" : "border-[rgba(15,17,22,0.1)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#5646ec]" />
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">{way.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[rgba(15,17,22,0.66)]">{way.copy}</p>
              </div>
            </div>
            <Link
              href={way.href}
              className={way.featured ? "site-cta-primary mt-6 inline-flex" : "site-cta-secondary mt-6 inline-flex"}
            >
              {way.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
