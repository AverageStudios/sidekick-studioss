import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";
import { Button } from "@/components/ui/button";
import { publicProductItems } from "@/data/public-product-pages";

export default function ProductPage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="page-section pt-34 sm:pt-40">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,124,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(143,124,255,0.08),transparent_32%)]" />
          <div className="relative max-w-3xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              Product
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl md:text-[4.2rem] md:leading-[0.98]">
              One platform to choose, launch, and manage leads
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 public-text-muted sm:text-base">
              SideKick helps small businesses choose their industry, pick a ready-to-go template, launch faster, and keep lead management and follow-up in one place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.28)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
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
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-8 sm:pt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicProductItems.map((item) => {
            const Icon = item.icon;

            return (
              <InteractiveGlowCard
                key={item.slug}
                className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] p-5 sm:p-6"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 public-text-muted">{item.description}</p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-6 w-full border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
                >
                  <Link href={item.href}>
                    View page
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </InteractiveGlowCard>
            );
          })}
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
