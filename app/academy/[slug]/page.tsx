import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, Clock3, LifeBuoy } from "lucide-react";
import { notFound } from "next/navigation";
import { AcademyArticleCard } from "@/components/academy-article-card";
import { AcademySidebar } from "@/components/academy-sidebar";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { Button } from "@/components/ui/button";
import { academyArticles, getAcademyArticle, getAcademyRelatedArticles } from "@/data/academy";

export function generateStaticParams() {
  return academyArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getAcademyArticle(slug);

  if (!article) {
    return {
      title: "Academy | SideKick Studioss",
    };
  }

  return {
    title: `${article.title} | SideKick Academy`,
    description: article.description,
  };
}

export default async function AcademyArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getAcademyArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getAcademyRelatedArticles(article);

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="page-section pt-34 sm:pt-40">
        <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <AcademySidebar currentSlug={article.slug} />
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_18px_50px_rgba(15,17,22,0.06)] sm:p-8">
              <Link
                href="/academy"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--public-muted)] transition hover:text-[var(--public-text)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Academy
              </Link>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[var(--public-line)] bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] public-accent-kicker">
                  {article.updatedLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--public-line)] bg-white/82 px-3 py-1 text-sm text-[var(--public-muted)]">
                  <Clock3 className="h-4 w-4 text-[var(--public-accent)]" />
                  {article.readTime}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl sm:leading-[1.02]">
                {article.title}
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 public-text-muted sm:text-base">
                {article.description}
              </p>
            </div>

            <article className="rounded-[32px] border border-[var(--public-line)] bg-[var(--public-surface)] p-6 sm:p-8">
              <div className="space-y-10">
                {article.blocks.map((block) => (
                  <section key={block.heading}>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">{block.heading}</h2>
                    <div className="mt-4 space-y-4">
                      {block.body.map((paragraph) => (
                        <p key={paragraph} className="text-sm leading-7 public-text-muted sm:text-base">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {block.bullets?.length ? (
                      <ul className="mt-5 space-y-3">
                        {block.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-sm leading-7 public-text-muted sm:text-base">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--public-accent)]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {block.steps?.length ? (
                      <ol className="mt-5 space-y-3">
                        {block.steps.map((step, index) => (
                          <li key={step} className="flex gap-4 rounded-[22px] border border-[var(--public-line)] bg-white/78 px-4 py-4">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(109,94,248,0.1)] text-sm font-semibold text-[var(--public-accent)]">
                              {index + 1}
                            </span>
                            <span className="text-sm leading-7 public-text-muted sm:text-base">{step}</span>
                          </li>
                        ))}
                      </ol>
                    ) : null}

                    {block.note ? (
                      <div className="mt-5 rounded-[24px] border border-[rgba(109,94,248,0.16)] bg-[rgba(109,94,248,0.07)] px-5 py-4">
                        <p className="text-sm leading-7 text-[rgba(61,48,138,0.92)]">{block.note}</p>
                      </div>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-[var(--public-line)] bg-white/80 p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--public-line)] bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] public-text-faint">
                  <BookOpenText className="h-3.5 w-3.5 text-[var(--public-accent)]" />
                  Keep learning
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">Browse the rest of the Academy</h2>
                <p className="mt-3 text-sm leading-7 public-text-muted">
                  Use the sidebar to jump between launch, integrations, CRM handoff, performance, and support articles.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-5 border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
                >
                  <Link href="/academy">Open Academy home</Link>
                </Button>
              </div>
              <div className="rounded-[28px] border border-[var(--public-line)] bg-white/80 p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--public-line)] bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] public-text-faint">
                  <LifeBuoy className="h-3.5 w-3.5 text-[var(--public-accent)]" />
                  Need help?
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">Still stuck after reading?</h2>
                <p className="mt-3 text-sm leading-7 public-text-muted">
                  Open a ticket from inside SideKick or email support if you need help with a launch, connection, or delivery issue.
                </p>
                <Button
                  asChild
                  className="mt-5 rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
                >
                  <Link href="/support/new">
                    Open support
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>

            {relatedArticles.length ? (
              <section className="rounded-[32px] border border-[var(--public-line)] bg-[var(--public-surface)] p-6 sm:p-8">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">Related articles</h2>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {relatedArticles.map((related) => (
                    <AcademyArticleCard key={related.slug} article={related} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
