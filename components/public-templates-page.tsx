"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { HomeFinalCta } from "@/components/home-final-cta";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { Reveal } from "@/components/ui/reveal";
import { resolveTemplateCtaLabel } from "@/data/template-taxonomy";
import { TemplateSeed } from "@/types";
import { cn } from "@/lib/utils";

// Friendly example values so marketing previews never show raw {{variables}} to
// visitors. Real values are filled in per workspace inside the launch flow.
const PREVIEW_PLACEHOLDER_EXAMPLES: Record<string, string> = {
  businessName: "Your Business",
  city: "your city",
  serviceName: "your service",
  offerName: "your offer",
  offerPrice: "$149",
  regularPrice: "$199",
  monthlyRate: "$49",
};

export function PublicTemplatesPage({ templates }: { templates: TemplateSeed[] }) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string>("All");

  const industries = useMemo(() => {
    const unique = [...new Set(templates.map((template) => template.industry).filter(Boolean))];
    return ["All", ...unique];
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return templates.filter((template) => {
      if (industry !== "All" && template.industry !== industry) return false;
      if (!normalized) return true;
      return [template.name, template.description, template.offerType, template.industry]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [templates, query, industry]);

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="site-container pb-24 pt-36 sm:pb-28 sm:pt-44" id="template-library">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="site-h2 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">
            Campaigns, already written for your industry
          </h1>
          <p className="site-lead mx-auto mt-5">
            Every template below is a complete Meta campaign: the ad you see is the
            ad that runs. Pick one, add your details, and launch.
          </p>
          <p className="mt-4 text-sm text-[rgba(15,17,22,0.55)]">
            Car detailing templates are available first. More small-business
            categories are being added.
          </p>
        </div>

        <div className={cn("mx-auto mt-12 max-w-xl", templates.length === 0 && "hidden")}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(15,17,22,0.45)]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates"
              aria-label="Search templates"
              className="h-12 w-full rounded-[14px] border border-[rgba(15,17,22,0.12)] bg-white pl-11 pr-4 text-[15px] text-[var(--public-text)] shadow-[0_1px_2px_rgba(15,17,22,0.04)] outline-none transition placeholder:text-[rgba(15,17,22,0.45)] focus:border-[rgba(101,88,246,0.55)] focus:shadow-[0_0_0_3px_rgba(101,88,246,0.12)]"
            />
          </div>
        </div>

        {industries.length > 2 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {industries.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setIndustry(value)}
                aria-pressed={industry === value}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
                  industry === value
                    ? "bg-[#0f1116] text-white"
                    : "border border-[rgba(15,17,22,0.12)] bg-white text-[rgba(15,17,22,0.6)] hover:text-[var(--public-text)]",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        ) : null}

        {templates.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md text-center">
            <p className="text-[16px] font-semibold text-[var(--public-text)]">
              The library lives inside SideKick
            </p>
            <p className="site-body mt-2">
              Start the trial to browse every template for your industry and
              preview the exact ad each one runs.
            </p>
            <Link href="/signup" className="site-cta-primary mt-6">
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : visibleTemplates.length === 0 ? (
          <p className="mt-20 text-center text-[15px] text-[rgba(15,17,22,0.55)]">
            No templates match that search. Clear it to browse the full library.
          </p>
        ) : (
          <div className="mx-auto mt-14 grid max-w-5xl gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTemplates.map((template, index) => (
              <Reveal key={template.slug} delay={Math.min(index % 3, 2) * 0.08} amount={0.15}>
                <div className="group flex h-full flex-col">
                  <div className="overflow-hidden rounded-[18px] border border-[rgba(15,17,22,0.1)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition-shadow duration-300 group-hover:shadow-[0_20px_48px_-16px_rgba(21,16,31,0.2)]">
                    <FacebookAdPreview
                      template={template}
                      placeholderValues={PREVIEW_PLACEHOLDER_EXAMPLES}
                      primaryText={template.adCopy.primary}
                      headline={template.adCopy.headlines[0] || template.name}
                      description={template.adCopy.descriptions[0] || template.positioning}
                      ctaLabel={resolveTemplateCtaLabel(template, "Learn more")}
                      imageUrl={template.previewImage}
                      compact
                      showMetaBar={false}
                      interactiveControls={false}
                      className="rounded-none"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-1 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-[var(--public-text)]">
                        {template.name}
                      </h2>
                      {template.industry ? (
                        <span className="mt-0.5 shrink-0 text-[12px] font-medium text-[rgba(15,17,22,0.5)]">
                          {template.industry}
                        </span>
                      ) : null}
                    </div>
                    <p className="site-body mt-2 line-clamp-2">{template.description}</p>
                    <Link
                      href="/signup"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--public-accent)] transition-colors hover:text-[var(--public-accent-strong)]"
                    >
                      Launch with this template
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <HomeFinalCta
        title="Your template is in there."
        subtitle="Start the trial, open the library, and launch the campaign that fits your business."
      />

      <PublicSiteFooter />
    </main>
  );
}
