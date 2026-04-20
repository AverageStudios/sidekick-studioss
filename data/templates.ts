import { TemplateRecord, TemplateSeed } from "@/types";
import { getTemplatePlaceholderFields } from "@/lib/campaign-launch";

// Dev fallback only. The real source of truth for customer-facing template browsing
// should be the Supabase `templates` table.
export const templateFallbackCatalog: TemplateSeed[] = [
  {
    id: "tpl-full-detail",
    slug: "full-detail-promo",
    name: "Full Detail Promo",
    description: "A fast-launch offer for drivers who want the full interior and exterior reset.",
    category: "Lead Generation",
    industry: "Auto detailing",
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
    category: "Lead Generation",
    industry: "Auto detailing",
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
    category: "Premium Service",
    industry: "Auto detailing",
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
    category: "Premium Service",
    industry: "Auto detailing",
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
    category: "Recurring Revenue",
    industry: "Auto detailing",
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

export function hydrateTemplateRecord(record: TemplateRecord): TemplateSeed {
  const fallback = getTemplateById(record.id) || getTemplateBySlug(record.slug);
  const config = record.config_json || {};
  const placeholderFields =
    config.placeholderFields ||
    fallback?.placeholderFields ||
    (fallback ? getTemplatePlaceholderFields(fallback) : []);

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    category: record.category,
    industry: config.industry || fallback?.industry || "",
    positioning: config.positioning || fallback?.positioning || record.description,
    previewImage: record.preview_image_url || fallback?.previewImage || "/placeholders/template.jpg",
    ctaDefault: config.ctaDefault || fallback?.ctaDefault || "Get Started",
    offerStructure: config.offerStructure || fallback?.offerStructure || [],
    placeholderFields,
    benefits: config.benefits || fallback?.benefits || [],
    faq: config.faq || fallback?.faq || [],
    adCopy: config.adCopy || fallback?.adCopy || {
      primary: "",
      headlines: [],
      descriptions: [],
      targeting: "",
      budget: "",
      creativeGuidance: [],
    },
    funnel: config.funnel || fallback?.funnel || {
      heroHeadline: record.name,
      heroSubheadline: record.description,
      offerLabel: record.name,
      whyChooseUs: [],
      finalCta: "Get Started",
    },
  };
}

// Backwards-compatible alias while the rest of the app finishes moving to the repository layer.
export const detailingTemplates = templateFallbackCatalog;
