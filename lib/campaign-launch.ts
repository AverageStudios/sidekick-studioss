import {
  BusinessProfile,
  CampaignDetailsStep,
  CampaignAdType,
  CampaignGoal,
  CampaignLaunchState,
  CampaignLocationTargetingType,
  CampaignLaunchStep,
  CampaignThankYouButtonAction,
  CampaignThankYouDestinationMode,
  TemplatePlaceholderField,
  TemplateSeed,
  TemplateSetupValues,
} from "@/types";
import { normalizeIndustryLabel, normalizeOfferTypeLabel } from "@/data/template-taxonomy";
import { extractTemplatePlaceholderFields } from "@/lib/template-placeholders";

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

export function normalizeCampaignAdType(value?: string | null): CampaignAdType {
  switch (value) {
    case "landing_page":
    case "call_now":
    case "messenger_leads":
    case "messenger_engagement":
    case "lead_form":
      return value;
    default:
      return "lead_form";
  }
}

export function getCampaignGoalForAdType(adType: CampaignAdType): CampaignGoal {
  switch (adType) {
    case "landing_page":
      return "OUTCOME_TRAFFIC";
    case "call_now":
    case "messenger_engagement":
      return "OUTCOME_ENGAGEMENT";
    case "messenger_leads":
    case "lead_form":
    default:
      return "OUTCOME_LEADS";
  }
}

