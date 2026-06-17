import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptCrmSecret, decryptEncryptedSecret, encryptCrmSecret } from "@/lib/crm-security";
import {
  env,
  isCrmProviderDebugEnabled,
  isFreshsalesConfigured,
  isGhlConfigured,
  isHubSpotConfigured,
  isZohoConfigured,
} from "@/lib/env";
import {
  createOrUpdateFreshsalesTestLead,
  exchangeFreshsalesCodeForTokens,
  getFreshsalesAccountInfo,
  getFreshsalesErrorDetails,
  getFreshsalesTokenMetadata,
  refreshFreshsalesAccessToken,
} from "@/lib/integrations/freshsales";
import {
  createOrUpdateHubSpotContact,
  exchangeHubSpotCodeForTokens,
  getHubSpotAccountDetails,
  getHubSpotTokenMetadata,
  refreshHubSpotAccessToken,
} from "@/lib/integrations/hubspot";
import {
  exchangeCodeForTokens as exchangePipedriveCodeForTokens,
  getCurrentUser as getPipedriveCurrentUser,
  getTokenMetadata as getPipedriveTokenMetadata,
  refreshAccessToken as refreshPipedriveAccessToken,
  sendTestLead as sendPipedriveTestLead,
} from "@/lib/integrations/pipedrive";
import {
  createZohoLead,
  exchangeZohoCodeForTokens,
  getZohoErrorDetails,
  getZohoOrgInfo,
  getZohoTokenMetadata,
  refreshZohoAccessToken,
} from "@/lib/integrations/zoho";
import {
  CampaignRecord,
  CrmConnectionStatus,
  CrmDeliveryState,
  CrmProvider,
  LeadRecord,
  NormalizedLeadCustomAnswer,
  NormalizedMetaLeadDeliveryRecord,
} from "@/types";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type WorkspaceCrmConnectionRow = {
  id: string;
  workspace_id: string;
  provider: CrmProvider;
  user_id: string;
  provider_user_id: string | null;
  provider_user_name: string | null;
  token_ciphertext: string | null;
  token_iv: string | null;
  token_tag: string | null;
  refresh_token_ciphertext: string | null;
  refresh_token_iv: string | null;
  refresh_token_tag: string | null;
  token_type: string | null;
  token_expires_at: string | null;
  scopes: string[];
  status: CrmConnectionStatus;
  metadata_json: Record<string, unknown>;
  connected_at: string;
  disconnected_at: string | null;
  last_synced_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkspaceCrmAssetRow = {
  id: string;
  workspace_id: string;
  provider: CrmProvider;
  connection_id: string | null;
  asset_type: "crm_destination";
  asset_id: string;
  name: string | null;
  metadata_json: Record<string, unknown>;
  is_available: boolean;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
};

export type CrmRoutingRuleRow = {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  provider: CrmProvider;
  connection_id: string;
  destination_asset_id: string | null;
  rule_scope: "workspace_default" | "campaign_override";
  priority: number;
  is_active: boolean;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LeadDeliveryRow = {
  id: string;
  workspace_id: string;
  lead_id: string;
  campaign_id: string | null;
  provider: CrmProvider;
  connection_id: string;
  destination_asset_id: string | null;
  state: CrmDeliveryState;
  external_record_id: string | null;
  attempts_count: number;
  last_attempt_at: string | null;
  last_error: string | null;
  last_error_detail_json: Record<string, unknown>;
  request_payload_json: Record<string, unknown>;
  response_payload_json: Record<string, unknown>;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadDeliverySummary = LeadDeliveryRow & {
  leadName: string | null;
  leadSource: string | null;
  formName: string | null;
  pageName: string | null;
  campaignName: string | null;
};

export type WorkspaceCrmState = {
  connections: WorkspaceCrmConnectionRow[];
  destinations: WorkspaceCrmAssetRow[];
  deliveries: LeadDeliverySummary[];
  deliveryCounts: Record<CrmDeliveryState, number>;
};

export type CrmTestDeliveryResult = {
  success: boolean;
  provider: CrmProvider;
  providerName: string;
  message: string;
  messageKey?: string;
  safeMessage: string;
  createdObjectType: "contact" | "lead" | "person" | "deal";
  providerRecordIds?: Record<string, string | null>;
  safeErrorCategory?: string;
};

type CrmDestinationSeed = {
  assetId: string;
  name: string;
  metadata: Record<string, unknown>;
  selected?: boolean;
};

type ValidatedConnection = {
  providerUserId: string | null;
  providerUserName: string | null;
  tokenType?: string | null;
  tokenExpiresAt?: string | null;
  refreshToken?: string | null;
  scopes: string[];
  metadata: Record<string, unknown>;
  destinations: CrmDestinationSeed[];
};

type DeliveryResult = {
  externalRecordId: string | null;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
};

type CrmDiagnosticError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  provider?: CrmProvider;
  step?: string;
  safeCategory?: string | null;
  apiDomainHost?: string | null;
  detailApiName?: string | null;
};

type GoHighLevelOAuthTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  userType?: string;
  companyId?: string;
  companyName?: string;
  locationId?: string;
  userId?: string;
  traceId?: string;
  refreshTokenId?: string;
  isBulkInstallation?: boolean;
};

type PipedriveMetadata = {
  apiDomain?: string | null;
  tokenType?: string | null;
  expiresIn?: number | string | null;
  refreshToken?: string | null;
  scope?: string | string[] | null;
  companyId?: string | null;
  companyName?: string | null;
  companyDomain?: string | null;
  email?: string | null;
  locale?: string | null;
  language?: string | null;
  timezoneName?: string | null;
};

type HubSpotMetadata = {
  tokenType?: string | null;
  expiresIn?: number | string | null;
  refreshToken?: string | null;
  scope?: string | string[] | null;
  authType?: string | null;
};

type ZohoMetadata = {
  tokenType?: string | null;
  expiresIn?: number | string | null;
  refreshToken?: string | null;
  scope?: string | string[] | null;
  apiDomain?: string | null;
  accountsServer?: string | null;
};

type FreshsalesMetadata = {
  tokenType?: string | null;
  expiresIn?: number | string | null;
  refreshToken?: string | null;
  scope?: string | string[] | null;
  apiBaseUrl?: string | null;
  authBaseUrl?: string | null;
};

const CRM_PROVIDERS: CrmProvider[] = ["gohighlevel", "hubspot", "pipedrive", "salesforce", "zoho", "freshsales"];
const CRM_TEST_PROVIDER_LABELS: Record<CrmProvider, string> = {
  gohighlevel: "GoHighLevel",
  hubspot: "HubSpot",
  pipedrive: "Pipedrive",
  salesforce: "Salesforce",
  zoho: "Zoho CRM",
  freshsales: "Freshsales",
};

const CRM_TEST_LEAD = {
  name: "SideKick Test Lead",
  firstName: "SideKick",
  lastName: "Test Lead",
  email: "test+sidekick@sidekickstudioss.com",
  phone: "555-010-2026",
  source: "SideKick CRM Delivery Test",
  note: "Created by SideKick Studioss to verify the CRM integration.",
} as const;

function getObjectRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function getCrmProviderLabel(provider: CrmProvider) {
  return CRM_TEST_PROVIDER_LABELS[provider] || provider;
}

export function isCrmTestDeliverySupported(provider: CrmProvider) {
  return (
    provider === "gohighlevel" ||
    provider === "pipedrive" ||
    provider === "hubspot" ||
    provider === "zoho" ||
    provider === "freshsales"
  );
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function getLeadCustomAnswers(lead: LeadRecord): NormalizedLeadCustomAnswer[] {
  const rows = Array.isArray(lead.field_data_json) ? lead.field_data_json : [];
  return rows
    .map((row) => {
      const record = getObjectRecord(row);
      const key = getFirstString(record.key, record.name, record.fieldKey) || "field";
      const label = getFirstString(record.label, record.name, key) || key;
      const values = Array.isArray(record.values)
        ? record.values.filter((value): value is string => typeof value === "string" && value.trim().length > 0).map((value) => value.trim())
        : [];
      return { key, label, values };
    })
    .filter((answer) => answer.values.length > 0);
}

function buildNormalizedMetaLeadDeliveryRecord({
  lead,
  campaign,
}: {
  lead: LeadRecord;
  campaign: Pick<CampaignRecord, "template_id"> | null;
}): NormalizedMetaLeadDeliveryRecord {
  return {
    workspace_id: lead.workspace_id || "",
    campaign_id: lead.campaign_id || null,
    template_id: campaign?.template_id || null,
    meta_lead_id: lead.meta_lead_id || null,
    meta_form_id: lead.meta_form_id || null,
    meta_page_id: lead.meta_page_id || null,
    name: lead.full_name || lead.name || null,
    email: lead.email || null,
    phone: lead.phone || null,
    custom_answers: getLeadCustomAnswers(lead),
    source: lead.source || null,
    created_at: lead.meta_created_time || lead.created_at || null,
  };
}

function isMissingTableError(error: { message?: string | null } | null | undefined, tableName: string) {
  const message = error?.message || "";
  return (
    message.includes(`Could not find the table 'public.${tableName}' in the schema cache`) ||
    message.includes(`relation \"public.${tableName}\" does not exist`) ||
    message.includes(`relation \"${tableName}\" does not exist`)
  );
}

function normalizeCrmDatabaseError(error: { message?: string | null } | null | undefined) {
  const message = error?.message || "";

  if (message.includes("workspace_provider_connections_provider_check")) {
    return "CRM providers are not enabled in this database yet. Apply the latest CRM provider migrations, including supabase/migrations/029_freshsales_crm_provider_support.sql, then try connecting again.";
  }

  if (message.includes("workspace_provider_assets_provider_check")) {
    return "CRM provider assets are not enabled in this database yet. Apply the latest CRM provider migrations, including supabase/migrations/029_freshsales_crm_provider_support.sql, then try again.";
  }

  if (message.includes("workspace_provider_assets_type_check")) {
    return "CRM destination support is not enabled in this database yet. Apply supabase/migrations/021_crm_integrations.sql, then try again.";
  }

  return message;
}

function getScopeList(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
          .map((entry) => entry.trim()),
      ),
    );
  }
  if (typeof value === "string") {
    return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
  }
  return [];
}

