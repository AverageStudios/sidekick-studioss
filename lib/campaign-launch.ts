import {
  BusinessProfile,
  CampaignAdType,
  CampaignGoal,
  CampaignLaunchLocation,
  CampaignLaunchState,
  CampaignLeadFormField,
  CampaignLeadFormMode,
  CampaignLocationScope,
  CampaignLocationTargetingType,
  CampaignThankYouButtonAction,
  CampaignThankYouDestinationMode,
  CampaignWizardStepId,
  TemplatePlaceholderField,
  TemplateSeed,
  TemplateSetupValues,
} from "@/types";
import { normalizeIndustryLabel, normalizeOfferTypeLabel } from "@/data/template-taxonomy";
import { extractTemplatePlaceholderFields } from "@/lib/template-placeholders";

export type CampaignLaunchView = {
  platform: CampaignLaunchState["platform"];
  adType: CampaignAdType;
  category: string;
  industry: string;
  offerType: string;
  templateSlug: string;
  campaignGoal: CampaignGoal;
  dailyBudget: string;
  targetLocation: string;
  targetLocations: CampaignLaunchLocation[];
  landingPageUrl: string;
  phoneNumber: string;
  messengerWelcomeMessage: string;
  messengerReplyPrompt: string;
  trackingPixelId: string;
  trackingPixelName: string;
  placeholderValues: Record<string, string>;
  thankYouPage: {
    enabled: boolean;
    headline: string;
    description: string;
    buttonLabel: string;
    buttonAction: CampaignThankYouButtonAction;
    websiteUrl: string;
    completionCountryCode: string;
    completionPhone: string;
    destinationMode: CampaignThankYouDestinationMode;
  };
  advanced: {
    campaignName: string;
    leadFormName: string;
    customAudiences: string;
    privacyPolicyUrl: string;
  };
  targeting: CampaignLaunchState["targeting"];
  leadForm: {
    mode: CampaignLeadFormMode;
    selectedFormId: string;
    selectedFormName: string;
    managedFormName: string;
    fields: CampaignLeadFormField[];
  };
  integrationSelections: CampaignLaunchState["integrationSelections"];
  previewTab?: CampaignLaunchState["previewTab"];
};

export type LaunchStepIssue = {
  code: string;
  message: string;
  field?: string;
};

export type LaunchStepValidation = {
  isValid: boolean;
  issues: LaunchStepIssue[];
};

export type CampaignStepDefinition = {
  id: CampaignWizardStepId;
  label: string;
  description: string;
};

const defaultStep: CampaignWizardStepId = "industry";
const defaultRadius = "10";

const stepDefinitions: Record<CampaignWizardStepId, CampaignStepDefinition> = {
  industry: {
    id: "industry",
    label: "Industry",
    description: "Choose the business category this campaign belongs to.",
  },
  template: {
    id: "template",
    label: "Template",
    description: "Pick the ad template you want to customize.",
  },
  "ad-type": {
    id: "ad-type",
    label: "Ad Type",
    description: "Choose how this campaign should drive responses.",
  },
  budget: {
    id: "budget",
    label: "Budget",
    description: "Set the daily campaign budget.",
  },
  location: {
    id: "location",
    label: "Target Location",
    description: "Define where Meta should deliver the campaign.",
  },
  "tracking-pixel": {
    id: "tracking-pixel",
    label: "Tracking Pixel",
    description: "Select the Meta Pixel used for landing page tracking.",
  },
  placeholders: {
    id: "placeholders",
    label: "Fill Placeholders",
    description: "Replace every template variable with campaign-specific content.",
  },
  "landing-page": {
    id: "landing-page",
    label: "Landing Page",
    description: "Choose the destination URL for website traffic.",
  },
  "phone-number": {
    id: "phone-number",
    label: "Phone Number",
    description: "Set the phone number used for call-first campaigns.",
  },
  "messenger-setup": {
    id: "messenger-setup",
    label: "Messenger Setup",
    description: "Write the opening Messenger prompts and conversation starter.",
  },
  "thank-you": {
    id: "thank-you",
    label: "Thank You",
    description: "Control the optional post-submit thank-you experience for lead forms.",
  },
  overview: {
    id: "overview",
    label: "Overview / Review & Edit",
    description: "Review the campaign, assets, and editable content before launch.",
  },
  launch: {
    id: "launch",
    label: "Launch",
    description: "Run readiness checks and publish to Meta.",
  },
};

const adTypeStepFlow: Record<CampaignAdType, CampaignWizardStepId[]> = {
  lead_form: ["industry", "template", "ad-type", "budget", "location", "placeholders", "thank-you", "overview", "launch"],
  landing_page: [
    "industry",
    "template",
    "ad-type",
    "budget",
    "location",
    "tracking-pixel",
    "placeholders",
    "landing-page",
    "overview",
    "launch",
  ],
  call_now: ["industry", "template", "ad-type", "budget", "location", "placeholders", "phone-number", "overview", "launch"],
  messenger_leads: [
    "industry",
    "template",
    "ad-type",
    "budget",
    "location",
    "placeholders",
    "messenger-setup",
    "overview",
    "launch",
  ],
  messenger_engagement: [
    "industry",
    "template",
    "ad-type",
    "budget",
    "location",
    "placeholders",
    "messenger-setup",
    "overview",
    "launch",
  ],
};

