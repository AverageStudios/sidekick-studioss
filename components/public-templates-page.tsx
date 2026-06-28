import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { HomeFinalCta } from "@/components/home-final-cta";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { Reveal } from "@/components/ui/reveal";
import { resolveTemplateCtaLabel } from "@/data/template-taxonomy";
import { TemplateSeed } from "@/types";

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

// The public site showcases a few templates rather than the full catalog.
const FEATURED_TEMPLATE_COUNT = 3;

export function PublicTemplatesPage({ templates }: { templates: TemplateSeed[] }) {
  const featuredTemplates = templates.slice(0, FEATURED_TEMPLATE_COUNT);

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="site-container pb-24 pt-36 sm:pb-28 sm:pt-44" id="template-library">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="site-h2 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">
            Campaigns, already written for your industry
          </h1>
          <p className="site-lead mx-auto mt-5">
            A few of the ready-to-launch campaigns small businesses start from. The
            ad you see is the ad that runs - the full library lives inside SideKick.
          </p>
          <p className="mt-4 text-sm text-[rgba(15,17,22,0.55)]">
            Car detailing templates are available first. More small-business
            categories are being added.
          </p>
          <div className="mt-6">
            <Link
              href="/industries/car-detailing"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,17,22,0.08)] bg-white px-4 py-2 text-sm font-medium text-[var(--public-text)] shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition hover:border-[rgba(15,17,22,0.14)] hover:text-[var(--public-accent)]"
            >
              See the car detailing funnel
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {featuredTemplates.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md text-center">
            <p className="text-[16px] font-semibold text-[var(--public-text)]">
              The library lives inside SideKick
            </p>
            <p className="site-body mt-2">
              Start free to browse every template for your industry and
              preview the exact ad each one runs.
            </p>
            <Link href="/signup?next=%2Ftemplates" className="site-cta-primary mt-6">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-14 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
              Featured templates
            </p>
            <div className="mx-auto mt-8 grid max-w-5xl gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTemplates.map((template, index) => (
                <Reveal key={template.slug} delay={Math.min(index, 2) * 0.08} amount={0.15}>
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
                        href="/pricing"
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

            <div className="mt-14 text-center">
              <Link href="/pricing" className="site-cta-secondary">
                See the full library inside SideKick
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </section>

      <HomeFinalCta
        title="Your template is in there."
        subtitle="Start free, open the library, and build the campaign that fits your business."
      />

      <PublicSiteFooter />
    </main>
  );
}
