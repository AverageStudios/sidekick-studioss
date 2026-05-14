export type TemplateIndustry =
  | "Car Detailing"
  | "Chiropractic"
  | "Physical Therapy"
  | "Cleaning Services"
  | "Fitness / Personal Training"
  | "Flooring"
  | "Landscape / Lawn Care"
  | "Plumbing"
  | "Pool Services"
  | "Roofing"
  | "Spas & Massage";

export type TemplateOfferType =
  | "Consultation"
  | "Quote Request"
  | "Service Booking"
  | "Inspection"
  | "Route Fill"
  | "Appointment Booking"
  | "Emergency Service"
  | "Recurring Maintenance"
  | "Membership / Program"
  | "High-Ticket Offer"
  | "Seasonal Promotion"
  | "Reactivation / Follow-Up";

export type TemplateCategory = TemplateIndustry;

export type UserRole = "admin" | "user";
export type TemplateStatus = "draft" | "published" | "archived";
export type LeadStatus = "new" | "contacted" | "booked" | "closed";
export type CampaignPlatform = "meta";
export type CampaignLocationScope = "world" | "country" | "state" | "city" | "zip" | "neighborhood" | "address";
export type CampaignLocationTargetingType = "home" | "recent" | "travel_in" | "recent_and_home";
export type CampaignAdType =
  | "lead_form"
  | "landing_page"
  | "call_now"
  | "messenger_leads"
  | "messenger_engagement";
export type MetaLocationClassification =
  | "world"
  | "country"
  | "region"
  | "city"
  | "zip"
  | "neighborhood"
  | "address"
  | "unknown";
export type MetaLocationTargeting = {
  key?: string;
  type?: string;
  classification?: MetaLocationClassification;
  name?: string;
  addressString?: string;
  countryCode?: string;
  countryName?: string;
  region?: string;
  regionId?: string;
  primaryCity?: string;
  primaryCityId?: string;
  latitude?: number;
  longitude?: number;
  supportsCity?: boolean;
  supportsRegion?: boolean;
  raw?: Record<string, unknown>;
};
export type CampaignWizardStepId =
  | "industry"
  | "template"
  | "ad-type"
  | "budget"
  | "location"
  | "tracking-pixel"
  | "placeholders"
  | "thank-you"
  | "landing-page"
  | "phone-number"
  | "messenger-setup"
  | "overview"
  | "launch";
export type CampaignGoal =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_APP_PROMOTION"
  | "OUTCOME_SALES";
export type CampaignLeadFormMode = "existing" | "managed_new";
export type CampaignPublishMode = "draft" | "live";
export type CampaignThankYouDestinationMode = "facebook" | "website";
export type CampaignThankYouButtonAction = "OPEN_WEBSITE" | "DOWNLOAD" | "CALL_BUSINESS";
export type CampaignLeadFormField = "FULL_NAME" | "EMAIL" | "PHONE";

export type TemplatePlaceholderField = {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: "text" | "currency" | "number";
  required?: boolean;
};

export type CampaignLaunchLocation = {
  id: string;
  label: string;
  radius: string;
  radiusAllowed?: boolean;
  distanceUnit?: "mile" | "kilometer";
  targetingMode: CampaignLocationTargetingType;
  scope?: CampaignLocationScope;
  lat?: number;
  lon?: number;
  countryCode?: string;
  metaLocation?: MetaLocationTargeting;
};

