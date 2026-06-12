import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AcademyArticle } from "@/data/academy";

export function AcademyArticleCard({ article }: { article: AcademyArticle }) {
  return (
    <Link
      href={`/academy/${article.slug}`}
      className="group block rounded-[28px] border border-[var(--public-line)] bg-[var(--public-surface)] p-6 transition hover:border-[rgba(109,94,248,0.18)] hover:shadow-[0_16px_48px_rgba(15,17,22,0.06)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-accent-kicker">{article.readTime}</p>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">{article.title}</h3>
      <p className="mt-3 text-sm leading-7 public-text-muted">{article.summary}</p>
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[var(--public-accent)]">
        Read article
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
