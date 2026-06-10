import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptCrmSecret, decryptEncryptedSecret, encryptCrmSecret } from "@/lib/crm-security";
import { env, isGhlConfigured } from "@/lib/env";
import { CrmConnectionStatus, CrmDeliveryState, CrmProvider, LeadRecord } from "@/types";

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

const CRM_PROVIDERS: CrmProvider[] = ["gohighlevel", "hubspot", "pipedrive", "salesforce"];

function getObjectRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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

function isMissingTableError(error: { message?: string | null } | null | undefined, tableName: string) {
  const message = error?.message || "";
  return (
    message.includes(`Could not find the table 'public.${tableName}' in the schema cache`) ||
    message.includes(`relation \"public.${tableName}\" does not exist`) ||
    message.includes(`relation \"${tableName}\" does not exist`)
  );
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
}: {
  accessToken: string;
}): Promise<ValidatedConnection> {
  const details = await crmFetch<Record<string, unknown>>(
    "https://api.hubapi.com/account-info/v3/details",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
    "HubSpot connection failed",
  );

  const portalId =
    getFirstString(details.portalId, details.hubId) ||
    (typeof details.portalId === "number" ? String(details.portalId) : null) ||
    (typeof details.hubId === "number" ? String(details.hubId) : null) ||
    "hubspot-account";
  const uiDomain = getFirstString(details.uiDomain, details.timeZone);

  return {
    providerUserId: portalId,
    providerUserName: uiDomain || `Portal ${portalId}`,
    tokenType: "Bearer",
    scopes: ["crm.objects.contacts.write"],
    metadata: {
      validated_at: new Date().toISOString(),
      portal_id: portalId,
      account_details: details,
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
      return validateHubSpotConnection({ accessToken: input.accessToken });
    default:
      throw new Error(`${input.provider} is not available in this first CRM pass yet.`);
  }
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
    .limit(12);

  if (error) {
    if (isMissingTableError(error, "lead_deliveries")) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data || []) as LeadDeliveryRow[];
}

export async function getWorkspaceCrmState({
  admin,
  workspaceId,
}: {
  admin: SupabaseAdmin;
  workspaceId: string;
}) {
  const [connections, destinations, routingRules, deliveries] = await Promise.all([
    listCrmConnections(admin, workspaceId),
    listCrmDestinations(admin, workspaceId),
    listCrmRoutingRules(admin, workspaceId),
    listRecentLeadDeliveries(admin, workspaceId),
  ]);

  const activeRoutingRule =
    routingRules.find((rule) => rule.rule_scope === "workspace_default" && rule.is_active) || null;

  return {
    connections,
    destinations,
    routingRules,
    activeRoutingRule,
    deliveries,
  };
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

    if (error) throw new Error(error.message);
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

    if (error) throw new Error(error.message);
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

  if (clearAssetsError) throw new Error(clearAssetsError.message);

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
    if (destinationsError) throw new Error(destinationsError.message);
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
    tags: ["sidekick"],
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
  connection,
  lead,
}: {
  connection: WorkspaceCrmConnectionRow;
  lead: LeadRecord;
}): Promise<DeliveryResult> {
  const token = decryptCrmSecret(connection);
  if (!token) throw new Error("HubSpot token is unavailable.");

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
      inputs: [
        {
          id: lead.email,
          idProperty: "email",
          properties,
          objectWriteTraceId: lead.id,
        },
      ],
    };
    const response = await crmFetch<Record<string, unknown>>(
      "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert",
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
    const firstResult = Array.isArray(response.results) ? getObjectRecord(response.results[0]) : {};
    return {
      externalRecordId: getFirstString(firstResult.id),
      requestPayload: payload,
      responsePayload: response,
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
      return deliverLeadToHubSpot({ connection, lead });
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
  if (!lead.workspace_id) return null;
  const routingRule = await resolveCrmRoutingRule({
    admin,
    workspaceId: lead.workspace_id,
    campaignId: lead.campaign_id || null,
  });

  if (!routingRule) return null;

  const { data: existing, error: existingError } = await admin
    .from("lead_deliveries")
    .select("*")
    .eq("lead_id", lead.id)
    .eq("provider", routingRule.provider)
    .eq("connection_id", routingRule.connection_id)
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
        provider: routingRule.provider,
        connection_id: routingRule.connection_id,
        destination_asset_id: routingRule.destination_asset_id,
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

  if (!delivery) return null;
  return processLeadCrmDelivery({ admin, deliveryId: delivery.id, lead });
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

  const attemptNumber = (delivery.attempts_count || 0) + 1;
  const attemptedAt = new Date().toISOString();

  try {
    const result = await deliverLeadViaProvider({ admin, connection, destination, lead });
    const { error: attemptInsertError } = await admin.from("lead_delivery_attempts").insert({
      delivery_id: delivery.id,
      attempt_number: attemptNumber,
      state: "delivered",
      http_status: 200,
      request_payload_json: result.requestPayload,
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
        request_payload_json: result.requestPayload,
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
      request_payload_json: {},
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
        last_error_detail_json: { message },
      })
      .eq("id", delivery.id);
    return { ok: false as const, error: message };
  }
}