function buildTokenExpiry(expiresIn?: number) {
  return typeof expiresIn === "number" && expiresIn > 0
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;
}

function normalizeAccessToken(value: string) {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.replace(/^Bearer\s+/i, "").trim();
}

function getCrmDiagnostic(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      message: "Unexpected CRM error",
      status: null,
      category: null,
      code: null,
      provider: null,
      step: null,
      safeCategory: null,
      apiDomainHost: null,
      detailApiName: null,
    };
  }

  const crmError = error as CrmDiagnosticError;
  return {
    message: crmError.message,
    status: typeof crmError.status === "number" ? crmError.status : null,
    category: typeof crmError.category === "string" ? crmError.category : null,
    code: typeof crmError.code === "string" ? crmError.code : null,
    provider: typeof crmError.provider === "string" ? crmError.provider : null,
    step: typeof crmError.step === "string" ? crmError.step : null,
    safeCategory: typeof crmError.safeCategory === "string" ? crmError.safeCategory : null,
    apiDomainHost: typeof crmError.apiDomainHost === "string" ? crmError.apiDomainHost : null,
    detailApiName: typeof crmError.detailApiName === "string" ? crmError.detailApiName : null,
  };
}

export function logCrmTestDeliveryFailure({
  provider,
  workspaceId,
  step,
  error,
}: {
  provider: CrmProvider;
  workspaceId: string;
  step: string;
  error: unknown;
}) {
  const diagnostic = getCrmDiagnostic(error);
  const payload = {
    provider,
    workspaceId,
    step,
    status: diagnostic.status,
    category: diagnostic.category,
    code: diagnostic.code,
    safeCategory: diagnostic.safeCategory,
    ...((provider === "zoho" || provider === "freshsales") && diagnostic.apiDomainHost
      ? { apiDomainHost: diagnostic.apiDomainHost }
      : {}),
    ...(provider === "zoho" && diagnostic.detailApiName ? { detailApiName: diagnostic.detailApiName } : {}),
    errorCategory:
      diagnostic.status === 401
        ? "auth"
        : diagnostic.status === 403
          ? "scope"
          : diagnostic.status && diagnostic.status >= 500
            ? "provider"
            : "request",
  };
  if (provider === "zoho" || provider === "freshsales" || isCrmProviderDebugEnabled()) {
    console.error("[crm-test-delivery]", JSON.stringify(payload));
  } else {
    console.error("[crm-test-delivery]", JSON.stringify({
      provider: payload.provider,
      workspaceId: payload.workspaceId,
      step: payload.step,
      status: payload.status,
      category: payload.category,
      code: payload.code,
      errorCategory: payload.errorCategory,
    }));
  }
}

export function getCrmTestDeliveryFailureMessage({
  provider,
  error,
}: {
  provider: CrmProvider;
  error: unknown;
}) {
  if (provider === "zoho") {
    const diagnostic = getCrmDiagnostic(error);
    if (
      diagnostic.safeCategory === "REQUIRED_FIELD_MISSING" ||
      diagnostic.safeCategory === "VALIDATION_FAILED"
    ) {
      return "Zoho rejected the test lead because your Lead layout has required fields SideKick is not sending yet.";
    }
  }

  if (provider === "freshsales") {
    const diagnostic = getCrmDiagnostic(error);
    if (
      diagnostic.safeCategory === "REQUIRED_FIELD_MISSING" ||
      diagnostic.safeCategory === "VALIDATION_FAILED"
    ) {
      return "Freshsales rejected the test lead because your CRM layout has required fields SideKick is not sending yet.";
    }
  }

  const providerLabel = getCrmProviderLabel(provider);
  return `Test failed. Please reconnect ${providerLabel} or try again.`;
}

async function crmFetch<T>(url: string, init: RequestInit & { headers?: HeadersInit }, errorPrefix: string) {
  const response = await fetch(url, init);
  const raw = await response.text();
  const data = raw
    ? (() => {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return { raw } as T;
        }
      })()
    : ({} as T);
  if (!response.ok) {
    throw new Error(`${errorPrefix}: ${response.status} ${response.statusText}`);
  }
  return data;
}

