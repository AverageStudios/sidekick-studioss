import { TemplateRecord } from "@/types";

export type AdminTemplateFormData = {
  templateId?: string;
  currentVersion?: number;
  name: string;
  slug: string;
  category: string;
  industry: string;
  description: string;
  previewImageUrl: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  positioning: string;
  offerType: string;
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
    category: "Lead Generation",
    industry: "",
    description: "",
    previewImageUrl: "",
    status: "draft",
    isFeatured: false,
    positioning: "",
    offerType: "Quote request",
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
    followUpSubject: "Thanks for reaching out",
    followUpBody: "We got your request and will follow up shortly.",
    followUpSms: "",
    reminderMessage: "",
  };
}

export function getAdminTemplateFormData(record: TemplateRecord): AdminTemplateFormData {
  const config = record.config_json || {};
  const faq = config.faq || [];
  const benefits = config.benefits || [];
  const offerStructure = config.offerStructure || [];
  const adCopy = config.adCopy;
  const funnel = config.funnel;
  const followUpDefaults = config.followUpDefaults;
  const leadFlowDefaults = config.leadFlowDefaults;

  return {
    templateId: record.id,
    currentVersion: record.version || 1,
    name: record.name,
    slug: record.slug,
    category: record.category,
    industry: config.industry || "",
    description: record.description,
    previewImageUrl: record.preview_image_url || "",
    status: record.status,
    isFeatured: record.is_featured,
    positioning: config.positioning || "",
    offerType: config.offerType || "Quote request",
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
    followUpSubject: followUpDefaults?.subject || "Thanks for reaching out",
    followUpBody: followUpDefaults?.body || "We got your request and will follow up shortly.",
    followUpSms: followUpDefaults?.sms || "",
    reminderMessage: followUpDefaults?.reminder || "",
  };
}
