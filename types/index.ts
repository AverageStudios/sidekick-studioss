export type TemplateCategory =
  | "Lead Generation"
  | "Premium Service"
  | "Recurring Revenue"
  | "Seasonal Offer";

export type UserRole = "admin" | "user";
export type TemplateStatus = "draft" | "published" | "archived";
export type LeadStatus = "new" | "contacted" | "booked" | "closed";
export type CampaignPlatform = "meta";
export type CampaignLocationScope = "world" | "country" | "state" | "city" | "address";
export type CampaignLocationTargetingType = "home" | "recent" | "travel_in" | "recent_and_home";
export type CampaignLaunchStep = "platform" | "category" | "template" | "campaign-details";
export type CampaignDetailsStep =
  | "goal"
  | "budget"
  | "location"
  | "pixel"
  | "placeholders"
  | "thank-you"
  | "review"
  | "advanced";
export type CampaignGoal =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_APP_PROMOTION"
  | "OUTCOME_SALES";
export type CampaignLeadFormMode = "existing" | "managed_new";
export type CampaignPublishMode = "draft" | "live";

export type TemplatePlaceholderField = {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: "text" | "currency" | "number";
  required?: boolean;
};

export type CampaignLaunchState = {
  platform: CampaignPlatform;
  category: string;
  templateSlug: string;
  currentStep: CampaignLaunchStep;
  currentDetailsStep: CampaignDetailsStep;
  campaignGoal: CampaignGoal;
  dailyBudget: string;
  targetLocation: string;
  targetLocations?: Array<{
    id: string;
    label: string;
    radius: string;
    targetingMode: CampaignLocationTargetingType;
    scope?: CampaignLocationScope;
    lat?: number;
    lon?: number;
    countryCode?: string;
  }>;
  trackingPixelId: string;
  trackingPixelName: string;
  placeholderValues: Record<string, string>;
  thankYouPage: {
    headline: string;
    description: string;
    buttonLabel: string;
    destinationUrl: string;
  };
  advanced: {
    campaignName: string;
    leadFormName: string;
    customAudiences: string;
    privacyPolicyUrl: string;
  };
  targeting: {
    ageMin: string;
    ageMax: string;
    gender: "all" | "male" | "female";
    interests: string;
    customAudiences: string;
  };
  leadForm: {
    mode: CampaignLeadFormMode;
    selectedFormId: string;
    selectedFormName: string;
    managedFormName: string;
    fields: Array<"FULL_NAME" | "EMAIL" | "PHONE">;
  };
  integrationSelections: {
    adAccountId: string;
    pageId: string;
    pixelId: string;
    leadFormId: string;
    instagramActorId: string;
  };
  previewTab?: "ad" | "lead-form" | "thank-you";
};

export type TemplateSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  industry?: string;
  positioning: string;
  previewImage: string;
  ctaDefault: string;
  offerStructure?: string[];
  placeholderFields?: TemplatePlaceholderField[];
  benefits: string[];
  faq: Array<{ question: string; answer: string }>;
  adCopy: {
    primary: string;
    headlines: string[];
    descriptions: string[];
    targeting: string;
    budget: string;
    creativeGuidance: string[];
    objective?: string;
  };
  funnel: {
    heroHeadline: string;
    heroSubheadline: string;
    offerLabel: string;
    whyChooseUs: string[];
    finalCta: string;
    pageIntro?: string;
    formCta?: string;
    formFields?: string[];
    nextStepFlow?: string[];
  };
};

export type TemplateConfigJson = Partial<{
  industry: string;
  positioning: string;
  offerType: string;
  promoDetails: string;
  ctaDefault: string;
  offerStructure: string[];
  placeholderFields: TemplatePlaceholderField[];
  benefits: string[];
  faq: Array<{ question: string; answer: string }>;
  adCopy: TemplateSeed["adCopy"];
  funnel: TemplateSeed["funnel"];
  leadFlowDefaults: {
    pageIntro: string;
    formCta: string;
    formFields: string[];
    nextStepFlow: string[];
  };
  followUpDefaults: {
    subject: string;
    body: string;
    sms?: string;
    reminder?: string;
  };
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
  placeholderValues?: Record<string, string>;
  campaignGoal?: CampaignGoal;
  dailyBudget?: string;
  targetLocation?: string;
  thankYouHeadline?: string;
  thankYouDescription?: string;
  thankYouButtonText?: string;
  destinationUrl?: string;
};

export type TemplateSetupAssetState = {
  logoUrl?: string | null;
  beforeImageUrls?: string[];
  afterImageUrls?: string[];
};

export type BusinessProfile = {
  id: string;
  user_id: string;
  workspace_id: string | null;
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
  first_name: string | null;
  last_name: string | null;
  selected_industry: string | null;
  starting_template_id: string | null;
  active_workspace_id: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceRole = "owner" | "admin" | "member";

export type WorkspaceRecord = {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMembershipRecord = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  updated_at: string;
};

export type WorkspaceSummary = WorkspaceRecord & {
  role: WorkspaceRole;
};

export type WorkspaceContext = {
  profile: ProfileRecord;
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary;
  businessProfile: BusinessProfile | null;
  userDisplayName: string;
  userEmail: string;
  userInitials: string;
  workspaceInitial: string;
};

export type WorkspaceMember = {
  membershipId: string;
  userId: string;
  role: WorkspaceRole;
  displayName: string;
  email: string;
  initials: string;
  isCurrentUser: boolean;
};

export type WorkspaceInvitationRole = "admin" | "member";
export type WorkspaceInvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type WorkspaceInvitation = {
  id: string;
  workspace_id: string;
  invited_email: string;
  invited_role: WorkspaceInvitationRole;
  invited_by_user_id: string;
  token: string;
  status: WorkspaceInvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  accepted_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignRecord = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  template_id: string;
  launch_platform?: CampaignPlatform | null;
  launch_category?: string | null;
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
  launch_state_json?: CampaignLaunchState | null;
  external_publish_status?: string | null;
  external_ids_json?: Record<string, unknown> | null;
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
  workspace_id: string | null;
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
  workspace_id: string | null;
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
