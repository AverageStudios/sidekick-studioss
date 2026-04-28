import { TemplateRecord } from "@/types";
import { normalizeIndustryLabel, normalizeOfferTypeLabel } from "@/data/template-taxonomy";

export type LeadFormSettings = {
  formType: "higher_intent" | "more_volume";
  locale: string;
  sameLeadForm: boolean;
  enablePhoneOtp: boolean;
  backgroundImageSource: "default" | "custom";
  greetingTitle: string;
  greetingBody: string;
  multipleChoiceQuestions: Array<{
    label: string;
    options: string[];
  }>;
  shortQuestions: string[];
  standardQuestions: string[];
  disclaimerTitle: string;
  disclaimerBody: string;
  disclaimerConsent: string;
  privacyPolicyUrl: string;
  enableMessenger: boolean;
};

export function getEmptyLeadFormSettings(): LeadFormSettings {
  return {
    formType: "more_volume",
    locale: "EN_US",
    sameLeadForm: false,
    enablePhoneOtp: false,
    backgroundImageSource: "default",
    greetingTitle: "",
    greetingBody: "",
    multipleChoiceQuestions: [
      {
        label: "",
        options: ["", ""],
      },
    ],
    shortQuestions: [""],
    standardQuestions: ["FULL_NAME", "PHONE", "EMAIL"],
    disclaimerTitle: "",
    disclaimerBody: "",
    disclaimerConsent: "",
    privacyPolicyUrl: "",
    enableMessenger: false,
  };
}

export type AdminTemplateFormData = {
  templateId?: string;
  currentVersion?: number;
  name: string;
  slug: string;
  category: string;
  industry: string;
  description: string;
  previewImageUrl: string;
  mediaImageUrls: string[];
  mediaVideoUrls: string[];
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  positioning: string;
  campaignType: string;
  audienceType: string;
  offerFramework: string;
  displayLink: string;
  adFormat: string;
  mediaType: string;
  adSetStructure: string;
  advantagePlusSettings: string;
  placements: string;
  dynamicCreative: string;
  conversionEvent: string;
  specialAdCategory: string;
  kpiCtrAll: string;
  kpiCtrLink: string;
  kpiCr: string;
  kpiCpa: string;
  utmParameters: string;
  offerType: string;
  supportedAdTypes: string[];
  defaultAdType: string;
  promoDetails: string;
  headline: string;
  subheadline: string;
  ctaDefault: string;
  offerLabel: string;
  offerStructure: string;
  benefits: string;
  faq: string;
  campaignObjective: string;
  adPrimary: string;
  adHeadlines: string;
  adDescriptions: string;
  targeting: string;
  budget: string;
  creativeGuidance: string;
  landingIntro: string;
  formCta: string;
  formFields: string;
  nextStepFlow: string;
  landingPageUrl: string;
  phoneNumber: string;
  messengerWelcomeMessage: string;
  messengerReplyPrompt: string;
  thankYouEnabled: boolean;
  thankYouHeadline: string;
  thankYouDescription: string;
  thankYouButtonText: string;
  thankYouWebsiteUrl: string;
  leadFormSettingsJson: string;
  followUpSubject: string;
  followUpBody: string;
  followUpSms: string;
  reminderMessage: string;
};

export type AdminTemplateFieldName = keyof AdminTemplateFormData;

export type AdminTemplateActionState = {
  formError: string | null;
  fieldErrors: Partial<Record<AdminTemplateFieldName, string>>;
};

export const emptyAdminTemplateActionState: AdminTemplateActionState = {
  formError: null,
  fieldErrors: {},
};

export function getEmptyAdminTemplateFormData(): AdminTemplateFormData {
  return {
    name: "",
    slug: "",
    category: "",
    industry: "Car Detailing",
    description: "",
    previewImageUrl: "",
    mediaImageUrls: [],
    mediaVideoUrls: [],
    status: "draft",
    isFeatured: false,
    positioning: "",
    campaignType: "standard",
    audienceType: "b2c",
    offerFramework: "direct_response",
    displayLink: "",
    adFormat: "individual",
    mediaType: "image",
    adSetStructure: "one_ad_set_multiple_ads",
    advantagePlusSettings: "automatic",
    placements: "automatic",
    dynamicCreative: "off",
    conversionEvent: "lead",
    specialAdCategory: "none",
    kpiCtrAll: "",
    kpiCtrLink: "",
    kpiCr: "",
    kpiCpa: "",
    utmParameters:
      "utm_source=Facebook&utm_campaign={{campaign.name}}&utm_medium={{adset.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&utm_term={{adset.name}}",
    offerType: "Quote Request",
    supportedAdTypes: ["lead_form"],
    defaultAdType: "lead_form",
    promoDetails: "",
    headline: "",
    subheadline: "",
    ctaDefault: "Get Started",
    offerLabel: "Limited-time offer",
    offerStructure: "",
    benefits: "",
    faq: "",
    campaignObjective: "Lead generation",
    adPrimary: "",
    adHeadlines: "",
    adDescriptions: "",
    targeting: "",
    budget: "",
    creativeGuidance: "",
    landingIntro: "",
    formCta: "Request details",
    formFields: "Name\nPhone\nEmail",
    nextStepFlow: "",
    landingPageUrl: "",
    phoneNumber: "",
    messengerWelcomeMessage: "",
    messengerReplyPrompt: "",
    thankYouEnabled: true,
    thankYouHeadline: "Thanks, we got your request.",
    thankYouDescription: "We'll follow up shortly with the next step.",
    thankYouButtonText: "Back to site",
    thankYouWebsiteUrl: "",
    leadFormSettingsJson: JSON.stringify(getEmptyLeadFormSettings()),
    followUpSubject: "Thanks for reaching out",
    followUpBody: "We got your request and will follow up shortly.",
    followUpSms: "",
    reminderMessage: "",
  };
}

