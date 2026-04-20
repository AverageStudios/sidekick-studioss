import { BusinessProfile, CampaignBundle, CampaignRecord, FunnelRecord, LeadRecord } from "@/types";
import { detailingTemplates } from "@/data/templates";
import { createCampaignBlueprint } from "@/lib/template-engine";

const demoProfile: BusinessProfile = {
  id: "profile-demo",
  user_id: "demo-user",
  workspace_id: "workspace-demo",
  business_name: "SideKick Detail Co.",
  location: "Charlotte, NC",
  phone: "(704) 555-0183",
  email: "hello@sidekickstudioss.com",
  description:
    "Mobile-friendly detailing offers for busy drivers who want a cleaner car without a complicated process.",
  logo_url: "/sidekick-logo.png",
  brand_color: "#6D5EF8",
  default_cta: "Get Started",
};

const template = detailingTemplates[0];
const blueprint = createCampaignBlueprint(
  template,
  {
    businessName: demoProfile.business_name,
    city: demoProfile.location,
    phone: demoProfile.phone,
    email: demoProfile.email,
    offerPrice: "179",
    regularPrice: "249",
    ctaText: "Get My Quote",
    headline: "",
    subheadline: "",
    businessDescription:
      "We help busy drivers keep their cars looking sharp with straightforward packages and fast replies.",
    testimonialText:
      "Quick to respond, easy to book, and the car looked better than expected when I picked it up.",
    brandColor: demoProfile.brand_color || "#6D5EF8",
    followUpEnabled: true,
  },
  {
    logoUrl: demoProfile.logo_url,
    beforeImageUrls: ["/demo/before-1.svg", "/demo/before-2.svg"],
    afterImageUrls: ["/demo/after-1.svg", "/demo/after-2.svg"],
  },
);

export const demoCampaign: CampaignRecord = {
  id: "campaign-demo",
  user_id: "demo-user",
  workspace_id: "workspace-demo",
  template_id: template.id,
  name: blueprint.campaignName,
  slug: blueprint.slug,
  offer_price: 179,
  regular_price: 249,
  cta_text: "Get My Quote",
  headline: blueprint.funnelConfig.headline,
  subheadline: blueprint.funnelConfig.subheadline,
  business_description: blueprint.funnelConfig.businessDescription,
  testimonial_text: blueprint.funnelConfig.testimonialText,
  before_images_json: blueprint.funnelConfig.beforeImageUrls,
  after_images_json: blueprint.funnelConfig.afterImageUrls,
  ad_copy_json: blueprint.adCopy,
  status: "published",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoFunnel: FunnelRecord = {
  id: "funnel-demo",
  user_id: "demo-user",
  workspace_id: "workspace-demo",
  campaign_id: demoCampaign.id,
  slug: "sidekick-full-detail-demo",
  is_published: true,
  published_at: new Date().toISOString(),
  config_json: blueprint.funnelConfig,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoLeads: LeadRecord[] = [
  {
    id: "lead-1",
    user_id: "demo-user",
    workspace_id: "workspace-demo",
    campaign_id: demoCampaign.id,
    funnel_id: demoFunnel.id,
    name: "Jordan Hayes",
    phone: "(704) 555-0141",
    email: "jordan@example.com",
    service_interest: "Full Detail Promo",
    message: "Need something this week before a road trip.",
    status: "new",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "lead-2",
    user_id: "demo-user",
    workspace_id: "workspace-demo",
    campaign_id: demoCampaign.id,
    funnel_id: demoFunnel.id,
    name: "Avery Brooks",
    phone: "(704) 555-0190",
    email: "avery@example.com",
    service_interest: "Ceramic Coating Promo",
    message: "Interested in coating pricing for a new SUV.",
    status: "contacted",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const demoBundle: CampaignBundle = {
  campaign: demoCampaign,
  funnel: demoFunnel,
  template,
  businessProfile: demoProfile,
};

export const demoUser = {
  id: "demo-user",
  email: "demo@sidekickstudioss.com",
};
