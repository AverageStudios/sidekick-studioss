import { env, isFollowUpBossConfigured } from "@/lib/env";

export type FollowUpBossOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  data?: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    ttl?: string;
    expires_at?: string;
  };
};

type FollowUpBossIdentityResponse = {
  account?: {
    id?: string | number;
    name?: string;
  };
  user?: {
    id?: string | number;
    name?: string;
    email?: string;
  };
  id?: string | number;
  name?: string;
  email?: string;
};

type FollowUpBossEventResponse = Record<string, unknown>;

type FollowUpBossErrorPayload = {
  error?: string;
  error_description?: string;
  errorMessage?: string;
  errorCode?: string;
  errorDetails?: string[];
  message?: string;
};

export type FollowUpBossProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  safeCategory?: string | null;
};

function createFollowUpBossProviderError(
  message: string,
  fields: Partial<Pick<FollowUpBossProviderError, "status" | "category" | "code" | "safeCategory">>,
) {
  return Object.assign(new Error(message), fields) as FollowUpBossProviderError;
}

function getRequiredClientId() {
  if (!isFollowUpBossConfigured() || !env.followUpBossClientId) {
    throw new Error("Follow Up Boss OAuth env vars are missing.");
  }
  return env.followUpBossClientId;
}

function getRequiredClientSecret() {
  if (!isFollowUpBossConfigured() || !env.followUpBossClientSecret) {
    throw new Error("Follow Up Boss OAuth env vars are missing.");
  }
  return env.followUpBossClientSecret;
}

function getRequiredRedirectUri() {
  if (!isFollowUpBossConfigured() || !env.followUpBossRedirectUri) {
    throw new Error("Follow Up Boss OAuth env vars are missing.");
  }
  return env.followUpBossRedirectUri;
}

function getRequiredSystemName() {
  if (!isFollowUpBossConfigured() || !env.followUpBossSystemName) {
    throw createFollowUpBossProviderError(
      "Follow Up Boss requires additional integration setup before SideKick can send leads.",
      {
        category: "configuration",
        code: "FOLLOWUPBOSS_SYSTEM_NAME_MISSING",
        safeCategory: "INVALID_SETUP",
      },
    );
  }
  return env.followUpBossSystemName;
}

function getRequiredSystemKey() {
  if (!isFollowUpBossConfigured() || !env.followUpBossSystemKey) {
    throw createFollowUpBossProviderError(
      "Follow Up Boss requires additional integration setup before SideKick can send leads.",
      {
        category: "configuration",
        code: "FOLLOWUPBOSS_SYSTEM_KEY_MISSING",
        safeCategory: "INVALID_SETUP",
      },
    );
  }
  return env.followUpBossSystemKey;
}

function resolveRedirectUri(override?: string | null) {
  return typeof override === "string" && override.trim().length > 0 ? override.trim() : getRequiredRedirectUri();
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

function getSafeProviderError(prefix: string, status: number, payload: FollowUpBossErrorPayload) {
  const candidates = [
    payload.error_description,
    payload.errorMessage,
    payload.message,
    payload.error,
    payload.errorCode,
    Array.isArray(payload.errorDetails) ? payload.errorDetails[0] : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return `${prefix}: ${candidate.trim()}`;
    }
  }

  return `${prefix}: HTTP ${status}`;
}

function classifyFollowUpBossError(status: number, payload: FollowUpBossErrorPayload) {
  const combined = [
    payload.error,
    payload.error_description,
    payload.errorMessage,
    payload.message,
    payload.errorCode,
    Array.isArray(payload.errorDetails) ? payload.errorDetails.join(" ") : null,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (status === 401) return "AUTH_FAILED";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 400 || combined.includes("required") || combined.includes("invalid")) {
    return "VALIDATION_FAILED";
  }
  return "UNKNOWN_PROVIDER_ERROR";
}

function getBasicAuthHeader() {
  return `Basic ${Buffer.from(`${getRequiredClientId()}:${getRequiredClientSecret()}`, "utf8").toString("base64")}`;
}

function getSystemHeaders() {
  return {
    "X-System": getRequiredSystemName(),
    "X-System-Key": getRequiredSystemKey(),
  };
}

async function requestJson<T>({
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
          return JSON.parse(raw) as T & FollowUpBossErrorPayload;
        } catch {
          return {} as T & FollowUpBossErrorPayload;
        }
      })()
    : ({} as T & FollowUpBossErrorPayload);

  if (!response.ok) {
    throw createFollowUpBossProviderError(getSafeProviderError(errorPrefix, response.status, payload), {
      status: response.status,
      category: "http",
      code:
        typeof payload.error === "string"
          ? payload.error
          : typeof payload.errorCode === "string"
            ? payload.errorCode
            : null,
      safeCategory: classifyFollowUpBossError(response.status, payload),
    });
  }

  return payload as T;
}