export const campaignGoalOptions: Array<{
  id: CampaignGoal;
  label: string;
  description: string;
  apiValue: string;
}> = [
  {
    id: "OUTCOME_AWARENESS",
    label: "Awareness",
    description: "Maximize reach and ad recall.",
    apiValue: "OUTCOME_AWARENESS",
  },
  {
    id: "OUTCOME_TRAFFIC",
    label: "Traffic",
    description: "Drive clicks to a website or landing page.",
    apiValue: "OUTCOME_TRAFFIC",
  },
  {
    id: "OUTCOME_ENGAGEMENT",
    label: "Engagement",
    description: "Drive post or message engagement.",
    apiValue: "OUTCOME_ENGAGEMENT",
  },
  {
    id: "OUTCOME_LEADS",
    label: "Leads",
    description: "Capture leads through Meta forms or conversations.",
    apiValue: "OUTCOME_LEADS",
  },
  {
    id: "OUTCOME_APP_PROMOTION",
    label: "App Promotion",
    description: "Promote app installs or usage.",
    apiValue: "OUTCOME_APP_PROMOTION",
  },
  {
    id: "OUTCOME_SALES",
    label: "Sales",
    description: "Drive conversion-focused outcomes.",
    apiValue: "OUTCOME_SALES",
  },
];

export const locationTargetingModeOptions: Array<{
  value: CampaignLocationTargetingType;
  label: string;
}> = [
  { value: "home", label: "People living in this location" },
  { value: "recent", label: "People recently in this location" },
  { value: "travel_in", label: "People traveling in this location" },
  { value: "recent_and_home", label: "People living in or recently in this location" },
];

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

function normalizeStepId(value?: string | null, adType?: CampaignAdType): CampaignWizardStepId {
  if (value && value in stepDefinitions) {
    const stepId = value as CampaignWizardStepId;
    if (!adType) return stepId;
    const visibleSteps = adTypeStepFlow[adType];
    return visibleSteps.includes(stepId) ? stepId : visibleSteps[0];
  }
  return adType ? adTypeStepFlow[adType][0] : defaultStep;
}

function normalizeThankYouButtonAction(value?: string | null): CampaignThankYouButtonAction {
  switch (value) {
    case "DOWNLOAD":
    case "CALL_BUSINESS":
    case "OPEN_WEBSITE":
      return value;
    default:
      return "OPEN_WEBSITE";
  }
}

function normalizeThankYouDestinationMode(value?: string | null): CampaignThankYouDestinationMode {
  switch (value) {
    case "website":
    case "facebook":
      return value;
    default:
      return "facebook";
  }
}

export function getDefaultThankYouButtonLabel(
  action: CampaignThankYouButtonAction,
): string {
  switch (action) {
    case "CALL_BUSINESS":
      return "Call now";
    case "DOWNLOAD":
      return "Download";
    case "OPEN_WEBSITE":
    default:
      return "Learn more";
  }
}

function normalizeTargetLocations(
  locations?: CampaignLaunchLocation[] | null,
): CampaignLaunchLocation[] {
  if (!Array.isArray(locations)) return [];
  return locations
    .filter((location) => location && typeof location === "object")
    .map((location, index) => ({
      id: location.id || `location-${index + 1}`,
      label: location.label || "",
      radius: location.radius || defaultRadius,
      radiusAllowed: location.radiusAllowed ?? true,
      distanceUnit: location.distanceUnit || "mile",
      targetingMode: location.targetingMode || "home",
      scope: location.scope || "city",
      lat: typeof location.lat === "number" ? location.lat : undefined,
      lon: typeof location.lon === "number" ? location.lon : undefined,
      countryCode: location.countryCode || undefined,
      metaLocation: location.metaLocation || undefined,
    }))
    .filter((location) => location.label.trim());
}

