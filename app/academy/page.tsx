import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, LifeBuoy } from "lucide-react";
import { AcademyArticleCard } from "@/components/academy-article-card";
import { AcademySidebar } from "@/components/academy-sidebar";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { Button } from "@/components/ui/button";
import { academyArticles, academyArticlesBySection } from "@/data/academy";

export const metadata: Metadata = {
  title: "Academy | SideKick Studioss",
  description:
    "Learn how to use SideKick with clear documentation for workspaces, templates, campaign launch, integrations, CRM handoff, performance, and support.",
};

export default function AcademyPage() {
  const featuredArticles = academyArticles.slice(0, 6);

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="page-section pt-34 sm:pt-40">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,124,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(143,124,255,0.08),transparent_34%)]" />
          <div className="relative max-w-4xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">Academy</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl md:text-[4rem] md:leading-[0.98]">
              The SideKick documentation center
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 public-text-muted sm:text-base">
              Learn how SideKick works from workspace setup to campaign launch, performance reporting, CRM handoff,
              and support. This Academy is built to answer the real questions users hit while running campaigns.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
              >
                <Link href={`/academy/${featuredArticles[0]?.slug || "sidekick-overview"}`}>
                  Start with the overview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
              >
                <Link href="/support/new">
                  Need support?
                  <LifeBuoy className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <AcademySidebar />
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Guided articles",
                  value: `${academyArticles.length}`,
                  body: "Practical docs covering the major product areas.",
                },
                {
                  label: "Core sections",
                  value: `${academyArticlesBySection.length}`,
                  body: "Structured to make browsing and future expansion easier.",
                },
                {
                  label: "Product focus",
                  value: "Campaigns",
                  body: "Docs are centered on launch, performance, and CRM handoff.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[26px] border border-[var(--public-line)] bg-white/80 px-5 py-5 shadow-[0_14px_36px_rgba(15,17,22,0.04)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 public-text-muted">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[30px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[0_18px_50px_rgba(15,17,22,0.06)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-accent-kicker">Featured</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)]">
                    Start with the areas most users need first
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--public-line)] bg-white/82 px-3.5 py-2 text-sm text-[var(--public-muted)]">
                  <BookOpenText className="h-4 w-4 text-[var(--public-accent)]" />
                  Public, shareable documentation
                </div>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {featuredArticles.map((article) => (
                  <AcademyArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {academyArticlesBySection.map((section) => (
                <div key={section.key} className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] p-6">
                  <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">{section.title}</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
                      {section.description}
                    </h2>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {section.articles.map((article) => (
                      <AcademyArticleCard key={article.slug} article={article} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
