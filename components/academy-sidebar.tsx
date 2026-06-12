"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { academyArticlesBySection } from "@/data/academy";
import { cn } from "@/lib/utils";

export function AcademySidebar({ currentSlug }: { currentSlug?: string }) {
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
    <aside aria-label="Academy guides">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(15,17,22,0.45)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search guides"
          className="h-10 w-full rounded-[10px] border border-[rgba(15,17,22,0.12)] bg-white pl-9 pr-3 text-sm text-[var(--public-text)] outline-none transition placeholder:text-[rgba(15,17,22,0.45)] focus:border-[rgba(101,88,246,0.55)] focus:shadow-[0_0_0_3px_rgba(101,88,246,0.1)]"
        />
      </div>

      <div className="mt-6 max-h-[calc(100vh-13rem)] space-y-7 overflow-y-auto pb-4 pr-2">
        {filteredSections.map((section) => (
          <div key={section.key}>
            <p className="text-[13px] font-semibold text-[var(--public-text)]">{section.title}</p>
            <ul className="mt-2 space-y-0.5">
              {section.articles.map((article) => {
                const isActive = currentSlug === article.slug;

                return (
                  <li key={article.slug}>
                    <Link
                      href={`/academy/${article.slug}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 text-[13px] leading-snug transition-colors",
                        isActive
                          ? "bg-[rgba(101,88,246,0.09)] font-semibold text-[var(--public-accent-strong)]"
                          : "text-[rgba(15,17,22,0.6)] hover:bg-[rgba(15,17,22,0.04)] hover:text-[var(--public-text)]",
                      )}
                    >
                      {article.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
