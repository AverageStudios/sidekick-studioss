import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchMetaLeadDetails,
  fetchMetaLeadFormDetails,
  fetchMetaLeadFormLeads,
  getMetaScopes,
  subscribeMetaPageToLeadgenWebhooks,
} from "@/lib/meta";
import {
  getWorkspaceMetaAccessToken,
  getWorkspaceMetaIntegrationState,
  type WorkspaceProviderAssetRow,
  type WorkspaceProviderConnectionRow,
} from "@/lib/meta-integration";
import { queueLeadForCrmDelivery } from "@/lib/crm-integration";
import { coerceFieldAnswers, formatLeadSearchValue, getCanonicalLeadStatus, type CanonicalLeadStatus } from "@/lib/leads";
import { CampaignAdType, LeadRecord } from "@/types";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const requiredLeadSyncScopes = ["pages_manage_ads"] as const;
const realtimeLeadSyncScopes = ["leads_retrieval"] as const;
const optionalLeadSyncScopes: readonly string[] = [];
const leadStatusIds = ["new", "contacted", "qualified", "closed", "archived"] as const;
const insertOptionalLeadColumns = new Set([
  "meta_lead_id",
  "meta_page_id",
  "meta_page_name",
  "meta_form_id",
  "meta_form_name",
  "meta_campaign_id",
  "meta_adset_id",
  "meta_ad_id",
  "source",
  "ad_type",
  "full_name",
  "first_name",
  "last_name",
  "company_name",
  "job_title",
  "notes",
  "normalized_fields_json",
  "field_data_json",
  "raw_payload_json",
  "meta_created_time",
  "last_synced_at",
  "is_test_lead",
]);
const optionalCampaignLeadMappingColumns = new Set([
  "meta_campaign_id",
  "meta_adset_id",
  "meta_ad_id",
  "meta_lead_form_id",
  "external_ids_json",
]);

export type WorkspaceLeadSyncHealth = {
  connected: boolean;
  activeConnectionId: string | null;
  selectedPageId: string | null;
  selectedPageName: string | null;
  currentScopes: string[];
  requiredScopesMissing: string[];
  optionalScopesMissing: string[];
  canReadLeads: boolean;
  webhookSubscriptionAttempted: boolean;
  webhookSubscriptionReady: boolean;
  lastWorkspaceSyncAt: string | null;
  lastWorkspaceSyncError: string | null;
};

export type MetaLeadSyncResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  warnings: string[];
  processedLeadIds: string[];
  syncedAt: string;
};

type LeadSyncMode = "incremental" | "backfill";

type CampaignLeadMapping = {
  campaignId: string;
  campaignName: string;
  campaignUserId: string;
  adType: CampaignAdType | null;
  metaCampaignId: string | null;
  metaAdSetId: string | null;
  metaAdId: string | null;
  metaLeadFormId: string | null;
  pageId: string | null;
};

function getObjectRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getMissingInsertColumn(message?: string) {
  if (!message) return null;
  const match = message.match(/Could not find the '([^']+)' column of 'leads'/i);
  return match?.[1] || null;
}

function getMissingCampaignMappingColumn(message?: string) {
  if (!message) return null;
  const match = message.match(/Could not find the '([^']+)' column of 'campaigns'/i);
  return match?.[1] || null;
}

async function insertLeadWithSchemaFallback(
  admin: SupabaseAdmin,
  payload: Record<string, unknown>,
) {
  const nextPayload = { ...payload };

  while (Object.keys(nextPayload).length) {
    const { data, error } = await admin.from("leads").insert(nextPayload).select("*").single();
    if (!error) {
      return data as LeadRecord;
    }

    const missingColumn = getMissingInsertColumn(error.message);
    if (!missingColumn || !insertOptionalLeadColumns.has(missingColumn) || !(missingColumn in nextPayload)) {
      throw new Error(error.message);
    }

    delete nextPayload[missingColumn];
  }

  throw new Error("Lead could not be stored because the database schema is missing required columns.");
}

function dedupeScopes(scopes: string[]) {
  return Array.from(new Set(scopes.map((scope) => scope.trim()).filter(Boolean)));
}

function getConnectionScopes(connection: Pick<WorkspaceProviderConnectionRow, "scopes"> | null) {
  if (!connection || !Array.isArray(connection.scopes)) return [];
  return dedupeScopes(connection.scopes.filter((scope): scope is string => typeof scope === "string"));
}

function getPageAccessTokenFromAsset(asset: WorkspaceProviderAssetRow | null) {
  const token = asset?.metadata_json?.access_token;
  return typeof token === "string" && token.trim().length ? token.trim() : null;
}