export function getAdminTemplateFormData(record: TemplateRecord): AdminTemplateFormData {
  const config = (record.config_json || {}) as NonNullable<TemplateRecord["config_json"]>;
  const creativeAssets = config.creativeAssets || {};
  const faq = config.faq || [];
  const benefits = config.benefits || [];
  const offerStructure = config.offerStructure || [];
  const adCopy = config.adCopy;
  const funnel = config.funnel;
  const followUpDefaults = config.followUpDefaults;
  const leadFlowDefaults = config.leadFlowDefaults;
  const leadFormSettings = config.leadFormSettings || {};
  const adTypeConfig = config.adTypeConfig || {};
  const additionalSettings = config.additionalSettings || {};
  const defaultAdType = (config.defaultAdType || (config.supportedAdTypes || [])[0] || "lead_form") as string;

  return {
    templateId: record.id,
    currentVersion: record.version || 1,
    name: record.name,
    slug: record.slug,
    category: record.category || config.industry || "",
    industry: normalizeIndustryLabel(record.industry || config.industry || record.category || ""),
    description: record.description,
    previewImageUrl: record.preview_image_url || "",
    mediaImageUrls: creativeAssets.imageUrls || [],
    mediaVideoUrls: creativeAssets.videoUrls || [],
    status: record.status,
    isFeatured: record.is_featured,
    positioning: config.positioning || "",
    campaignType: config.campaignType || "standard",
    audienceType: config.audienceType || "b2c",
    offerFramework: config.offerFramework || "direct_response",
    displayLink: config.displayLink || "",
    adFormat: config.adFormat || "individual",
    mediaType: config.mediaType || "image",
    adSetStructure: config.campaignSettings?.adSetStructure || "one_ad_set_multiple_ads",
    advantagePlusSettings: config.campaignSettings?.advantagePlusSettings || "automatic",
    placements: config.campaignSettings?.placements || "automatic",
    dynamicCreative: config.campaignSettings?.dynamicCreative || "off",
    conversionEvent: config.campaignSettings?.conversionEvent || "lead",
    specialAdCategory: additionalSettings.specialAdCategory || "none",
    kpiCtrAll: additionalSettings.kpiThresholds?.ctrAll || "",
    kpiCtrLink: additionalSettings.kpiThresholds?.ctrLink || "",
    kpiCr: additionalSettings.kpiThresholds?.cr || "",
    kpiCpa: additionalSettings.kpiThresholds?.cpa || "",
    utmParameters:
      additionalSettings.utmParameters ||
      "utm_source=Facebook&utm_campaign={{campaign.name}}&utm_medium={{adset.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&utm_term={{adset.name}}",
    offerType: normalizeOfferTypeLabel(record.offer_type || config.offerType || "Quote Request"),
    supportedAdTypes: config.supportedAdTypes || ["lead_form"],
    defaultAdType,
    promoDetails: config.promoDetails || "",
    headline: funnel?.heroHeadline || "",
    subheadline: funnel?.heroSubheadline || "",
    ctaDefault: config.ctaDefault || funnel?.finalCta || "Get Started",
    offerLabel: funnel?.offerLabel || "Limited-time offer",
    offerStructure: offerStructure.join("\n"),
    benefits: benefits.join("\n"),
    faq: faq.map((item) => `${item.question} | ${item.answer}`).join("\n"),
    campaignObjective: adCopy?.objective || "Lead generation",
    adPrimary: adCopy?.primary || "",
    adHeadlines: (adCopy?.headlines || []).join("\n"),
    adDescriptions: (adCopy?.descriptions || []).join("\n"),
    targeting: adCopy?.targeting || "",
    budget: adCopy?.budget || "",
    creativeGuidance: (adCopy?.creativeGuidance || []).join("\n"),
    landingIntro: leadFlowDefaults?.pageIntro || "",
    formCta: leadFlowDefaults?.formCta || config.ctaDefault || funnel?.finalCta || "Request details",
    formFields: (leadFlowDefaults?.formFields || []).join("\n"),
    nextStepFlow: (leadFlowDefaults?.nextStepFlow || []).join("\n"),
    landingPageUrl: adTypeConfig.landing_page?.landingPageUrl || "",
    phoneNumber: adTypeConfig.call_now?.phoneNumber || "",
    messengerWelcomeMessage: adTypeConfig.messenger_leads?.messengerWelcomeMessage || adTypeConfig.messenger_engagement?.messengerWelcomeMessage || "",
    messengerReplyPrompt: adTypeConfig.messenger_leads?.messengerReplyPrompt || adTypeConfig.messenger_engagement?.messengerReplyPrompt || "",
    thankYouEnabled: adTypeConfig.lead_form?.thankYouEnabled ?? true,
    thankYouHeadline: adTypeConfig.lead_form?.thankYouHeadline || "Thanks, we got your request.",
    thankYouDescription: adTypeConfig.lead_form?.thankYouDescription || "We'll follow up shortly with the next step.",
    thankYouButtonText: adTypeConfig.lead_form?.thankYouButtonLabel || "Back to site",
    thankYouWebsiteUrl: adTypeConfig.lead_form?.thankYouWebsiteUrl || "",
    leadFormSettingsJson: JSON.stringify({
      ...getEmptyLeadFormSettings(),
      ...leadFormSettings,
    }),
    followUpSubject: followUpDefaults?.subject || "Thanks for reaching out",
    followUpBody: followUpDefaults?.body || "We got your request and will follow up shortly.",
    followUpSms: followUpDefaults?.sms || "",
    reminderMessage: followUpDefaults?.reminder || "",
  };
}
