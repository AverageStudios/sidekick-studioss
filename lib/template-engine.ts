import { TemplateSeed, TemplateSetupAssetState, TemplateSetupValues } from "@/types";
import { slugify } from "@/lib/utils";

function buildPlaceholderTokens(values: TemplateSetupValues) {
  const placeholderValues = values.placeholderValues || {};
  const offerPrice = placeholderValues.offerPrice || placeholderValues.monthlyRate || values.offerPrice || "";
  const regularPrice = placeholderValues.regularPrice || values.regularPrice || "";
  const savings =
    placeholderValues.savings ||
    (offerPrice && regularPrice && !Number.isNaN(Number(regularPrice)) && !Number.isNaN(Number(offerPrice))
      ? String(Number(regularPrice) - Number(offerPrice))
      : "");

  return {
    businessName: values.businessName || "Your detailing shop",
    city: values.city || "your city",
    offerPrice,
    price: offerPrice,
    regularPrice,
    normalPrice: placeholderValues.normalPrice || regularPrice,
    savings,
    monthlyRate: placeholderValues.monthlyRate || offerPrice,
    joinFee: placeholderValues.joinFee || regularPrice,
    yearlySavings: placeholderValues.yearlySavings || "",
    ctaText: values.ctaText || "",
    ...placeholderValues,
  };
}

function fillPlaceholders(input: string, values: TemplateSetupValues) {
  const tokens = buildPlaceholderTokens(values);

  return input.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = tokens[key as keyof typeof tokens];
    return typeof value === "string" ? value : "";
  });
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
      thankYouPage: {
        headline: values.thankYouHeadline || "Thanks, we got your request.",
        description: values.thankYouDescription || "We'll follow up shortly with the next step.",
        buttonLabel: values.thankYouButtonText || "Back to site",
        destinationUrl: values.destinationUrl || "",
      },
      launchSettings: {
        campaignGoal: values.campaignGoal || "OUTCOME_LEADS",
        dailyBudget: values.dailyBudget || "",
        targetLocation: values.targetLocation || values.city,
        placeholderValues: values.placeholderValues || {},
      },
    },
  };
}
