import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deleteMetaObject, fetchMetaCampaignStatus } from "@/lib/meta";
import { getWorkspaceMetaAccessToken } from "@/lib/meta-integration";
import { CampaignRecord } from "@/types";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

type CampaignPublishJobRow = {
  id: string;
  campaign_id: string;
  workspace_id: string;
  provider: string;
  mode: string;
  status: string;
  external_ids_json: Record<string, unknown> | null;
  meta_response_json: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignMetaIdentifiers = {
  campaignId: string | null;
  adSetId: string | null;
  adId: string | null;
  leadFormId: string | null;
  creativeId: string | null;
};

export type CampaignLifecycleState = "draft" | "active" | "paused" | "in_review" | "archived" | "unknown";

type CampaignStatusSnapshot = {
  externalPublishStatus: string | null;
  effectiveStatus: string | null;
  configuredStatus: string | null;
  syncedAt: string | null;
  source: "meta" | "job" | "local";
};

const optionalCampaignColumns = new Set([
  "workspace_id",
  "external_ids_json",
  "external_publish_status",
  "meta_campaign_id",
  "meta_adset_id",
  "meta_ad_id",
  "meta_lead_form_id",
  "meta_creative_id",
  "meta_effective_status",
  "meta_configured_status",
  "meta_status_synced_at",
  "management_sync_state",
  "archived_at",
]);

function getMissingCampaignSchemaColumn(message?: string) {
  if (!message) return null;
  const match = message.match(/Could not find the '([^']+)' column of 'campaigns'/i);
  return match?.[1] || null;
}

async function updateCampaignWithSchemaFallback(
  admin: SupabaseAdmin,
  campaignId: string,
  payload: Record<string, unknown>,
) {
  const nextPayload = { ...payload };

  while (Object.keys(nextPayload).length) {
    const { error } = await admin.from("campaigns").update(nextPayload).eq("id", campaignId);
    if (!error) {
      return;
    }

    const missingColumn = getMissingCampaignSchemaColumn(error.message);
    if (!missingColumn || !optionalCampaignColumns.has(missingColumn) || !(missingColumn in nextPayload)) {
      throw new Error(error.message);
    }

    delete nextPayload[missingColumn];
  }
}

function getObjectRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeMetaLifecycleStatus(input?: string | null) {
  const normalized = (input || "").trim().toUpperCase();
  if (!normalized) return null;
  if (
    normalized.includes("ARCHIVED") ||
    normalized.includes("DELETED") ||
    normalized === "WITH_ISSUES"
  ) {
    return "archived";
  }
  if (normalized.includes("PAUSED")) {
    return "paused";
  }
  if (
    normalized === "IN_PROCESS" ||
    normalized === "PENDING_REVIEW" ||
    normalized === "PENDING_BILLING_INFO" ||
    normalized === "PREAPPROVED" ||
    normalized === "PENDING_PROCESSING"
  ) {
    return "in_review";
  }
  if (
    normalized === "ACTIVE"
  ) {
    return "active";
  }
  return "unknown";
}

function buildCampaignStatusSnapshotFromMeta(payload: {
  effectiveStatus?: string | null;
  configuredStatus?: string | null;
  syncedAt?: string | null;
}): CampaignStatusSnapshot {
  const statusFromEffective = normalizeMetaLifecycleStatus(payload.effectiveStatus);
  const statusFromConfigured = normalizeMetaLifecycleStatus(payload.configuredStatus);
  const lifecycle = statusFromEffective === "unknown" ? statusFromConfigured : statusFromEffective;
  return {
    externalPublishStatus: lifecycle && lifecycle !== "unknown" ? lifecycle : "unknown",
    effectiveStatus: payload.effectiveStatus || null,
    configuredStatus: payload.configuredStatus || null,
    syncedAt: payload.syncedAt || new Date().toISOString(),
    source: "meta",
  };
}

