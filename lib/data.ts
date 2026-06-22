import { cache } from "react";
import { getTemplateById, hydrateTemplateRecord } from "@/data/templates";
import { demoBundle, demoCampaign, demoFunnel, demoLeads } from "@/lib/demo-data";
import { isDemoModeEnabled, isSupabaseServerConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hydrateAndSyncCampaignRecords, repairCampaignMetaIdentifiers, syncCampaignStatusFromMeta } from "@/lib/campaign-management";
import { getCanonicalLeadStatus, getLeadSubmittedAt } from "@/lib/leads";
import { buildLeadSyncReconnectUrl, getLeadInboxSearchMatch, getWorkspaceLeadSyncHealth, type WorkspaceLeadSyncHealth } from "@/lib/meta-leads";
import { listPublishedTemplates, getPublishedTemplateBySlug } from "@/lib/template-repository";
import { ensureWorkspaceContextByUserId, getActiveWorkspaceIdForUser, userHasWorkspaceAccess } from "@/lib/workspaces";
import { getWorkspaceMetaIntegrationState } from "@/lib/meta-integration";
import { countLeadsByStatus, countLeadsInPastDays } from "@/lib/workspace-metrics";
import { BusinessProfile, CampaignBundle, CampaignRecord, LeadRecord, TemplateRecord } from "@/types";

type DashboardSnapshotOptions = {
  allowDemo?: boolean;
};

function isMissingColumnError(message?: string) {
  return (
    typeof message === "string" &&
    (/Could not find the '([^']+)' column/i.test(message) ||
      /column\s+.+\s+does not exist/i.test(message))
  );
}

async function loadDashboardLeadCountRows(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceId: string,
) {
  const primaryResult = await supabase
    .from("leads")
    .select("id, status, created_at, meta_created_time")
    .eq("workspace_id", workspaceId);

  if (!primaryResult.error) {
    return primaryResult;
  }

  if (!isMissingColumnError(primaryResult.error.message)) {
    return primaryResult;
  }

  return supabase
    .from("leads")
    .select("id, status, created_at")
    .eq("workspace_id", workspaceId);
}

export type DashboardSnapshot = {
  liveFunnels: number;
  totalLeads: number;
  newLeads: number;
  newLeadsLast30Days: number;
  contactedLeads: number;
  bookedLeads: number;
  recentLeads: LeadRecord[];
  campaigns: CampaignRecord[];
  funnels: Array<Record<string, unknown>>;
  loadError: string | null;
};

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

export function getEmptyDashboardSnapshot(): DashboardSnapshot {
  return {
    liveFunnels: 0,
    totalLeads: 0,
    newLeads: 0,
    newLeadsLast30Days: 0,
    contactedLeads: 0,
    bookedLeads: 0,
    recentLeads: [],
    campaigns: [],
    funnels: [],
    loadError: null,
  };
}

export const getTemplates = cache(async () => listPublishedTemplates());

export const getTemplate = cache(async (slug: string) => getPublishedTemplateBySlug(slug));

export const getBusinessProfile = cache(async (userId: string) => {
  if (!isSupabaseServerConfigured()) {
    return isDemoModeEnabled() ? demoBundle.businessProfile : null;
  }

  const context = await ensureWorkspaceContextByUserId(userId);
  return context?.businessProfile || null;
});