function normalizeOAuthTokenResponse(payload: FollowUpBossOAuthTokenResponse) {
  const data = payload.data || {};
  return {
    access_token: payload.access_token || data.access_token,
    refresh_token: payload.refresh_token || data.refresh_token,
    token_type: payload.token_type || data.token_type,
    expires_in:
      typeof payload.expires_in === "number"
        ? payload.expires_in
        : typeof data.ttl === "string"
          ? Number(data.ttl)
          : undefined,
    scope: payload.scope,
  } satisfies FollowUpBossOAuthTokenResponse;
}

export function buildFollowUpBossAuthorizationUrl(state: string, redirectUriOverride?: string | null) {
  const url = new URL("https://app.followupboss.com/oauth/authorize");
  url.searchParams.set("response_type", "auth_code");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("redirect_uri", resolveRedirectUri(redirectUriOverride));
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "login");
  if (env.followUpBossScopes) {
    url.searchParams.set("scope", env.followUpBossScopes);
  }
  return url;
}

export async function exchangeFollowUpBossCodeForTokens(code: string, redirectUriOverride?: string | null) {
  const payload = await requestJson<FollowUpBossOAuthTokenResponse>({
    url: "https://app.followupboss.com/oauth/token",
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: resolveRedirectUri(redirectUriOverride),
    }).toString(),
    errorPrefix: "Follow Up Boss token exchange failed",
  });

  const normalized = normalizeOAuthTokenResponse(payload);
  if (!normalized.access_token) {
    throw new Error("Follow Up Boss did not return an access token.");
  }

  return normalized;
}

export async function refreshFollowUpBossAccessToken(refreshToken: string) {
  const payload = await requestJson<FollowUpBossOAuthTokenResponse>({
    url: "https://app.followupboss.com/oauth/token",
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    errorPrefix: "Follow Up Boss token refresh failed",
  });

  const normalized = normalizeOAuthTokenResponse(payload);
  if (!normalized.access_token) {
    throw new Error("Follow Up Boss did not return a refreshed access token.");
  }

  return normalized;
}

export function getFollowUpBossTokenMetadata(token: FollowUpBossOAuthTokenResponse) {
  return {
    tokenType: token.token_type || "Bearer",
    refreshToken: token.refresh_token || null,
    expiresIn: typeof token.expires_in === "number" ? token.expires_in : null,
    scopes: getScopeList(token.scope || env.followUpBossScopes),
  };
}

export async function getFollowUpBossIdentity(accessToken: string) {
  const payload = await requestJson<FollowUpBossIdentityResponse>({
    url: "https://api.followupboss.com/v1/identity",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...getSystemHeaders(),
    },
    errorPrefix: "Follow Up Boss identity lookup failed",
  });

  return {
    userId:
      payload.user?.id != null
        ? String(payload.user.id)
        : payload.id != null
          ? String(payload.id)
          : null,
    userName:
      (typeof payload.user?.name === "string" && payload.user.name) ||
      (typeof payload.name === "string" ? payload.name : null),
    email:
      (typeof payload.user?.email === "string" && payload.user.email) ||
      (typeof payload.email === "string" ? payload.email : null),
    accountId: payload.account?.id != null ? String(payload.account.id) : null,
    accountName: typeof payload.account?.name === "string" ? payload.account.name : null,
  };
}

export async function createFollowUpBossTestLeadEvent({
  accessToken,
}: {
  accessToken: string;
}) {
  const payload = await requestJson<FollowUpBossEventResponse>({
    url: "https://api.followupboss.com/v1/events",
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...getSystemHeaders(),
    },
    body: JSON.stringify({
      source: "SideKick",
      system: getRequiredSystemName(),
      type: "Registration",
      message: "SideKick CRM Delivery Test",
      person: {
        firstName: "SideKick",
        lastName: "Test Lead",
        emails: [{ value: "test+sidekick@sidekickstudioss.com" }],
        phones: [{ value: "555-010-2026" }],
      },
    }),
    errorPrefix: "Follow Up Boss event delivery failed",
  });

  return {
    personId:
      (typeof payload.id === "number" || typeof payload.id === "string") ? String(payload.id) : null,
    responsePayload: payload,
  };
}