function getStatusSnapshotFromJob(job: CampaignPublishJobRow | null): CampaignStatusSnapshot | null {
  if (!job) return null;
  const metaResponse = getObjectRecord(job.meta_response_json);
  const statusSync = getObjectRecord(metaResponse.status_sync);
  const externalPublishStatus =
    typeof statusSync.external_publish_status === "string"
      ? statusSync.external_publish_status
      : null;
  const effectiveStatus =
    typeof statusSync.effective_status === "string" ? statusSync.effective_status : null;
  const configuredStatus =
    typeof statusSync.configured_status === "string" ? statusSync.configured_status : null;
  const syncedAt =
    typeof statusSync.synced_at === "string"
      ? statusSync.synced_at
      : typeof statusSync.checked_at === "string"
        ? statusSync.checked_at
        : job.updated_at || job.created_at || null;

  if (!externalPublishStatus && !effectiveStatus && !configuredStatus) {
    return null;
  }

  return {
    externalPublishStatus,
    effectiveStatus,
    configuredStatus,
    syncedAt,
    source: "job",
  };
}

function getCampaignIdentifiersFromExternalIds(externalIds: Record<string, unknown>) {
  return {
    campaignId: typeof externalIds.campaign_id === "string" ? externalIds.campaign_id : null,
    adSetId: typeof externalIds.adset_id === "string" ? externalIds.adset_id : null,
    adId: typeof externalIds.ad_id === "string" ? externalIds.ad_id : null,
    leadFormId: typeof externalIds.lead_form_id === "string" ? externalIds.lead_form_id : null,
    creativeId: typeof externalIds.creative_id === "string" ? externalIds.creative_id : null,
  };
}

export function getCampaignMetaIdentifiers(
  campaign: Pick<
    CampaignRecord,
    "external_ids_json" | "meta_campaign_id" | "meta_adset_id" | "meta_ad_id" | "meta_lead_form_id" | "meta_creative_id"
  >,
): CampaignMetaIdentifiers {
  const externalIds = getObjectRecord(campaign.external_ids_json);
  const jobIdentifiers = getCampaignIdentifiersFromExternalIds(externalIds);

  return {
    campaignId:
      "meta_campaign_id" in campaign && typeof campaign.meta_campaign_id === "string"
        ? campaign.meta_campaign_id
        : jobIdentifiers.campaignId,
    adSetId:
      "meta_adset_id" in campaign && typeof campaign.meta_adset_id === "string"
        ? campaign.meta_adset_id
        : jobIdentifiers.adSetId,
    adId:
      "meta_ad_id" in campaign && typeof campaign.meta_ad_id === "string"
        ? campaign.meta_ad_id
        : jobIdentifiers.adId,
    leadFormId:
      "meta_lead_form_id" in campaign && typeof campaign.meta_lead_form_id === "string"
        ? campaign.meta_lead_form_id
        : jobIdentifiers.leadFormId,
    creativeId:
      "meta_creative_id" in campaign && typeof campaign.meta_creative_id === "string"
        ? campaign.meta_creative_id
        : jobIdentifiers.creativeId,
  };
}

export function getCampaignLifecycleState(
  campaign: Pick<
    CampaignRecord,
    "status" | "external_publish_status" | "archived_at" | "meta_effective_status" | "meta_configured_status"
  >,
): CampaignLifecycleState {
  if (campaign.status === "archived" || campaign.archived_at) {
    return "archived";
  }

  if (campaign.status === "draft") {
    return "draft";
  }

  const externalStatus = normalizeMetaLifecycleStatus(campaign.external_publish_status || "");
  if (externalStatus && externalStatus !== "unknown") {
    return externalStatus;
  }

  const effectiveStatus = normalizeMetaLifecycleStatus(campaign.meta_effective_status || "");
  if (effectiveStatus && effectiveStatus !== "unknown") {
    return effectiveStatus;
  }

  const configuredStatus = normalizeMetaLifecycleStatus(campaign.meta_configured_status || "");
  if (configuredStatus && configuredStatus !== "unknown") {
    return configuredStatus;
  }

  return campaign.status === "published" ? "unknown" : "active";
}