export const getDashboardSnapshot = cache(async (userId: string, options?: DashboardSnapshotOptions) => {
  const allowDemo = options?.allowDemo ?? true;

  if (!isSupabaseServerConfigured()) {
    if (!allowDemo || !isDemoModeEnabled()) {
      return getEmptyDashboardSnapshot();
    }

    const counts = countLeadsByStatus(demoLeads);
    return {
      liveFunnels: 1,
      totalLeads: counts.total,
      newLeads: counts.newCount,
      newLeadsLast30Days: countLeadsInPastDays(demoLeads, 30),
      contactedLeads: counts.contactedCount,
      bookedLeads: counts.qualifiedCount,
      recentLeads: demoLeads,
      campaigns: [demoCampaign],
      funnels: [demoFunnel],
      loadError: null,
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return allowDemo && isDemoModeEnabled()
        ? {
          totalLeads: demoLeads.length,
          liveFunnels: 1,
          newLeads: countLeadsByStatus(demoLeads).newCount,
          newLeadsLast30Days: countLeadsInPastDays(demoLeads, 30),
          contactedLeads: countLeadsByStatus(demoLeads).contactedCount,
          bookedLeads: countLeadsByStatus(demoLeads).qualifiedCount,
          recentLeads: demoLeads,
          campaigns: [demoCampaign],
          funnels: [demoFunnel],
          loadError: null,
        }
      : getEmptyDashboardSnapshot();
  }

  const activeWorkspaceId = await getActiveWorkspaceIdForUser(userId);
  if (!activeWorkspaceId) {
    return getEmptyDashboardSnapshot();
  }

  try {
    const [funnelsResult, leadCountsResult, recentLeadsResult, campaignsResult] = await Promise.all([
      supabase.from("funnels").select("id, is_published").eq("workspace_id", activeWorkspaceId),
      loadDashboardLeadCountRows(supabase, activeWorkspaceId),
      supabase
        .from("leads")
        .select("id, status, created_at, meta_created_time, campaign_id, full_name, email, phone, name, first_name, last_name")
        .eq("workspace_id", activeWorkspaceId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("campaigns").select("*").eq("workspace_id", activeWorkspaceId).order("created_at", { ascending: false }),
    ]);

    if (funnelsResult.error) throw new Error(funnelsResult.error.message);
    if (leadCountsResult.error) throw new Error(leadCountsResult.error.message);
    if (recentLeadsResult.error) throw new Error(recentLeadsResult.error.message);
    if (campaignsResult.error) throw new Error(campaignsResult.error.message);

    const allLeadRows = (leadCountsResult.data || []) as LeadRecord[];
    const leadCounts = countLeadsByStatus(allLeadRows);
    const campaigns = await hydrateAndSyncCampaignRecords({
      admin: supabase,
      campaigns: (campaignsResult.data || []) as CampaignRecord[],
      syncLiveStatuses: true,
    });

    return {
      liveFunnels: (funnelsResult.data || []).filter((funnel) => funnel.is_published).length,
      totalLeads: leadCounts.total,
      newLeads: leadCounts.newCount,
      newLeadsLast30Days: countLeadsInPastDays(allLeadRows, 30),
      contactedLeads: leadCounts.contactedCount,
      bookedLeads: leadCounts.qualifiedCount,
      recentLeads: (recentLeadsResult.data || []) as LeadRecord[],
      campaigns,
      funnels: (funnelsResult.data || []) as Array<Record<string, unknown>>,
      loadError: null,
    };
  } catch (error) {
    console.error("[dashboard snapshot] metrics load failed", {
      userId,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return {
      ...getEmptyDashboardSnapshot(),
      loadError: error instanceof Error ? error.message : "Dashboard metrics could not be loaded.",
    };
  }
});

export const getWorkspaceCampaignsForUser = cache(
  async (userId: string, syncLiveStatuses = false, allowDemo = true) => {
    if (!isSupabaseServerConfigured()) {
      if (!allowDemo || !isDemoModeEnabled()) {
        return [] as CampaignRecord[];
      }
      return [demoCampaign];
    }

    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      if (!allowDemo || !isDemoModeEnabled()) {
        return [] as CampaignRecord[];
      }
      return [demoCampaign];
    }

    const activeWorkspaceId = await getActiveWorkspaceIdForUser(userId);
    if (!activeWorkspaceId) {
      return [] as CampaignRecord[];
    }

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("workspace_id", activeWorkspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return hydrateAndSyncCampaignRecords({
      admin: supabase,
      campaigns: (data || []) as CampaignRecord[],
      syncLiveStatuses,
    });
  },
);

export const getCampaignBundle = cache(async (userId: string, id: string) => {
  if (!isSupabaseServerConfigured()) {
    if (isDemoModeEnabled() && id === demoCampaign.id) {
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
  const repairedCampaign = await repairCampaignMetaIdentifiers(
    supabase,
    hydratedCampaign as CampaignRecord,
  );
  const managedCampaign =
    repairedCampaign.campaign.status === "published"
      ? await syncCampaignStatusFromMeta({
          admin: supabase,
          campaign: repairedCampaign.campaign,
        }).catch(() => repairedCampaign.campaign)
      : repairedCampaign.campaign;

  const funnel = await supabase.from("funnels").select("*").eq("campaign_id", campaign.id).single();
  const profile = managedCampaign.workspace_id
    ? (
        await supabase
          .from("business_profiles")
          .select("*")
          .eq("workspace_id", managedCampaign.workspace_id)
          .maybeSingle()
      ).data
    : await getBusinessProfile(userId);

  const templateRecord = await getTemplateRecordById(managedCampaign.template_id);
  const template = templateRecord ? hydrateTemplateRecord(templateRecord) : getTemplateById(managedCampaign.template_id);
  const resolvedTemplate = template || getTemplateById(managedCampaign.template_id);
  if (!resolvedTemplate) return null;

  return {
    campaign: managedCampaign,
    funnel: funnel.data,
    template: resolvedTemplate,
    businessProfile: profile as BusinessProfile | null,
  } as CampaignBundle;
});

export const getFunnelBundleById = cache(async (userId: string, id: string) => {
  if (!isSupabaseServerConfigured()) {
    if (isDemoModeEnabled() && id === demoFunnel.id) {
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
    return isDemoModeEnabled() ? demoBundle : null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return isDemoModeEnabled() ? demoBundle : null;
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

export const getLeads = cache(async (userId: string, status?: string, options?: { allowDemo?: boolean }) => {
  const allowDemo = options?.allowDemo ?? true;

  if (!isSupabaseServerConfigured()) {
    if (!allowDemo || !isDemoModeEnabled()) {
      return [];
    }

    return status ? demoLeads.filter((lead) => lead.status === status) : demoLeads;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (!allowDemo || !isDemoModeEnabled()) {
      return [];
    }

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

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as LeadRecord[];
});

export async function getLeadInboxData(
  userId: string,
  options?: {
    status?: string;
    query?: string;
    campaignId?: string;
    dateRange?: string;
    leadId?: string;
  },
) {
  if (!isSupabaseServerConfigured()) {
    const allLeads = demoLeads
      .slice()
      .sort((left, right) => +new Date(getLeadSubmittedAt(right)) - +new Date(getLeadSubmittedAt(left)));
    const filtered = allLeads.filter((lead) => {
      const matchesStatus =
        !options?.status ||
        options.status === "all" ||
        getCanonicalLeadStatus(lead.status) === options.status;
      const matchesSearch = getLeadInboxSearchMatch(lead, options?.query || "");
      const matchesCampaign = !options?.campaignId || lead.campaign_id === options.campaignId;
      return matchesStatus && matchesSearch && matchesCampaign;
    });

    return {
      leads: filtered,
      allLeads,
      selectedLead:
        filtered.find((lead) => lead.id === options?.leadId) ||
        allLeads.find((lead) => lead.id === options?.leadId) ||
        filtered[0] ||
        null,
      campaigns: [demoCampaign],
      syncHealth: null as WorkspaceLeadSyncHealth | null,
      reconnectUrl: buildLeadSyncReconnectUrl("/leads"),
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      leads: [] as LeadRecord[],
      allLeads: [] as LeadRecord[],
      selectedLead: null as LeadRecord | null,
      campaigns: [] as CampaignRecord[],
      syncHealth: null as WorkspaceLeadSyncHealth | null,
      reconnectUrl: buildLeadSyncReconnectUrl("/leads"),
    };
  }

  const workspaceId = await getActiveWorkspaceIdForUser(userId);
  if (!workspaceId) {
    return {
      leads: [] as LeadRecord[],
      allLeads: [] as LeadRecord[],
      selectedLead: null as LeadRecord | null,
      campaigns: [] as CampaignRecord[],
      syncHealth: null as WorkspaceLeadSyncHealth | null,
      reconnectUrl: buildLeadSyncReconnectUrl("/leads"),
    };
  }

  const [leadsResult, campaignsResult, syncHealth] = await Promise.all([
    admin.from("leads").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    admin
      .from("campaigns")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    getWorkspaceLeadSyncHealth({ admin, workspaceId }).catch(() => null),
  ]);

  if (leadsResult.error) {
    throw new Error(leadsResult.error.message);
  }
  if (campaignsResult.error) {
    throw new Error(campaignsResult.error.message);
  }

  const allLeads = ((leadsResult.data || []) as LeadRecord[]).slice().sort(
    (left, right) => +new Date(getLeadSubmittedAt(right)) - +new Date(getLeadSubmittedAt(left)),
  );
  const campaigns = await hydrateAndSyncCampaignRecords({
    admin,
    campaigns: (campaignsResult.data || []) as CampaignRecord[],
    syncLiveStatuses: false,
  });

  const now = Date.now();
  const minTimestamp =
    options?.dateRange === "7d"
      ? now - 7 * 24 * 60 * 60 * 1000
      : options?.dateRange === "30d"
        ? now - 30 * 24 * 60 * 60 * 1000
        : null;

  const filteredLeads = allLeads.filter((lead) => {
    const matchesStatus =
      !options?.status ||
      options.status === "all" ||
      getCanonicalLeadStatus(lead.status) === options.status;
    const matchesSearch = getLeadInboxSearchMatch(lead, options?.query || "");
    const matchesCampaign = !options?.campaignId || lead.campaign_id === options.campaignId;
    const submittedTime = +new Date(getLeadSubmittedAt(lead));
    const matchesDate = !minTimestamp || submittedTime >= minTimestamp;
    return matchesStatus && matchesSearch && matchesCampaign && matchesDate;
  });

  return {
    leads: filteredLeads,
    allLeads,
    selectedLead:
      filteredLeads.find((lead) => lead.id === options?.leadId) ||
      allLeads.find((lead) => lead.id === options?.leadId) ||
      filteredLeads[0] ||
      null,
    campaigns,
    syncHealth,
    reconnectUrl: buildLeadSyncReconnectUrl("/leads"),
  };
}

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