function readConnectionLeadSyncMetadata(connection: WorkspaceProviderConnectionRow | null) {
  const metadata = getObjectRecord(connection?.metadata_json);
  const leadSync = getObjectRecord(metadata.lead_sync);
  return {
    lastWorkspaceSyncAt:
      typeof leadSync.last_synced_at === "string" ? leadSync.last_synced_at : null,
    lastWorkspaceSyncError:
      typeof leadSync.last_error === "string" ? leadSync.last_error : null,
    webhookSubscriptionReady:
      typeof leadSync.webhook_subscription_ready === "boolean"
        ? leadSync.webhook_subscription_ready
        : null,
  };
}

function buildLeadReconnectHint() {
  const requiredScopes = getMetaScopes({
    includeLeadFormManagement: true,
    includeLeadRetrieval: true,
    includePageWebhookManagement: false,
  });
  return `Reconnect Meta from the Leads page so the active workspace token includes: ${requiredScopes.join(", ")}.`;
}

function normalizePhoneValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\s+/g, " ");
}

function normalizeLeadFieldKey(rawName: string) {
  return rawName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeLeadStatusInput(value: string | null | undefined): CanonicalLeadStatus {
  return getCanonicalLeadStatus(value);
}

function normalizeLeadFieldData(fieldData: Array<{ name?: string; values?: string[] }> | undefined) {
  const answers = (fieldData || []).map((entry) => {
    const rawName = typeof entry.name === "string" ? entry.name.trim() : "";
    const key = normalizeLeadFieldKey(rawName || "field");
    const values = Array.isArray(entry.values)
      ? entry.values.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean)
      : [];
    return {
      key,
      label: rawName || key || "Field",
      values,
    };
  });

  const normalized: Record<string, string[]> = {};
  for (const answer of answers) {
    if (!answer.key) continue;
    normalized[answer.key] = answer.values;
  }

  const first = (...keys: string[]) => {
    for (const key of keys) {
      const values = normalized[key];
      if (values?.length) return values[0];
    }
    return "";
  };

  const firstName = first("first_name");
  const lastName = first("last_name");
  const fullName = first("full_name", "full_name__full_name") || [firstName, lastName].filter(Boolean).join(" ").trim();
  const email = first("email");
  const phone = first("phone_number", "phone", "work_phone_number");
  const companyName = first("company_name");
  const jobTitle = first("job_title");

  return {
    answers,
    normalized,
    derived: {
      full_name: fullName || null,
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone ? normalizePhoneValue(phone) : null,
      company_name: companyName || null,
      job_title: jobTitle || null,
    },
  };
}

