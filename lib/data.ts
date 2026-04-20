import { cache } from "react";
import { getTemplateById, hydrateTemplateRecord } from "@/data/templates";
import { demoBundle, demoCampaign, demoFunnel, demoLeads } from "@/lib/demo-data";
import { isSupabaseServerConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listPublishedTemplates, getPublishedTemplateBySlug } from "@/lib/template-repository";
import { ensureWorkspaceContextByUserId, getActiveWorkspaceIdForUser, userHasWorkspaceAccess } from "@/lib/workspaces";
import { getWorkspaceMetaIntegrationState } from "@/lib/meta-integration";
import { BusinessProfile, CampaignBundle, LeadRecord, TemplateRecord } from "@/types";

async function getTemplateRecordById(id: string) {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return (data as TemplateRecord | null) || null;
}

export const getTemplates = cache(async () => listPublishedTemplates());

export const getTemplate = cache(async (slug: string) => getPublishedTemplateBySlug(slug));

export const getBusinessProfile = cache(async (userId: string) => {
  if (!isSupabaseServerConfigured()) {
    return demoBundle.businessProfile;
  }

  const context = await ensureWorkspaceContextByUserId(userId);
  return context?.businessProfile || null;
});

export const getDashboardSnapshot = cache(async (userId: string) => {
  if (!isSupabaseServerConfigured()) {
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
  if (!supabase) {
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
  const activeWorkspaceId = await getActiveWorkspaceIdForUser(userId);
  const [funnelsResult, leadsResult, campaignsResult] = await Promise.all([
    activeWorkspaceId
      ? supabase.from("funnels").select("*").eq("workspace_id", activeWorkspaceId)
      : supabase.from("funnels").select("*").eq("user_id", userId),
    activeWorkspaceId
      ? supabase.from("leads").select("*").eq("workspace_id", activeWorkspaceId).order("created_at", { ascending: false }).limit(8)
      : supabase.from("leads").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
    activeWorkspaceId
      ? supabase.from("campaigns").select("*").eq("workspace_id", activeWorkspaceId).order("created_at", { ascending: false })
      : supabase.from("campaigns").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
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
  if (!isSupabaseServerConfigured()) {
    if (id === demoCampaign.id) {
      return demoBundle;
    }
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) return null;
  const allowed = await userHasWorkspaceAccess(userId, campaign.workspace_id);
  if (!allowed) return null;

  const latestSnapshot = await supabase
    .from("campaign_launch_snapshots")
    .select("snapshot_json")
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hydratedCampaign =
    latestSnapshot.data?.snapshot_json
      ? {
          ...campaign,
          launch_state_json: latestSnapshot.data.snapshot_json,
        }
      : campaign;

  const funnel = await supabase.from("funnels").select("*").eq("campaign_id", campaign.id).single();
  const profile = campaign.workspace_id
    ? (
        await supabase
          .from("business_profiles")
          .select("*")
          .eq("workspace_id", campaign.workspace_id)
          .maybeSingle()
      ).data
    : await getBusinessProfile(userId);

  const templateRecord = await getTemplateRecordById(campaign.template_id);
  const template = templateRecord ? hydrateTemplateRecord(templateRecord) : getTemplateById(campaign.template_id);
  const resolvedTemplate = template || getTemplateById(campaign.template_id);
  if (!resolvedTemplate) return null;

  return {
    campaign: hydratedCampaign,
    funnel: funnel.data,
    template: resolvedTemplate,
    businessProfile: profile as BusinessProfile | null,
  } as CampaignBundle;
});

export const getFunnelBundleById = cache(async (userId: string, id: string) => {
  if (!isSupabaseServerConfigured()) {
    if (id === demoFunnel.id) {
      return demoBundle;
    }
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data: funnel } = await supabase
    .from("funnels")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!funnel) return null;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", funnel.campaign_id)
    .single();

  if (!campaign) return null;
  const allowed = await userHasWorkspaceAccess(userId, campaign.workspace_id);
  if (!allowed) return null;

  const templateRecord = await getTemplateRecordById(campaign.template_id);
  const template = templateRecord ? hydrateTemplateRecord(templateRecord) : getTemplateById(campaign.template_id);
  if (!template) return null;

  const businessProfile = campaign.workspace_id
    ? (
        await supabase
          .from("business_profiles")
          .select("*")
          .eq("workspace_id", campaign.workspace_id)
          .maybeSingle()
      ).data
    : await getBusinessProfile(userId);

  return {
    campaign,
    funnel,
    template,
    businessProfile,
  } as CampaignBundle;
});

export const getFunnelBySlug = cache(async (slug: string) => {
  if (!isSupabaseServerConfigured()) {
    return demoBundle;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return demoBundle;
  const { data: funnel } = await supabase
    .from("funnels")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!funnel) return null;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", funnel.campaign_id)
    .single();

  if (!campaign) return null;

  const templateRecord = await getTemplateRecordById(campaign.template_id);
  const template = templateRecord ? hydrateTemplateRecord(templateRecord) : getTemplateById(campaign.template_id);
  if (!template) return null;

  const profile = campaign.workspace_id
    ? (
        await supabase
          .from("business_profiles")
          .select("*")
          .eq("workspace_id", campaign.workspace_id)
          .maybeSingle()
      ).data
    : await getBusinessProfile(campaign.user_id);

  return {
    campaign,
    funnel,
    template,
    businessProfile: profile,
  } as CampaignBundle;
});

export const getLeads = cache(async (userId: string, status?: string) => {
  if (!isSupabaseServerConfigured()) {
    return status ? demoLeads.filter((lead) => lead.status === status) : demoLeads;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return status ? demoLeads.filter((lead) => lead.status === status) : demoLeads;
  }
  const activeWorkspaceId = await getActiveWorkspaceIdForUser(userId);
  let query = activeWorkspaceId
    ? supabase.from("leads").select("*").eq("workspace_id", activeWorkspaceId).order("created_at", {
        ascending: false,
      })
    : supabase.from("leads").select("*").eq("user_id", userId).order("created_at", {
        ascending: false,
      });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return (data || []) as LeadRecord[];
});

export const getWorkspaceMetaIntegrationForUser = cache(async (userId: string) => {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const workspaceId = await getActiveWorkspaceIdForUser(userId);
  if (!workspaceId) return null;

  try {
    return await getWorkspaceMetaIntegrationState({ admin, workspaceId });
  } catch {
    return null;
  }
});