async function validateGoHighLevelConnection({
  accessToken,
  locationId,
  tokenType,
  expiresIn,
  refreshToken,
  scope,
  userType,
  companyId,
  companyName,
  userId,
  refreshTokenId,
  traceId,
}: {
  accessToken: string;
  locationId: string;
  tokenType?: string | null;
  expiresIn?: number;
  refreshToken?: string | null;
  scope?: string | string[];
  userType?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  userId?: string | null;
  refreshTokenId?: string | null;
  traceId?: string | null;
}): Promise<ValidatedConnection> {
  const details = await crmFetch<Record<string, unknown>>(
    `https://services.leadconnectorhq.com/locations/${encodeURIComponent(locationId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: "2023-02-21",
        Accept: "application/json",
      },
    },
    "GoHighLevel connection failed",
  );

  const location = getObjectRecord(details.location ?? details);
  const locationName = getFirstString(location.name, location.businessName, `Location ${locationId}`) || `Location ${locationId}`;

  return {
    providerUserId: getFirstString(location.id, locationId),
    providerUserName: locationName,
    tokenType: tokenType || "Bearer",
    tokenExpiresAt: buildTokenExpiry(expiresIn),
    refreshToken: refreshToken || null,
    scopes: getScopeList(scope).length ? getScopeList(scope) : ["contacts.write", "locations.readonly"],
    metadata: {
      validated_at: new Date().toISOString(),
      location_id: locationId,
      location_name: locationName,
      user_type: userType || "Location",
      company_id: companyId || null,
      company_name: companyName || null,
      provider_user_id: userId || null,
      refresh_token_id: refreshTokenId || null,
      trace_id: traceId || null,
      account_details: location,
    },
    destinations: [
      {
        assetId: locationId,
        name: `${locationName} contacts`,
        metadata: {
          destinationType: "location_contacts",
          locationId,
        },
        selected: true,
      },
    ],
  };
}

async function validateHubSpotConnection({
  accessToken,
  metadata,
}: {
  accessToken: string;
  metadata?: HubSpotMetadata;
}): Promise<ValidatedConnection> {
  try {
    const details = await getHubSpotAccountDetails(accessToken);
    const portalId =
      getFirstString(details.portalId, details.hubId) ||
      (typeof details.portalId === "number" ? String(details.portalId) : null) ||
      (typeof details.hubId === "number" ? String(details.hubId) : null) ||
      "hubspot-account";
    const uiDomain =
      getFirstString(details.uiDomain, details.hub_domain, details.timeZone) || `Portal ${portalId}`;
    return {
      providerUserId: portalId,
      providerUserName: uiDomain,
      tokenType: getFirstString(metadata?.tokenType) || "Bearer",
      tokenExpiresAt: buildTokenExpiry(
        typeof metadata?.expiresIn === "number"
          ? metadata.expiresIn
          : typeof metadata?.expiresIn === "string"
            ? Number(metadata.expiresIn)
            : undefined,
      ),
      refreshToken: getFirstString(metadata?.refreshToken),
      scopes: getScopeList(metadata?.scope).length ? getScopeList(metadata?.scope) : ["crm.objects.contacts.write"],
      metadata: {
        validated_at: new Date().toISOString(),
        validation_mode: "oauth_account_lookup",
        auth_type: getFirstString(metadata?.authType, "oauth"),
        portal_id: portalId,
        account_details: details || {},
      },
      destinations: [
        {
          assetId: "contacts",
          name: "HubSpot contacts",
          metadata: {
            destinationType: "contacts",
            objectType: "contacts",
          },
          selected: true,
        },
      ],
    };
  } catch (error) {
    const diagnostic = getCrmDiagnostic(error);
    if (diagnostic.status === 401 || diagnostic.category === "EXPIRED_AUTHENTICATION") {
      throw new Error(
        "HubSpot token is invalid or expired. Reconnect HubSpot with OAuth and crm.objects.contacts.write.",
      );
    }

    if (diagnostic.status === 403) {
      throw new Error(
        "HubSpot token is missing contact write access. Reconnect HubSpot with crm.objects.contacts.write enabled.",
      );
    }

    throw new Error(diagnostic.message || "HubSpot verification could not be completed.");
  }
}

async function validateZohoConnection({
  accessToken,
  metadata,
}: {
  accessToken: string;
  metadata?: ZohoMetadata;
}): Promise<ValidatedConnection> {
  try {
    const apiDomain = getFirstString(metadata?.apiDomain) || "https://www.zohoapis.com";
    const org = await getZohoOrgInfo({
      accessToken,
      apiDomain,
    });
    const orgId = getFirstString(org.id, org.zgid, org.primary_zuid) || "zoho-org";
    const orgName =
      getFirstString(org.company_name, org.domain_name, org.primary_email) || `Zoho CRM org ${orgId}`;
    return {
      providerUserId: orgId,
      providerUserName: orgName,
      tokenType: getFirstString(metadata?.tokenType) || "Bearer",
      tokenExpiresAt: buildTokenExpiry(
        typeof metadata?.expiresIn === "number"
          ? metadata.expiresIn
          : typeof metadata?.expiresIn === "string"
            ? Number(metadata.expiresIn)
            : undefined,
      ),
      refreshToken: getFirstString(metadata?.refreshToken),
      scopes: getScopeList(metadata?.scope).length
        ? getScopeList(metadata?.scope)
        : ["ZohoCRM.modules.Leads.CREATE", "ZohoCRM.org.READ"],
      metadata: {
        validated_at: new Date().toISOString(),
        auth_type: "oauth",
        api_domain: apiDomain,
        accounts_server: getFirstString(metadata?.accountsServer) || env.zohoAccountsUrl || null,
        org_id: orgId,
        org_name: orgName,
        account_details: org,
      },
      destinations: [
        {
          assetId: "leads",
          name: "Zoho CRM leads",
          metadata: {
            destinationType: "leads",
            objectType: "Leads",
            apiDomain,
          },
          selected: true,
        },
      ],
    };
  } catch (error) {
    const diagnostic = getCrmDiagnostic(error);
    if (diagnostic.status === 401) {
      throw new Error(
        "Zoho token is invalid or expired. Reconnect Zoho CRM with lead and org scopes enabled.",
      );
    }

    if (diagnostic.status === 403) {
      throw new Error(
        "Zoho CRM access is missing required lead or org permissions. Reconnect Zoho with the requested scopes.",
      );
    }

    throw new Error(diagnostic.message || "Zoho verification could not be completed.");
  }
}

async function validateFreshsalesConnection({
  accessToken,
  metadata,
}: {
  accessToken: string;
  metadata?: FreshsalesMetadata;
}): Promise<ValidatedConnection> {
  try {
    const apiBaseUrl = getFirstString(metadata?.apiBaseUrl, env.freshsalesApiBaseUrl);
    if (!apiBaseUrl) {
      throw new Error("Freshsales API base URL is missing.");
    }

    const account = await getFreshsalesAccountInfo({
      accessToken,
      apiBaseUrl,
    });
    const accountLabel = account.apiHost || "Freshsales CRM";

    return {
      providerUserId: account.apiHost || accountLabel,
      providerUserName: accountLabel,
      tokenType: getFirstString(metadata?.tokenType) || "Token",
      tokenExpiresAt: buildTokenExpiry(
        typeof metadata?.expiresIn === "number"
          ? metadata.expiresIn
          : typeof metadata?.expiresIn === "string"
            ? Number(metadata.expiresIn)
            : undefined,
      ),
      refreshToken: getFirstString(metadata?.refreshToken),
      scopes: getScopeList(metadata?.scope).length
        ? getScopeList(metadata?.scope)
        : ["freshsales.contacts.create", "freshsales.contacts.edit", "freshsales.contacts.view"],
      metadata: {
        validated_at: new Date().toISOString(),
        auth_type: "oauth",
        api_base_url: account.apiBaseUrl,
        auth_base_url: getFirstString(metadata?.authBaseUrl, env.freshsalesAuthBaseUrl) || null,
        account_host: account.apiHost,
        contact_field_count: account.fieldCount,
      },
      destinations: [
        {
          assetId: "contacts",
          name: "Freshsales contacts",
          metadata: {
            destinationType: "contacts",
            objectType: "contacts",
            apiBaseUrl: account.apiBaseUrl,
          },
          selected: true,
        },
      ],
    };
  } catch (error) {
    const diagnostic = getCrmDiagnostic(error);
    if (diagnostic.status === 401) {
      throw new Error("Freshsales token is invalid or expired. Reconnect Freshsales.");
    }

    if (diagnostic.status === 403) {
      throw new Error("Freshsales access is missing contact permissions. Reconnect Freshsales with contact scopes enabled.");
    }

    throw new Error(diagnostic.message || "Freshsales verification could not be completed.");
  }
}

async function validateCrmConnection(input: {
  provider: CrmProvider;
  accessToken: string;
  metadata?: Record<string, unknown>;
}) {
  switch (input.provider) {
    case "gohighlevel": {
      const locationId = getString(input.metadata?.locationId)?.trim();
      if (!locationId) {
        throw new Error("GoHighLevel requires a location ID.");
      }
      return validateGoHighLevelConnection({
        accessToken: input.accessToken,
        locationId,
        tokenType: getString(input.metadata?.tokenType),
        expiresIn:
          typeof input.metadata?.expiresIn === "number"
            ? input.metadata.expiresIn
            : typeof input.metadata?.expiresIn === "string"
              ? Number(input.metadata.expiresIn)
              : undefined,
        refreshToken: getString(input.metadata?.refreshToken),
        scope:
          typeof input.metadata?.scope === "string" || Array.isArray(input.metadata?.scope)
            ? input.metadata.scope
            : undefined,
        userType: getString(input.metadata?.userType),
        companyId: getString(input.metadata?.companyId),
        companyName: getString(input.metadata?.companyName),
        userId: getString(input.metadata?.userId),
        refreshTokenId: getString(input.metadata?.refreshTokenId),
        traceId: getString(input.metadata?.traceId),
      });
    }
    case "hubspot":
      return validateHubSpotConnection({
        accessToken: input.accessToken,
        metadata: input.metadata as HubSpotMetadata | undefined,
      });
    case "pipedrive":
      return validatePipedriveConnection({
        accessToken: input.accessToken,
        metadata: input.metadata as PipedriveMetadata | undefined,
      });
    case "zoho":
      return validateZohoConnection({
        accessToken: input.accessToken,
        metadata: input.metadata as ZohoMetadata | undefined,
      });
    case "freshsales":
      return validateFreshsalesConnection({
        accessToken: input.accessToken,
        metadata: input.metadata as FreshsalesMetadata | undefined,
      });
    default:
      throw new Error(`${input.provider} is not available in this first CRM pass yet.`);
  }
}

async function validatePipedriveConnection({
  accessToken,
  metadata,
}: {
  accessToken: string;
  metadata?: PipedriveMetadata;
}): Promise<ValidatedConnection> {
  const apiDomain = getFirstString(metadata?.apiDomain);
  if (!apiDomain) {
    throw new Error("Pipedrive did not provide an API domain.");
  }

  const currentUser = await getPipedriveCurrentUser({
    accessToken,
    apiDomain,
  });

  return {
    providerUserId: getFirstString(currentUser.companyId, currentUser.userId),
    providerUserName: getFirstString(currentUser.companyName, currentUser.companyDomain, currentUser.userName),
    tokenType: getFirstString(metadata?.tokenType) || "Bearer",
    tokenExpiresAt: buildTokenExpiry(
      typeof metadata?.expiresIn === "number"
        ? metadata.expiresIn
        : typeof metadata?.expiresIn === "string"
          ? Number(metadata.expiresIn)
          : undefined,
    ),
    refreshToken: getFirstString(metadata?.refreshToken),
    scopes: getScopeList(metadata?.scope),
    metadata: {
      validated_at: new Date().toISOString(),
      api_domain: apiDomain,
      company_id: currentUser.companyId,
      company_name: currentUser.companyName,
      company_domain: currentUser.companyDomain,
      user_id: currentUser.userId,
      user_name: currentUser.userName,
      email: currentUser.email,
      locale: currentUser.locale,
      language: currentUser.language,
      timezone_name: currentUser.timezoneName,
    },
    destinations: [],
  };
}

async function exchangeGoHighLevelCodeForToken({
  code,
  userType,
}: {
  code: string;
  userType: "Location" | "Company";
}) {
  if (!isGhlConfigured() || !env.ghlClientId || !env.ghlClientSecret || !env.crmOAuthRedirectUri) {
    throw new Error("GoHighLevel OAuth env vars are missing.");
  }

  const response = await crmFetch<GoHighLevelOAuthTokenResponse>(
    "https://services.leadconnectorhq.com/oauth/token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.ghlClientId,
        client_secret: env.ghlClientSecret,
        grant_type: "authorization_code",
        code,
        user_type: userType,
        redirect_uri: env.crmOAuthRedirectUri,
      }).toString(),
    },
    "GoHighLevel OAuth exchange failed",
  );

  if (!response.access_token) {
    throw new Error("GoHighLevel did not return an access token.");
  }

  return response;
}

async function refreshGoHighLevelToken({
  admin,
  connection,
  refreshToken,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  refreshToken: string;
}) {
  if (!isGhlConfigured() || !env.ghlClientId || !env.ghlClientSecret || !env.crmOAuthRedirectUri) {
    throw new Error("GoHighLevel OAuth env vars are missing.");
  }

  const refreshed = await crmFetch<GoHighLevelOAuthTokenResponse>(
    "https://services.leadconnectorhq.com/oauth/token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.ghlClientId,
        client_secret: env.ghlClientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        user_type:
          getFirstString(connection.metadata_json.user_type, "Location") === "Company"
            ? "Company"
            : "Location",
        redirect_uri: env.crmOAuthRedirectUri,
      }).toString(),
    },
    "GoHighLevel token refresh failed",
  );

  if (!refreshed.access_token) {
    throw new Error("GoHighLevel did not return a refreshed access token.");
  }

  const accessPayload = encryptCrmSecret(refreshed.access_token);
  const nextRefreshToken = refreshed.refresh_token || refreshToken;
  const refreshPayload = nextRefreshToken ? encryptCrmSecret(nextRefreshToken) : null;

  const { error } = await admin
    .from("workspace_provider_connections")
    .update({
      token_ciphertext: accessPayload.ciphertext,
      token_iv: accessPayload.iv,
      token_tag: accessPayload.tag,
      refresh_token_ciphertext: refreshPayload?.ciphertext || null,
      refresh_token_iv: refreshPayload?.iv || null,
      refresh_token_tag: refreshPayload?.tag || null,
      token_type: refreshed.token_type || connection.token_type || "Bearer",
      token_expires_at: buildTokenExpiry(refreshed.expires_in),
      scopes: getScopeList(refreshed.scope).length ? getScopeList(refreshed.scope) : connection.scopes,
      metadata_json: {
        ...connection.metadata_json,
        user_type: refreshed.userType || connection.metadata_json.user_type || "Location",
        company_id: refreshed.companyId || connection.metadata_json.company_id || null,
        refresh_token_id: refreshed.refreshTokenId || connection.metadata_json.refresh_token_id || null,
        trace_id: refreshed.traceId || connection.metadata_json.trace_id || null,
      },
      last_synced_at: new Date().toISOString(),
      status: "connected",
      disconnected_at: null,
      is_active: true,
    })
    .eq("id", connection.id);

  if (error) throw new Error(error.message);

  return refreshed.access_token;
}

async function listCrmConnections(admin: SupabaseAdmin, workspaceId: string) {
  const { data, error } = await admin
    .from("workspace_provider_connections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .in("provider", CRM_PROVIDERS)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as WorkspaceCrmConnectionRow[];
}

async function listCrmDestinations(admin: SupabaseAdmin, workspaceId: string) {
  const { data, error } = await admin
    .from("workspace_provider_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("asset_type", "crm_destination")
    .in("provider", CRM_PROVIDERS)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as WorkspaceCrmAssetRow[];
}

async function listCrmRoutingRules(admin: SupabaseAdmin, workspaceId: string) {
  const { data, error } = await admin
    .from("crm_routing_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "crm_routing_rules")) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data || []) as CrmRoutingRuleRow[];
}

async function listRecentLeadDeliveries(admin: SupabaseAdmin, workspaceId: string) {
  const { data, error } = await admin
    .from("lead_deliveries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingTableError(error, "lead_deliveries")) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data || []) as LeadDeliveryRow[];
}

async function enrichLeadDeliveries({
  admin,
  deliveries,
}: {
  admin: SupabaseAdmin;
  deliveries: LeadDeliveryRow[];
}) {
  if (!deliveries.length) return [] as LeadDeliverySummary[];

  const leadIds = Array.from(new Set(deliveries.map((delivery) => delivery.lead_id).filter(Boolean)));
  const campaignIds = Array.from(new Set(deliveries.map((delivery) => delivery.campaign_id).filter((value): value is string => Boolean(value))));

  const [leadsResult, campaignsResult] = await Promise.all([
    leadIds.length
      ? admin.from("leads").select("id, name, full_name, source, meta_form_name, meta_page_name").in("id", leadIds)
      : Promise.resolve({ data: [], error: null }),
    campaignIds.length
      ? admin.from("campaigns").select("id, name").in("id", campaignIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (leadsResult.error) throw new Error(leadsResult.error.message);
  if (campaignsResult.error) throw new Error(campaignsResult.error.message);

  const leadMap = new Map<string, Record<string, unknown>>();
  for (const lead of (leadsResult.data || []) as Array<Record<string, unknown>>) {
    const leadId = getFirstString(lead.id);
    if (leadId) leadMap.set(leadId, lead);
  }

  const campaignMap = new Map<string, Record<string, unknown>>();
  for (const campaign of (campaignsResult.data || []) as Array<Record<string, unknown>>) {
    const campaignId = getFirstString(campaign.id);
    if (campaignId) campaignMap.set(campaignId, campaign);
  }

  return deliveries.map((delivery) => {
    const lead = leadMap.get(delivery.lead_id) || {};
    const campaign = delivery.campaign_id ? campaignMap.get(delivery.campaign_id) || {} : {};
    return {
      ...delivery,
      leadName: getFirstString(lead.full_name, lead.name),
      leadSource: getFirstString(lead.source),
      formName: getFirstString(lead.meta_form_name),
      pageName: getFirstString(lead.meta_page_name),
      campaignName: getFirstString(campaign.name),
    } satisfies LeadDeliverySummary;
  });
}

export async function getWorkspaceCrmState({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}): Promise<WorkspaceCrmState> {
  const [connections, destinations, deliveries] = await Promise.all([
    listCrmConnections(admin, workspaceId),
    listCrmDestinations(admin, workspaceId),
    listRecentLeadDeliveries(admin, workspaceId),
  ]);
  const enrichedDeliveries = await enrichLeadDeliveries({ admin, deliveries });
  const deliveryCounts = deliveries.reduce<Record<CrmDeliveryState, number>>(
    (counts, delivery) => {
      counts[delivery.state] += 1;
      return counts;
    },
    {
      pending: 0,
      delivered: 0,
      failed: 0,
      retrying: 0,
      skipped: 0,
    },
  );

  return {
    connections,
    destinations,
    deliveries: enrichedDeliveries,
    deliveryCounts,
  };
}

function getWorkspaceCrmTargets({
  connections,
  destinations,
}: {
  connections: WorkspaceCrmConnectionRow[];
  destinations: WorkspaceCrmAssetRow[];
}) {
  return connections
    .filter((connection) => connection.is_active && connection.status === "connected")
    .map((connection) => {
      const providerDestinations = destinations.filter(
        (destination) =>
          destination.provider === connection.provider &&
          destination.is_available &&
          (destination.connection_id === connection.id || destination.connection_id === null),
      );
      const selectedDestination =
        providerDestinations.find((destination) => destination.is_selected) ||
        providerDestinations[0] ||
        null;

      return {
        connection,
        destination: selectedDestination,
      };
    })
    .filter((target) => Boolean(target.destination));
}

export async function connectWorkspaceCrmProvider({
  admin,
  workspaceId,
  userId,
  provider,
  accessToken,
  metadata,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
  provider: CrmProvider;
  accessToken: string;
  metadata?: Record<string, unknown>;
}) {
  const validated = await validateCrmConnection({
    provider,
    accessToken: normalizeAccessToken(accessToken),
    metadata,
  });
  const normalizedAccessToken = normalizeAccessToken(accessToken);
  const encrypted = encryptCrmSecret(normalizedAccessToken);
  const encryptedRefreshToken = validated.refreshToken
    ? encryptCrmSecret(validated.refreshToken)
    : null;
  const existingConnections = await listCrmConnections(admin, workspaceId);
  const activeConnection = existingConnections.find((connection) => connection.provider === provider && connection.is_active) || null;

  if (activeConnection) {
    const { error } = await admin
      .from("workspace_provider_connections")
      .update({
        provider_user_id: validated.providerUserId,
        provider_user_name: validated.providerUserName,
        token_ciphertext: encrypted.ciphertext,
        token_iv: encrypted.iv,
        token_tag: encrypted.tag,
        refresh_token_ciphertext: encryptedRefreshToken?.ciphertext || null,
        refresh_token_iv: encryptedRefreshToken?.iv || null,
        refresh_token_tag: encryptedRefreshToken?.tag || null,
        token_type: validated.tokenType || "Bearer",
        token_expires_at: validated.tokenExpiresAt || null,
        scopes: validated.scopes,
        status: "connected",
        metadata_json: {
          ...validated.metadata,
          ...getObjectRecord(metadata),
        },
        disconnected_at: null,
        last_synced_at: new Date().toISOString(),
        is_active: true,
      })
      .eq("id", activeConnection.id);

    if (error) throw new Error(normalizeCrmDatabaseError(error));
  } else {
    const { error } = await admin.from("workspace_provider_connections").insert({
      workspace_id: workspaceId,
      provider,
      user_id: userId,
      provider_user_id: validated.providerUserId,
      provider_user_name: validated.providerUserName,
      token_ciphertext: encrypted.ciphertext,
      token_iv: encrypted.iv,
      token_tag: encrypted.tag,
      refresh_token_ciphertext: encryptedRefreshToken?.ciphertext || null,
      refresh_token_iv: encryptedRefreshToken?.iv || null,
      refresh_token_tag: encryptedRefreshToken?.tag || null,
      token_type: validated.tokenType || "Bearer",
      token_expires_at: validated.tokenExpiresAt || null,
      scopes: validated.scopes,
      status: "connected",
      metadata_json: {
        ...validated.metadata,
        ...getObjectRecord(metadata),
      },
      is_active: true,
      last_synced_at: new Date().toISOString(),
    });

    if (error) throw new Error(normalizeCrmDatabaseError(error));
  }

  const refreshedConnections = await listCrmConnections(admin, workspaceId);
  const savedConnection = refreshedConnections.find((connection) => connection.provider === provider && connection.is_active);
  if (!savedConnection) {
    throw new Error(`Could not save ${provider} connection.`);
  }

  const { error: clearAssetsError } = await admin
    .from("workspace_provider_assets")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .eq("asset_type", "crm_destination");

  if (clearAssetsError) throw new Error(normalizeCrmDatabaseError(clearAssetsError));

  if (validated.destinations.length) {
    const { error: destinationsError } = await admin.from("workspace_provider_assets").insert(
      validated.destinations.map((destination) => ({
        workspace_id: workspaceId,
        provider,
        connection_id: savedConnection.id,
        asset_type: "crm_destination",
        asset_id: destination.assetId,
        name: destination.name,
        metadata_json: destination.metadata,
        is_available: true,
        is_selected: Boolean(destination.selected),
      })),
    );
    if (destinationsError) throw new Error(normalizeCrmDatabaseError(destinationsError));
  }

  return savedConnection;
}

export async function connectWorkspaceGoHighLevelOAuthProvider({
  admin,
  workspaceId,
  userId,
  code,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
  code: string;
}) {
  const locationToken = await exchangeGoHighLevelCodeForToken({
    code,
    userType: "Location",
  }).catch(async (error) => {
    const locationMessage = error instanceof Error ? error.message : "GoHighLevel location install failed.";
    try {
      const companyToken = await exchangeGoHighLevelCodeForToken({
        code,
        userType: "Company",
      });
      const locationId = getFirstString(companyToken.locationId);
      if (!locationId) {
        throw new Error(
          "GoHighLevel returned an agency-level install. Install the app from the target sub-account so SideKick receives a location token.",
        );
      }

      return companyToken;
    } catch (companyError) {
      const companyMessage =
        companyError instanceof Error ? companyError.message : "GoHighLevel company install failed.";
      throw new Error(
        companyMessage.includes("agency-level install")
          ? companyMessage
          : `${locationMessage} ${companyMessage}`.trim(),
      );
    }
  });

  const locationId = getFirstString(locationToken.locationId);
  if (!locationId) {
    throw new Error("GoHighLevel did not return a location ID for this installation.");
  }

  return connectWorkspaceCrmProvider({
    admin,
    workspaceId,
    userId,
    provider: "gohighlevel",
    accessToken: normalizeAccessToken(locationToken.access_token || ""),
    metadata: {
      locationId,
      companyId: locationToken.companyId || null,
      companyName: locationToken.companyName || null,
      userId: locationToken.userId || null,
      userType: locationToken.userType || "Location",
      scope: locationToken.scope || null,
      refreshTokenId: locationToken.refreshTokenId || null,
      traceId: locationToken.traceId || null,
      expiresIn: locationToken.expires_in,
      refreshToken: locationToken.refresh_token || null,
      tokenType: locationToken.token_type || "Bearer",
    },
  });
}

export async function connectWorkspacePipedriveOAuthProvider({
  admin,
  workspaceId,
  userId,
  code,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
  code: string;
}) {
  const token = await exchangePipedriveCodeForTokens(code);
  const tokenMetadata = getPipedriveTokenMetadata(token);

  return connectWorkspaceCrmProvider({
    admin,
    workspaceId,
    userId,
    provider: "pipedrive",
    accessToken: normalizeAccessToken(token.access_token || ""),
    metadata: {
      apiDomain: tokenMetadata.apiDomain,
      scope: token.scope || tokenMetadata.scopes,
      refreshToken: tokenMetadata.refreshToken,
      expiresIn: tokenMetadata.expiresIn,
      tokenType: tokenMetadata.tokenType,
    },
  });
}

export async function connectWorkspaceHubSpotOAuthProvider({
  admin,
  workspaceId,
  userId,
  code,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
  code: string;
}) {
  const token = await exchangeHubSpotCodeForTokens(code);
  const tokenMetadata = getHubSpotTokenMetadata(token);

  return connectWorkspaceCrmProvider({
    admin,
    workspaceId,
    userId,
    provider: "hubspot",
    accessToken: normalizeAccessToken(token.access_token || ""),
    metadata: {
      authType: "oauth",
      scope: token.scope || tokenMetadata.scopes,
      refreshToken: tokenMetadata.refreshToken,
      expiresIn: tokenMetadata.expiresIn,
      tokenType: tokenMetadata.tokenType,
    },
  });
}

export async function connectWorkspaceZohoOAuthProvider({
  admin,
  workspaceId,
  userId,
  code,
  accountsServer,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
  code: string;
  accountsServer?: string | null;
}) {
  const token = await exchangeZohoCodeForTokens({
    code,
    accountsUrl: accountsServer,
  });
  const tokenMetadata = getZohoTokenMetadata(token);

  return connectWorkspaceCrmProvider({
    admin,
    workspaceId,
    userId,
    provider: "zoho",
    accessToken: normalizeAccessToken(token.access_token || ""),
    metadata: {
      authType: "oauth",
      scope: token.scope || tokenMetadata.scopes,
      refreshToken: tokenMetadata.refreshToken,
      expiresIn: tokenMetadata.expiresIn,
      tokenType: tokenMetadata.tokenType,
      apiDomain: tokenMetadata.apiDomain,
      accountsServer: accountsServer || env.zohoAccountsUrl || null,
    },
  });
}

export async function connectWorkspaceFreshsalesOAuthProvider({
  admin,
  workspaceId,
  userId,
  code,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  userId: string;
  code: string;
}) {
  const token = await exchangeFreshsalesCodeForTokens(code);
  const tokenMetadata = getFreshsalesTokenMetadata(token);

  return connectWorkspaceCrmProvider({
    admin,
    workspaceId,
    userId,
    provider: "freshsales",
    accessToken: normalizeAccessToken(token.access_token || ""),
    metadata: {
      authType: "oauth",
      scope: token.scope || tokenMetadata.scopes,
      refreshToken: tokenMetadata.refreshToken,
      expiresIn: tokenMetadata.expiresIn,
      tokenType: tokenMetadata.tokenType,
      apiBaseUrl: env.freshsalesApiBaseUrl || null,
      authBaseUrl: env.freshsalesAuthBaseUrl || null,
    },
  });
}

export async function disconnectWorkspaceCrmProvider({
  admin,
  workspaceId,
  provider,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  provider: CrmProvider;
}) {
  const connections = await listCrmConnections(admin, workspaceId);
  const activeConnection = connections.find((connection) => connection.provider === provider && connection.is_active) || null;
  if (!activeConnection) return;

  const { error: connectionError } = await admin
    .from("workspace_provider_connections")
    .update({
      status: "disconnected",
      is_active: false,
      disconnected_at: new Date().toISOString(),
    })
    .eq("id", activeConnection.id);

  if (connectionError) throw new Error(connectionError.message);

  const { error: assetsError } = await admin
    .from("workspace_provider_assets")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .eq("asset_type", "crm_destination");

  if (assetsError) throw new Error(assetsError.message);

  const { error: routingError } = await admin
    .from("crm_routing_rules")
    .update({ is_active: false })
    .eq("workspace_id", workspaceId)
    .eq("provider", provider);

  if (routingError && !isMissingTableError(routingError, "crm_routing_rules")) {
    throw new Error(routingError.message);
  }
}

export async function saveWorkspaceCrmRoutingRule({
  admin,
  workspaceId,
  campaignId,
  provider,
  destinationAssetId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  campaignId?: string | null;
  provider: CrmProvider;
  destinationAssetId: string;
}) {
  const connections = await listCrmConnections(admin, workspaceId);
  const connection = connections.find((entry) => entry.provider === provider && entry.is_active);
  if (!connection) {
    throw new Error(`Connect ${provider} before saving routing.`);
  }

  const ruleScope = campaignId ? "campaign_override" : "workspace_default";
  const query = admin
    .from("crm_routing_rules")
    .update({ is_active: false })
    .eq("workspace_id", workspaceId)
    .eq("rule_scope", ruleScope);

  if (campaignId) {
    const { error } = await query.eq("campaign_id", campaignId);
    if (error) {
      if (isMissingTableError(error, "crm_routing_rules")) {
        throw new Error("CRM routing is not available until the latest database migration is applied.");
      }
      throw new Error(error.message);
    }
  } else {
    const { error } = await query.is("campaign_id", null);
    if (error) {
      if (isMissingTableError(error, "crm_routing_rules")) {
        throw new Error("CRM routing is not available until the latest database migration is applied.");
      }
      throw new Error(error.message);
    }
  }

  const { error: insertError } = await admin.from("crm_routing_rules").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId || null,
    provider,
    connection_id: connection.id,
    destination_asset_id: destinationAssetId,
    rule_scope: ruleScope,
    priority: campaignId ? 10 : 100,
    is_active: true,
    metadata_json: {},
  });
  if (insertError) {
    if (isMissingTableError(insertError, "crm_routing_rules")) {
      throw new Error("CRM routing is not available until the latest database migration is applied.");
    }
    throw new Error(insertError.message);
  }
}

export async function resolveCrmRoutingRule({
  admin,
  workspaceId,
  campaignId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  campaignId?: string | null;
}) {
  const rules = await listCrmRoutingRules(admin, workspaceId);
  return (
    (campaignId ? rules.find((rule) => rule.rule_scope === "campaign_override" && rule.campaign_id === campaignId) : null) ||
    rules.find((rule) => rule.rule_scope === "workspace_default" && !rule.campaign_id) ||
    null
  );
}

async function getGoHighLevelAccessToken({
  admin,
  connection,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
}) {
  const accessToken = decryptCrmSecret(connection);
  if (!accessToken) {
    throw new Error("GoHighLevel token is unavailable.");
  }

  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null;
  const expiresSoon = typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt <= Date.now() + 60_000;

  if (!expiresSoon) {
    return accessToken;
  }

  const refreshToken = decryptEncryptedSecret({
    ciphertext: connection.refresh_token_ciphertext,
    iv: connection.refresh_token_iv,
    tag: connection.refresh_token_tag,
  });
  if (!refreshToken) {
    return accessToken;
  }

  return refreshGoHighLevelToken({
    admin,
    connection,
    refreshToken,
  }).catch(() => accessToken);
}

async function refreshHubSpotToken({
  admin,
  connection,
  refreshToken,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  refreshToken: string;
}) {
  if (!isHubSpotConfigured()) {
    throw new Error("HubSpot OAuth env vars are missing.");
  }

  const refreshed = await refreshHubSpotAccessToken(refreshToken);
  const metadata = getHubSpotTokenMetadata(refreshed);
  const accessPayload = encryptCrmSecret(refreshed.access_token || "");
  const nextRefreshToken = metadata.refreshToken || refreshToken;
  const refreshPayload = nextRefreshToken ? encryptCrmSecret(nextRefreshToken) : null;

  const { error } = await admin
    .from("workspace_provider_connections")
    .update({
      token_ciphertext: accessPayload.ciphertext,
      token_iv: accessPayload.iv,
      token_tag: accessPayload.tag,
      refresh_token_ciphertext: refreshPayload?.ciphertext || null,
      refresh_token_iv: refreshPayload?.iv || null,
      refresh_token_tag: refreshPayload?.tag || null,
      token_type: metadata.tokenType || connection.token_type || "Bearer",
      token_expires_at: buildTokenExpiry(
        typeof metadata.expiresIn === "number" ? metadata.expiresIn : undefined,
      ),
      scopes: metadata.scopes.length ? metadata.scopes : connection.scopes,
      metadata_json: {
        ...connection.metadata_json,
        auth_type: "oauth",
      },
      last_synced_at: new Date().toISOString(),
      status: "connected",
      disconnected_at: null,
      is_active: true,
    })
    .eq("id", connection.id);

  if (error) throw new Error(error.message);
  return refreshed.access_token || "";
}

async function getHubSpotAccessToken({
  admin,
  connection,
  requireOAuth = false,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  requireOAuth?: boolean;
}) {
  const accessToken = decryptCrmSecret(connection);
  if (!accessToken) {
    throw new Error("HubSpot token is unavailable.");
  }

  const authType = getFirstString(connection.metadata_json.auth_type);
  if (requireOAuth && authType !== "oauth") {
    throw new Error("HubSpot must be reconnected through OAuth before test delivery can run.");
  }

  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null;
  const expiresSoon = typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt <= Date.now() + 60_000;

  if (!expiresSoon) {
    return accessToken;
  }

  const refreshToken = decryptEncryptedSecret({
    ciphertext: connection.refresh_token_ciphertext,
    iv: connection.refresh_token_iv,
    tag: connection.refresh_token_tag,
  });

  if (!refreshToken) {
    if (requireOAuth) {
      throw new Error("HubSpot OAuth refresh token is missing. Reconnect HubSpot.");
    }
    return accessToken;
  }

  return refreshHubSpotToken({
    admin,
    connection,
    refreshToken,
  }).catch(() => {
    if (requireOAuth) {
      throw new Error("HubSpot token is invalid or expired. Reconnect HubSpot.");
    }
    return accessToken;
  });
}

async function refreshZohoToken({
  admin,
  connection,
  refreshToken,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  refreshToken: string;
}) {
  if (!isZohoConfigured()) {
    throw new Error("Zoho OAuth env vars are missing.");
  }

  const accountsServer = getFirstString(connection.metadata_json.accounts_server, env.zohoAccountsUrl);
  const refreshed = await refreshZohoAccessToken({
    refreshToken,
    accountsUrl: accountsServer,
  }).catch((error) => {
    const diagnostic = getZohoErrorDetails(error);
    throw Object.assign(
      new Error("Zoho token refresh failed."),
      {
        provider: "zoho" as const,
        step: "token_refresh",
        status: diagnostic.status ?? undefined,
        category: diagnostic.category,
        code: diagnostic.code,
        safeCategory: diagnostic.safeCategory || "REFRESH_FAILED",
        apiDomainHost: getFirstString(connection.metadata_json.api_domain)?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null,
      } satisfies Partial<CrmDiagnosticError>,
    );
  });
  const metadata = getZohoTokenMetadata(refreshed);
  const accessPayload = encryptCrmSecret(refreshed.access_token || "");
  const nextRefreshToken = metadata.refreshToken || refreshToken;
  const refreshPayload = nextRefreshToken ? encryptCrmSecret(nextRefreshToken) : null;

  const { error } = await admin
    .from("workspace_provider_connections")
    .update({
      token_ciphertext: accessPayload.ciphertext,
      token_iv: accessPayload.iv,
      token_tag: accessPayload.tag,
      refresh_token_ciphertext: refreshPayload?.ciphertext || null,
      refresh_token_iv: refreshPayload?.iv || null,
      refresh_token_tag: refreshPayload?.tag || null,
      token_type: metadata.tokenType || connection.token_type || "Bearer",
      token_expires_at: buildTokenExpiry(
        typeof metadata.expiresIn === "number" ? metadata.expiresIn : undefined,
      ),
      scopes: metadata.scopes.length ? metadata.scopes : connection.scopes,
      metadata_json: {
        ...connection.metadata_json,
        auth_type: "oauth",
        ...(metadata.apiDomain ? { api_domain: metadata.apiDomain } : {}),
      },
      last_synced_at: new Date().toISOString(),
      status: "connected",
      disconnected_at: null,
      is_active: true,
    })
    .eq("id", connection.id);

  if (error) throw new Error(error.message);

  return {
    accessToken: refreshed.access_token || "",
    apiDomain: metadata.apiDomain || getFirstString(connection.metadata_json.api_domain) || "https://www.zohoapis.com",
  };
}

async function getZohoAccessToken({
  admin,
  connection,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
}) {
  const accessToken = decryptCrmSecret(connection);
  if (!accessToken) {
    throw Object.assign(new Error("Zoho token is unavailable."), {
      provider: "zoho" as const,
      step: "token_load",
      safeCategory: "AUTH_FAILED",
    } satisfies Partial<CrmDiagnosticError>);
  }

  const apiDomain = getFirstString(connection.metadata_json.api_domain) || "https://www.zohoapis.com";
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null;
  const expiresSoon = typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt <= Date.now() + 60_000;

  if (!expiresSoon) {
    return { accessToken, apiDomain };
  }

  const refreshToken = decryptEncryptedSecret({
    ciphertext: connection.refresh_token_ciphertext,
    iv: connection.refresh_token_iv,
    tag: connection.refresh_token_tag,
  });

  if (!refreshToken) {
    throw Object.assign(new Error("Zoho refresh token is missing. Reconnect Zoho CRM."), {
      provider: "zoho" as const,
      step: "token_refresh",
      safeCategory: "REFRESH_FAILED",
      apiDomainHost: apiDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    } satisfies Partial<CrmDiagnosticError>);
  }

  return refreshZohoToken({
    admin,
    connection,
    refreshToken,
  }).catch(() => {
    throw Object.assign(new Error("Zoho token is invalid or expired. Reconnect Zoho CRM."), {
      provider: "zoho" as const,
      step: "token_refresh",
      safeCategory: "REFRESH_FAILED",
      apiDomainHost: apiDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    } satisfies Partial<CrmDiagnosticError>);
  });
}

async function refreshFreshsalesToken({
  admin,
  connection,
  refreshToken,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  refreshToken: string;
}) {
  if (!isFreshsalesConfigured()) {
    throw new Error("Freshsales OAuth env vars are missing.");
  }

  const refreshed = await refreshFreshsalesAccessToken(refreshToken).catch((error) => {
    const diagnostic = getFreshsalesErrorDetails(error);
    throw Object.assign(
      new Error("Freshsales token refresh failed."),
      {
        provider: "freshsales" as const,
        step: "token_refresh",
        status: diagnostic.status ?? undefined,
        category: diagnostic.category,
        code: diagnostic.code,
        safeCategory: diagnostic.safeCategory || "REFRESH_FAILED",
        apiDomainHost:
          diagnostic.apiDomainHost ||
          getFirstString(connection.metadata_json.api_base_url)?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ||
          null,
      } satisfies Partial<CrmDiagnosticError>,
    );
  });

  const metadata = getFreshsalesTokenMetadata(refreshed);
  const accessPayload = encryptCrmSecret(refreshed.access_token || "");
  const nextRefreshToken = metadata.refreshToken || refreshToken;
  const refreshPayload = nextRefreshToken ? encryptCrmSecret(nextRefreshToken) : null;

  const { error } = await admin
    .from("workspace_provider_connections")
    .update({
      token_ciphertext: accessPayload.ciphertext,
      token_iv: accessPayload.iv,
      token_tag: accessPayload.tag,
      refresh_token_ciphertext: refreshPayload?.ciphertext || null,
      refresh_token_iv: refreshPayload?.iv || null,
      refresh_token_tag: refreshPayload?.tag || null,
      token_type: metadata.tokenType || connection.token_type || "Token",
      token_expires_at: buildTokenExpiry(
        typeof metadata.expiresIn === "number" ? metadata.expiresIn : undefined,
      ),
      scopes: metadata.scopes.length ? metadata.scopes : connection.scopes,
      metadata_json: {
        ...connection.metadata_json,
        auth_type: "oauth",
      },
      last_synced_at: new Date().toISOString(),
      status: "connected",
      disconnected_at: null,
      is_active: true,
    })
    .eq("id", connection.id);

  if (error) throw new Error(error.message);

  return {
    accessToken: refreshed.access_token || "",
    apiBaseUrl: getFirstString(connection.metadata_json.api_base_url, env.freshsalesApiBaseUrl) || "",
  };
}

async function getFreshsalesAccessToken({
  admin,
  connection,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
}) {
  const accessToken = decryptCrmSecret(connection);
  if (!accessToken) {
    throw Object.assign(new Error("Freshsales token is unavailable."), {
      provider: "freshsales" as const,
      step: "token_load",
      safeCategory: "AUTH_FAILED",
    } satisfies Partial<CrmDiagnosticError>);
  }

  const apiBaseUrl = getFirstString(connection.metadata_json.api_base_url, env.freshsalesApiBaseUrl);
  if (!apiBaseUrl) {
    throw new Error("Freshsales API base URL is missing.");
  }

  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null;
  const expiresSoon = typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt <= Date.now() + 60_000;

  if (!expiresSoon) {
    return { accessToken, apiBaseUrl };
  }

  const refreshToken = decryptEncryptedSecret({
    ciphertext: connection.refresh_token_ciphertext,
    iv: connection.refresh_token_iv,
    tag: connection.refresh_token_tag,
  });

  if (!refreshToken) {
    throw Object.assign(new Error("Freshsales refresh token is missing. Reconnect Freshsales."), {
      provider: "freshsales" as const,
      step: "token_refresh",
      safeCategory: "REFRESH_FAILED",
      apiDomainHost: apiBaseUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    } satisfies Partial<CrmDiagnosticError>);
  }

  return refreshFreshsalesToken({
    admin,
    connection,
    refreshToken,
  }).catch(() => {
    throw Object.assign(new Error("Freshsales token is invalid or expired. Reconnect Freshsales."), {
      provider: "freshsales" as const,
      step: "token_refresh",
      safeCategory: "REFRESH_FAILED",
      apiDomainHost: apiBaseUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
    } satisfies Partial<CrmDiagnosticError>);
  });
}

async function refreshPipedriveToken({
  admin,
  connection,
  refreshToken,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  refreshToken: string;
}) {
  const refreshed = await refreshPipedriveAccessToken(refreshToken);
  const metadata = getPipedriveTokenMetadata(refreshed);
  const accessPayload = encryptCrmSecret(refreshed.access_token || "");
  const nextRefreshToken = metadata.refreshToken || refreshToken;
  const refreshPayload = nextRefreshToken ? encryptCrmSecret(nextRefreshToken) : null;

  const { error } = await admin
    .from("workspace_provider_connections")
    .update({
      token_ciphertext: accessPayload.ciphertext,
      token_iv: accessPayload.iv,
      token_tag: accessPayload.tag,
      refresh_token_ciphertext: refreshPayload?.ciphertext || null,
      refresh_token_iv: refreshPayload?.iv || null,
      refresh_token_tag: refreshPayload?.tag || null,
      token_type: metadata.tokenType || connection.token_type || "Bearer",
      token_expires_at: buildTokenExpiry(
        typeof metadata.expiresIn === "number" ? metadata.expiresIn : undefined,
      ),
      scopes: metadata.scopes.length ? metadata.scopes : connection.scopes,
      metadata_json: {
        ...connection.metadata_json,
        ...(metadata.apiDomain ? { api_domain: metadata.apiDomain } : {}),
      },
      last_synced_at: new Date().toISOString(),
      status: "connected",
      disconnected_at: null,
      is_active: true,
    })
    .eq("id", connection.id);

  if (error) throw new Error(error.message);

  return {
    accessToken: refreshed.access_token || "",
    apiDomain: metadata.apiDomain || getFirstString(connection.metadata_json.api_domain) || "",
  };
}

async function getPipedriveAccessToken({
  admin,
  connection,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
}) {
  const accessToken = decryptCrmSecret(connection);
  if (!accessToken) {
    throw new Error("Pipedrive token is unavailable.");
  }

  const apiDomain = getFirstString(connection.metadata_json.api_domain);
  if (!apiDomain) {
    throw new Error("Pipedrive API domain is unavailable.");
  }

  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null;
  const expiresSoon = typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt <= Date.now() + 60_000;

  if (!expiresSoon) {
    return { accessToken, apiDomain };
  }

  const refreshToken = decryptEncryptedSecret({
    ciphertext: connection.refresh_token_ciphertext,
    iv: connection.refresh_token_iv,
    tag: connection.refresh_token_tag,
  });
  if (!refreshToken) {
    return { accessToken, apiDomain };
  }

  return refreshPipedriveToken({
    admin,
    connection,
    refreshToken,
  }).catch(() => ({ accessToken, apiDomain }));
}

async function deliverLeadToGoHighLevel({
  admin,
  connection,
  destination,
  lead,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  destination: WorkspaceCrmAssetRow | null;
  lead: LeadRecord;
}): Promise<DeliveryResult> {
  const token = await getGoHighLevelAccessToken({ admin, connection });

  const locationId =
    getFirstString(destination?.metadata_json.locationId, connection.metadata_json.location_id, destination?.asset_id) ||
    "";
  if (!locationId) throw new Error("GoHighLevel location ID is missing.");

  const payload = {
    locationId,
    firstName: lead.first_name || undefined,
    lastName: lead.last_name || undefined,
    name: lead.full_name || lead.name || undefined,
    email: lead.email || undefined,
    phone: lead.phone || undefined,
    companyName: lead.company_name || undefined,
    source: "SideKick",
    tags: [
      "sidekick",
      ...(lead.source === "meta_lead_ad" ? ["meta-lead-form"] : []),
    ],
  };

  const response = await crmFetch<Record<string, unknown>>(
    "https://services.leadconnectorhq.com/contacts/upsert",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2023-02-21",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    },
    "GoHighLevel lead delivery failed",
  );

  const contact = getObjectRecord(response.contact);
  return {
    externalRecordId: getFirstString(contact.id),
    requestPayload: payload,
    responsePayload: response,
  };
}

async function deliverLeadToHubSpot({
  admin,
  connection,
  lead,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  lead: LeadRecord;
}): Promise<DeliveryResult> {
  const token = await getHubSpotAccessToken({
    admin,
    connection,
  });

  const properties = {
    ...(lead.email ? { email: lead.email } : {}),
    ...(lead.first_name ? { firstname: lead.first_name } : {}),
    ...(lead.last_name ? { lastname: lead.last_name } : {}),
    ...(lead.phone ? { phone: lead.phone } : {}),
    ...(lead.company_name ? { company: lead.company_name } : {}),
    ...(lead.job_title ? { jobtitle: lead.job_title } : {}),
  };

  if (!Object.keys(properties).length) {
    throw new Error("HubSpot delivery needs at least one mapped contact property.");
  }

  if (lead.email) {
    const payload = {
      email: lead.email,
      firstName: lead.first_name || "",
      lastName: lead.last_name || "",
      phone: lead.phone || undefined,
      objectWriteTraceId: lead.id,
    };
    const result = await createOrUpdateHubSpotContact({
      accessToken: token,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      objectWriteTraceId: payload.objectWriteTraceId,
    });
    return {
      externalRecordId: result.contactId,
      requestPayload: payload,
      responsePayload: { contactId: result.contactId },
    };
  }

  const payload = { properties };
  const response = await crmFetch<Record<string, unknown>>(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    },
    "HubSpot lead delivery failed",
  );
  return {
    externalRecordId: getFirstString(response.id),
    requestPayload: payload,
    responsePayload: response,
  };
}

export async function sendWorkspacePipedriveTestLead({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const connections = await listCrmConnections(admin, workspaceId);
  const connection =
    connections.find((entry) => entry.provider === "pipedrive" && entry.is_active && entry.status === "connected") ||
    null;

  if (!connection) {
    throw new Error("Pipedrive is not connected for this workspace.");
  }

  const { accessToken, apiDomain } = await getPipedriveAccessToken({
    admin,
    connection,
  });

  return sendPipedriveTestLead({
    accessToken,
    apiDomain,
  });
}

export async function sendWorkspaceGoHighLevelTestLead({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const connections = await listCrmConnections(admin, workspaceId);
  const connection =
    connections.find((entry) => entry.provider === "gohighlevel" && entry.is_active && entry.status === "connected") ||
    null;

  if (!connection) {
    throw new Error("GoHighLevel is not connected for this workspace.");
  }

  const accessToken = await getGoHighLevelAccessToken({
    admin,
    connection,
  });

  const locationId =
    getFirstString(connection.metadata_json.location_id, connection.metadata_json.locationId, connection.provider_user_id) ||
    "";
  if (!locationId) {
    throw new Error("GoHighLevel location ID is missing.");
  }

  const payload = {
    locationId,
    firstName: CRM_TEST_LEAD.firstName,
    lastName: CRM_TEST_LEAD.lastName,
    name: CRM_TEST_LEAD.name,
    email: CRM_TEST_LEAD.email,
    phone: CRM_TEST_LEAD.phone,
    source: CRM_TEST_LEAD.source,
    tags: ["sidekick", "crm-delivery-test"],
  };

  const response = await crmFetch<Record<string, unknown>>(
    "https://services.leadconnectorhq.com/contacts/upsert",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: "2023-02-21",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    },
    "GoHighLevel test delivery failed",
  );

  const contact = getObjectRecord(response.contact);
  return {
    success: true,
    provider: "gohighlevel",
    providerName: "GoHighLevel",
    message: "Test contact sent to GoHighLevel.",
    messageKey: "crm_test_delivery_gohighlevel_success",
    safeMessage: "Test contact sent to GoHighLevel.",
    createdObjectType: "contact",
    providerRecordIds: {
      contactId: getFirstString(contact.id),
    },
  } satisfies CrmTestDeliveryResult;
}

export async function sendWorkspaceHubSpotTestLead({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const connections = await listCrmConnections(admin, workspaceId);
  const connection =
    connections.find((entry) => entry.provider === "hubspot" && entry.is_active && entry.status === "connected") ||
    null;

  if (!connection) {
    throw new Error("HubSpot is not connected for this workspace.");
  }

  const token = await getHubSpotAccessToken({
    admin,
    connection,
    requireOAuth: true,
  });
  const result = await createOrUpdateHubSpotContact({
    accessToken: token,
    email: CRM_TEST_LEAD.email,
    firstName: CRM_TEST_LEAD.firstName,
    lastName: CRM_TEST_LEAD.lastName,
    phone: CRM_TEST_LEAD.phone,
    objectWriteTraceId: `sidekick-hubspot-test-${workspaceId}`,
  });

  return {
    success: true,
    provider: "hubspot",
    providerName: "HubSpot",
    message: "Test contact sent to HubSpot.",
    messageKey: "crm_test_delivery_hubspot_success",
    safeMessage: "Test contact sent to HubSpot.",
    createdObjectType: "contact",
    providerRecordIds: {
      contactId: result.contactId,
    },
  } satisfies CrmTestDeliveryResult;
}

export async function sendWorkspaceZohoTestLead({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const connections = await listCrmConnections(admin, workspaceId);
  const connection =
    connections.find((entry) => entry.provider === "zoho" && entry.is_active && entry.status === "connected") ||
    null;

  if (!connection) {
    throw new Error("Zoho CRM is not connected for this workspace.");
  }

  const requiredScopes = ["ZohoCRM.modules.Leads.CREATE"];
  const missingScopes = requiredScopes.filter((scope) => !connection.scopes.includes(scope));
  if (missingScopes.length) {
    throw Object.assign(new Error("Zoho CRM connection is missing required lead scopes."), {
      provider: "zoho" as const,
      step: "scope_check",
      safeCategory: "INVALID_SCOPE",
      code: "MISSING_REQUIRED_SCOPE",
      category: "scope",
      apiDomainHost:
        getFirstString(connection.metadata_json.api_domain, "https://www.zohoapis.com")
          ?.replace(/^https?:\/\//, "")
          .replace(/\/.*$/, "") || null,
    } satisfies Partial<CrmDiagnosticError>);
  }

  const { accessToken, apiDomain } = await getZohoAccessToken({
    admin,
    connection,
  });
  const result = await createZohoLead({
    accessToken,
    apiDomain,
    lead: {
      firstName: CRM_TEST_LEAD.firstName,
      lastName: CRM_TEST_LEAD.lastName,
      email: CRM_TEST_LEAD.email,
      phone: CRM_TEST_LEAD.phone,
      leadSource: CRM_TEST_LEAD.source,
      company: "SideKick Studioss Test",
    },
  }).catch((error) => {
    const diagnostic = getZohoErrorDetails(error);
    throw Object.assign(
      new Error(error instanceof Error ? error.message : "Zoho lead creation failed."),
      {
        provider: "zoho" as const,
        step: diagnostic.step || "create_lead",
        status: diagnostic.status ?? undefined,
        category: diagnostic.category,
        code: diagnostic.code,
        safeCategory: diagnostic.safeCategory,
        apiDomainHost: diagnostic.apiDomainHost || apiDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
        detailApiName: diagnostic.detailApiName,
      } satisfies Partial<CrmDiagnosticError>,
    );
  });

  return {
    success: true,
    provider: "zoho",
    providerName: "Zoho CRM",
    message: "Test lead sent to Zoho CRM.",
    messageKey: "crm_test_delivery_zoho_success",
    safeMessage: "Test lead sent to Zoho CRM.",
    createdObjectType: "lead",
    providerRecordIds: {
      leadId: result.leadId,
    },
  } satisfies CrmTestDeliveryResult;
}

export async function sendWorkspaceFreshsalesTestLead({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const connections = await listCrmConnections(admin, workspaceId);
  const connection =
    connections.find((entry) => entry.provider === "freshsales" && entry.is_active && entry.status === "connected") ||
    null;

  if (!connection) {
    throw new Error("Freshsales is not connected for this workspace.");
  }

  const requiredScopes = ["freshsales.contacts.create"];
  const missingScopes = requiredScopes.filter((scope) => !connection.scopes.includes(scope));
  if (missingScopes.length) {
    throw Object.assign(new Error("Freshsales connection is missing required contact scopes."), {
      provider: "freshsales" as const,
      step: "scope_check",
      safeCategory: "INVALID_SCOPE",
      code: "MISSING_REQUIRED_SCOPE",
      category: "scope",
      apiDomainHost:
        getFirstString(connection.metadata_json.api_base_url, env.freshsalesApiBaseUrl)
          ?.replace(/^https?:\/\//, "")
          .replace(/\/.*$/, "") || null,
    } satisfies Partial<CrmDiagnosticError>);
  }

  const { accessToken, apiBaseUrl } = await getFreshsalesAccessToken({
    admin,
    connection,
  });
  const result = await createOrUpdateFreshsalesTestLead({
    accessToken,
    apiBaseUrl,
    contact: {
      firstName: CRM_TEST_LEAD.firstName,
      lastName: CRM_TEST_LEAD.lastName,
      email: CRM_TEST_LEAD.email,
      phone: CRM_TEST_LEAD.phone,
    },
  }).catch((error) => {
    const diagnostic = getFreshsalesErrorDetails(error);
    throw Object.assign(
      new Error(error instanceof Error ? error.message : "Freshsales contact creation failed."),
      {
        provider: "freshsales" as const,
        step: diagnostic.step || "create_contact",
        status: diagnostic.status ?? undefined,
        category: diagnostic.category,
        code: diagnostic.code,
        safeCategory: diagnostic.safeCategory,
        apiDomainHost:
          diagnostic.apiDomainHost || apiBaseUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
      } satisfies Partial<CrmDiagnosticError>,
    );
  });

  return {
    success: true,
    provider: "freshsales",
    providerName: "Freshsales",
    message: "Test contact sent to Freshsales.",
    messageKey: "crm_test_delivery_freshsales_success",
    safeMessage: "Test contact sent to Freshsales.",
    createdObjectType: "contact",
    providerRecordIds: {
      contactId: result.contactId,
    },
  } satisfies CrmTestDeliveryResult;
}

export async function sendWorkspaceCrmTestLead({
  admin,
  workspaceId,
  provider,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  provider: CrmProvider;
}) {
  switch (provider) {
    case "pipedrive":
      return sendWorkspacePipedriveTestLead({ admin, workspaceId });
    case "gohighlevel":
      return sendWorkspaceGoHighLevelTestLead({ admin, workspaceId });
    case "hubspot":
      return sendWorkspaceHubSpotTestLead({ admin, workspaceId });
    case "zoho":
      return sendWorkspaceZohoTestLead({ admin, workspaceId });
    case "freshsales":
      return sendWorkspaceFreshsalesTestLead({ admin, workspaceId });
    default:
      throw new Error(`${getCrmProviderLabel(provider)} test delivery is not available yet.`);
  }
}

async function deliverLeadViaProvider({
  admin,
  connection,
  destination,
  lead,
}: {
  admin: SupabaseAdmin;
  connection: WorkspaceCrmConnectionRow;
  destination: WorkspaceCrmAssetRow | null;
  lead: LeadRecord;
}) {
  switch (connection.provider) {
    case "gohighlevel":
      return deliverLeadToGoHighLevel({ admin, connection, destination, lead });
    case "hubspot":
      return deliverLeadToHubSpot({ admin, connection, lead });
    default:
      throw new Error(`${connection.provider} delivery is not implemented yet.`);
  }
}

export async function queueLeadForCrmDelivery({
  admin,
  lead,
}: {
  admin: SupabaseAdmin;
  lead: LeadRecord;
}) {
  if (!lead.workspace_id) {
    return { ok: false as const, skipped: true as const, error: "Lead is not attached to a workspace." };
  }
  const [connections, destinations] = await Promise.all([
    listCrmConnections(admin, lead.workspace_id),
    listCrmDestinations(admin, lead.workspace_id),
  ]);
  const targets = getWorkspaceCrmTargets({
    connections,
    destinations,
  });

  if (!targets.length) {
    return {
      ok: false as const,
      skipped: true as const,
      error: "No connected CRM destination is configured for this workspace.",
    };
  }
  const results: Array<{ provider: CrmProvider; ok: boolean; error?: string }> = [];

  for (const target of targets) {
    const { data: existing, error: existingError } = await admin
      .from("lead_deliveries")
      .select("*")
      .eq("lead_id", lead.id)
      .eq("provider", target.connection.provider)
      .eq("connection_id", target.connection.id)
      .maybeSingle();
    if (existingError) {
      if (isMissingTableError(existingError, "lead_deliveries")) {
        return null;
      }
      throw new Error(existingError.message);
    }

    let delivery: LeadDeliveryRow | null = existing ? (existing as LeadDeliveryRow) : null;
    if (!delivery) {
      const { data: insertedDelivery, error: insertError } = await admin
        .from("lead_deliveries")
        .insert({
          workspace_id: lead.workspace_id,
          lead_id: lead.id,
          campaign_id: lead.campaign_id || null,
          provider: target.connection.provider,
          connection_id: target.connection.id,
          destination_asset_id: target.destination?.id || null,
          state: "pending",
          last_error_detail_json: {},
          request_payload_json: {},
          response_payload_json: {},
        })
        .select("*")
        .single();

      if (insertError) {
        if (isMissingTableError(insertError, "lead_deliveries")) {
          return null;
        }
        throw new Error(insertError.message);
      }
      delivery = insertedDelivery as LeadDeliveryRow;
    }

    if (!delivery) continue;
    const result = await processLeadCrmDelivery({ admin, deliveryId: delivery.id, lead });
    results.push({
      provider: target.connection.provider,
      ok: result.ok,
      ...(result.ok ? {} : { error: result.error }),
    });
  }

  return {
    ok: results.every((result) => result.ok),
    skipped: false as const,
    results,
  };
}

export async function retryFailedCrmDeliveriesForWorkspace({
  admin,
  workspaceId,
  limit = 25,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
  limit?: number;
}) {
  const { data, error } = await admin
    .from("lead_deliveries")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("state", "failed")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error, "lead_deliveries")) {
      return { retried: 0, failed: 0 };
    }
    throw new Error(error.message);
  }

  let retried = 0;
  let failed = 0;

  for (const row of (data || []) as Array<{ id: string }>) {
    const result = await processLeadCrmDelivery({
      admin,
      deliveryId: row.id,
    }).catch(() => ({ ok: false as const }));

    if (result.ok) {
      retried += 1;
    } else {
      failed += 1;
    }
  }

  return { retried, failed };
}

export async function processLeadCrmDelivery({
  admin,
  deliveryId,
  lead: providedLead,
}: {
  admin: SupabaseAdmin;
  deliveryId: string;
  lead?: LeadRecord;
}) {
  const { data: deliveryData, error: deliveryError } = await admin
    .from("lead_deliveries")
    .select("*")
    .eq("id", deliveryId)
    .single();
  if (deliveryError) {
    if (isMissingTableError(deliveryError, "lead_deliveries")) {
      return { ok: false as const, error: "CRM delivery logging is not available until the latest database migration is applied." };
    }
    throw new Error(deliveryError.message);
  }
  const delivery = deliveryData as LeadDeliveryRow;

  const lead = providedLead || (
    (await admin.from("leads").select("*").eq("id", delivery.lead_id).single()).data as LeadRecord
  );
  const campaign = lead.campaign_id
    ? (
        await admin
          .from("campaigns")
          .select("id, template_id")
          .eq("id", lead.campaign_id)
          .maybeSingle()
      ).data as Pick<CampaignRecord, "id" | "template_id"> | null
    : null;
  const { data: connectionData } = await admin
    .from("workspace_provider_connections")
    .select("*")
    .eq("id", delivery.connection_id)
    .single();
  const connection = connectionData as WorkspaceCrmConnectionRow;
  const destination = delivery.destination_asset_id
    ? (
        await admin
          .from("workspace_provider_assets")
          .select("*")
          .eq("id", delivery.destination_asset_id)
          .maybeSingle()
      ).data as WorkspaceCrmAssetRow | null
    : null;
  const normalizedLead = buildNormalizedMetaLeadDeliveryRecord({
    lead,
    campaign,
  });

  const attemptNumber = (delivery.attempts_count || 0) + 1;
  const attemptedAt = new Date().toISOString();

  await admin
    .from("lead_deliveries")
    .update({
      state: attemptNumber > 1 ? "retrying" : "pending",
      attempts_count: Math.max(delivery.attempts_count || 0, attemptNumber - 1),
      last_attempt_at: attemptedAt,
    })
    .eq("id", delivery.id);

  try {
    const result = await deliverLeadViaProvider({ admin, connection, destination, lead });
    const { error: attemptInsertError } = await admin.from("lead_delivery_attempts").insert({
      delivery_id: delivery.id,
      attempt_number: attemptNumber,
      state: "delivered",
      http_status: 200,
      request_payload_json: {
        normalizedLead,
        providerRequest: result.requestPayload,
      },
      response_payload_json: result.responsePayload,
    });
    if (attemptInsertError && !isMissingTableError(attemptInsertError, "lead_delivery_attempts")) {
      throw new Error(attemptInsertError.message);
    }
    await admin
      .from("lead_deliveries")
      .update({
        state: "delivered",
        external_record_id: result.externalRecordId,
        attempts_count: attemptNumber,
        last_attempt_at: attemptedAt,
        delivered_at: attemptedAt,
        last_error: null,
        last_error_detail_json: {},
        request_payload_json: {
          normalizedLead,
          providerRequest: result.requestPayload,
        },
        response_payload_json: result.responsePayload,
      })
      .eq("id", delivery.id);
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM delivery failed.";
    const { error: failedAttemptInsertError } = await admin.from("lead_delivery_attempts").insert({
      delivery_id: delivery.id,
      attempt_number: attemptNumber,
      state: "failed",
      request_payload_json: {
        normalizedLead,
      },
      response_payload_json: {},
      error_message: message,
    });
    if (failedAttemptInsertError && !isMissingTableError(failedAttemptInsertError, "lead_delivery_attempts")) {
      throw new Error(failedAttemptInsertError.message);
    }
    await admin
      .from("lead_deliveries")
      .update({
        state: "failed",
        attempts_count: attemptNumber,
        last_attempt_at: attemptedAt,
        last_error: message,
        last_error_detail_json: { message, normalizedLead },
        request_payload_json: {
          normalizedLead,
        },
      })
      .eq("id", delivery.id);
    return { ok: false as const, error: message };
  }
}
