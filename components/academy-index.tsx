"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { academyArticlesBySection } from "@/data/academy";
import { Reveal } from "@/components/ui/reveal";

export function AcademyIndex() {
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return academyArticlesBySection;

    return academyArticlesBySection
      .map((section) => ({
        ...section,
        articles: section.articles.filter((article) => {
          const haystack = [article.title, article.summary, section.title].join(" ").toLowerCase();
          return haystack.includes(normalized);
        }),
      }))
      .filter((section) => section.articles.length > 0);
  }, [query]);

  return (
    <div>
      <div className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(15,17,22,0.45)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search guides"
          aria-label="Search the Academy"
          className="h-12 w-full rounded-[14px] border border-[rgba(15,17,22,0.12)] bg-white pl-11 pr-4 text-[15px] text-[var(--public-text)] shadow-[0_1px_2px_rgba(15,17,22,0.04)] outline-none transition placeholder:text-[rgba(15,17,22,0.45)] focus:border-[rgba(101,88,246,0.55)] focus:shadow-[0_0_0_3px_rgba(101,88,246,0.12)]"
        />
      </div>

      {filteredSections.length === 0 ? (
        <p className="mt-16 text-center text-[15px] text-[rgba(15,17,22,0.55)]">
          No guides match &ldquo;{query}&rdquo;. Try a different word, or browse the
          sections below by clearing the search.
        </p>
      ) : (
        <div className="mt-16 grid gap-x-16 gap-y-14 sm:grid-cols-2">
          {filteredSections.map((section, index) => (
            <Reveal key={section.key} delay={Math.min(index, 3) * 0.06} amount={0.15}>
              <section>
                <h2 className="font-heading text-lg font-semibold tracking-[-0.015em] text-[var(--public-text)]">
                  {section.title}
                </h2>
                <p className="site-body mt-1.5">{section.description}</p>
                <ul className="mt-5 divide-y divide-[rgba(15,17,22,0.06)] border-t border-[rgba(15,17,22,0.06)]">
                  {section.articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/academy/${article.slug}`}
                        className="group flex items-center justify-between gap-4 py-3"
                      >
                        <span className="text-[15px] font-medium text-[rgba(15,17,22,0.78)] transition-colors group-hover:text-[var(--public-accent)]">
                          {article.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-[13px] text-[rgba(15,17,22,0.45)]">
                          {article.readTime}
                          <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