function createDefaultState({
  template,
  businessProfile,
  partial,
}: {
  template?: TemplateSeed | null;
  businessProfile?: BusinessProfile | null;
  partial?: Partial<CampaignLaunchState> | null;
}): CampaignLaunchState {
  const resolvedTemplate = template || null;
  const resolvedAdType = normalizeCampaignAdType(partial?.selection?.adType || resolvedTemplate?.defaultAdType || null);
  const defaultGoal = getCampaignGoalForAdType(resolvedAdType);
  const targetLocation = businessProfile?.location || "";
  const defaultLocations = targetLocation
    ? [
        {
          id: "primary-location",
          label: targetLocation,
          radius: defaultRadius,
          radiusAllowed: true,
          distanceUnit: "mile" as const,
          targetingMode: "home" as const,
          scope: "city" as const,
        },
      ]
    : [];

  return {
    version: 2,
    platform: "meta",
    stepId: normalizeStepId(partial?.stepId, resolvedAdType),
    selection: {
      industry: normalizeIndustryLabel(
        partial?.selection?.industry || resolvedTemplate?.industry || resolvedTemplate?.category || "",
      ),
      category: normalizeIndustryLabel(
        partial?.selection?.category || resolvedTemplate?.category || resolvedTemplate?.industry || "",
      ),
      offerType: normalizeOfferTypeLabel(partial?.selection?.offerType || resolvedTemplate?.offerType || ""),
      templateSlug: partial?.selection?.templateSlug || resolvedTemplate?.slug || "",
      adType: resolvedAdType,
    },
    campaign: {
      objective: normalizeCampaignGoal(partial?.campaign?.objective || defaultGoal),
      name:
        partial?.campaign?.name ||
        (resolvedTemplate ? `${businessProfile?.business_name || "SideKick"} ${resolvedTemplate.name}` : ""),
      dailyBudget: partial?.campaign?.dailyBudget || "25",
    },
    targeting: {
      locations: partial?.targeting?.locations?.length ? normalizeTargetLocations(partial.targeting.locations) : defaultLocations,
      ageMin: partial?.targeting?.ageMin || "23",
      ageMax: partial?.targeting?.ageMax || "65",
      gender: partial?.targeting?.gender || "all",
      interests: partial?.targeting?.interests || "",
      customAudiences: partial?.targeting?.customAudiences || "",
    },
    placeholders: {
      values: {
        ...(partial?.placeholders?.values || {}),
      },
    },
    adTypeConfig: {
      leadForm: {
        mode: partial?.adTypeConfig?.leadForm?.mode || "managed_new",
        selectedFormId: partial?.adTypeConfig?.leadForm?.selectedFormId || "",
        selectedFormName: partial?.adTypeConfig?.leadForm?.selectedFormName || "",
        managedFormName:
          partial?.adTypeConfig?.leadForm?.managedFormName || `${resolvedTemplate?.name || "Campaign"} Lead Form`,
        fields:
          partial?.adTypeConfig?.leadForm?.fields?.length
            ? partial.adTypeConfig.leadForm.fields
            : (["FULL_NAME", "EMAIL", "PHONE"] as CampaignLeadFormField[]),
        privacyPolicyUrl: partial?.adTypeConfig?.leadForm?.privacyPolicyUrl || "",
        thankYou: {
          enabled: partial?.adTypeConfig?.leadForm?.thankYou?.enabled ?? true,
          headline:
            partial?.adTypeConfig?.leadForm?.thankYou?.headline ||
            resolvedTemplate?.adTypeConfig?.lead_form?.thankYouHeadline ||
            "Thanks, we got your request.",
          description:
            partial?.adTypeConfig?.leadForm?.thankYou?.description ||
            resolvedTemplate?.adTypeConfig?.lead_form?.thankYouDescription ||
            "We'll follow up shortly with the next step.",
          buttonLabel:
            partial?.adTypeConfig?.leadForm?.thankYou?.buttonLabel ||
            resolvedTemplate?.adTypeConfig?.lead_form?.thankYouButtonLabel ||
            getDefaultThankYouButtonLabel("OPEN_WEBSITE"),
          buttonAction:
            partial?.adTypeConfig?.leadForm?.thankYou?.buttonAction || "OPEN_WEBSITE",
          websiteUrl:
            partial?.adTypeConfig?.leadForm?.thankYou?.websiteUrl ||
            resolvedTemplate?.adTypeConfig?.lead_form?.thankYouWebsiteUrl ||
            "",
          completionCountryCode:
            partial?.adTypeConfig?.leadForm?.thankYou?.completionCountryCode || "+1",
          completionPhone:
            partial?.adTypeConfig?.leadForm?.thankYou?.completionPhone || businessProfile?.phone || "",
          destinationMode:
            partial?.adTypeConfig?.leadForm?.thankYou?.destinationMode || "facebook",
        },
      },
      landingPage: {
        url:
          partial?.adTypeConfig?.landingPage?.url ||
          resolvedTemplate?.adTypeConfig?.landing_page?.landingPageUrl ||
          "",
        pixelId: partial?.adTypeConfig?.landingPage?.pixelId || "",
        pixelName: partial?.adTypeConfig?.landingPage?.pixelName || "",
      },
      callNow: {
        phoneNumber:
          partial?.adTypeConfig?.callNow?.phoneNumber ||
          resolvedTemplate?.adTypeConfig?.call_now?.phoneNumber ||
          businessProfile?.phone ||
          "",
      },
      messenger: {
        welcomeMessage:
          partial?.adTypeConfig?.messenger?.welcomeMessage ||
          resolvedTemplate?.adTypeConfig?.messenger_leads?.messengerWelcomeMessage ||
          "",
        replyPrompt:
          partial?.adTypeConfig?.messenger?.replyPrompt ||
          resolvedTemplate?.adTypeConfig?.messenger_leads?.messengerReplyPrompt ||
          "",
      },
    },
    integrationSelections: {
      adAccountId: partial?.integrationSelections?.adAccountId || "",
      pageId: partial?.integrationSelections?.pageId || "",
      pixelId: partial?.integrationSelections?.pixelId || "",
      leadFormId: partial?.integrationSelections?.leadFormId || "",
      instagramActorId: partial?.integrationSelections?.instagramActorId || "",
    },
    review: {
      headline: partial?.review?.headline || "",
      subheadline: partial?.review?.subheadline || "",
      businessDescription: partial?.review?.businessDescription || businessProfile?.description || "",
      testimonialText: partial?.review?.testimonialText || "",
      ctaText: partial?.review?.ctaText || businessProfile?.default_cta || resolvedTemplate?.ctaDefault || "Learn more",
    },
    previewTab: partial?.previewTab || "ad",
  };
}

