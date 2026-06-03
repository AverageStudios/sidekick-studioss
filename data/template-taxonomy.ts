import type { TemplateIndustry, TemplateOfferType } from "@/types";
import { slugify } from "@/lib/utils";

export const supportedIndustries: TemplateIndustry[] = [
  "Car Detailing",
  "Chiropractic",
  "Physical Therapy",
  "Cleaning Services",
  "Fitness / Personal Training",
  "Flooring",
  "Landscape / Lawn Care",
  "Plumbing",
  "Pool Services",
  "Roofing",
  "Spas & Massage",
];

export const supportedOfferTypes: TemplateOfferType[] = [
  "Consultation",
  "Quote Request",
  "Service Booking",
  "Inspection",
  "Route Fill",
  "Appointment Booking",
  "Emergency Service",
  "Recurring Maintenance",
  "Membership / Program",
  "High-Ticket Offer",
  "Seasonal Promotion",
  "Reactivation / Follow-Up",
];

export const carDetailingLaunchCategories = [
  "All",
  "Full Details",
  "Interior Only",
  "Exterior Only",
  "Paint Correction & Protection",
  "Seasonal Specials",
  "Maintenance / Membership",
  "Quick Offers / Lead Drivers",
] as const;

const carDetailingCategoryLabelByKey = new Map(
  carDetailingLaunchCategories
    .filter((label) => label !== "All")
    .map((label) => [slugify(label), label] as const),
);

const templateLaunchCategoryBySlug: Record<string, string> = {
  "full-detail-promo": "Full Details",
  "interior-detail-promo": "Interior Only",
  "ceramic-coating-promo": "Paint Correction & Protection",
  "paint-correction-promo": "Paint Correction & Protection",
  "monthly-maintenance-promo": "Maintenance / Membership",
  "premium-exterior-detail": "Full Details",
  "protect-your-investment": "Paint Correction & Protection",
  "defend-your-shine": "Paint Correction & Protection",
};

