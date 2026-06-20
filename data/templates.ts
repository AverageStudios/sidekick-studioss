import { TemplateIndustry, TemplateOfferType, TemplateRecord, TemplateSeed } from "@/types";
import {
  formatTemplateCtaLabel,
  normalizeIndustryLabel,
  normalizeOfferTypeLabel,
  normalizeTemplateCtaType,
  resolveTemplateLaunchCategory,
} from "@/data/template-taxonomy";
import { extractTemplatePlaceholderFields } from "@/lib/template-placeholders";

const liveTemplateDisplayNameOverrides: Record<string, string> = {
  "premium-exterior-detailing": "Premium Exterior Detail",
  "minimal-exterior-detailing": "Quick Exterior Detail",
  "winter-detailing-special": "Winter Detail Special",
  "winter-ready-detailing": "Winter-Ready Detail",
};

// Dev fallback only. The real source of truth for customer-facing template browsing
// should be the Supabase `templates` table.
export const templateFallbackCatalog: TemplateSeed[] = [
  {
    id: "tpl-full-detail",
    slug: "full-detail-promo",
    name: "Full Detail Promo",
    description: "A fast-launch offer for drivers who want the full interior and exterior reset.",
    category: "Full Details",
    industry: "Car Detailing",
    offerType: "Service Booking",
    supportedAdTypes: ["lead_form", "landing_page", "call_now", "messenger_leads", "messenger_engagement"],
    defaultAdType: "lead_form",
    positioning: "Best for shops pushing a flagship full detail with a clean entry offer.",
    previewImage: "/placeholders/full-detail.jpg",
    ctaDefault: "Claim My Detail",
    offerStructure: [
      "Lead with the main service angle",
      "Anchor the offer with price or value",
      "Move into a simple mobile lead form",
    ],
    benefits: [
      "Simple offer positioning that works for paid traffic",
      "High-trust before and after story",
      "Quick form that is easy to complete on mobile",
    ],
    faq: [
      {
        question: "What does a full detail include?",
        answer: "Interior reset, exterior wash, wheels, trim care, and a polished presentation depending on your package.",
      },
      {
        question: "How long does it take?",
        answer: "Most full details take half a day to a full day depending on vehicle size and condition.",
      },
    ],
    adCopy: {
      primary:
        "Need your car looking sharp again in {{city}}? {{businessName}} is running a limited full detail offer for drivers who want a full reset without the usual back-and-forth.",
      headlines: [
        "Book a full detail in {{city}}",
        "Get your car fully reset",
        "Limited full detail offer",
      ],
      descriptions: [
        "Built for busy drivers who want a simple before-and-after result.",
        "Fast quote. Clean finish. Easy booking.",
      ],
      targeting:
        "Target local drivers within 10-20 miles, recent car buyers, busy professionals, and luxury vehicle owners.",
      budget: "Start with $20-$35/day for 5 days and move budget toward the best performing audience.",
      creativeGuidance: [
        "Lead with a clean hood reflection or interior refresh shot",
        "Use one strong before-and-after pair",
        "Keep text minimal and offer-focused",
      ],
    },
    funnel: {
      heroHeadline: "Full detail offers made simple for drivers in {{city}}",
      heroSubheadline:
        "A clean, polished detail package from {{businessName}} with fast lead capture and easy follow-up.",
      offerLabel: "Limited full detail offer",
      whyChooseUs: [
        "Fast response for paid traffic leads",
        "Clear package without confusing upsells",
        "Mobile-friendly page designed to convert",
      ],
      finalCta: "Get your detail quote",
    },
  },
  {
    id: "tpl-interior",
    slug: "interior-detail-promo",
    name: "Interior Detail Promo",
    description: "A focused funnel for detailers selling interior recovery, stain removal, and refresh jobs.",
    category: "Interior Only",
    industry: "Car Detailing",
    offerType: "Quote Request",
    supportedAdTypes: ["lead_form", "landing_page", "call_now", "messenger_leads", "messenger_engagement"],
    defaultAdType: "lead_form",
    positioning: "Best for shops booking family vehicles, work trucks, or rideshare interiors.",
    previewImage: "/placeholders/interior-detail.jpg",
    ctaDefault: "Get Interior Pricing",
    offerStructure: [
      "Start from the pain point",
      "Show the interior reset angle",
      "Collect the inquiry with a quick form",
    ],
    benefits: [
      "Clear pain-point messaging for messy interiors",
      "Works well with dirty-to-clean creative",
      "Strong lead magnet for practical buyers",
    ],
    faq: [
      {
        question: "Can you remove odors and stains?",
        answer: "Most shops can dramatically improve stains, odors, and buildup, with results depending on condition.",
      },
      {
        question: "Do you need to see the vehicle first?",
        answer: "A quick lead form is enough to start. Shops can confirm specifics after the first contact.",
      },
    ],
    adCopy: {
      primary:
        "Spills, pet hair, crumbs, and daily mess add up fast. {{businessName}} helps drivers in {{city}} get a cleaner interior without a complicated booking process.",
      headlines: [
        "Interior details in {{city}}",
        "Reset your car interior",
        "Remove stains and buildup",
      ],
      descriptions: [
        "Built for busy drivers with family cars, work trucks, and daily drivers.",
        "Simple quote flow with a clear next step.",
      ],
      targeting:
        "Target parents, rideshare drivers, commuters, and local service workers with daily-use vehicles.",
      budget: "Use $15-$30/day to test family-focused and practical value-focused ad angles.",
      creativeGuidance: [
        "Show seats, carpets, and center console before and after",
        "Use close-up proof shots",
        "Keep the offer grounded and practical",
      ],
    },
    funnel: {
      heroHeadline: "Make your interior feel clean again",
      heroSubheadline:
        "{{businessName}} helps drivers in {{city}} reset messy interiors with a simple quote-first flow.",
      offerLabel: "Interior detail special",
      whyChooseUs: [
        "Designed for high-intent local traffic",
        "Perfect for dirty daily-driver pain points",
        "Easy form completion on mobile",
      ],
      finalCta: "See interior pricing",
    },
  },
  {
    id: "tpl-ceramic",
    slug: "ceramic-coating-promo",
    name: "Ceramic Coating Promo",
    description: "A premium-feeling campaign for high-ticket coating jobs and paint protection offers.",
    category: "Paint Correction & Protection",
    industry: "Car Detailing",
    offerType: "High-Ticket Offer",
    supportedAdTypes: ["lead_form", "landing_page", "call_now", "messenger_leads", "messenger_engagement"],
    defaultAdType: "lead_form",
    positioning: "Best for detailers selling higher-ticket paint protection with a premium brand feel.",
    previewImage: "/placeholders/ceramic.jpg",
    ctaDefault: "Request Coating Quote",
    offerStructure: [
      "Premium service positioning",
      "Protection/value framing",
      "Quote request for higher-intent buyers",
    ],
    benefits: [
      "Premium landing flow for higher-ticket services",
      "Supports price anchoring against regular pricing",
      "Helps shops communicate long-term value quickly",
    ],
    faq: [
      {
        question: "How long does ceramic coating last?",
        answer: "Longevity depends on the package and maintenance routine, but coatings are positioned as long-term protection.",
      },
      {
        question: "Is paint correction included?",
        answer: "Many ceramic packages include prep or correction work before coating application.",
      },
    ],
    adCopy: {
      primary:
        "Want your paint protected and easier to maintain? {{businessName}} is running a ceramic coating offer for drivers in {{city}} who want a premium finish that lasts.",
      headlines: [
        "Ceramic coating in {{city}}",
        "Protect your paint properly",
        "Premium shine. Less upkeep.",
      ],
      descriptions: [
        "Built for premium buyers who want lasting results.",
        "Clean quote flow with a stronger value story.",
      ],
      targeting:
        "Target luxury vehicle owners, enthusiasts, recent buyers, and drivers interested in paint protection.",
      budget: "Start at $30-$50/day because higher-ticket services need enough room for signal.",
      creativeGuidance: [
        "Use glossy paint reflections and close-up finish shots",
        "Anchor the regular price visually",
        "Keep the page quiet and premium",
      ],
    },
    funnel: {
      heroHeadline: "Premium ceramic coating offers for {{city}} drivers",
      heroSubheadline:
        "{{businessName}} helps local drivers protect paint, keep gloss longer, and book faster with one clean page.",
      offerLabel: "Ceramic coating offer",
      whyChooseUs: [
        "Premium positioning without a bloated funnel",
        "Clean value communication for high-ticket buyers",
        "Built to convert mobile paid traffic",
      ],
      finalCta: "Request my coating quote",
    },
  },
  {
    id: "tpl-paint-correction",
    slug: "paint-correction-promo",
    name: "Paint Correction Promo",
    description: "A polished campaign for swirl removal, gloss restoration, and paint correction leads.",
    category: "Paint Correction & Protection",
    industry: "Car Detailing",
    offerType: "Inspection",
    supportedAdTypes: ["lead_form", "landing_page", "call_now", "messenger_leads", "messenger_engagement"],
    defaultAdType: "lead_form",
    positioning: "Best for detailers selling transformation-focused correction work.",
    previewImage: "/placeholders/paint-correction.jpg",
    ctaDefault: "See Correction Options",
    offerStructure: [
      "Transformation-first hero",
      "Paint correction value story",
      "Simple quote step",
    ],
    benefits: [
      "Strong fit for visual transformation ads",
      "Helps explain value with simple copy",
      "Works well with one or two elite before-and-after examples",
    ],
    faq: [
      {
        question: "Will every scratch come out?",
        answer: "Results depend on paint condition, but the goal is visible gloss improvement and defect reduction.",
      },
      {
        question: "Is this for every vehicle?",
        answer: "This offer is best for owners who care about appearance and want a higher-end finish.",
      },
    ],
    adCopy: {
      primary:
        "If your paint looks dull, swirled, or tired, {{businessName}} offers paint correction in {{city}} with a simple quote flow and cleaner positioning.",
      headlines: [
        "Bring your paint back",
        "Paint correction in {{city}}",
        "Gloss restoration made simple",
      ],
      descriptions: [
        "For owners who want a cleaner, sharper finish.",
        "Use one page to explain the offer and collect the lead.",
      ],
      targeting:
        "Target vehicle owners interested in car care, detailing, enthusiast pages, and luxury or sports models.",
      budget: "Start at $25-$40/day and optimize against the creative angle with the strongest proof.",
      creativeGuidance: [
        "Use light-angle paint shots to show defect removal",
        "Keep the hero clean and premium",
        "Lead with transformation proof over feature lists",
      ],
    },
    funnel: {
      heroHeadline: "A cleaner finish starts with proper paint correction",
      heroSubheadline:
        "{{businessName}} helps drivers in {{city}} restore gloss and remove the dull, tired look with a focused correction offer.",
      offerLabel: "Paint correction offer",
      whyChooseUs: [
        "Simple premium offer flow",
        "Built for transformation-led creative",
        "Clear quote step without clutter",
      ],
      finalCta: "Get my paint quote",
    },
  },
  {
    id: "tpl-maintenance",
    slug: "monthly-maintenance-promo",
    name: "Monthly Maintenance Promo",
    description: "A recurring-revenue funnel for maintenance washes and simple monthly membership style offers.",
    category: "Maintenance / Membership",
    industry: "Car Detailing",
    offerType: "Recurring Maintenance",
    supportedAdTypes: ["lead_form", "landing_page", "call_now", "messenger_leads", "messenger_engagement"],
    defaultAdType: "lead_form",
    positioning: "Best for detailers wanting steadier repeat business with a lightweight offer.",
    previewImage: "/placeholders/maintenance.jpg",
    ctaDefault: "Join The Wash Plan",
    offerStructure: [
      "Convenience-focused recurring angle",
      "Membership or monthly plan framing",
      "Lead capture for repeat business",
    ],
    benefits: [
      "Supports repeatable local revenue",
      "Simple offer format for existing customers and new traffic",
      "Easy follow-up angle for monthly service",
    ],
    faq: [
      {
        question: "How often should I book maintenance?",
        answer: "Most drivers do best with a regular monthly cadence depending on use and parking conditions.",
      },
      {
        question: "Is this only for existing customers?",
        answer: "No. It can work for new leads or customers stepping down from bigger detail packages.",
      },
    ],
    adCopy: {
      primary:
        "Want to keep your car looking clean without booking from scratch every time? {{businessName}} is offering a simple maintenance plan for drivers in {{city}}.",
      headlines: [
        "Monthly detail maintenance",
        "Keep your car consistently clean",
        "Simple wash plan in {{city}}",
      ],
      descriptions: [
        "A clean recurring offer for drivers who want less hassle.",
        "Great for repeat business and easy follow-up.",
      ],
      targeting:
        "Target current customers, local commuters, professionals, and drivers who recently engaged with higher-ticket ads.",
      budget: "Use $10-$20/day and retarget previous visitors or past lead audiences first.",
      creativeGuidance: [
        "Show clean maintenance visuals over heavy restoration shots",
        "Position it as convenience and consistency",
        "Use clean recurring-value language",
      ],
    },
    funnel: {
      heroHeadline: "Stay clean without starting over every month",
      heroSubheadline:
        "{{businessName}} makes it easy for drivers in {{city}} to keep their vehicles consistently clean with a lightweight recurring offer.",
      offerLabel: "Monthly maintenance offer",
      whyChooseUs: [
        "Simple recurring offer for steady revenue",
        "Fast mobile quote and lead capture flow",
        "Easy to retarget and follow up",
      ],
      finalCta: "Join the plan",
    },
  },
];

