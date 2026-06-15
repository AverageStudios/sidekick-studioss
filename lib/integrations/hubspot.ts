import { env, isHubSpotConfigured } from "@/lib/env";

export type HubSpotOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type HubSpotAccountDetails = {
  portalId?: number | string;
  hubId?: number | string;
  timeZone?: string;
  hub_domain?: string;
  uiDomain?: string;
};

type HubSpotContactUpsertResponse = {
  results?: Array<{
    id?: string | number;
  }>;
};

export type HubSpotProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
};

function createHubSpotProviderError(
  message: string,
  fields: Partial<Pick<HubSpotProviderError, "status" | "category" | "code">>,
) {
  return Object.assign(new Error(message), fields) as HubSpotProviderError;
}

function getRequiredClientId() {
  if (!isHubSpotConfigured() || !env.hubspotClientId) {
    throw new Error("HubSpot OAuth env vars are missing.");
  }
  return env.hubspotClientId;
}

function getRequiredClientSecret() {
  if (!isHubSpotConfigured() || !env.hubspotClientSecret) {
    throw new Error("HubSpot OAuth env vars are missing.");
  }
  return env.hubspotClientSecret;
}

function getRequiredRedirectUri() {
  if (!isHubSpotConfigured() || !env.hubspotRedirectUri) {
    throw new Error("HubSpot OAuth env vars are missing.");
  }
  return env.hubspotRedirectUri;
}

function getRequiredScopes() {
  if (!isHubSpotConfigured() || !env.hubspotScopes) {
    throw new Error("HubSpot OAuth env vars are missing.");
  }
  return env.hubspotScopes;
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

async function hubspotRequest<T>({
  url,
  method = "GET",
  headers,
  body,
  errorPrefix,
}: {
  url: string;
  method?: "GET" | "POST";
  headers?: HeadersInit;
  body?: string;
  errorPrefix: string;
}) {
  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body } : {}),
    cache: "no-store",
  });

  const raw = await response.text();
  const payload = raw
    ? (() => {
        try {
          return JSON.parse(raw) as Record<string, unknown> & T;
        } catch {
          return ({ raw } as unknown) as Record<string, unknown> & T;
        }
      })()
    : ({} as Record<string, unknown> & T);

  if (!response.ok) {
    throw createHubSpotProviderError(
      `${errorPrefix}: ${response.status} ${response.statusText}`,
      {
        status: response.status,
        category: typeof payload.category === "string" ? payload.category : null,
        code:
          typeof payload.errorType === "string"
            ? payload.errorType
            : typeof payload.subCategory === "string"
              ? payload.subCategory
              : null,
      },
    );
  }

  return payload as T;
}

export function buildHubSpotAuthorizationUrl(state: string) {
  const url = new URL("https://app.hubspot.com/oauth/authorize");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("redirect_uri", getRequiredRedirectUri());
  url.searchParams.set("scope", getRequiredScopes());
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeHubSpotCodeForTokens(code: string) {
  const payload = await hubspotRequest<HubSpotOAuthTokenResponse>({
    url: "https://api.hubapi.com/oauth/v3/token",
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getRequiredClientId(),
      client_secret: getRequiredClientSecret(),
      redirect_uri: getRequiredRedirectUri(),
      code,
    }).toString(),
    errorPrefix: "HubSpot token exchange failed",
  });

  if (!payload.access_token) {
    throw new Error("HubSpot did not return an access token.");
  }

  return payload;
}

export async function refreshHubSpotAccessToken(refreshToken: string) {
  const payload = await hubspotRequest<HubSpotOAuthTokenResponse>({
    url: "https://api.hubapi.com/oauth/v3/token",
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: getRequiredClientId(),
      client_secret: getRequiredClientSecret(),
      redirect_uri: getRequiredRedirectUri(),
      refresh_token: refreshToken,
    }).toString(),
    errorPrefix: "HubSpot token refresh failed",
  });

  if (!payload.access_token) {
    throw new Error("HubSpot did not return a refreshed access token.");
  }

  return payload;
}

export async function getHubSpotAccountDetails(accessToken: string) {
  try {
    return await hubspotRequest<HubSpotAccountDetails>({
      url: "https://api.hubapi.com/integrations/v1/me",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      errorPrefix: "HubSpot account lookup failed",
    });
  } catch {
    return hubspotRequest<HubSpotAccountDetails>({
      url: "https://api.hubapi.com/account-info/v3/details",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      errorPrefix: "HubSpot account lookup failed",
    });
  }
}

export function getHubSpotTokenMetadata(token: HubSpotOAuthTokenResponse) {
  return {
    tokenType: token.token_type || "Bearer",
    refreshToken: token.refresh_token || null,
    expiresIn: typeof token.expires_in === "number" ? token.expires_in : null,
    scopes: getScopeList(token.scope),
  };
}

export async function createOrUpdateHubSpotContact({
  accessToken,
  email,
  firstName,
  lastName,
  phone,
  objectWriteTraceId,
}: {
  accessToken: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  objectWriteTraceId: string;
}) {
  const payload = await hubspotRequest<HubSpotContactUpsertResponse>({
    url: "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert",
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      inputs: [
        {
          id: email,
          idProperty: "email",
          properties: {
            email,
            firstname: firstName,
            lastname: lastName,
            ...(phone ? { phone } : {}),
          },
          objectWriteTraceId,
        },
      ],
    }),
    errorPrefix: "HubSpot contact upsert failed",
  });

  const firstResult = Array.isArray(payload.results) ? payload.results[0] : null;
  return {
    contactId: firstResult?.id != null ? String(firstResult.id) : null,
  };
}