function isCanonicalState(value: unknown): value is CampaignLaunchState {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as CampaignLaunchState).version === 2 &&
      typeof (value as CampaignLaunchState).selection === "object",
  );
}

function migrateLegacyState(
  state: Record<string, unknown>,
  template: TemplateSeed | null,
  businessProfile: BusinessProfile | null,
): CampaignLaunchState {
  const adType = normalizeCampaignAdType(
    typeof state.adType === "string" ? state.adType : template?.defaultAdType || null,
  );
  const defaultState = createDefaultState({
    template,
    businessProfile,
    partial: {
      selection: {
        industry: typeof state.industry === "string" ? state.industry : "",
        category: typeof state.category === "string" ? state.category : "",
        offerType: typeof state.offerType === "string" ? state.offerType : "",
        templateSlug: typeof state.templateSlug === "string" ? state.templateSlug : template?.slug || "",
        adType,
      },
      stepId: typeof state.currentDetailsStep === "string" && state.currentDetailsStep in stepDefinitions
        ? (state.currentDetailsStep as CampaignWizardStepId)
        : typeof state.currentStep === "string"
          ? (state.currentStep === "campaign-details" ? "ad-type" : state.currentStep) as CampaignWizardStepId
          : undefined,
    },
  });

  const legacyTargetLocations = normalizeTargetLocations(
    Array.isArray(state.targetLocations) ? (state.targetLocations as CampaignLaunchLocation[]) : null,
  );
  const fallbackTargetLocation =
    typeof state.targetLocation === "string" && state.targetLocation.trim()
      ? [
          {
            id: "primary-location",
            label: state.targetLocation.trim(),
            radius: defaultRadius,
            radiusAllowed: true,
            distanceUnit: "mile" as const,
            targetingMode: "home" as const,
            scope: "city" as const,
          },
        ]
      : defaultState.targeting.locations;

  const legacyThankYou = typeof state.thankYouPage === "object" && state.thankYouPage
    ? (state.thankYouPage as Record<string, unknown>)
    : {};
  const legacyAdvanced = typeof state.advanced === "object" && state.advanced
    ? (state.advanced as Record<string, unknown>)
    : {};
  const legacyTargeting = typeof state.targeting === "object" && state.targeting
    ? (state.targeting as Record<string, unknown>)
    : {};
  const legacyLeadForm = typeof state.leadForm === "object" && state.leadForm
    ? (state.leadForm as Record<string, unknown>)
    : {};
  const legacyIntegration = typeof state.integrationSelections === "object" && state.integrationSelections
    ? (state.integrationSelections as Record<string, unknown>)
    : {};

  return {
    ...defaultState,
    stepId: normalizeStepId(defaultState.stepId, adType),
    selection: {
      industry: normalizeIndustryLabel(
        (typeof state.industry === "string" ? state.industry : "") ||
          (typeof state.category === "string" ? state.category : "") ||
          defaultState.selection.industry,
      ),
      category: normalizeIndustryLabel(
        (typeof state.category === "string" ? state.category : "") ||
          (typeof state.industry === "string" ? state.industry : "") ||
          defaultState.selection.category,
      ),
      offerType: normalizeOfferTypeLabel(
        (typeof state.offerType === "string" ? state.offerType : "") || defaultState.selection.offerType,
      ),
      templateSlug:
        (typeof state.templateSlug === "string" ? state.templateSlug : "") || defaultState.selection.templateSlug,
      adType,
    },
    campaign: {
      objective: normalizeCampaignGoal(
        typeof state.campaignGoal === "string" ? state.campaignGoal : defaultState.campaign.objective,
      ),
      name:
        (typeof legacyAdvanced.campaignName === "string" ? legacyAdvanced.campaignName : "") ||
        defaultState.campaign.name,
      dailyBudget:
        (typeof state.dailyBudget === "string" ? state.dailyBudget : "") || defaultState.campaign.dailyBudget,
    },
    targeting: {
      locations: legacyTargetLocations.length ? legacyTargetLocations : fallbackTargetLocation,
      ageMin: (typeof legacyTargeting.ageMin === "string" ? legacyTargeting.ageMin : "") || defaultState.targeting.ageMin,
      ageMax: (typeof legacyTargeting.ageMax === "string" ? legacyTargeting.ageMax : "") || defaultState.targeting.ageMax,
      gender:
        legacyTargeting.gender === "male" || legacyTargeting.gender === "female"
          ? legacyTargeting.gender
          : "all",
      interests:
        (typeof legacyTargeting.interests === "string" ? legacyTargeting.interests : "") ||
        defaultState.targeting.interests,
      customAudiences:
        (typeof legacyTargeting.customAudiences === "string" ? legacyTargeting.customAudiences : "") ||
        (typeof legacyAdvanced.customAudiences === "string" ? legacyAdvanced.customAudiences : "") ||
        defaultState.targeting.customAudiences,
    },
    placeholders: {
      values:
        typeof state.placeholderValues === "object" && state.placeholderValues
          ? (state.placeholderValues as Record<string, string>)
          : defaultState.placeholders.values,
    },
    adTypeConfig: {
      leadForm: {
        mode:
          legacyLeadForm.mode === "existing" || legacyLeadForm.mode === "managed_new"
            ? legacyLeadForm.mode
            : defaultState.adTypeConfig.leadForm.mode,
        selectedFormId:
          (typeof legacyLeadForm.selectedFormId === "string" ? legacyLeadForm.selectedFormId : "") ||
          defaultState.adTypeConfig.leadForm.selectedFormId,
        selectedFormName:
          (typeof legacyLeadForm.selectedFormName === "string" ? legacyLeadForm.selectedFormName : "") ||
          defaultState.adTypeConfig.leadForm.selectedFormName,
        managedFormName:
          (typeof legacyLeadForm.managedFormName === "string" ? legacyLeadForm.managedFormName : "") ||
          (typeof legacyAdvanced.leadFormName === "string" ? legacyAdvanced.leadFormName : "") ||
          defaultState.adTypeConfig.leadForm.managedFormName,
        fields: Array.isArray(legacyLeadForm.fields) && legacyLeadForm.fields.length
          ? (legacyLeadForm.fields as CampaignLeadFormField[])
          : defaultState.adTypeConfig.leadForm.fields,
        privacyPolicyUrl:
          (typeof legacyAdvanced.privacyPolicyUrl === "string" ? legacyAdvanced.privacyPolicyUrl : "") ||
          defaultState.adTypeConfig.leadForm.privacyPolicyUrl,
        thankYou: {
          enabled:
            typeof legacyThankYou.enabled === "boolean"
              ? legacyThankYou.enabled
              : defaultState.adTypeConfig.leadForm.thankYou.enabled,
          headline:
            (typeof legacyThankYou.headline === "string" ? legacyThankYou.headline : "") ||
            defaultState.adTypeConfig.leadForm.thankYou.headline,
          description:
            (typeof legacyThankYou.description === "string" ? legacyThankYou.description : "") ||
            defaultState.adTypeConfig.leadForm.thankYou.description,
          buttonLabel:
            (typeof legacyThankYou.buttonLabel === "string" ? legacyThankYou.buttonLabel : "") ||
            defaultState.adTypeConfig.leadForm.thankYou.buttonLabel,
          buttonAction: normalizeThankYouButtonAction(
            typeof legacyThankYou.buttonAction === "string" ? legacyThankYou.buttonAction : null,
          ),
          websiteUrl:
            (typeof legacyThankYou.websiteUrl === "string" ? legacyThankYou.websiteUrl : "") ||
            defaultState.adTypeConfig.leadForm.thankYou.websiteUrl,
          completionCountryCode:
            (typeof legacyThankYou.completionCountryCode === "string"
              ? legacyThankYou.completionCountryCode
              : "") || defaultState.adTypeConfig.leadForm.thankYou.completionCountryCode,
          completionPhone:
            (typeof legacyThankYou.completionPhone === "string" ? legacyThankYou.completionPhone : "") ||
            defaultState.adTypeConfig.leadForm.thankYou.completionPhone,
          destinationMode: normalizeThankYouDestinationMode(
            typeof legacyThankYou.destinationMode === "string" ? legacyThankYou.destinationMode : null,
          ),
        },
      },
      landingPage: {
        url:
          (typeof state.landingPageUrl === "string" ? state.landingPageUrl : "") ||
          defaultState.adTypeConfig.landingPage.url,
        pixelId:
          (typeof state.trackingPixelId === "string" ? state.trackingPixelId : "") ||
          (typeof legacyIntegration.pixelId === "string" ? legacyIntegration.pixelId : "") ||
          defaultState.adTypeConfig.landingPage.pixelId,
        pixelName:
          (typeof state.trackingPixelName === "string" ? state.trackingPixelName : "") ||
          defaultState.adTypeConfig.landingPage.pixelName,
      },
      callNow: {
        phoneNumber:
          (typeof state.phoneNumber === "string" ? state.phoneNumber : "") ||
          defaultState.adTypeConfig.callNow.phoneNumber,
      },
      messenger: {
        welcomeMessage:
          (typeof state.messengerWelcomeMessage === "string" ? state.messengerWelcomeMessage : "") ||
          defaultState.adTypeConfig.messenger.welcomeMessage,
        replyPrompt:
          (typeof state.messengerReplyPrompt === "string" ? state.messengerReplyPrompt : "") ||
          defaultState.adTypeConfig.messenger.replyPrompt,
      },
    },
    integrationSelections: {
      adAccountId:
        (typeof legacyIntegration.adAccountId === "string" ? legacyIntegration.adAccountId : "") ||
        defaultState.integrationSelections.adAccountId,
      pageId:
        (typeof legacyIntegration.pageId === "string" ? legacyIntegration.pageId : "") ||
        defaultState.integrationSelections.pageId,
      pixelId:
        (typeof legacyIntegration.pixelId === "string" ? legacyIntegration.pixelId : "") ||
        defaultState.integrationSelections.pixelId,
      leadFormId:
        (typeof legacyIntegration.leadFormId === "string" ? legacyIntegration.leadFormId : "") ||
        defaultState.integrationSelections.leadFormId,
      instagramActorId:
        (typeof legacyIntegration.instagramActorId === "string" ? legacyIntegration.instagramActorId : "") ||
        defaultState.integrationSelections.instagramActorId,
    },
    review: {
      headline: "",
      subheadline: "",
      businessDescription: businessProfile?.description || defaultState.review.businessDescription,
      testimonialText: "",
      ctaText: defaultState.review.ctaText,
    },
    previewTab:
      state.previewTab === "lead-form" || state.previewTab === "thank-you" ? state.previewTab : "ad",
  };
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

export function createInitialCampaignLaunchState({
  template,
  businessProfile,
  partial,
}: {
  template?: TemplateSeed | null;
  businessProfile?: BusinessProfile | null;
  partial?: Partial<CampaignLaunchState> | null;
}): CampaignLaunchState {
  return createDefaultState({ template, businessProfile, partial });
}

export function normalizeCampaignLaunchState(
  state: Partial<CampaignLaunchState> | Record<string, unknown> | null | undefined,
  template: TemplateSeed,
  businessProfile: BusinessProfile | null,
): CampaignLaunchState {
  if (!state) {
    return createInitialCampaignLaunchState({ template, businessProfile });
  }

  if (isCanonicalState(state)) {
    const merged = createDefaultState({
      template,
      businessProfile,
      partial: {
        ...state,
        selection: { ...state.selection },
        campaign: { ...state.campaign },
        targeting: {
          ...state.targeting,
          locations: normalizeTargetLocations(state.targeting.locations),
        },
        placeholders: {
          values: { ...state.placeholders.values },
        },
        adTypeConfig: {
          leadForm: {
            ...state.adTypeConfig.leadForm,
            fields: [...state.adTypeConfig.leadForm.fields],
            thankYou: { ...state.adTypeConfig.leadForm.thankYou },
          },
          landingPage: { ...state.adTypeConfig.landingPage },
          callNow: { ...state.adTypeConfig.callNow },
          messenger: { ...state.adTypeConfig.messenger },
        },
        integrationSelections: { ...state.integrationSelections },
        review: { ...state.review },
      },
    });
    merged.stepId = normalizeStepId(merged.stepId, merged.selection.adType);
    return merged;
  }

  return migrateLegacyState(state as Record<string, unknown>, template, businessProfile);
}

export function getTemplatePlaceholderFields(template: TemplateSeed) {
  return extractTemplatePlaceholderFields(template);
}

export function getVisibleWizardSteps(adType: CampaignAdType) {
  return adTypeStepFlow[adType].map((stepId) => stepDefinitions[stepId]);
}

export function getStepDefinition(stepId: CampaignWizardStepId) {
  return stepDefinitions[stepId];
}

export function getNextWizardStep(
  adType: CampaignAdType,
  currentStepId: CampaignWizardStepId,
) {
  const steps = adTypeStepFlow[adType];
  const currentIndex = steps.indexOf(currentStepId);
  return steps[Math.min(currentIndex + 1, steps.length - 1)];
}

export function getPreviousWizardStep(
  adType: CampaignAdType,
  currentStepId: CampaignWizardStepId,
) {
  const steps = adTypeStepFlow[adType];
  const currentIndex = steps.indexOf(currentStepId);
  return steps[Math.max(currentIndex - 1, 0)];
}

function primaryLocationLabel(state: CampaignLaunchState) {
  return state.targeting.locations[0]?.label || "";
}

export function createLaunchStateView(state: CampaignLaunchState): CampaignLaunchView {
  return {
    platform: state.platform,
    adType: state.selection.adType,
    category: state.selection.category,
    industry: state.selection.industry,
    offerType: state.selection.offerType,
    templateSlug: state.selection.templateSlug,
    campaignGoal: state.campaign.objective,
    dailyBudget: state.campaign.dailyBudget,
    targetLocation: primaryLocationLabel(state),
    targetLocations: state.targeting.locations,
    landingPageUrl: state.adTypeConfig.landingPage.url,
    phoneNumber: state.adTypeConfig.callNow.phoneNumber,
    messengerWelcomeMessage: state.adTypeConfig.messenger.welcomeMessage,
    messengerReplyPrompt: state.adTypeConfig.messenger.replyPrompt,
    trackingPixelId: state.adTypeConfig.landingPage.pixelId,
    trackingPixelName: state.adTypeConfig.landingPage.pixelName,
    placeholderValues: state.placeholders.values,
    thankYouPage: state.adTypeConfig.leadForm.thankYou,
    advanced: {
      campaignName: state.campaign.name,
      leadFormName: state.adTypeConfig.leadForm.managedFormName,
      customAudiences: state.targeting.customAudiences,
      privacyPolicyUrl: state.adTypeConfig.leadForm.privacyPolicyUrl,
    },
    targeting: state.targeting,
    leadForm: {
      mode: state.adTypeConfig.leadForm.mode,
      selectedFormId: state.adTypeConfig.leadForm.selectedFormId,
      selectedFormName: state.adTypeConfig.leadForm.selectedFormName,
      managedFormName: state.adTypeConfig.leadForm.managedFormName,
      fields: state.adTypeConfig.leadForm.fields,
    },
    integrationSelections: state.integrationSelections,
    previewTab: state.previewTab,
  };
}

function sanitizeDestinationUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function resolveThankYouDestinationUrl(state: CampaignLaunchState) {
  const thankYou = state.adTypeConfig.leadForm.thankYou;
  if (thankYou.buttonAction === "OPEN_WEBSITE" || thankYou.buttonAction === "DOWNLOAD") {
    return sanitizeDestinationUrl(thankYou.websiteUrl);
  }
  if (state.integrationSelections.pageId) {
    return `https://www.facebook.com/${state.integrationSelections.pageId}`;
  }
  return "https://www.facebook.com";
}

export function getTemplateSetupValuesFromLaunchState(
  template: TemplateSeed,
  state: CampaignLaunchState,
  businessProfile: BusinessProfile | null,
): TemplateSetupValues {
  const placeholderValues = state.placeholders.values || {};
  const primaryLocation = primaryLocationLabel(state) || businessProfile?.location || "";
  const offerPrice =
    placeholderValues.offerPrice ||
    placeholderValues.price ||
    placeholderValues.monthlyRate ||
    "";
  const regularPrice =
    placeholderValues.regularPrice ||
    placeholderValues.joinFee ||
    "";

  return {
    adType: state.selection.adType,
    businessName: businessProfile?.business_name || "Your Business",
    city: primaryLocation,
    phone: businessProfile?.phone || "",
    email: businessProfile?.email || "",
    offerPrice,
    regularPrice,
    ctaText: state.review.ctaText || template.ctaDefault,
    headline: state.review.headline,
    subheadline: state.review.subheadline,
    businessDescription: state.review.businessDescription || businessProfile?.description || "",
    testimonialText: state.review.testimonialText,
    brandColor: businessProfile?.brand_color || "#6D5EF8",
    followUpEnabled: true,
    placeholderValues,
    campaignGoal: state.campaign.objective,
    dailyBudget: state.campaign.dailyBudget,
    targetLocation: primaryLocation,
    landingPageUrl: state.adTypeConfig.landingPage.url,
    phoneNumber: state.adTypeConfig.callNow.phoneNumber,
    messengerWelcomeMessage: state.adTypeConfig.messenger.welcomeMessage,
    messengerReplyPrompt: state.adTypeConfig.messenger.replyPrompt,
    thankYouEnabled: state.adTypeConfig.leadForm.thankYou.enabled,
    thankYouHeadline: state.adTypeConfig.leadForm.thankYou.headline,
    thankYouDescription: state.adTypeConfig.leadForm.thankYou.description,
    thankYouButtonText: state.adTypeConfig.leadForm.thankYou.buttonLabel,
    destinationUrl: resolveThankYouDestinationUrl(state),
  };
}

function validateUrlField(value: string, field: string, emptyMessage: string, invalidMessage: string) {
  const normalized = sanitizeDestinationUrl(value);
  if (!normalized) {
    return [{ code: `${field}_missing`, message: emptyMessage, field }];
  }
  try {
    // eslint-disable-next-line no-new
    new URL(normalized);
    return [];
  } catch {
    return [{ code: `${field}_invalid`, message: invalidMessage, field }];
  }
}

export function resolvePlaceholderValue(
  fieldId: string,
  state: CampaignLaunchState,
  setupValues: TemplateSetupValues,
) {
  const directValue = state.placeholders.values?.[fieldId];
  if (directValue && directValue.trim()) {
    return directValue.trim();
  }

  const normalizedId = fieldId.trim().toLowerCase();
  const aliases: Record<string, string[]> = {
    price: ["offerPrice"],
    offerprice: ["offerPrice"],
    regularprice: ["regularPrice"],
    businessname: ["businessName"],
    business_name: ["businessName"],
    location: ["city"],
    cta: ["ctaText"],
    ctatext: ["ctaText"],
  };

  for (const key of aliases[normalizedId] || []) {
    const candidate = (setupValues as Record<string, unknown>)[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const directSetupMatch = Object.entries(setupValues).find(([key, value]) => {
    return key.toLowerCase() === normalizedId && typeof value === "string" && value.trim();
  });
  return typeof directSetupMatch?.[1] === "string" ? directSetupMatch[1].trim() : "";
}

export function validateWizardStep({
  stepId,
  state,
  template,
  businessProfile,
}: {
  stepId: CampaignWizardStepId;
  state: CampaignLaunchState;
  template: TemplateSeed | null;
  businessProfile: BusinessProfile | null;
}): LaunchStepValidation {
  const issues: LaunchStepIssue[] = [];
  const setupValues = template ? getTemplateSetupValuesFromLaunchState(template, state, businessProfile) : null;

  switch (stepId) {
    case "industry":
      if (!state.selection.industry.trim()) {
        issues.push({
          code: "industry_missing",
          message: "Select an industry before continuing.",
          field: "selection.industry",
        });
      }
      break;
    case "template":
      if (!template) {
        issues.push({
          code: "template_missing",
          message: "Choose a template before continuing.",
          field: "selection.templateSlug",
        });
      }
      break;
    case "ad-type":
      if (!state.selection.adType) {
        issues.push({
          code: "ad_type_missing",
          message: "Pick an ad type before continuing.",
          field: "selection.adType",
        });
      }
      break;
    case "budget":
      if (!parseDailyBudgetAmount(state.campaign.dailyBudget)) {
        issues.push({
          code: "budget_invalid",
          message: "Enter a valid daily budget greater than 0.",
          field: "campaign.dailyBudget",
        });
      }
      break;
    case "location":
      if (!state.targeting.locations.length) {
        issues.push({
          code: "location_missing",
          message: "Add at least one target location before continuing.",
          field: "targeting.locations",
        });
      }
      break;
    case "tracking-pixel":
      if (state.selection.adType === "landing_page" && !state.integrationSelections.pixelId && !state.adTypeConfig.landingPage.pixelId) {
        issues.push({
          code: "pixel_missing",
          message: "Select a tracking pixel for landing page campaigns.",
          field: "integrationSelections.pixelId",
        });
      }
      break;
    case "placeholders":
      if (!template || !setupValues) break;
      for (const field of getTemplatePlaceholderFields(template)) {
        if (!field.required) continue;
        const value = resolvePlaceholderValue(field.id, state, setupValues);
        if (!value) {
          issues.push({
            code: `placeholder_${field.id}_missing`,
            message: `${field.label} is required before continuing.`,
            field: `placeholders.values.${field.id}`,
          });
        }
      }
      break;
    case "landing-page":
      if (state.selection.adType === "landing_page") {
        issues.push(
          ...validateUrlField(
            state.adTypeConfig.landingPage.url,
            "adTypeConfig.landingPage.url",
            "Landing page campaigns need a destination URL.",
            "Landing page URL is invalid.",
          ),
        );
      }
      break;
    case "phone-number":
      if (state.selection.adType === "call_now" && !state.adTypeConfig.callNow.phoneNumber.trim()) {
        issues.push({
          code: "phone_missing",
          message: "Provide a phone number for Call Now campaigns.",
          field: "adTypeConfig.callNow.phoneNumber",
        });
      }
      break;
    case "messenger-setup":
      if (
        (state.selection.adType === "messenger_leads" || state.selection.adType === "messenger_engagement") &&
        !state.adTypeConfig.messenger.welcomeMessage.trim() &&
        !state.adTypeConfig.messenger.replyPrompt.trim()
      ) {
        issues.push({
          code: "messenger_setup_missing",
          message: "Add a welcome message or reply prompt for Messenger campaigns.",
          field: "adTypeConfig.messenger",
        });
      }
      break;
    case "thank-you":
      if (state.selection.adType === "lead_form" && state.adTypeConfig.leadForm.thankYou.enabled) {
        const thankYou = state.adTypeConfig.leadForm.thankYou;
        if (
          (thankYou.buttonAction === "OPEN_WEBSITE" || thankYou.buttonAction === "DOWNLOAD") &&
          thankYou.websiteUrl.trim()
        ) {
          issues.push(
            ...validateUrlField(
              thankYou.websiteUrl,
              "adTypeConfig.leadForm.thankYou.websiteUrl",
              "Destination URL is required for this thank-you action.",
              "Destination URL is invalid.",
            ),
          );
        }
        if (thankYou.buttonAction === "CALL_BUSINESS" && !thankYou.completionPhone.trim()) {
          issues.push({
            code: "thank_you_phone_missing",
            message: "Call Business thank-you actions need a phone number.",
            field: "adTypeConfig.leadForm.thankYou.completionPhone",
          });
        }
      }
      break;
    case "overview":
      if (!state.integrationSelections.adAccountId) {
        issues.push({
          code: "ad_account_missing",
          message: "Select a Meta ad account before launch.",
          field: "integrationSelections.adAccountId",
        });
      }
      if (!state.integrationSelections.pageId) {
        issues.push({
          code: "page_missing",
          message: "Select a Facebook Page before launch.",
          field: "integrationSelections.pageId",
        });
      }
      if (state.selection.adType === "lead_form" && state.adTypeConfig.leadForm.mode === "managed_new") {
        if (!state.adTypeConfig.leadForm.managedFormName.trim()) {
          issues.push({
            code: "lead_form_name_missing",
            message: "Provide a managed lead form name before launch.",
            field: "adTypeConfig.leadForm.managedFormName",
          });
        }
        if (!state.adTypeConfig.leadForm.privacyPolicyUrl.trim()) {
          issues.push({
            code: "privacy_policy_missing",
            message: "Privacy policy URL is required for SideKick-managed lead forms.",
            field: "adTypeConfig.leadForm.privacyPolicyUrl",
          });
        } else {
          issues.push(
            ...validateUrlField(
              state.adTypeConfig.leadForm.privacyPolicyUrl,
              "adTypeConfig.leadForm.privacyPolicyUrl",
              "Privacy policy URL is required for SideKick-managed lead forms.",
              "Privacy policy URL is invalid.",
            ),
          );
        }
      }
      break;
    case "launch":
    default:
      break;
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function evaluateLaunchReadiness({
  state,
  template,
  businessProfile,
}: {
  state: CampaignLaunchState;
  template: TemplateSeed | null;
  businessProfile: BusinessProfile | null;
}) {
  const stepIds = getVisibleWizardSteps(state.selection.adType)
    .map((step) => step.id)
    .filter((stepId) => stepId !== "launch");
  const issues = stepIds.flatMap((stepId) =>
    validateWizardStep({ stepId, state, template, businessProfile }).issues,
  );

  const deduped = new Map<string, LaunchStepIssue>();
  for (const issue of issues) {
    deduped.set(`${issue.code}:${issue.field || ""}`, issue);
  }
  return [...deduped.values()];
}