export function getCampaignLifecycleLabel(
  campaign: Pick<
    CampaignRecord,
    "status" | "external_publish_status" | "archived_at" | "meta_effective_status" | "meta_configured_status"
  >,
) {
  const state = getCampaignLifecycleState(campaign);
  switch (state) {
    case "draft":
      return "Draft";
    case "in_review":
      return "In Review";
    case "paused":
      return "Paused";
    case "archived":
      return "Archived";
    case "unknown":
      return "Unknown";
    case "active":
    default:
      return "Active";
  }
}

async function loadLatestPublishJobs(admin: SupabaseAdmin, campaignIds: string[]) {
  if (!campaignIds.length) {
    return new Map<string, CampaignPublishJobRow>();
  }

  const { data, error } = await admin
    .from("campaign_publish_jobs")
    .select("id, campaign_id, workspace_id, provider, mode, status, external_ids_json, meta_response_json, created_by, created_at, updated_at")
    .in("campaign_id", campaignIds)
    .eq("provider", "meta")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as CampaignPublishJobRow[];
  const byCampaignId = new Map<string, CampaignPublishJobRow>();
  for (const row of rows) {
    if (!byCampaignId.has(row.campaign_id)) {
      byCampaignId.set(row.campaign_id, row);
    }
  }
  return byCampaignId;
}

function mergeCampaignManagementData(
  campaign: CampaignRecord,
  job: CampaignPublishJobRow | null,
  overrideSnapshot?: CampaignStatusSnapshot | null,
) {
  const jobExternalIds = getObjectRecord(job?.external_ids_json);
  const existingExternalIds = getObjectRecord(campaign.external_ids_json);
  const mergedExternalIds = {
    ...jobExternalIds,
    ...existingExternalIds,
  };
  const identifiers = getCampaignIdentifiersFromExternalIds(mergedExternalIds);
  const snapshot = overrideSnapshot || getStatusSnapshotFromJob(job);

  return {
    ...campaign,
    external_ids_json: Object.keys(mergedExternalIds).length ? mergedExternalIds : campaign.external_ids_json || null,
    meta_campaign_id: campaign.meta_campaign_id || identifiers.campaignId,
    meta_adset_id: campaign.meta_adset_id || identifiers.adSetId,
    meta_ad_id: campaign.meta_ad_id || identifiers.adId,
    meta_lead_form_id: campaign.meta_lead_form_id || identifiers.leadFormId,
    meta_creative_id: campaign.meta_creative_id || identifiers.creativeId,
    external_publish_status:
      snapshot?.externalPublishStatus || campaign.external_publish_status || null,
    meta_effective_status:
      snapshot?.effectiveStatus || campaign.meta_effective_status || null,
    meta_configured_status:
      snapshot?.configuredStatus || campaign.meta_configured_status || null,
    meta_status_synced_at:
      snapshot?.syncedAt || campaign.meta_status_synced_at || null,
    management_sync_state: snapshot ? "synced" : campaign.management_sync_state || "unknown",
  } as CampaignRecord;
}