export function getAdTypeLabel(adType: CampaignAdType) {
  switch (adType) {
    case "lead_form":
      return "Lead Form";
    case "landing_page":
      return "Landing Page";
    case "call_now":
      return "Call Now";
    case "messenger_leads":
      return "Messenger (Leads)";
    case "messenger_engagement":
      return "Messenger (Engagement)";
    default:
      return "Lead Form";
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

function normalizeCampaignDetailsStep(value?: string | null): CampaignDetailsStep {
  switch (value) {
    case "goal":
      return "ad-type";
    case "pixel":
      return "tracking-pixel";
    case "advanced":
      return "review";
    case "ad-type":
    case "budget":
    case "location":
    case "tracking-pixel":
    case "placeholders":
    case "thank-you":
    case "landing-page":
    case "phone-number":
    case "messenger-setup":
    case "review":
    case "launch":
      return value;
    default:
      return "ad-type";
  }
}

function normalizeLeadFormMode(value?: string | null) {
  return value === "managed_new" ? "managed_new" : "existing";
}

function normalizeThankYouDestinationMode(
  value?: string | null,
  websiteUrl?: string | null,
): CampaignThankYouDestinationMode {
  if (value === "website" || value === "facebook") {
    return value;
  }
  return websiteUrl?.trim() ? "website" : "facebook";
}

function normalizeThankYouButtonAction(
  value?: string | null,
): CampaignThankYouButtonAction {
  if (value === "DOWNLOAD" || value === "CALL_BUSINESS" || value === "OPEN_WEBSITE") {
    return value;
  }
  return "OPEN_WEBSITE";
}

function normalizeAdTypeConfig(
  partial?: Partial<CampaignLaunchState> | null,
  template?: TemplateSeed | null,
) {
  return normalizeCampaignAdType(partial?.adType || template?.defaultAdType || null);
}

function resolveTemplateAdTypeConfig(
  template: TemplateSeed | null | undefined,
  adType: CampaignAdType,
) {
  return template?.adTypeConfig?.[adType] || {};
}

function deriveThankYouDestinationMode(
  buttonAction: CampaignThankYouButtonAction,
): CampaignThankYouDestinationMode {
  return buttonAction === "CALL_BUSINESS" ? "facebook" : "website";
}

export function getDefaultThankYouButtonLabel(
  buttonAction: CampaignThankYouButtonAction,
) {
  if (buttonAction === "DOWNLOAD") return "Download";
  if (buttonAction === "CALL_BUSINESS") return "Call Now";
  return "Continue";
}

export function getCampaignDetailsStepsForAdType(adType: CampaignAdType): Array<{ id: CampaignDetailsStep; label: string; description: string }> {
  const common: Array<{ id: CampaignDetailsStep; label: string; description: string }> = [
    { id: "ad-type", label: "Pick Ad Type", description: "Choose the campaign flow that fits this template." },
    { id: "budget", label: "Budget", description: "Set the daily spend for this campaign." },
    { id: "location", label: "Target Location", description: "Pick where the campaign should run." },
  ];

  const byType: Record<CampaignAdType, Array<{ id: CampaignDetailsStep; label: string; description: string }>> = {
    lead_form: [
      ...common,
      { id: "placeholders", label: "Fill Placeholders", description: "Complete template variables across the ad." },
      { id: "thank-you", label: "Thank You Page", description: "Optionally configure the post-submit screen." },
      { id: "review", label: "Review & Launch", description: "Review the full lead form campaign before launch." },
    ],
    landing_page: [
      ...common,
      { id: "tracking-pixel", label: "Tracking Pixel", description: "Attach the pixel from your connected Meta account." },
      { id: "placeholders", label: "Fill Placeholders", description: "Complete template variables across the ad." },
      { id: "landing-page", label: "Landing Page", description: "Set the website destination for this ad." },
      { id: "review", label: "Review & Launch", description: "Review the full landing page campaign before launch." },
    ],
    call_now: [
      ...common,
      { id: "placeholders", label: "Fill Placeholders", description: "Complete template variables across the ad." },
      { id: "phone-number", label: "Phone Number", description: "Add the call destination for the CTA." },
      { id: "review", label: "Review & Launch", description: "Review the full call campaign before launch." },
    ],
    messenger_leads: [
      ...common,
      { id: "placeholders", label: "Fill Placeholders", description: "Complete template variables across the ad." },
      { id: "messenger-setup", label: "Messenger Setup", description: "Configure the messaging handoff and welcome text." },
      { id: "review", label: "Review & Launch", description: "Review the full Messenger leads campaign before launch." },
    ],
    messenger_engagement: [
      ...common,
      { id: "placeholders", label: "Fill Placeholders", description: "Complete template variables across the ad." },
      { id: "messenger-setup", label: "Messenger Setup", description: "Configure the messaging handoff and welcome text." },
      { id: "review", label: "Review & Launch", description: "Review the full Messenger engagement campaign before launch." },
    ],
  };

  return byType[adType];
}

export function getNextCampaignDetailsStep(
  adType: CampaignAdType,
  currentStep: CampaignDetailsStep,
): CampaignDetailsStep {
  const steps = getCampaignDetailsStepsForAdType(adType);
  const index = steps.findIndex((step) => step.id === currentStep);
  return steps[Math.min(Math.max(index, 0) + 1, steps.length - 1)].id;
}

export function getPreviousCampaignDetailsStep(
  adType: CampaignAdType,
  currentStep: CampaignDetailsStep,
): CampaignDetailsStep {
  const steps = getCampaignDetailsStepsForAdType(adType);
  const index = steps.findIndex((step) => step.id === currentStep);
  return steps[Math.max(index - 1, 0)].id;
}

function normalizeTargetLocations(
  locations?: CampaignLaunchState["targetLocations"],
): CampaignLaunchState["targetLocations"] {
  if (!locations?.length) return [];

  return locations.map((location, index) => ({
    id: location.id || `location-${index + 1}`,
    label: location.label,
    radius: location.radius || "10",
    radiusAllowed:
      location.radiusAllowed ??
      (location.scope === "city" || location.scope === "zip" || location.scope === "neighborhood" || location.scope === "address"),
    distanceUnit: location.distanceUnit || "mile",
    scope: location.scope,
    lat: typeof location.lat === "number" ? location.lat : undefined,
    lon: typeof location.lon === "number" ? location.lon : undefined,
    countryCode: location.countryCode,
    metaLocation: location.metaLocation
      ? {
          ...location.metaLocation,
          raw:
            location.metaLocation.raw && typeof location.metaLocation.raw === "object"
              ? { ...location.metaLocation.raw }
              : location.metaLocation.raw,
        }
      : undefined,
    targetingMode: normalizeLocationTargetingMode(location.targetingMode),
  }));
}

export const campaignWizardSteps: Array<{ id: CampaignLaunchStep; label: string }> = [
  { id: "platform", label: "Choose platform" },
  { id: "industry", label: "Select industry" },
  { id: "template", label: "Select template" },
  { id: "campaign-details", label: "Campaign details" },
];

export const campaignDetailsSteps = getCampaignDetailsStepsForAdType("lead_form");

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

export function getTemplatePlaceholderFields(template: TemplateSeed) {
  return extractTemplatePlaceholderFields(template);
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
  const initialStep = (partial?.currentStep as string | undefined) === "offer-type" ? "template" : partial?.currentStep;
  const resolvedAdType = normalizeAdTypeConfig(partial, resolvedTemplate);
  const templateAdTypeConfig = resolveTemplateAdTypeConfig(resolvedTemplate, resolvedAdType);
  const defaultCampaignName =
    partial?.advanced?.campaignName ||
    (resolvedTemplate
      ? `${businessProfile?.business_name || "SideKick"} ${resolvedTemplate.name}`
      : "");
  const thankYouDestinationMode = normalizeThankYouDestinationMode(
    partial?.thankYouPage?.destinationMode,
    partial?.thankYouPage?.websiteUrl,
  );
  const thankYouButtonAction = normalizeThankYouButtonAction(
    partial?.thankYouPage?.buttonAction,
  );

  return {
    platform: "meta",
    adType: resolvedAdType,
    category: normalizeIndustryLabel(partial?.category || partial?.industry || resolvedTemplate?.industry || resolvedTemplate?.category || ""),
    industry: normalizeIndustryLabel(partial?.industry || partial?.category || resolvedTemplate?.industry || resolvedTemplate?.category || ""),
    offerType: normalizeOfferTypeLabel(partial?.offerType || resolvedTemplate?.offerType || ""),
    templateSlug: partial?.templateSlug || resolvedTemplate?.slug || "",
    currentStep: initialStep || (resolvedTemplate ? "template" : "platform"),
    currentDetailsStep: normalizeCampaignDetailsStep(partial?.currentDetailsStep),
    campaignGoal: normalizeCampaignGoal(partial?.campaignGoal || getCampaignGoalForAdType(resolvedAdType)),
    dailyBudget: partial?.dailyBudget || "25",
    targetLocation: partial?.targetLocation || businessProfile?.location || "",
    landingPageUrl: partial?.landingPageUrl || templateAdTypeConfig.landingPageUrl || "",
    phoneNumber: partial?.phoneNumber || templateAdTypeConfig.phoneNumber || businessProfile?.phone || "",
    messengerWelcomeMessage:
      partial?.messengerWelcomeMessage || templateAdTypeConfig.messengerWelcomeMessage || "",
    messengerReplyPrompt:
      partial?.messengerReplyPrompt || templateAdTypeConfig.messengerReplyPrompt || "",
    targetLocations:
      partial?.targetLocations?.length
        ? normalizeTargetLocations(partial.targetLocations)
        : (partial?.targetLocation || businessProfile?.location)
          ? [
              {
                id: "primary-location",
                label: partial?.targetLocation || businessProfile?.location || "",
                radius: "10",
                radiusAllowed: true,
                distanceUnit: "mile",
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
      enabled: partial?.thankYouPage?.enabled ?? templateAdTypeConfig.thankYouEnabled ?? true,
      headline:
        partial?.thankYouPage?.headline ||
        templateAdTypeConfig.thankYouHeadline ||
        "Thanks, we got your request.",
      description:
        partial?.thankYouPage?.description ||
        templateAdTypeConfig.thankYouDescription ||
        `We'll follow up from ${businessProfile?.business_name || "your workspace"} shortly.`,
      buttonLabel:
        partial?.thankYouPage?.buttonLabel ||
        templateAdTypeConfig.thankYouButtonLabel ||
        getDefaultThankYouButtonLabel(thankYouButtonAction),
      buttonAction: thankYouButtonAction,
      websiteUrl: partial?.thankYouPage?.websiteUrl || templateAdTypeConfig.thankYouWebsiteUrl || "",
      completionCountryCode: partial?.thankYouPage?.completionCountryCode || "+1",
      completionPhone: partial?.thankYouPage?.completionPhone || "",
      destinationMode: partial?.thankYouPage?.destinationMode || deriveThankYouDestinationMode(thankYouButtonAction),
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
  const thankYouDestinationUrl =
    state.thankYouPage.buttonAction === "OPEN_WEBSITE" || state.thankYouPage.buttonAction === "DOWNLOAD"
      ? state.thankYouPage.websiteUrl
      : state.integrationSelections.pageId
        ? `https://www.facebook.com/${state.integrationSelections.pageId}`
        : "";

  return {
    adType: state.adType,
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
    landingPageUrl: state.landingPageUrl,
    phoneNumber: state.phoneNumber,
    messengerWelcomeMessage: state.messengerWelcomeMessage,
    messengerReplyPrompt: state.messengerReplyPrompt,
    thankYouEnabled: state.thankYouPage.enabled,
    thankYouHeadline: state.thankYouPage.headline,
    thankYouDescription: state.thankYouPage.description,
    thankYouButtonText: state.thankYouPage.buttonLabel,
    destinationUrl: thankYouDestinationUrl,
  };
}
