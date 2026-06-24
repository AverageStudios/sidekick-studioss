import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { Reveal } from "@/components/ui/reveal";
import { FUNNEL_TEMPLATES_HREF } from "@/components/funnel/funnel-links";
import { resolveTemplateCtaLabel } from "@/data/template-taxonomy";
import { listPublishedTemplates } from "@/lib/template-repository";
import { TemplateSeed } from "@/types";

const PREVIEW_PLACEHOLDER_EXAMPLES: Record<string, string> = {
  businessName: "Your Business",
  city: "your city",
  serviceName: "your service",
  offerName: "your offer",
  offerPrice: "$149",
  regularPrice: "$199",
  monthlyRate: "$49",
};

const FEATURED_TEMPLATE_SLUGS = [
  "premium-exterior-detailing",
  "clean-cabin-reset",
  "defend-your-shine",
] as const;

export async function TemplatePreviewGrid() {
  const publishedTemplates = await listPublishedTemplates();
  const featuredTemplates = FEATURED_TEMPLATE_SLUGS.map((slug) =>
    publishedTemplates.find((template) => template.slug === slug),
  ).filter((template): template is TemplateSeed => Boolean(template));

  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="site-h2">Start from templates built for real small-business offers.</h2>
          <p className="site-body mx-auto mt-4 max-w-xl">
            These previews use the same compact Facebook-style card layout SideKick shows inside the app, so what you see here feels much closer to the real template experience.
          </p>
        </Reveal>

        <div className="mt-12 grid justify-center gap-6 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
          {featuredTemplates.map((template, index) => (
            <Reveal key={template.slug} delay={Math.min(index, 2) * 0.08} amount={0.15}>
              <div className="group mx-auto flex max-w-[22rem] flex-col overflow-hidden rounded-[30px] border border-[rgba(15,17,22,0.09)] bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-24px_rgba(21,16,31,0.28)]">
                <div className="relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)]" />
                  <div className="origin-center transition duration-500 group-hover:scale-[1.025] group-hover:-translate-y-0.5 motion-reduce:transform-none">
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
                      className="border-0 shadow-none"
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-[var(--line)] bg-[var(--soft-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                      {template.offerType || "Offer type"}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[rgba(15,17,22,0.45)]">
                      {template.industry}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">
                      {template.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">{template.category}</p>
                  </div>

                  <p className="line-clamp-2 flex-1 text-sm leading-6 text-[var(--muted)]">
                    {template.description}
                  </p>

                  <Link
                    href={FUNNEL_TEMPLATES_HREF}
                    className="mt-1 inline-flex w-full items-center justify-between rounded-[18px] border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[rgba(109,94,248,0.25)] hover:text-[var(--public-accent-strong)]"
                  >
                    Preview template
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
