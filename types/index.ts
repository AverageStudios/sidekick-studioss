export type TemplateCategory =
  | "Lead Generation"
  | "Premium Service"
  | "Recurring Revenue"
  | "Seasonal Offer";

export type UserRole = "admin" | "user";
export type TemplateStatus = "draft" | "published" | "archived";
export type LeadStatus = "new" | "contacted" | "booked" | "closed";

export type TemplateSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  positioning: string;
  previewImage: string;
  ctaDefault: string;
  benefits: string[];
  faq: Array<{ question: string; answer: string }>;
  adCopy: {
    primary: string;
    headlines: string[];
    descriptions: string[];
    targeting: string;
    budget: string;
    creativeGuidance: string[];
  };
  funnel: {
    heroHeadline: string;
    heroSubheadline: string;
    offerLabel: string;
    whyChooseUs: string[];
    finalCta: string;
  };
};

export type TemplateConfigJson = Partial<{
  positioning: string;
  ctaDefault: string;
  benefits: string[];
  faq: Array<{ question: string; answer: string }>;
  adCopy: TemplateSeed["adCopy"];
  funnel: TemplateSeed["funnel"];
}>;

export type TemplateRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  preview_image_url: string | null;
  config_json: TemplateConfigJson | null;
  status: TemplateStatus;
  is_featured: boolean;
  version?: number | null;
  created_by?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TemplateSetupValues = {
  businessName: string;
  city: string;
  phone: string;
  email: string;
  offerPrice: string;
  regularPrice: string;
  ctaText: string;
  headline: string;
  subheadline: string;
  businessDescription: string;
  testimonialText: string;
  brandColor: string;
  followUpEnabled: boolean;
};

export type TemplateSetupAssetState = {
  logoUrl?: string | null;
  beforeImageUrls?: string[];
  afterImageUrls?: string[];
};

export type BusinessProfile = {
  id: string;
  business_name: string;
  location: string;
  phone: string;
  email: string;
  description: string;
  logo_url: string | null;
  brand_color: string | null;
  default_cta: string | null;
};

export type ProfileRecord = {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type CampaignRecord = {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  slug: string;
  offer_price: number | null;
  regular_price: number | null;
  cta_text: string;
  headline: string;
  subheadline: string;
  business_description: string;
  testimonial_text: string | null;
  before_images_json: string[];
  after_images_json: string[];
  source_template_version?: number | null;
  ad_copy_json: {
    primary: string;
    headlines: string[];
    descriptions: string[];
    targeting: string;
    budget: string;
    creativeGuidance: string[];
  };
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

export type FunnelRecord = {
  id: string;
  user_id: string;
  campaign_id: string;
  slug: string;
  is_published: boolean;
  published_at: string | null;
  config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LeadRecord = {
  id: string;
  user_id: string;
  campaign_id: string;
  funnel_id: string;
  name: string;
  phone: string;
  email: string;
  service_interest: string;
  message: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
};

export type CampaignBundle = {
  campaign: CampaignRecord;
  funnel: FunnelRecord;
  template: TemplateSeed;
  businessProfile: BusinessProfile | null;
};