async function loadCampaignLeadMappings(admin: SupabaseAdmin, workspaceId: string) {
  const campaignSelectColumns = [
    "id",
    "user_id",
    "workspace_id",
    "name",
    "meta_campaign_id",
    "meta_adset_id",
    "meta_ad_id",
    "meta_lead_form_id",
    "external_ids_json",
  ];

  const loadCampaignRows = async () => {
    const columns = [...campaignSelectColumns];

    while (columns.length) {
      const result = await admin
        .from("campaigns")
        .select(columns.join(", "))
        .eq("workspace_id", workspaceId);

      if (!result.error) {
        return result.data || [];
      }

      const missingColumn = getMissingCampaignMappingColumn(result.error.message);
      if (!missingColumn || !optionalCampaignLeadMappingColumns.has(missingColumn)) {
        throw new Error(result.error.message);
      }

      const missingIndex = columns.indexOf(missingColumn);
      if (missingIndex === -1) {
        throw new Error(result.error.message);
      }
      columns.splice(missingIndex, 1);
    }

    return [];
  };

  const [campaignRows, jobsResult, snapshotsResult] = await Promise.all([
    loadCampaignRows(),
    admin
      .from("campaign_publish_jobs")
      .select("campaign_id, external_ids_json, resolved_assets_json, normalized_payload_json, created_at")
      .eq("workspace_id", workspaceId)
      .eq("provider", "meta")
      .order("created_at", { ascending: false }),
    admin
      .from("campaign_launch_snapshots")
      .select("campaign_id, snapshot_json, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  if (jobsResult.error) throw new Error(jobsResult.error.message);
  if (snapshotsResult.error) throw new Error(snapshotsResult.error.message);

  const latestJobs = new Map<string, Record<string, unknown>>();
  for (const row of (jobsResult.data || []) as Array<Record<string, unknown>>) {
    const campaignId = typeof row.campaign_id === "string" ? row.campaign_id : "";
    if (!campaignId || latestJobs.has(campaignId)) continue;
    latestJobs.set(campaignId, row);
  }

  const latestSnapshots = new Map<string, Record<string, unknown>>();
  for (const row of (snapshotsResult.data || []) as Array<Record<string, unknown>>) {
    const campaignId = typeof row.campaign_id === "string" ? row.campaign_id : "";
    if (!campaignId || latestSnapshots.has(campaignId)) continue;
    latestSnapshots.set(campaignId, getObjectRecord(row.snapshot_json));
  }

  return (campaignRows as unknown as Array<Record<string, unknown>>).map((campaign) => {
    const campaignId = String(campaign.id || "");
    const externalIds = getObjectRecord(campaign.external_ids_json);
    const job = latestJobs.get(campaignId);
    const jobExternalIds = getObjectRecord(job?.external_ids_json);
    const resolvedAssets = getObjectRecord(job?.resolved_assets_json);
    const page = getObjectRecord(resolvedAssets.page);
    const snapshot = latestSnapshots.get(campaignId);
    const snapshotSelection = getObjectRecord(snapshot?.selection);
    const snapshotIntegrationSelections = getObjectRecord(snapshot?.integrationSelections);

    return {
      campaignId,
      campaignName: String(campaign.name || "Campaign"),
      campaignUserId: String(campaign.user_id || ""),
      adType:
        typeof snapshotSelection.adType === "string"
          ? (snapshotSelection.adType as CampaignAdType)
          : null,
      metaCampaignId:
        (typeof campaign.meta_campaign_id === "string" && campaign.meta_campaign_id) ||
        (typeof externalIds.campaign_id === "string" ? externalIds.campaign_id : null) ||
        (typeof jobExternalIds.campaign_id === "string" ? jobExternalIds.campaign_id : null),
      metaAdSetId:
        (typeof campaign.meta_adset_id === "string" && campaign.meta_adset_id) ||
        (typeof externalIds.adset_id === "string" ? externalIds.adset_id : null) ||
        (typeof jobExternalIds.adset_id === "string" ? jobExternalIds.adset_id : null),
      metaAdId:
        (typeof campaign.meta_ad_id === "string" && campaign.meta_ad_id) ||
        (typeof externalIds.ad_id === "string" ? externalIds.ad_id : null) ||
        (typeof jobExternalIds.ad_id === "string" ? jobExternalIds.ad_id : null),
      metaLeadFormId:
        (typeof campaign.meta_lead_form_id === "string" && campaign.meta_lead_form_id) ||
        (typeof externalIds.lead_form_id === "string" ? externalIds.lead_form_id : null) ||
        (typeof jobExternalIds.lead_form_id === "string" ? jobExternalIds.lead_form_id : null),
      pageId:
        (typeof page.id === "string" ? page.id : null) ||
        (typeof snapshotIntegrationSelections.pageId === "string" ? snapshotIntegrationSelections.pageId : null),
    } satisfies CampaignLeadMapping;
  });
}

function matchCampaignForLead(mappings: CampaignLeadMapping[], input: {
  metaCampaignId?: string | null;
  metaAdSetId?: string | null;
  metaAdId?: string | null;
  metaLeadFormId?: string | null;
  pageId?: string | null;
}) {
  const exactCampaign =
    mappings.find((mapping) => input.metaCampaignId && mapping.metaCampaignId === input.metaCampaignId) ||
    mappings.find((mapping) => input.metaAdId && mapping.metaAdId === input.metaAdId) ||
    mappings.find((mapping) => input.metaAdSetId && mapping.metaAdSetId === input.metaAdSetId) ||
    mappings.find((mapping) => input.metaLeadFormId && mapping.metaLeadFormId === input.metaLeadFormId);

  if (exactCampaign) {
    return exactCampaign;
  }

  if (input.pageId) {
    const byPage = mappings.filter((mapping) => mapping.pageId === input.pageId && mapping.adType === "lead_form");
    if (byPage.length === 1) {
      return byPage[0];
    }
  }

  return null;
}

function buildLeadSyncHealth(args: {
  connection: WorkspaceProviderConnectionRow | null;
  selectedPage: WorkspaceProviderAssetRow | null;
}) {
  const scopes = getConnectionScopes(args.connection);
  const requiredScopesMissing = requiredLeadSyncScopes.filter((scope) => !scopes.includes(scope));
  const realtimeScopesMissing = realtimeLeadSyncScopes.filter((scope) => !scopes.includes(scope));
  const optionalScopesMissing = optionalLeadSyncScopes.filter((scope) => !scopes.includes(scope));
  const metadata = readConnectionLeadSyncMetadata(args.connection);
  return {
    connected: Boolean(args.connection),
    activeConnectionId: args.connection?.id || null,
    selectedPageId: args.selectedPage?.asset_id || null,
    selectedPageName: args.selectedPage?.name || null,
    currentScopes: scopes,
    requiredScopesMissing,
    optionalScopesMissing,
    canReadLeads: Boolean(args.connection) && requiredScopesMissing.length === 0,
    webhookSubscriptionAttempted: Boolean(args.connection?.metadata_json && getObjectRecord(args.connection.metadata_json).lead_sync),
    webhookSubscriptionReady:
      typeof metadata.webhookSubscriptionReady === "boolean"
        ? metadata.webhookSubscriptionReady
        : false,
    lastWorkspaceSyncAt: metadata.lastWorkspaceSyncAt,
    lastWorkspaceSyncError: metadata.lastWorkspaceSyncError,
  } satisfies WorkspaceLeadSyncHealth;
}

async function persistLeadSyncMetadata({
  admin,
  connectionId,
  previousMetadata,
  result,
  errorMessage,
  webhookSubscriptionReady,
}: {
  admin: SupabaseAdmin;
  connectionId: string;
  previousMetadata: Record<string, unknown>;
  result?: MetaLeadSyncResult;
  errorMessage?: string | null;
  webhookSubscriptionReady?: boolean;
}) {
  const leadSyncMetadata = {
    ...getObjectRecord(previousMetadata.lead_sync),
    ...(result
      ? {
          last_synced_at: result.syncedAt,
          last_result: {
            created: result.created,
            updated: result.updated,
            skipped: result.skipped,
            warnings: result.warnings,
            errors: result.errors,
          },
        }
      : {}),
    ...(typeof webhookSubscriptionReady === "boolean"
      ? { webhook_subscription_ready: webhookSubscriptionReady }
      : {}),
    last_error: errorMessage || null,
  };

  const { error } = await admin
    .from("workspace_provider_connections")
    .update({
      metadata_json: {
        ...previousMetadata,
        lead_sync: leadSyncMetadata,
      },
      last_synced_at: result?.syncedAt || new Date().toISOString(),
    })
    .eq("id", connectionId);

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertLeadRecord({
  admin,
  workspaceId,
  userId,
  campaignId,
  funnelId,
  metaLeadId,
  metaPageId,
  metaPageName,
  metaFormId,
  metaFormName,
  metaCampaignId,
  metaAdSetId,
  metaAdId,
  adType,
  submittedAt,
  answers,
  normalizedFieldMap,
  rawPayload,
  derived,
  serviceInterest,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
  campaignId: string | null;
  funnelId: string | null;
  metaLeadId: string;
  metaPageId: string | null;
  metaPageName: string | null;
  metaFormId: string | null;
  metaFormName: string | null;
  metaCampaignId: string | null;
  metaAdSetId: string | null;
  metaAdId: string | null;
  adType: CampaignAdType | null;
  submittedAt: string | null;
  answers: Array<Record<string, unknown>>;
  normalizedFieldMap: Record<string, string[]>;
  rawPayload: Record<string, unknown>;
  derived: {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    job_title: string | null;
  };
  serviceInterest: string | null;
}) {
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await admin
    .from("leads")
    .select("*")
    .eq("meta_lead_id", metaLeadId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    workspace_id: workspaceId,
    user_id: userId,
    campaign_id: campaignId,
    funnel_id: funnelId,
    meta_lead_id: metaLeadId,
    meta_page_id: metaPageId,
    meta_page_name: metaPageName,
    meta_form_id: metaFormId,
    meta_form_name: metaFormName,
    meta_campaign_id: metaCampaignId,
    meta_adset_id: metaAdSetId,
    meta_ad_id: metaAdId,
    source: "meta_lead_ad",
    ad_type: adType,
    full_name: derived.full_name,
    first_name: derived.first_name,
    last_name: derived.last_name,
    name: derived.full_name || derived.email || derived.phone || "Unnamed lead",
    email: derived.email,
    phone: derived.phone,
    company_name: derived.company_name,
    job_title: derived.job_title,
    service_interest: serviceInterest,
    normalized_fields_json: normalizedFieldMap,
    field_data_json: answers,
    raw_payload_json: rawPayload,
    meta_created_time: submittedAt,
    last_synced_at: now,
    status: normalizeLeadStatusInput((existing as LeadRecord | null)?.status),
  } satisfies Record<string, unknown>;

  if (existing) {
    const { data, error } = await admin
      .from("leads")
      .update(payload)
      .eq("id", (existing as LeadRecord).id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      created: false,
      lead: data as LeadRecord,
    };
  }

  const insertedLead = await insertLeadWithSchemaFallback(admin, payload);
  return {
    created: true,
    lead: insertedLead,
  };
}

async function fetchWorkspacePageToken({
  admin,
  workspaceId,
  pageId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  pageId: string | null | undefined;
}) {
  if (!pageId) return null;
  const integrationState = await getWorkspaceMetaIntegrationState({ admin, workspaceId });
  const pageAsset =
    integrationState.assets.pages.find((asset) => asset.asset_id === pageId) ||
    integrationState.assets.pages.find((asset) => asset.is_selected) ||
    null;
  const pageAccessToken = getPageAccessTokenFromAsset(pageAsset);

  return {
    integrationState,
    pageAsset,
    pageAccessToken,
  };
}

async function ingestMetaLeadDetails({
  admin,
  workspaceId,
  leadDetails,
  pageId,
  pageName,
  rawPayload,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  leadDetails: Awaited<ReturnType<typeof fetchMetaLeadDetails>>;
  pageId: string | null;
  pageName: string | null;
  rawPayload: Record<string, unknown>;
}) {
  const mappings = await loadCampaignLeadMappings(admin, workspaceId);
  const matchedCampaign = matchCampaignForLead(mappings, {
    metaCampaignId: leadDetails.campaign_id || null,
    metaAdSetId: leadDetails.adset_id || null,
    metaAdId: leadDetails.ad_id || null,
    metaLeadFormId: leadDetails.form_id || null,
    pageId,
  });
  const formTokenContext = await fetchWorkspacePageToken({
    admin,
    workspaceId,
    pageId,
  });
  let formName =
    formTokenContext?.integrationState.assets.leadForms.find((asset) => asset.asset_id === leadDetails.form_id)?.name ||
    null;

  if (!formName && leadDetails.form_id && formTokenContext?.pageAccessToken) {
    formName =
      (await fetchMetaLeadFormDetails(formTokenContext.pageAccessToken, leadDetails.form_id).catch(() => null))?.name || null;
  }

  const normalizedFields = normalizeLeadFieldData(leadDetails.field_data);
  const upserted = await upsertLeadRecord({
    admin,
    workspaceId,
    userId: matchedCampaign?.campaignUserId || formTokenContext?.integrationState.connection?.user_id || "",
    campaignId: matchedCampaign?.campaignId || null,
    funnelId: null,
    metaLeadId: leadDetails.id,
    metaPageId: pageId || null,
    metaPageName: pageName || null,
    metaFormId: leadDetails.form_id || null,
    metaFormName: formName,
    metaCampaignId: leadDetails.campaign_id || null,
    metaAdSetId: leadDetails.adset_id || null,
    metaAdId: leadDetails.ad_id || null,
    adType: matchedCampaign?.adType || "lead_form",
    submittedAt: leadDetails.created_time || null,
    answers: normalizedFields.answers,
    normalizedFieldMap: normalizedFields.normalized,
    rawPayload: {
      ...rawPayload,
      lead_details: leadDetails,
    },
    derived: normalizedFields.derived,
    serviceInterest: matchedCampaign?.campaignName || formName || null,
  });

  console.info("[meta leads] ingested lead", {
    workspaceId,
    metaLeadId: leadDetails.id,
    created: upserted.created,
    campaignId: matchedCampaign?.campaignId || null,
    formId: leadDetails.form_id || null,
    pageId,
  });

  if (upserted.created) {
    await queueLeadForCrmDelivery({
      admin,
      lead: upserted.lead,
    }).catch((error) => {
      console.error("[crm delivery] could not queue lead after Meta ingestion", {
        workspaceId,
        metaLeadId: leadDetails.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });
  }

  return upserted;
}

export async function getWorkspaceLeadSyncHealth({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const integrationState = await getWorkspaceMetaIntegrationState({ admin, workspaceId });
  const selectedPage =
    integrationState.assets.pages.find((asset) => asset.is_selected) || integrationState.assets.pages[0] || null;

  return buildLeadSyncHealth({
    connection: integrationState.connection,
    selectedPage,
  });
}

export async function ensureWorkspaceMetaLeadAutomation({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const integrationState = await getWorkspaceMetaIntegrationState({ admin, workspaceId });
  const selectedPage =
    integrationState.assets.pages.find((asset) => asset.is_selected) || integrationState.assets.pages[0] || null;
  const health = buildLeadSyncHealth({
    connection: integrationState.connection,
    selectedPage,
  });
  const realtimeScopesMissing = realtimeLeadSyncScopes.filter(
    (scope) => !health.currentScopes.includes(scope),
  );

  const result = {
    connected: health.connected,
    subscribed: false,
    synced: false,
    mode: "incremental" as LeadSyncMode,
    warnings: [] as string[],
    errors: [] as string[],
  };

  if (!integrationState.connection) {
    result.warnings.push("Meta is not connected for this workspace yet.");
    return result;
  }

  if (!selectedPage?.asset_id) {
    result.warnings.push("Select a Facebook Page before automatic lead sync can be enabled.");
    await persistLeadSyncMetadata({
      admin,
      connectionId: integrationState.connection.id,
      previousMetadata: getObjectRecord(integrationState.connection.metadata_json),
      errorMessage: null,
      webhookSubscriptionReady: false,
    });
    return result;
  }

  if (!health.canReadLeads) {
    result.warnings.push(
      `Lead sync is not ready yet because the active Meta connection is missing: ${health.requiredScopesMissing.join(", ")}. ${buildLeadReconnectHint()}`,
    );
    await persistLeadSyncMetadata({
      admin,
      connectionId: integrationState.connection.id,
      previousMetadata: getObjectRecord(integrationState.connection.metadata_json),
      errorMessage: result.warnings[0] || null,
      webhookSubscriptionReady: false,
    });
    return result;
  }

  if (realtimeScopesMissing.length > 0) {
    const message =
      "Real-time Meta lead delivery is not fully available yet because the connected Meta app/token does not have leads_retrieval. SideKick can still run automatic recovery syncs, but instant webhook delivery requires Meta app approval for leads_retrieval.";
    result.warnings.push(message);
    await persistLeadSyncMetadata({
      admin,
      connectionId: integrationState.connection.id,
      previousMetadata: getObjectRecord(integrationState.connection.metadata_json),
      errorMessage: null,
      webhookSubscriptionReady: false,
    });

    try {
      const syncMetadata = readConnectionLeadSyncMetadata(integrationState.connection);
      result.mode = syncMetadata.lastWorkspaceSyncAt ? "incremental" : "backfill";
      await syncWorkspaceMetaLeads({
        admin,
        workspaceId,
        mode: result.mode,
      });
      result.synced = true;
    } catch (error) {
      const syncMessage = error instanceof Error ? error.message : "Automatic lead recovery sync failed.";
      result.errors.push(syncMessage);
    }

    return result;
  }

  const selectedPageAccessToken = getPageAccessTokenFromAsset(selectedPage);
  if (!selectedPageAccessToken) {
    result.warnings.push(
      `The selected Page ${selectedPage.name || selectedPage.asset_id} is missing a usable Page token, so automatic lead sync could not be finalized yet.`,
    );
    await persistLeadSyncMetadata({
      admin,
      connectionId: integrationState.connection.id,
      previousMetadata: getObjectRecord(integrationState.connection.metadata_json),
      errorMessage: result.warnings[0] || null,
      webhookSubscriptionReady: false,
    });
    return result;
  }

  try {
    await subscribeMetaPageToLeadgenWebhooks({
      accessToken: selectedPageAccessToken,
      pageId: selectedPage.asset_id,
    });
    result.subscribed = true;
    await persistLeadSyncMetadata({
      admin,
      connectionId: integrationState.connection.id,
      previousMetadata: getObjectRecord(integrationState.connection.metadata_json),
      errorMessage: null,
      webhookSubscriptionReady: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Page webhook subscription failed.";
    result.errors.push(message);
    await persistLeadSyncMetadata({
      admin,
      connectionId: integrationState.connection.id,
      previousMetadata: getObjectRecord(integrationState.connection.metadata_json),
      errorMessage: message,
      webhookSubscriptionReady: false,
    });
    return result;
  }

  const syncMetadata = readConnectionLeadSyncMetadata(integrationState.connection);
  result.mode = syncMetadata.lastWorkspaceSyncAt ? "incremental" : "backfill";

  try {
    await syncWorkspaceMetaLeads({
      admin,
      workspaceId,
      mode: result.mode,
    });
    result.synced = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automatic lead recovery sync failed.";
    result.errors.push(message);
  }

  return result;
}

export async function syncWorkspaceMetaLeads({
  admin,
  workspaceId,
  mode = "incremental",
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  mode?: LeadSyncMode;
}) {
  const tokenContext = await getWorkspaceMetaAccessToken({ admin, workspaceId });
  const integrationState = await getWorkspaceMetaIntegrationState({ admin, workspaceId });
  const selectedPage =
    integrationState.assets.pages.find((asset) => asset.is_selected) || integrationState.assets.pages[0] || null;
  const health = buildLeadSyncHealth({
    connection: integrationState.connection,
    selectedPage,
  });

  if (!tokenContext || !integrationState.connection) {
    throw new Error("Connect Meta before syncing leads.");
  }

  if (!health.canReadLeads) {
    throw new Error(
      `The active Meta connection cannot retrieve lead data yet. Missing scopes: ${health.requiredScopesMissing.join(", ")}. ${buildLeadReconnectHint()}`,
    );
  }

  const mappings = await loadCampaignLeadMappings(admin, workspaceId);
  const formIds = Array.from(
    new Set(
      [
        ...mappings.map((mapping) => mapping.metaLeadFormId).filter((value): value is string => Boolean(value)),
        ...integrationState.assets.leadForms.map((asset) => asset.asset_id).filter(Boolean),
      ],
    ),
  );

  if (!formIds.length) {
    throw new Error("No Meta lead forms are connected to this workspace yet, so there are no leads to sync.");
  }

  const syncMetadata = readConnectionLeadSyncMetadata(integrationState.connection);
  const sinceTime =
    mode === "incremental" && syncMetadata.lastWorkspaceSyncAt
      ? new Date(syncMetadata.lastWorkspaceSyncAt).getTime()
      : null;
  const result: MetaLeadSyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    warnings: [],
    processedLeadIds: [],
    syncedAt: new Date().toISOString(),
  };

  const selectedPageAccessToken = getPageAccessTokenFromAsset(selectedPage);
  if (selectedPage?.asset_id && selectedPageAccessToken && health.optionalScopesMissing.length === 0) {
    await subscribeMetaPageToLeadgenWebhooks({
      accessToken: selectedPageAccessToken,
      pageId: selectedPage.asset_id,
    }).catch((error) => {
      const message = error instanceof Error ? error.message : "Page webhook subscription failed.";
      result.warnings.push(`Could not verify Page webhook subscription for ${selectedPage.name || selectedPage.asset_id}: ${message}`);
      return null;
    });
  } else if (health.optionalScopesMissing.length) {
    result.warnings.push(
      `Real-time lead webhook subscription is not fully available yet because the active Meta token is missing ${health.optionalScopesMissing.join(", ")}. Manual and backfill sync still work.`,
    );
  }

  for (const formId of formIds) {
    const assetName = integrationState.assets.leadForms.find((asset) => asset.asset_id === formId)?.name || formId;
    const mappedCampaign = mappings.find((mapping) => mapping.metaLeadFormId === formId) || null;
    const mappedPageContext = await fetchWorkspacePageToken({
      admin,
      workspaceId,
      pageId: mappedCampaign?.pageId || selectedPage?.asset_id || null,
    });
    const pageAccessToken =
      mappedPageContext?.pageAccessToken ||
      selectedPageAccessToken ||
      tokenContext.accessToken;

    let afterCursor: string | null = null;
    const maxPages = mode === "backfill" ? 8 : 3;
    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      try {
        const page = await fetchMetaLeadFormLeads({
          accessToken: pageAccessToken,
          formId,
          after: afterCursor,
          limit: 50,
        });

        if (!page.data.length) {
          if (pageIndex === 0) {
            result.warnings.push(`No leads were returned for ${assetName}.`);
          }
          break;
        }

        let shouldStopForIncremental = false;
        for (const lead of page.data) {
          if (sinceTime && lead.created_time) {
            const leadTimestamp = new Date(lead.created_time).getTime();
            if (Number.isFinite(leadTimestamp) && leadTimestamp <= sinceTime) {
              shouldStopForIncremental = true;
              result.skipped += 1;
              continue;
            }
          }

          try {
            const ingested = await ingestMetaLeadDetails({
              admin,
              workspaceId,
              leadDetails: lead,
              pageId: mappedPageContext?.pageAsset?.asset_id || selectedPage?.asset_id || null,
              pageName: mappedPageContext?.pageAsset?.name || selectedPage?.name || null,
              rawPayload: {
                source: "meta_leads_sync",
                form_id: formId,
                page_id: mappedPageContext?.pageAsset?.asset_id || selectedPage?.asset_id || null,
              },
            });

            if (ingested.created) {
              result.created += 1;
            } else {
              result.updated += 1;
            }
            result.processedLeadIds.push(lead.id);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Lead ingestion failed.";
            result.errors.push(`Lead ${lead.id} from ${assetName}: ${message}`);
          }
        }

        if (shouldStopForIncremental || !page.hasNext || !page.after) {
          break;
        }
        afterCursor = page.after;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Lead form sync failed.";
        result.errors.push(`Could not sync ${assetName}: ${message}`);
        break;
      }
    }
  }

  await persistLeadSyncMetadata({
    admin,
    connectionId: integrationState.connection.id,
    previousMetadata: getObjectRecord(integrationState.connection.metadata_json),
    result,
    errorMessage: result.errors.length ? result.errors[0] : null,
    webhookSubscriptionReady: health.optionalScopesMissing.length === 0,
  });

  return result;
}

export async function ingestMetaLeadWebhookPayload({
  admin,
  payload,
}: {
  admin: SupabaseAdmin;
  payload: Record<string, unknown>;
}) {
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const result: MetaLeadSyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    warnings: [],
    processedLeadIds: [],
    syncedAt: new Date().toISOString(),
  };

  for (const entry of entries) {
    const entryRecord = getObjectRecord(entry);
    const pageId = typeof entryRecord.id === "string" ? entryRecord.id : null;
    const changes = Array.isArray(entryRecord.changes) ? entryRecord.changes : [];

    for (const change of changes) {
      const changeRecord = getObjectRecord(change);
      if (changeRecord.field !== "leadgen") {
        continue;
      }
      const value = getObjectRecord(changeRecord.value);
      const leadgenId = typeof value.leadgen_id === "string" ? value.leadgen_id : null;
      if (!leadgenId || !pageId) {
        result.warnings.push("Skipped a leadgen webhook event because page_id or leadgen_id was missing.");
        continue;
      }

      const { data: matchingPages, error: matchingPagesError } = await admin
        .from("workspace_provider_assets")
        .select("workspace_id, name, is_selected")
        .eq("provider", "meta")
        .eq("asset_type", "page")
        .eq("asset_id", pageId)
        .eq("is_available", true);

      if (matchingPagesError) {
        result.errors.push(`Could not resolve workspace for Page ${pageId}: ${matchingPagesError.message}`);
        continue;
      }

      const workspaceIds = Array.from(
        new Set(
          ((matchingPages || []) as Array<Record<string, unknown>>)
            .map((row) => (typeof row.workspace_id === "string" ? row.workspace_id : ""))
            .filter(Boolean),
        ),
      );

      if (!workspaceIds.length) {
        result.warnings.push(`Received a Meta lead webhook for Page ${pageId}, but no workspace is connected to that Page.`);
        continue;
      }

      for (const workspaceId of workspaceIds) {
        try {
          const tokenContext = await getWorkspaceMetaAccessToken({ admin, workspaceId });
          const pageTokenContext = await fetchWorkspacePageToken({
            admin,
            workspaceId,
            pageId,
          });
          const accessToken =
            pageTokenContext?.pageAccessToken ||
            tokenContext?.accessToken;

          if (!accessToken) {
            result.errors.push(`Workspace ${workspaceId} does not have a usable Meta token for Page ${pageId}.`);
            continue;
          }

          const leadDetails = await fetchMetaLeadDetails(accessToken, leadgenId);
          const ingested = await ingestMetaLeadDetails({
            admin,
            workspaceId,
            leadDetails,
            pageId,
            pageName: pageTokenContext?.pageAsset?.name || null,
            rawPayload: {
              source: "meta_webhook",
              page_id: pageId,
              webhook_change: value,
            },
          });

          if (ingested.created) {
            result.created += 1;
          } else {
            result.updated += 1;
          }
          result.processedLeadIds.push(leadgenId);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Webhook lead ingestion failed.";
          result.errors.push(`Workspace ${workspaceId} lead ${leadgenId}: ${message}`);
        }
      }
    }
  }

  return result;
}

export function buildLeadSyncReconnectUrl(next = "/leads") {
  return `/api/meta/connect?reconnect=1&scopeSet=leads&next=${encodeURIComponent(next)}`;
}

export function getLeadInboxSearchMatch(lead: LeadRecord, query: string) {
  const needle = formatLeadSearchValue(query);
  if (!needle) return true;
  const haystacks = [
    lead.full_name,
    lead.name,
    lead.email,
    lead.phone,
    lead.meta_form_name,
    lead.service_interest,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => formatLeadSearchValue(value));

  return haystacks.some((value) => value.includes(needle));
}

export function getLeadFieldAnswers(lead: LeadRecord) {
  return coerceFieldAnswers(lead.field_data_json);
}

export function getLeadStatusOptions() {
  return leadStatusIds;
}
