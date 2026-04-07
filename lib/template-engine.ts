import { TemplateSeed, TemplateSetupAssetState, TemplateSetupValues } from "@/types";
import { slugify } from "@/lib/utils";

function fillPlaceholders(input: string, values: TemplateSetupValues) {
  return input
    .replaceAll("{{businessName}}", values.businessName || "Your detailing shop")
    .replaceAll("{{city}}", values.city || "your city");
}

export function createCampaignBlueprint(
  template: TemplateSeed,
  values: TemplateSetupValues,
  assets: TemplateSetupAssetState,
) {
  return {
    campaignName: `${values.businessName || "Detailing"} ${template.name}`,
    slug: slugify(`${values.businessName}-${template.slug}-${values.city}`),
    adCopy: {
      primary: fillPlaceholders(template.adCopy.primary, values),
      headlines: template.adCopy.headlines.map((item) => fillPlaceholders(item, values)),
      descriptions: template.adCopy.descriptions.map((item) => fillPlaceholders(item, values)),
      targeting: fillPlaceholders(template.adCopy.targeting, values),
      budget: fillPlaceholders(template.adCopy.budget, values),
      creativeGuidance: template.adCopy.creativeGuidance,
    },
    funnelConfig: {
      headline: values.headline || fillPlaceholders(template.funnel.heroHeadline, values),
      subheadline:
        values.subheadline || fillPlaceholders(template.funnel.heroSubheadline, values),
      offerLabel: template.funnel.offerLabel,
      ctaText: values.ctaText || template.ctaDefault,
      benefits: template.benefits,
      whyChooseUs: template.funnel.whyChooseUs,
      finalCta: fillPlaceholders(template.funnel.finalCta, values),
      faq: template.faq,
      testimonialText:
        values.testimonialText || "Easy process, fast response, and the kind of finish people notice.",
      beforeImageUrls: assets.beforeImageUrls || [],
      afterImageUrls: assets.afterImageUrls || [],
      logoUrl: assets.logoUrl || null,
      businessDescription: values.businessDescription,
      brandColor: values.brandColor || "#6D5EF8",
      city: values.city,
      businessName: values.businessName,
      phone: values.phone,
      email: values.email,
      offerPrice: values.offerPrice,
      regularPrice: values.regularPrice,
      followUpEnabled: values.followUpEnabled,
    },
  };
}

