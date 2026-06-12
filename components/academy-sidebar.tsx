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
    <aside className="rounded-[28px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.8)] p-4 shadow-[0_18px_50px_rgba(15,17,22,0.06)] backdrop-blur-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--public-muted-soft)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the Academy"
          className="w-full rounded-[18px] border border-[var(--public-line)] bg-white/86 py-2.5 pl-9 pr-3 text-sm text-[var(--public-text)] outline-none transition focus:border-[rgba(143,124,255,0.5)]"
        />
      </div>

      <div className="mt-4 max-h-[calc(100vh-14rem)] space-y-4 overflow-y-auto pr-1">
        {filteredSections.map((section) => (
          <div key={section.key} className="rounded-[22px] border border-[var(--public-line)] bg-white/70 p-3.5">
            <div className="px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">{section.title}</p>
              <p className="mt-1 text-xs leading-5 public-text-soft">{section.description}</p>
            </div>
            <div className="mt-3 space-y-1.5">
              {section.articles.map((article) => {
                const isActive = currentSlug === article.slug;

                return (
                  <Link
                    key={article.slug}
                    href={`/academy/${article.slug}`}
                    className={cn(
                      "block rounded-[18px] px-3 py-2.5 text-sm transition",
                      isActive
                        ? "bg-[rgba(109,94,248,0.1)] text-[var(--public-text)] shadow-[inset_0_0_0_1px_rgba(109,94,248,0.18)]"
                        : "text-[var(--public-muted)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]",
                    )}
                  >
                    {article.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
