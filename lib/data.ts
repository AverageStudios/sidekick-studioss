import { cache } from "react";
import { detailingTemplates, getTemplateBySlug } from "@/data/templates";
import { demoBundle, demoCampaign, demoFunnel, demoLeads } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BusinessProfile, CampaignBundle, LeadRecord } from "@/types";

export const getTemplates = cache(async () => detailingTemplates);

export const getTemplate = cache(async (slug: string) => getTemplateBySlug(slug));

export const getBusinessProfile = cache(async (userId: string) => {
  if (!isSupabaseConfigured()) {
    return demoBundle.businessProfile;
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase!
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as BusinessProfile | null;
});

export const getDashboardSnapshot = cache(async (userId: string) => {
  if (!isSupabaseConfigured()) {
    return {
      liveFunnels: 1,
      newLeads: demoLeads.filter((lead) => lead.status === "new").length,
      contactedLeads: demoLeads.filter((lead) => lead.status === "contacted").length,
      bookedLeads: demoLeads.filter((lead) => lead.status === "booked").length,
      recentLeads: demoLeads,
      campaigns: [demoCampaign],
      funnels: [demoFunnel],
    };
  }

  const supabase = createSupabaseAdminClient();
  const [funnelsResult, leadsResult, campaignsResult] = await Promise.all([
    supabase!.from("funnels").select("*").eq("user_id", userId),
    supabase!.from("leads").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
    supabase!.from("campaigns").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const leads = (leadsResult.data || []) as LeadRecord[];

  return {
    liveFunnels: (funnelsResult.data || []).filter((funnel) => funnel.is_published).length,
    newLeads: leads.filter((lead) => lead.status === "new").length,
    contactedLeads: leads.filter((lead) => lead.status === "contacted").length,
    bookedLeads: leads.filter((lead) => lead.status === "booked").length,
    recentLeads: leads,
    campaigns: campaignsResult.data || [],
    funnels: funnelsResult.data || [],
  };
});

export const getCampaignBundle = cache(async (userId: string, id: string) => {
  if (!isSupabaseConfigured()) {
    if (id === demoCampaign.id) {
      return demoBundle;
    }
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: campaign } = await supabase!
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!campaign) return null;

  const [funnel, profile] = await Promise.all([
    supabase!.from("funnels").select("*").eq("campaign_id", campaign.id).single(),
    getBusinessProfile(userId),
  ]);

  const template = detailingTemplates.find((item) => item.id === campaign.template_id);
  const resolvedTemplate = template || detailingTemplates.find((item) => item.id === campaign.template_id);
  if (!resolvedTemplate) return null;

  return {
    campaign,
    funnel: funnel.data,
    template: resolvedTemplate,
    businessProfile: profile,
  } as CampaignBundle;
});

export const getFunnelBundleById = cache(async (userId: string, id: string) => {
  if (!isSupabaseConfigured()) {
    if (id === demoFunnel.id) {
      return demoBundle;
    }
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: funnel } = await supabase!
    .from("funnels")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!funnel) return null;

  const { data: campaign } = await supabase!
    .from("campaigns")
    .select("*")
    .eq("id", funnel.campaign_id)
    .single();

  if (!campaign) return null;

  const template = detailingTemplates.find((item) => item.id === campaign.template_id);
  if (!template) return null;

  const businessProfile = await getBusinessProfile(userId);

  return {
    campaign,
    funnel,
    template,
    businessProfile,
  } as CampaignBundle;
});

export const getFunnelBySlug = cache(async (slug: string) => {
  if (!isSupabaseConfigured()) {
    return demoBundle;
  }

  const supabase = createSupabaseAdminClient();
  const { data: funnel } = await supabase!
    .from("funnels")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!funnel) return null;

  const { data: campaign } = await supabase!
    .from("campaigns")
    .select("*")
    .eq("id", funnel.campaign_id)
    .single();

  if (!campaign) return null;

  const template = detailingTemplates.find((item) => item.id === campaign.template_id);
  if (!template) return null;

  const profile = await getBusinessProfile(campaign.user_id);

  return {
    campaign,
    funnel,
    template,
    businessProfile: profile,
  } as CampaignBundle;
});

export const getLeads = cache(async (userId: string, status?: string) => {
  if (!isSupabaseConfigured()) {
    return status ? demoLeads.filter((lead) => lead.status === status) : demoLeads;
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase!.from("leads").select("*").eq("user_id", userId).order("created_at", {
    ascending: false,
  });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return (data || []) as LeadRecord[];
});