async function persistCampaignManagementState({
  admin,
  campaign,
  identifiers,
  snapshot,
}: {
  admin: SupabaseAdmin;
  campaign: CampaignRecord;
  identifiers: CampaignMetaIdentifiers;
  snapshot: CampaignStatusSnapshot;
}) {
  const mergedExternalIds = {
    ...getObjectRecord(campaign.external_ids_json),
    ...(identifiers.campaignId ? { campaign_id: identifiers.campaignId } : {}),
    ...(identifiers.adSetId ? { adset_id: identifiers.adSetId } : {}),
    ...(identifiers.adId ? { ad_id: identifiers.adId } : {}),
    ...(identifiers.leadFormId ? { lead_form_id: identifiers.leadFormId } : {}),
    ...(identifiers.creativeId ? { creative_id: identifiers.creativeId } : {}),
  };

  const lifecycle = snapshot.externalPublishStatus || "unknown";
  const now = snapshot.syncedAt || new Date().toISOString();
  const campaignPayload: Record<string, unknown> = {
    external_ids_json: mergedExternalIds,
    external_publish_status: lifecycle,
    meta_campaign_id: identifiers.campaignId,
    meta_adset_id: identifiers.adSetId,
    meta_ad_id: identifiers.adId,
    meta_lead_form_id: identifiers.leadFormId,
    meta_creative_id: identifiers.creativeId,
    meta_effective_status: snapshot.effectiveStatus,
    meta_configured_status: snapshot.configuredStatus,
    meta_status_synced_at: now,
    management_sync_state: "synced",
  };
  if (lifecycle === "archived") {
    campaignPayload.status = "archived";
  }

  await updateCampaignWithSchemaFallback(admin, campaign.id, campaignPayload).catch(() => {});

  const { data: existingJobs, error: jobError } = await admin
    .from("campaign_publish_jobs")
    .select("id, meta_response_json")
    .eq("campaign_id", campaign.id)
    .eq("provider", "meta")
    .order("created_at", { ascending: false })
    .limit(1);

  if (jobError) {
    throw new Error(jobError.message);
  }

  const statusSyncJson = {
    external_publish_status: lifecycle,
    effective_status: snapshot.effectiveStatus,
    configured_status: snapshot.configuredStatus,
    synced_at: now,
    source: snapshot.source,
  };

  const existingJob = (existingJobs || [])[0] as { id: string; meta_response_json?: Record<string, unknown> } | undefined;
  if (existingJob?.id) {
    const mergedMetaResponse = {
      ...getObjectRecord(existingJob.meta_response_json),
      status_sync: statusSyncJson,
    };
    const { error: updateError } = await admin
      .from("campaign_publish_jobs")
      .update({
        external_ids_json: mergedExternalIds,
        meta_response_json: mergedMetaResponse,
      })
      .eq("id", existingJob.id);
    if (updateError) {
      throw new Error(updateError.message);
    }
    return;
  }

  const { error: insertError } = await admin.from("campaign_publish_jobs").insert({
    workspace_id: campaign.workspace_id,
    campaign_id: campaign.id,
    provider: "meta",
    mode: "management_sync",
    status: "published",
    external_ids_json: mergedExternalIds,
    meta_response_json: {
      status_sync: statusSyncJson,
    },
    created_by: campaign.user_id,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function repairCampaignMetaIdentifiers(
  admin: SupabaseAdmin,
  campaign: CampaignRecord,
) {
  const [jobMap] = await Promise.all([loadLatestPublishJobs(admin, [campaign.id])]);
  const hydratedCampaign = mergeCampaignManagementData(campaign, jobMap.get(campaign.id) || null);
  return {
    campaign: hydratedCampaign,
    identifiers: getCampaignMetaIdentifiers(hydratedCampaign),
  };
}

export async function syncCampaignStatusFromMeta({
  admin,
  campaign,
}: {
  admin: SupabaseAdmin;
  campaign: CampaignRecord;
}) {
  const repaired = await repairCampaignMetaIdentifiers(admin, campaign);
  const hydratedCampaign = repaired.campaign;
  const identifiers = repaired.identifiers;

  if (
    hydratedCampaign.status !== "published" ||
    hydratedCampaign.archived_at ||
    !hydratedCampaign.workspace_id ||
    !identifiers.campaignId
  ) {
    return hydratedCampaign;
  }

  const tokenContext = await getWorkspaceMetaAccessToken({
    admin,
    workspaceId: hydratedCampaign.workspace_id,
  });

  if (!tokenContext?.accessToken) {
    return {
      ...hydratedCampaign,
      management_sync_state: "stale",
    } as CampaignRecord;
  }

  const remoteStatus = await fetchMetaCampaignStatus(tokenContext.accessToken, identifiers.campaignId);
  const snapshot = buildCampaignStatusSnapshotFromMeta({
    effectiveStatus: remoteStatus.effective_status || remoteStatus.status || null,
    configuredStatus: remoteStatus.configured_status || null,
  });

  await persistCampaignManagementState({
    admin,
    campaign: hydratedCampaign,
    identifiers,
    snapshot,
  });

  return mergeCampaignManagementData(hydratedCampaign, null, snapshot);
}

export async function hydrateAndSyncCampaignRecords({
  admin,
  campaigns,
  syncLiveStatuses = false,
}: {
  admin: SupabaseAdmin;
  campaigns: CampaignRecord[];
  syncLiveStatuses?: boolean;
}) {
  if (!campaigns.length) return campaigns;

  const jobsByCampaignId = await loadLatestPublishJobs(
    admin,
    campaigns.map((campaign) => campaign.id),
  );
  const hydrated = campaigns.map((campaign) =>
    mergeCampaignManagementData(campaign, jobsByCampaignId.get(campaign.id) || null),
  );

  if (!syncLiveStatuses) {
    return hydrated;
  }

  const syncResults = await Promise.allSettled(
    hydrated.map(async (campaign) => {
      if (campaign.status !== "published" || campaign.archived_at) {
        return campaign;
      }
      return syncCampaignStatusFromMeta({ admin, campaign });
    }),
  );

  return hydrated.map((campaign, index) => {
    const result = syncResults[index];
    if (result?.status === "fulfilled") {
      return result.value;
    }
    return {
      ...campaign,
      management_sync_state: campaign.status === "published" ? "error" : campaign.management_sync_state,
    } as CampaignRecord;
  });
}

export async function archiveCampaignWithMetaSync({
  admin,
  campaign,
}: {
  admin: SupabaseAdmin;
  campaign: CampaignRecord;
}) {
  const repaired = await repairCampaignMetaIdentifiers(admin, campaign);
  const now = new Date().toISOString();
  const archivedCampaign = {
    ...repaired.campaign,
    status: "archived",
    external_publish_status: "archived",
    meta_status_synced_at: now,
    management_sync_state: "synced",
  } as CampaignRecord;

  await persistCampaignManagementState({
    admin,
    campaign: archivedCampaign,
    identifiers: repaired.identifiers,
    snapshot: {
      externalPublishStatus: "archived",
      effectiveStatus: repaired.campaign.meta_effective_status || "PAUSED",
      configuredStatus: repaired.campaign.meta_configured_status || "PAUSED",
      syncedAt: now,
      source: "local",
    },
  });

  return archivedCampaign;
}

export async function deleteCampaignWithMetaCleanup({
  admin,
  campaign,
}: {
  admin: SupabaseAdmin;
  campaign: CampaignRecord;
}) {
  const repaired = await repairCampaignMetaIdentifiers(admin, campaign);
  const identifiers = repaired.identifiers;
  const workspaceId = repaired.campaign.workspace_id;

  if (workspaceId) {
    const tokenContext = await getWorkspaceMetaAccessToken({
      admin,
      workspaceId,
    });

    if (tokenContext?.accessToken) {
      const remoteObjectIds = Array.from(
        new Set(
          [
            identifiers.adId,
            identifiers.adSetId,
            identifiers.campaignId,
            identifiers.creativeId,
            identifiers.leadFormId,
          ].filter((value): value is string => Boolean(value)),
        ),
      );

      const deleteResults = await Promise.allSettled(
        remoteObjectIds.map((objectId) =>
          deleteMetaObject({
            accessToken: tokenContext.accessToken,
            objectId,
          }),
        ),
      );

      deleteResults.forEach((result, index) => {
        if (result.status !== "rejected") return;
        const message = result.reason instanceof Error ? result.reason.message : "Meta delete failed.";
        console.warn("[campaign] Failed to delete Meta object during campaign deletion:", {
          campaignId: repaired.campaign.id,
          objectId: remoteObjectIds[index],
          message,
        });
      });
    }
  }

  return repaired.campaign;
}

export function getCampaignLastSyncedAt(campaign: Pick<CampaignRecord, "meta_status_synced_at">) {
  return campaign.meta_status_synced_at || null;
}

export function getCampaignSyncState(
  campaign: Pick<CampaignRecord, "status" | "management_sync_state">,
) {
  if (campaign.status !== "published") {
    return "not_live";
  }
  return campaign.management_sync_state || "unknown";
}