export type CampaignLaunchState = {
  version: 2;
  platform: CampaignPlatform;
  stepId: CampaignWizardStepId;
  selection: {
    industry: string;
    category: string;
    offerType: string;
    templateSlug: string;
    adType: CampaignAdType;
  };
  campaign: {
    objective: CampaignGoal;
    name: string;
    dailyBudget: string;
  };
  targeting: {
    locations: CampaignLaunchLocation[];
    ageMin: string;
    ageMax: string;
    gender: "all" | "male" | "female";
    interests: string;
    customAudiences: string;
  };
  placeholders: {
    values: Record<string, string>;
  };
  adTypeConfig: {
    leadForm: {
      mode: CampaignLeadFormMode;
      selectedFormId: string;
      selectedFormName: string;
      managedFormName: string;
      fields: CampaignLeadFormField[];
      privacyPolicyUrl: string;
      thankYou: {
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
    };
    landingPage: {
      url: string;
      pixelId: string;
      pixelName: string;
    };
    callNow: {
      phoneNumber: string;
    };
    messenger: {
      welcomeMessage: string;
      replyPrompt: string;
    };
  };
  integrationSelections: {
    adAccountId: string;
    pageId: string;
    pixelId: string;
    leadFormId: string;
    instagramActorId: string;
  };
  review: {
    headline: string;
    subheadline: string;
    businessDescription: string;
    testimonialText: string;
    ctaText: string;
  };
  previewTab?: "ad" | "lead-form" | "thank-you";
};

export type TemplateSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  industry: TemplateIndustry;
  offerType: TemplateOfferType;
  campaignType?: string;
  audienceType?: string;
  offerFramework?: string;
  displayLink?: string;
  promoDetails?: string;
  adFormat?: string;
  mediaType?: string;
  campaignSettings?: {
    adSetStructure?: string;
    advantagePlusSettings?: string;
    placements?: string;
    dynamicCreative?: string;
    conversionEvent?: string;
  };
  additionalSettings?: {
    specialAdCategory?: string;
    kpiThresholds?: {
      ctrAll?: string;
      ctrLink?: string;
      cr?: string;
      cpa?: string;
    };
    utmParameters?: string;
  };
  supportedAdTypes?: CampaignAdType[];
  defaultAdType?: CampaignAdType;
  positioning: string;
  previewImage: string;
  creativeAssets?: {
    imageUrls?: string[];
    videoUrls?: string[];
  };
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
  adTypeConfig?: Partial<
    Record<
      CampaignAdType,
      {
        landingPageUrl?: string;
        phoneNumber?: string;
        messengerWelcomeMessage?: string;
        messengerReplyPrompt?: string;
        thankYouEnabled?: boolean;
        thankYouHeadline?: string;
        thankYouDescription?: string;
        thankYouButtonLabel?: string;
        thankYouWebsiteUrl?: string;
      }
    >
  >;
};

export type TemplateConfigJson = Partial<{
  industry: string;
  category: string;
  positioning: string;
  offerType: string;
  campaignType: string;
  audienceType: string;
  offerFramework: string;
  displayLink: string;
  adFormat: string;
  mediaType: string;
  campaignSettings: TemplateSeed["campaignSettings"];
  additionalSettings: TemplateSeed["additionalSettings"];
  supportedAdTypes: CampaignAdType[];
  defaultAdType: CampaignAdType;
  promoDetails: string;
  ctaDefault: string;
  offerStructure: string[];
  placeholderFields: TemplatePlaceholderField[];
  benefits: string[];
  faq: Array<{ question: string; answer: string }>;
  adCopy: TemplateSeed["adCopy"];
  funnel: TemplateSeed["funnel"];
  adTypeConfig: TemplateSeed["adTypeConfig"];
  creativeAssets: {
    imageUrls?: string[];
    videoUrls?: string[];
  };
  leadFlowDefaults: {
    pageIntro: string;
    formCta: string;
    formFields: string[];
    nextStepFlow: string[];
  };
  leadFormSettings: {
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
  industry?: TemplateIndustry | string | null;
  offer_type?: TemplateOfferType | string | null;
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
  adType?: CampaignAdType;
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
  landingPageUrl?: string;
  phoneNumber?: string;
  messengerWelcomeMessage?: string;
  messengerReplyPrompt?: string;
  thankYouEnabled?: boolean;
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
  launch_industry?: string | null;
  launch_offer_type?: string | null;
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
