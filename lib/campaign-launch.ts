import {
  BusinessProfile,
  CampaignDetailsStep,
  CampaignGoal,
  CampaignLaunchState,
  CampaignLocationTargetingType,
  CampaignLaunchStep,
  TemplatePlaceholderField,
  TemplateSeed,
  TemplateSetupValues,
} from "@/types";

function normalizeCampaignGoal(goal?: string | null): CampaignGoal {
  switch (goal) {
    case "lead_generation":
      return "OUTCOME_LEADS";
    case "messages":
      return "OUTCOME_ENGAGEMENT";
    case "traffic":
      return "OUTCOME_TRAFFIC";
    case "OUTCOME_AWARENESS":
    case "OUTCOME_TRAFFIC":
    case "OUTCOME_ENGAGEMENT":
    case "OUTCOME_LEADS":
    case "OUTCOME_APP_PROMOTION":
    case "OUTCOME_SALES":
      return goal;
    default:
      return "OUTCOME_LEADS";
  }
}

export function parseDailyBudgetAmount(input?: string | null): number | null {
  if (!input) return null;
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function parseDailyBudgetToCents(input?: string | null): number | null {
  const amount = parseDailyBudgetAmount(input);
  if (amount === null) return null;
  return Math.round(amount * 100);
}

function normalizeLocationTargetingMode(
  value?: string | null,
): CampaignLocationTargetingType {
  switch (value) {
    case "people_living_in":
      return "home";
    case "people_living_or_recently_in":
      return "recent_and_home";
    case "home":
    case "recent":
    case "travel_in":
    case "recent_and_home":
      return value;
    default:
      return "home";
  }
}

function normalizeLeadFormMode(value?: string | null) {
  return value === "managed_new" ? "managed_new" : "existing";
}

function normalizeTargetLocations(
  locations?: CampaignLaunchState["targetLocations"],
): CampaignLaunchState["targetLocations"] {
  if (!locations?.length) return [];

  return locations.map((location, index) => ({
    id: location.id || `location-${index + 1}`,
    label: location.label,
    radius: location.radius || "10",
    scope: location.scope,
    lat: typeof location.lat === "number" ? location.lat : undefined,
    lon: typeof location.lon === "number" ? location.lon : undefined,
    countryCode: location.countryCode,
    targetingMode: normalizeLocationTargetingMode(location.targetingMode),
  }));
}

export const campaignWizardSteps: Array<{ id: CampaignLaunchStep; label: string }> = [
  { id: "platform", label: "Choose platform" },
  { id: "category", label: "Select category" },
  { id: "template", label: "Select template" },
  { id: "campaign-details", label: "Campaign details" },
];

export const campaignDetailsSteps: Array<{ id: CampaignDetailsStep; label: string; description: string }> = [
  { id: "goal", label: "Campaign goal", description: "Pick the ad type and objective." },
  { id: "budget", label: "Daily budget", description: "Set what you want to spend each day." },
  { id: "location", label: "Target location", description: "Choose where this ad should run." },
  { id: "pixel", label: "Tracking pixel", description: "Pick the pixel you want tied to this campaign." },
  { id: "placeholders", label: "Placeholders", description: "Fill the template-specific offer values." },
  { id: "thank-you", label: "Thank-you page", description: "Configure the post-submit experience." },
  { id: "review", label: "Review & launch", description: "Review the campaign setup before launch." },
  { id: "advanced", label: "Advanced settings", description: "Optional campaign naming and policy settings." },
];

export const locationTargetingModeOptions: Array<{
  value: CampaignLocationTargetingType;
  label: string;
}> = [
  { value: "home", label: "People living in this location" },
  { value: "recent_and_home", label: "Living in or recently in this location" },
  { value: "recent", label: "People recently in this location" },
  { value: "travel_in", label: "People traveling in this location" },
];

export const campaignGoalOptions: Array<{
  id: CampaignGoal;
  label: string;
  description: string;
  apiValue: CampaignGoal;
}> = [
  {
    id: "OUTCOME_AWARENESS",
    label: "Awareness",
    description: "Optimize for reach and attention when the goal is visibility first.",
    apiValue: "OUTCOME_AWARENESS",
  },
  {
    id: "OUTCOME_TRAFFIC",
    label: "Traffic",
    description: "Send people to a website, landing page, or destination that needs clicks.",
    apiValue: "OUTCOME_TRAFFIC",
  },
  {
    id: "OUTCOME_ENGAGEMENT",
    label: "Engagement",
    description: "Optimize for messages, post engagement, and other higher-response interactions.",
    apiValue: "OUTCOME_ENGAGEMENT",
  },
  {
    id: "OUTCOME_LEADS",
    label: "Leads",
    description: "Best when you want Meta-optimized lead capture from the ad or connected form flow.",
    apiValue: "OUTCOME_LEADS",
  },
  {
    id: "OUTCOME_APP_PROMOTION",
    label: "App promotion",
    description: "Use when the campaign is meant to drive app installs or app activity.",
    apiValue: "OUTCOME_APP_PROMOTION",
  },
  {
    id: "OUTCOME_SALES",
    label: "Sales",
    description: "Optimize for conversion-focused outcomes when the campaign is built to drive purchases or booked revenue actions.",
    apiValue: "OUTCOME_SALES",
  },
];

const fallbackPlaceholderMap: Record<string, TemplatePlaceholderField[]> = {
  "full-detail-promo": [
    { id: "offerPrice", label: "Offer price", placeholder: "$179", inputType: "currency", required: true, defaultValue: "179" },
    { id: "regularPrice", label: "Normal price", placeholder: "$249", inputType: "currency", required: true, defaultValue: "249" },
    { id: "savings", label: "Savings", placeholder: "$70", inputType: "currency", defaultValue: "70" },
  ],
  "interior-detail-promo": [
    { id: "offerPrice", label: "Offer price", placeholder: "$129", inputType: "currency", required: true, defaultValue: "129" },
    { id: "regularPrice", label: "Normal price", placeholder: "$179", inputType: "currency", required: true, defaultValue: "179" },
    { id: "savings", label: "Savings", placeholder: "$50", inputType: "currency", defaultValue: "50" },
  ],
  "ceramic-coating-promo": [
    { id: "offerPrice", label: "Intro price", placeholder: "$899", inputType: "currency", required: true, defaultValue: "899" },
    { id: "regularPrice", label: "Normal price", placeholder: "$1,099", inputType: "currency", required: true, defaultValue: "1099" },
    { id: "savings", label: "Savings", placeholder: "$200", inputType: "currency", defaultValue: "200" },
  ],
  "paint-correction-promo": [
    { id: "offerPrice", label: "Correction price", placeholder: "$499", inputType: "currency", required: true, defaultValue: "499" },
    { id: "regularPrice", label: "Normal price", placeholder: "$649", inputType: "currency", required: true, defaultValue: "649" },
    { id: "savings", label: "Savings", placeholder: "$150", inputType: "currency", defaultValue: "150" },
  ],
  "monthly-maintenance-promo": [
    { id: "monthlyRate", label: "Monthly rate", placeholder: "$59", inputType: "currency", required: true, defaultValue: "59" },
    { id: "joinFee", label: "Join fee", placeholder: "$0", inputType: "currency", defaultValue: "0" },
    { id: "yearlySavings", label: "Yearly savings", placeholder: "$180", inputType: "currency", defaultValue: "180" },
  ],
};

export function getTemplatePlaceholderFields(template: TemplateSeed) {
  return template.placeholderFields?.length
    ? template.placeholderFields
    : fallbackPlaceholderMap[template.slug] || [];
}

function defaultPlaceholderValues(template: TemplateSeed) {
  return Object.fromEntries(
    getTemplatePlaceholderFields(template).map((field) => [field.id, field.defaultValue || ""]),
  );
}

export function createInitialCampaignLaunchState({
  template,
  businessProfile,
  partial,
}: {
  template?: TemplateSeed | null;
  businessProfile?: BusinessProfile | null;
  partial?: Partial<CampaignLaunchState> | null;
}): CampaignLaunchState {
  const resolvedTemplate = template || null;
  const defaultCampaignName =
    partial?.advanced?.campaignName ||
    (resolvedTemplate
      ? `${businessProfile?.business_name || "SideKick"} ${resolvedTemplate.name}`
      : "");

  return {
    platform: "meta",
    category: partial?.category || resolvedTemplate?.category || "",
    templateSlug: partial?.templateSlug || resolvedTemplate?.slug || "",
    currentStep: partial?.currentStep || (resolvedTemplate ? "template" : "platform"),
    currentDetailsStep: partial?.currentDetailsStep || "goal",
    campaignGoal: normalizeCampaignGoal(partial?.campaignGoal),
    dailyBudget: partial?.dailyBudget || "25",
    targetLocation: partial?.targetLocation || businessProfile?.location || "",
    targetLocations:
      partial?.targetLocations?.length
        ? normalizeTargetLocations(partial.targetLocations)
        : (partial?.targetLocation || businessProfile?.location)
          ? [
              {
                id: "primary-location",
                label: partial?.targetLocation || businessProfile?.location || "",
                radius: "10",
                targetingMode: "home" as const,
                scope: "city" as const,
              },
            ]
          : [],
    trackingPixelId:
      partial?.trackingPixelId ||
      partial?.integrationSelections?.pixelId ||
      "",
    trackingPixelName: partial?.trackingPixelName || "",
    placeholderValues: {
      ...(resolvedTemplate ? defaultPlaceholderValues(resolvedTemplate) : {}),
      ...(partial?.placeholderValues || {}),
    },
    thankYouPage: {
      headline: partial?.thankYouPage?.headline || "Thanks, we got your request.",
      description:
        partial?.thankYouPage?.description ||
        `We'll follow up from ${businessProfile?.business_name || "your workspace"} shortly.`,
      buttonLabel: partial?.thankYouPage?.buttonLabel || "Back to site",
      destinationUrl: partial?.thankYouPage?.destinationUrl || "",
    },
    advanced: {
      campaignName: defaultCampaignName,
      leadFormName: partial?.advanced?.leadFormName || `${resolvedTemplate?.name || "Campaign"} Lead Form`,
      customAudiences: partial?.advanced?.customAudiences || "",
      privacyPolicyUrl: partial?.advanced?.privacyPolicyUrl || "",
    },
    targeting: {
      ageMin: partial?.targeting?.ageMin || "23",
      ageMax: partial?.targeting?.ageMax || "65",
      gender: partial?.targeting?.gender || "all",
      interests: partial?.targeting?.interests || "",
      customAudiences: partial?.targeting?.customAudiences || partial?.advanced?.customAudiences || "",
    },
    leadForm: {
      mode: normalizeLeadFormMode(partial?.leadForm?.mode),
      selectedFormId:
        partial?.leadForm?.selectedFormId ||
        partial?.integrationSelections?.leadFormId ||
        "",
      selectedFormName: partial?.leadForm?.selectedFormName || "",
      managedFormName:
        partial?.leadForm?.managedFormName ||
        partial?.advanced?.leadFormName ||
        `${resolvedTemplate?.name || "Campaign"} Lead Form`,
      fields:
        partial?.leadForm?.fields?.length
          ? partial.leadForm.fields
          : ["FULL_NAME", "EMAIL", "PHONE"],
    },
    integrationSelections: {
      adAccountId: partial?.integrationSelections?.adAccountId || "",
      pageId: partial?.integrationSelections?.pageId || "",
      pixelId: partial?.integrationSelections?.pixelId || "",
      leadFormId: partial?.integrationSelections?.leadFormId || "",
      instagramActorId: partial?.integrationSelections?.instagramActorId || "",
    },
    previewTab: partial?.previewTab || "ad",
  };
}

export function normalizeCampaignLaunchState(
  state: Partial<CampaignLaunchState> | null | undefined,
  template: TemplateSeed,
  businessProfile: BusinessProfile | null,
) {
  return createInitialCampaignLaunchState({
    template,
    businessProfile,
    partial: state || {},
  });
}

export function getTemplateSetupValuesFromLaunchState(
  template: TemplateSeed,
  state: CampaignLaunchState,
  businessProfile: BusinessProfile | null,
): TemplateSetupValues {
  const placeholderValues = state.placeholderValues || {};
  const offerPrice = placeholderValues.offerPrice || placeholderValues.monthlyRate || "";
  const regularPrice = placeholderValues.regularPrice || placeholderValues.joinFee || "";
  const primaryLocation = state.targetLocations?.[0]?.label || state.targetLocation;

  return {
    businessName: businessProfile?.business_name || "Your Business",
    city: businessProfile?.location || primaryLocation || "",
    phone: businessProfile?.phone || "",
    email: businessProfile?.email || "",
    offerPrice,
    regularPrice,
    ctaText: businessProfile?.default_cta || template.ctaDefault,
    headline: "",
    subheadline: "",
    businessDescription: businessProfile?.description || "",
    testimonialText: "",
    brandColor: businessProfile?.brand_color || "#6D5EF8",
    followUpEnabled: true,
    placeholderValues,
    campaignGoal: normalizeCampaignGoal(state.campaignGoal),
    dailyBudget: state.dailyBudget,
    targetLocation: primaryLocation,
    thankYouHeadline: state.thankYouPage.headline,
    thankYouDescription: state.thankYouPage.description,
    thankYouButtonText: state.thankYouPage.buttonLabel,
    destinationUrl: state.thankYouPage.destinationUrl,
  };
}
