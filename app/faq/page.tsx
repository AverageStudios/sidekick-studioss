import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { Button } from "@/components/ui/button";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";
import { publicFaqs } from "@/data/public-faqs";

export default function FaqPage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="page-section pt-34 sm:pt-40">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,124,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(143,124,255,0.08),transparent_34%)]" />
          <div className="relative max-w-3xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              FAQ
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl md:text-[4rem] md:leading-[0.98]">
              Clear answers about the SideKick platform
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 public-text-muted sm:text-base">
              What SideKick is, how it works, and what you can do inside it from templates to leads and follow-up.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
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
                <Link href="/product">See Product Overview</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="grid gap-4 lg:grid-cols-2">
          {publicFaqs.map((item, index) => (
            <InteractiveGlowCard
              key={item.question}
              className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">
                0{index + 1}
              </p>
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                {item.question}
              </h2>
              <p className="mt-3 text-sm leading-7 public-text-muted">{item.answer}</p>
            </InteractiveGlowCard>
          ))}
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,124,255,0.1),transparent_34%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                Ready to try it?
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
                Start with the full SideKick flow
              </h2>
              <p className="mt-4 text-sm leading-7 public-text-muted sm:text-base">
                Choose your industry, pick a template, and see how the platform handles launch, leads, and follow-up.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
            >
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
