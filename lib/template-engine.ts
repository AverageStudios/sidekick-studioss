import { TemplateSeed, TemplateSetupAssetState, TemplateSetupValues } from "@/types";
import { slugify } from "@/lib/utils";
import { replacePlaceholdersInString } from "@/lib/template-placeholders";

function buildPlaceholderTokens(values: TemplateSetupValues) {
  return {
    businessName: values.businessName || "Your detailing shop",
    city: values.city || "your city",
    ctaText: values.ctaText || "",
    ...(values.placeholderValues || {}),
  };
}

function fillPlaceholders(input: string, values: TemplateSetupValues) {
  return replacePlaceholdersInString(input, buildPlaceholderTokens(values));
}

export function createCampaignBlueprint(
  template: TemplateSeed,
  values: TemplateSetupValues,
  assets: TemplateSetupAssetState,
) {
  const replace = (input: string) => fillPlaceholders(input, values);

  return {
    campaignName: `${values.businessName || "Detailing"} ${template.name}`,
    slug: slugify(`${values.businessName}-${template.slug}-${values.city}`),
    adCopy: {
      primary: replace(template.adCopy.primary),
      headlines: template.adCopy.headlines.map(replace),
      descriptions: template.adCopy.descriptions.map(replace),
      targeting: replace(template.adCopy.targeting),
      budget: replace(template.adCopy.budget),
      creativeGuidance: template.adCopy.creativeGuidance.map(replace),
      objective: template.adCopy.objective ? replace(template.adCopy.objective) : undefined,
    },
    funnelConfig: {
      headline: values.headline || replace(template.funnel.heroHeadline),
      subheadline:
        values.subheadline || replace(template.funnel.heroSubheadline),
      offerLabel: replace(template.funnel.offerLabel),
      ctaText: values.ctaText || replace(template.ctaDefault),
      benefits: template.benefits.map(replace),
      whyChooseUs: template.funnel.whyChooseUs.map(replace),
      finalCta: replace(template.funnel.finalCta),
      faq: template.faq.map((item) => ({
        question: replace(item.question),
        answer: replace(item.answer),
      })),
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
        adType: values.adType || "lead_form",
        campaignGoal: values.campaignGoal || "OUTCOME_LEADS",
        dailyBudget: values.dailyBudget || "",
        targetLocation: values.targetLocation || values.city,
        landingPageUrl: values.landingPageUrl || "",
        phoneNumber: values.phoneNumber || "",
        messengerWelcomeMessage: values.messengerWelcomeMessage || "",
        messengerReplyPrompt: values.messengerReplyPrompt || "",
        thankYouEnabled: values.thankYouEnabled ?? true,
        placeholderValues: values.placeholderValues || {},
      },
    },
  };
}