function toTrimmedLabel(value?: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeTemplateCategoryKey(value?: string | null) {
  const trimmed = toTrimmedLabel(value);
  return trimmed ? slugify(trimmed) : "";
}

function normalizeCarDetailingLaunchCategory(value?: string | null) {
  const trimmed = toTrimmedLabel(value);
  if (!trimmed) return "";

  const normalizedKey = normalizeTemplateCategoryKey(trimmed);
  const canonicalLabel = carDetailingCategoryLabelByKey.get(normalizedKey);
  if (canonicalLabel) {
    return canonicalLabel;
  }

  if (/summer|seasonal/i.test(trimmed)) {
    return "Seasonal Specials";
  }

  if (/(inside[\s&/_-]*(?:and[\s&/_-]*)?out|interior[\s&/_-]*(?:and[\s&/_-]*)?exterior)/i.test(trimmed)) {
    return "Full Details";
  }

  if (/(full[\s_-]?detail|detail[\s_-]?promo|detail package|full reset|complete detail|complete reset|full service)/i.test(trimmed)) {
    return "Full Details";
  }

  if (/(interior|cabin|inside)/i.test(trimmed)) {
    return "Interior Only";
  }

  if (/(exterior|outside|wash|shine)/i.test(trimmed)) {
    return "Exterior Only";
  }

  if (/(ceramic|coating|paint[\s_-]?correction|paint correction|protection|defend|protect your shine|protect your investment|gloss restore)/i.test(trimmed)) {
    return "Paint Correction & Protection";
  }

  if (/(maintenance|membership|wash plan|monthly|recurring|subscription)/i.test(trimmed)) {
    return "Maintenance / Membership";
  }

  if (/(quick offer|lead driver|fast offer|special|deal|promo|reactivation)/i.test(trimmed)) {
    return "Quick Offers / Lead Drivers";
  }

  switch (trimmed.toLowerCase()) {
    case "premium / high ticket":
    case "premium high ticket":
    case "premium-high-ticket":
      return "Full Details";
    default:
      return trimmed;
  }
}

const ctaDisplayLabels: Record<string, string> = {
  LEARN_MORE: "Learn More",
  GET_QUOTE: "Get Quote",
  BOOK_NOW: "Book Now",
  SIGN_UP: "Sign Up",
  CALL_NOW: "Call Now",
  CONTACT_US: "Contact Us",
  SEND_MESSAGE: "Send Message",
  APPLY_NOW: "Apply Now",
  DOWNLOAD: "Download",
  GET_STARTED: "Get Started",
  SHOP_NOW: "Shop Now",
};

const ctaLabelToType: Record<string, string> = Object.entries(ctaDisplayLabels).reduce(
  (acc, [type, label]) => {
    acc[label.toLowerCase()] = type;
    return acc;
  },
  {} as Record<string, string>,
);

function normalizeCtaKey(value: string) {
  return value
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function formatTemplateCtaLabel(value?: string | null, fallback = "Learn more") {
  const trimmed = toTrimmedLabel(value);
  if (!trimmed) {
    return fallback;
  }

  const key = normalizeCtaKey(trimmed);
  if (ctaDisplayLabels[key]) {
    return ctaDisplayLabels[key];
  }

  if (trimmed.includes(" ")) {
    return trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  return trimmed;
}

export function normalizeTemplateCtaType(value?: string | null) {
  const trimmed = toTrimmedLabel(value);
  if (!trimmed) {
    return "";
  }

  const normalizedKey = normalizeCtaKey(trimmed);
  if (ctaDisplayLabels[normalizedKey]) {
    return normalizedKey;
  }

  const labelMatch = ctaLabelToType[trimmed.toLowerCase()];
  if (labelMatch) {
    return labelMatch;
  }

  return "";
}

export function normalizeIndustryLabel(value?: string | null) {
  const trimmed = toTrimmedLabel(value);
  if (!trimmed) return "";

  switch (trimmed.toLowerCase()) {
    case "car detailing":
      return "Car Detailing";
    case "chiropractic":
      return "Chiropractic";
    case "physical therapy":
      return "Physical Therapy";
    case "cleaning services":
      return "Cleaning Services";
    case "fitness / personal training":
    case "fitness personal training":
      return "Fitness / Personal Training";
    case "flooring":
      return "Flooring";
    case "landscape / lawn care":
    case "landscape lawn care":
      return "Landscape / Lawn Care";
    case "plumbing":
      return "Plumbing";
    case "pool services":
      return "Pool Services";
    case "roofing":
      return "Roofing";
    case "spas & massage":
    case "spas and massage":
      return "Spas & Massage";
    case "auto-detailing":
    case "auto detailing":
    case "detailing":
      return "Car Detailing";
    case "fitness":
    case "fitness studio":
    case "personal training":
      return "Fitness / Personal Training";
    case "landscaping":
    case "landscape":
      return "Landscape / Lawn Care";
    case "spa":
    case "spa & massage":
    case "massage":
      return "Spas & Massage";
    default:
      return trimmed;
  }
}

export function normalizeOfferTypeLabel(value?: string | null) {
  const trimmed = toTrimmedLabel(value);
  if (!trimmed) return "";

  switch (trimmed.toLowerCase()) {
    case "consultation":
      return "Consultation";
    case "quote request":
    case "quote":
      return "Quote Request";
    case "service booking":
    case "booking":
      return "Service Booking";
    case "inspection":
      return "Inspection";
    case "route fill":
      return "Route Fill";
    case "appointment booking":
    case "appointment":
      return "Appointment Booking";
    case "emergency service":
      return "Emergency Service";
    case "recurring maintenance":
    case "recurring revenue":
    case "monthly maintenance":
      return "Recurring Maintenance";
    case "membership / program":
    case "membership program":
    case "membership push":
      return "Membership / Program";
    case "high-ticket offer":
    case "high-ticket":
      return "High-Ticket Offer";
    case "seasonal promotion":
    case "seasonal offer":
      return "Seasonal Promotion";
    case "reactivation / follow-up":
    case "reactivation":
    case "follow-up":
      return "Reactivation / Follow-Up";
    default:
      return trimmed;
  }
}

export function resolveTemplateCtaLabel(
  template?: {
    ctaType?: string | null;
    ctaLabel?: string | null;
    root_cta?: string | null;
    creative_cta?: string | null;
    recommended_cta?: string | null;
    cta?: string | null;
    creative?: {
      cta?: string | null;
    } | null;
    ctaDefault?: string | null;
    ctaPolicy?: {
      displayLabel?: string | null;
    } | null;
    funnel?: {
      finalCta?: string | null;
    } | null;
  } | null,
  fallback = "Learn more",
) {
  const explicitLabel =
    template?.ctaLabel?.trim() ||
    template?.ctaPolicy?.displayLabel?.trim();

  if (explicitLabel) {
    return explicitLabel;
  }

  const resolvedType =
    normalizeTemplateCtaType(template?.ctaType) ||
    template?.root_cta?.trim() ||
    template?.creative_cta?.trim() ||
    template?.recommended_cta?.trim() ||
    template?.cta?.trim() ||
    template?.creative?.cta?.trim() ||
    template?.funnel?.finalCta?.trim() ||
    template?.ctaDefault?.trim();
  return formatTemplateCtaLabel(resolvedType || fallback, fallback);
}

export function resolveTemplateLaunchCategory(template?: {
  launchCategory?: string | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  positioning?: string | null;
  category?: string | null;
  industry?: string | null;
  config_json?: {
    launchCategory?: string | null;
    template?: {
      category?: string | null;
      categoryLabel?: string | null;
      internalName?: string | null;
      slug?: string | null;
      name?: string | null;
    } | null;
  } | null;
} | null) {
  const industry = toTrimmedLabel(template?.industry);
  const categoryFromRecord = normalizeCarDetailingLaunchCategory(template?.category);
  if (categoryFromRecord && normalizeTemplateCategoryKey(categoryFromRecord) !== normalizeTemplateCategoryKey(industry)) {
    return categoryFromRecord;
  }

  const launchCategoryFromRecord = normalizeCarDetailingLaunchCategory(template?.launchCategory);
  if (launchCategoryFromRecord) {
    return launchCategoryFromRecord;
  }

  const configCategory =
    normalizeCarDetailingLaunchCategory(template?.config_json?.launchCategory) ||
    normalizeCarDetailingLaunchCategory(template?.config_json?.template?.categoryLabel) ||
    normalizeCarDetailingLaunchCategory(template?.config_json?.template?.category) ||
    normalizeCarDetailingLaunchCategory(template?.config_json?.template?.internalName) ||
    normalizeCarDetailingLaunchCategory(template?.config_json?.template?.name) ||
    normalizeCarDetailingLaunchCategory(template?.name) ||
    normalizeCarDetailingLaunchCategory(template?.description) ||
    normalizeCarDetailingLaunchCategory(template?.positioning);

  if (configCategory && normalizeTemplateCategoryKey(configCategory) !== normalizeTemplateCategoryKey(industry)) {
    return configCategory;
  }

  const slugKey = toTrimmedLabel(template?.slug || template?.config_json?.template?.slug)
    .toLowerCase();
  if (slugKey && templateLaunchCategoryBySlug[slugKey]) {
    return templateLaunchCategoryBySlug[slugKey];
  }

  if (slugKey && /summer|seasonal/i.test(slugKey)) {
    return "Seasonal Specials";
  }

  const category = normalizeCarDetailingLaunchCategory(template?.category);
  if (category && normalizeTemplateCategoryKey(category) !== normalizeTemplateCategoryKey(industry)) {
    return category;
  }

  return "";
}
