import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { AcademySidebar } from "@/components/academy-sidebar";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import {
  academyArticles,
  academySections,
  getAcademyArticle,
  getAcademyRelatedArticles,
} from "@/data/academy";

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
  const sectionTitle = academySections.find((section) => section.key === article.section)?.title;

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <div className="site-container grid gap-12 pb-24 pt-32 sm:pt-36 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
        <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <AcademySidebar currentSlug={article.slug} />
        </div>

        <div className="min-w-0 max-w-[44rem]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[rgba(15,17,22,0.5)]">
            <Link href="/academy" className="font-medium transition-colors hover:text-[var(--public-text)]">
              Academy
            </Link>
            {sectionTitle ? (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-[rgba(15,17,22,0.65)]">{sectionTitle}</span>
              </>
            ) : null}
          </nav>

          <h1 className="font-heading mt-5 text-[clamp(1.9rem,1.4rem+2vw,2.8rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--public-text)] [text-wrap:balance]">
            {article.title}
          </h1>
          <p className="site-lead mt-4">{article.description}</p>
          <p className="mt-4 text-[13px] text-[rgba(15,17,22,0.5)]">
            {article.updatedLabel} · {article.readTime}
          </p>

          <article className="mt-12 space-y-12 border-t border-[rgba(15,17,22,0.08)] pt-10">
            {article.blocks.map((block) => (
              <section key={block.heading}>
                <h2 className="font-heading text-xl font-semibold tracking-[-0.018em] text-[var(--public-text)]">
                  {block.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {block.body.map((paragraph) => (
                    <p key={paragraph} className="text-[15px] leading-[1.75] text-[rgba(15,17,22,0.72)]">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {block.bullets?.length ? (
                  <ul className="mt-5 space-y-2.5">
                    {block.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 text-[15px] leading-[1.7] text-[rgba(15,17,22,0.72)]">
                        <span className="mt-[0.65rem] h-1 w-1 shrink-0 rounded-full bg-[rgba(15,17,22,0.4)]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {block.steps?.length ? (
                  <ol className="mt-5 space-y-3.5">
                    {block.steps.map((step, index) => (
                      <li key={step} className="flex gap-3.5 text-[15px] leading-[1.7] text-[rgba(15,17,22,0.72)]">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(101,88,246,0.1)] text-[12px] font-semibold text-[var(--public-accent-strong)]">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}

                {block.note ? (
                  <div className="mt-5 rounded-xl bg-[rgba(101,88,246,0.06)] px-4 py-3.5">
                    <p className="text-sm leading-[1.7] text-[rgba(61,48,138,0.95)]">
                      <span className="font-semibold">Note: </span>
                      {block.note}
                    </p>
                  </div>
                ) : null}
              </section>
            ))}
          </article>

          <div className="mt-14 border-t border-[rgba(15,17,22,0.08)] pt-8">
            <p className="text-sm text-[rgba(15,17,22,0.55)]">
              Still stuck after reading?{" "}
              <Link
                href="/support/new"
                className="font-semibold text-[var(--public-accent)] transition-colors hover:text-[var(--public-accent-strong)]"
              >
                Open a support ticket
              </Link>{" "}
              and the team will pick it up.
            </p>
          </div>

          {relatedArticles.length ? (
            <section className="mt-12">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.015em] text-[var(--public-text)]">
                Related guides
              </h2>
              <ul className="mt-4 divide-y divide-[rgba(15,17,22,0.06)] border-t border-[rgba(15,17,22,0.06)]">
                {relatedArticles.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/academy/${related.slug}`}
                      className="group flex items-center justify-between gap-4 py-3.5"
                    >
                      <span>
                        <span className="block text-[15px] font-medium text-[rgba(15,17,22,0.82)] transition-colors group-hover:text-[var(--public-accent)]">
                          {related.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-[rgba(15,17,22,0.5)]">
                          {related.summary}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] text-[rgba(15,17,22,0.45)]">{related.readTime}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <PublicSiteFooter />
    </main>
  );
}