export function getTemplateBySlug(slug: string) {
  return templateFallbackCatalog.find((template) => template.slug === slug);
}

export function getTemplateById(id: string) {
  return templateFallbackCatalog.find((template) => template.id === id);
}

function getFirstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeStringArray(values: unknown[]): string[] {
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function hydrateTemplateRecord(record: TemplateRecord): TemplateSeed {
  const fallback = getTemplateById(record.id) || getTemplateBySlug(record.slug);
  const displayName = liveTemplateDisplayNameOverrides[record.slug] || record.name;
  const config = record.config_json || {};
  const configCreative = (config as {
    creative?: {
      adType?: string | null;
      headline?: string | null;
      primaryText?: string | null;
      formHeadline?: string | null;
      formDescription?: string | null;
      creativeAngle?: string | null;
      imageText?: string | null;
      thankYouHeadline?: string | null;
      thankYouDescription?: string | null;
      linkDescription?: string | null;
      cta?: string | null;
    } | null;
  }).creative;
  const configTemplate = (config as {
    template?: {
      name?: string | null;
      slug?: string | null;
      goal?: string | null;
      description?: string | null;
      categoryLabel?: string | null;
      recommendedAdType?: string | null;
      internalDescription?: string | null;
      linkDescription?: string | null;
    } | null;
  }).template;
  const configIndustry = (config as {
    industry?: { name?: string | null } | string | null;
  }).industry;
  const configMediaGuidance = (config as {
    mediaGuidance?: {
      imageNotes?: string | null;
      creativeStyle?: string | null;
      recommendedSize?: string | null;
      recommendedFormat?: string | null;
    } | null;
  }).mediaGuidance;
  const configCreativeAssets = (config as {
    creativeAssets?: {
      imageUrls?: string[];
      videoUrls?: string[];
      primaryImageUrl?: string | null;
      creativeStyle?: string | null;
      recommendedSize?: string | null;
      recommendedFormat?: string | null;
    } | null;
  }).creativeAssets;
  const explicitLinkDescription =
    ((config as { linkDescription?: string | null }).linkDescription || "").trim() ||
    ((configCreative?.linkDescription || "").trim()) ||
    ((configTemplate?.linkDescription || "").trim()) ||
    "";
  const industry = normalizeIndustryLabel(
    getFirstNonEmptyString(
      record.industry,
      typeof configIndustry === "string" ? configIndustry : configIndustry?.name,
      fallback?.industry,
      record.category,
    ),
  ) as TemplateIndustry;
  const category = getFirstNonEmptyString(
    record.category,
    (config as { category?: string | null }).category,
    configTemplate?.categoryLabel,
    fallback?.category,
    industry,
    "Uncategorized",
  );
  const offerType = normalizeOfferTypeLabel(record.offer_type || config.offerType || fallback?.offerType || "") as TemplateOfferType;
  const supportedAdTypes = normalizeStringArray([
    ...(((config as { supportedAdTypes?: unknown[] }).supportedAdTypes as unknown[]) || []),
    configCreative?.adType || "",
    configTemplate?.recommendedAdType || "",
    ...(fallback?.supportedAdTypes || []),
  ]);
  const normalizedSupportedAdTypes = supportedAdTypes.length ? Array.from(new Set(supportedAdTypes)) : ["lead_form"];
  const defaultAdType = getFirstNonEmptyString(
    (config as { defaultAdType?: string | null }).defaultAdType,
    configCreative?.adType,
    configTemplate?.recommendedAdType,
    fallback?.defaultAdType,
    normalizedSupportedAdTypes[0],
    "lead_form",
  );
  const resolvedCtaType =
    normalizeTemplateCtaType(
      config.ctaType ||
        (config as { root_cta?: string | null }).root_cta ||
        (config as { creative_cta?: string | null }).creative_cta ||
        (config as { recommended_cta?: string | null }).recommended_cta ||
        (config as { cta?: string | null }).cta ||
        (config as { creative?: { cta?: string | null } | null }).creative?.cta ||
        config.ctaDefault ||
        fallback?.ctaType ||
        fallback?.ctaDefault ||
        undefined,
    ) || "";
  const resolvedCtaLabel =
    config.ctaLabel ||
    ((config as { ctaPolicy?: { displayLabel?: string | null } | null }).ctaPolicy?.displayLabel || "") ||
    formatTemplateCtaLabel(resolvedCtaType || config.ctaDefault || fallback?.ctaDefault || undefined, "Learn more");
  const derivedCreativeGuidance = normalizeStringArray([
    configMediaGuidance?.creativeStyle || "",
    configMediaGuidance?.imageNotes || "",
    configCreativeAssets?.creativeStyle || "",
    getFirstNonEmptyString(
      configMediaGuidance?.recommendedSize,
      configCreativeAssets?.recommendedSize,
    )
      ? `Recommended size: ${getFirstNonEmptyString(
          configMediaGuidance?.recommendedSize,
          configCreativeAssets?.recommendedSize,
        )}`
      : "",
    getFirstNonEmptyString(
      configMediaGuidance?.recommendedFormat,
      configCreativeAssets?.recommendedFormat,
    )
      ? `Recommended format: ${getFirstNonEmptyString(
          configMediaGuidance?.recommendedFormat,
          configCreativeAssets?.recommendedFormat,
        )}`
      : "",
  ]);
  const fallbackAdCopy = fallback?.adCopy || {
    primary: "",
    headlines: [],
    descriptions: [],
    targeting: "",
    budget: "",
    creativeGuidance: [],
  };
  const configAdCopy = (config.adCopy || {}) as Partial<TemplateSeed["adCopy"]>;
  const mergedDescriptions = Array.isArray(configAdCopy.descriptions)
    ? [...configAdCopy.descriptions]
    : normalizeStringArray([
        explicitLinkDescription,
        configCreative?.linkDescription || "",
        configCreative?.formDescription || "",
        configTemplate?.internalDescription || "",
        configTemplate?.description || "",
        fallbackAdCopy.descriptions?.[0] || "",
      ]);

  if (explicitLinkDescription) {
    if (mergedDescriptions.length > 0) {
      mergedDescriptions[0] = explicitLinkDescription;
    } else {
      mergedDescriptions.push(explicitLinkDescription);
    }
  }

  const fallbackWhyChooseUs = (fallback?.funnel?.whyChooseUs || []).filter(Boolean);
  const derivedWhyChooseUs = normalizeStringArray([
    configCreative?.formDescription || "",
    configTemplate?.goal || "",
    configTemplate?.internalDescription || "",
    configMediaGuidance?.imageNotes || "",
  ]);
  const hydratedSeed: TemplateSeed = {
    id: record.id,
    slug: record.slug,
    name: displayName,
    description: record.description,
    category,
    industry: industry || "Car Detailing",
    offerType: offerType || fallback?.offerType || "Quote Request",
    supportedAdTypes: normalizedSupportedAdTypes as TemplateSeed["supportedAdTypes"],
    defaultAdType: defaultAdType as TemplateSeed["defaultAdType"],
    positioning:
      getFirstNonEmptyString(
        config.positioning,
        configTemplate?.goal,
        configTemplate?.internalDescription,
        configCreative?.creativeAngle,
        fallback?.positioning,
        record.description,
      ) || record.description,
    previewImage: record.preview_image_url || fallback?.previewImage || "/placeholders/template.jpg",
    creativeAssets: {
      imageUrls: normalizeStringArray([
        ...((configCreativeAssets?.imageUrls || []) as string[]),
        record.preview_image_url || "",
        configCreativeAssets?.primaryImageUrl || "",
        ...(fallback?.creativeAssets?.imageUrls || []),
      ]).filter((value) => !value.includes("PASTE_PUBLIC_IMAGE_URL_HERE")),
      videoUrls: (configCreativeAssets?.videoUrls || fallback?.creativeAssets?.videoUrls || []) as string[],
    },
    launchCategory: resolveTemplateLaunchCategory({
      slug: record.slug,
      name: displayName,
      description: record.description,
      positioning:
        getFirstNonEmptyString(
          config.positioning,
          configTemplate?.goal,
          configTemplate?.internalDescription,
          fallback?.positioning,
          record.description,
        ) || record.description,
      category: record.category,
      industry:
        getFirstNonEmptyString(
          record.industry,
          typeof configIndustry === "string" ? configIndustry : configIndustry?.name,
          fallback?.industry,
        ) || null,
      config_json: {
        launchCategory: (config as { launchCategory?: string | null }).launchCategory || undefined,
        template: (config as { template?: { category?: string | null; categoryLabel?: string | null; slug?: string | null } | null }).template || null,
      },
    }),
    ctaType: resolvedCtaType,
    ctaLabel: resolvedCtaLabel,
    ctaDefault: resolvedCtaLabel,
    promoDetails:
      getFirstNonEmptyString(
        config.promoDetails,
        explicitLinkDescription,
        configCreative?.linkDescription,
        configCreative?.formDescription,
        fallback?.promoDetails,
      ) || "",
    offerStructure: config.offerStructure || fallback?.offerStructure || [],
    benefits: config.benefits || fallback?.benefits || [],
    faq: config.faq || fallback?.faq || [],
    adCopy: {
      primary:
        getFirstNonEmptyString(
          configAdCopy.primary,
          configCreative?.primaryText,
          configTemplate?.description,
          fallbackAdCopy.primary,
          record.description,
        ) || record.description,
      headlines: Array.isArray(configAdCopy.headlines) && configAdCopy.headlines.length
        ? configAdCopy.headlines
        : normalizeStringArray([
            configCreative?.headline || "",
            configCreative?.formHeadline || "",
            configTemplate?.name || "",
            fallbackAdCopy.headlines?.[0] || "",
            displayName,
          ]).slice(0, 3),
      descriptions: mergedDescriptions.length ? mergedDescriptions : [record.description],
      targeting:
        getFirstNonEmptyString(
          configAdCopy.targeting,
          fallbackAdCopy.targeting,
          "Target local drivers in your service area who match the campaign offer and are ready to request a quote.",
        ) || "",
      budget:
        getFirstNonEmptyString(
          configAdCopy.budget,
          fallbackAdCopy.budget,
          "Start with a modest daily test budget, verify lead quality, then scale the best-performing ad set.",
        ) || "",
      creativeGuidance:
        Array.isArray(configAdCopy.creativeGuidance) && configAdCopy.creativeGuidance.length
          ? configAdCopy.creativeGuidance
          : derivedCreativeGuidance.length
            ? derivedCreativeGuidance
            : fallbackAdCopy.creativeGuidance || [],
      objective: configAdCopy.objective || fallbackAdCopy.objective,
    },
    funnel: config.funnel || fallback?.funnel || {
      heroHeadline:
        getFirstNonEmptyString(
          configCreative?.formHeadline,
          configCreative?.headline,
          configTemplate?.name,
          displayName,
        ) || displayName,
      heroSubheadline:
        getFirstNonEmptyString(
          configCreative?.formDescription,
          configTemplate?.description,
          record.description,
        ) || record.description,
      offerLabel:
        getFirstNonEmptyString(
          configTemplate?.categoryLabel,
          configCreative?.headline,
          displayName,
        ) || displayName,
      whyChooseUs: derivedWhyChooseUs.length
        ? derivedWhyChooseUs.slice(0, 3)
        : fallbackWhyChooseUs.length
          ? fallbackWhyChooseUs
          : ["Fast follow-up", "Clear offer positioning", "Built for mobile lead capture"],
      finalCta: getFirstNonEmptyString(resolvedCtaLabel, "Get Started") || "Get Started",
    },
    adTypeConfig: config.adTypeConfig || fallback?.adTypeConfig || {},
  };

  if (process.env.NODE_ENV !== "production") {
    console.debug("[template hydration CTA]", {
      slug: record.slug,
      raw: {
        ctaType: (config as { ctaType?: string | null }).ctaType || null,
        root_cta: (config as { root_cta?: string | null }).root_cta || null,
        creative_cta: (config as { creative_cta?: string | null }).creative_cta || null,
        recommended_cta: (config as { recommended_cta?: string | null }).recommended_cta || null,
        ctaLabel: (config as { ctaLabel?: string | null }).ctaLabel || null,
        ctaPolicyDisplayLabel: (config as { ctaPolicy?: { displayLabel?: string | null } | null }).ctaPolicy?.displayLabel || null,
        cta: (config as { cta?: string | null }).cta || null,
        creative: (config as { creative?: { cta?: string | null } | null }).creative?.cta || null,
        ctaDefault: config.ctaDefault || null,
        funnelFinalCta: config.funnel?.finalCta || null,
      },
      resolvedType: hydratedSeed.ctaType,
      resolvedLabel: hydratedSeed.ctaLabel,
    });
  }

  return {
    ...hydratedSeed,
    placeholderFields:
      config.placeholderFields ||
      ((config as {
        placeholders?: Array<{
          key?: string | null;
          label?: string | null;
          default?: string | null;
          required?: boolean | null;
          type?: "text" | "currency" | "number" | null;
        }>;
      }).placeholders || []).map((field) => ({
        id: field.key || "",
        label: field.label || field.key || "Field",
        defaultValue: field.default || undefined,
        required: Boolean(field.required),
        inputType:
          field.type === "currency" || field.type === "number" || field.type === "text"
            ? field.type
            : "text",
      })).filter((field) => field.id) ||
      fallback?.placeholderFields ||
      extractTemplatePlaceholderFields(hydratedSeed),
  };
}

// Backwards-compatible alias while the rest of the app finishes moving to the repository layer.
export const detailingTemplates = templateFallbackCatalog;
