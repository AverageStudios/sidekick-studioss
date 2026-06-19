import { env, isCloseConfigured } from "@/lib/env";

export type CloseOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  organization_id?: string;
  user_id?: string;
};

type CloseMeResponse = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  organizations?: Array<{
    id?: string;
    name?: string;
  }>;
  memberships?: Array<{
    organization_id?: string;
  }>;
};

type CloseLeadCreateResponse = {
  id?: string;
  contact_ids?: string[];
};

type CloseErrorPayload = {
  error?: string;
  message?: string;
  field_errors?: Record<string, unknown>;
  errors?: Array<Record<string, unknown>>;
};

export type CloseProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  safeCategory?: string | null;
};

function createCloseProviderError(
  message: string,
  fields: Partial<Pick<CloseProviderError, "status" | "category" | "code" | "safeCategory">>,
) {
  return Object.assign(new Error(message), fields) as CloseProviderError;
}

function getRequiredClientId() {
  if (!isCloseConfigured() || !env.closeClientId) {
    throw new Error("Close OAuth env vars are missing.");
  }
  return env.closeClientId;
}

function getRequiredClientSecret() {
  if (!isCloseConfigured() || !env.closeClientSecret) {
    throw new Error("Close OAuth env vars are missing.");
  }
  return env.closeClientSecret;
}

function getRequiredRedirectUri() {
  if (!isCloseConfigured() || !env.closeRedirectUri) {
    throw new Error("Close OAuth env vars are missing.");
  }
  return env.closeRedirectUri;
}

function getRequiredScopes() {
  if (!isCloseConfigured() || !env.closeScopes) {
    throw new Error("Close OAuth env vars are missing.");
  }
  return env.closeScopes;
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

function getSafeProviderError(prefix: string, status: number, payload: CloseErrorPayload) {
  const candidates = [
    payload.message,
    payload.error,
    Array.isArray(payload.errors) ? payload.errors[0]?.message : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return `${prefix}: ${candidate.trim()}`;
    }
  }

  return `${prefix}: HTTP ${status}`;
}

function classifyCloseError(status: number, payload: CloseErrorPayload) {
  const normalizedError = typeof payload.error === "string" ? payload.error.toLowerCase() : "";
  const normalizedMessage = typeof payload.message === "string" ? payload.message.toLowerCase() : "";
  const hasFieldErrors =
    payload.field_errors && typeof payload.field_errors === "object" && Object.keys(payload.field_errors).length > 0;
  const combined = `${normalizedError} ${normalizedMessage}`.trim();

  if (status === 401) return "AUTH_FAILED";
  if (status === 403) return "PERMISSION_DENIED";
  if (hasFieldErrors || combined.includes("required") || combined.includes("invalid")) {
    return "REQUIRED_FIELD_MISSING";
  }
  if (status === 400) return "VALIDATION_FAILED";
  return "UNKNOWN_PROVIDER_ERROR";
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
          return JSON.parse(raw) as T & CloseErrorPayload;
        } catch {
          return {} as T & CloseErrorPayload;
        }
      })()
    : ({} as T & CloseErrorPayload);

  if (!response.ok) {
    throw createCloseProviderError(getSafeProviderError(errorPrefix, response.status, payload), {
      status: response.status,
      category: "http",
      code: typeof payload.error === "string" ? payload.error : null,
      safeCategory: classifyCloseError(response.status, payload),
    });
  }

  return payload as T;
}

export function buildCloseAuthorizationUrl(state: string, redirectUriOverride?: string | null) {
  const url = new URL("https://app.close.com/oauth2/authorize/");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUriOverride?.trim() || getRequiredRedirectUri());
  url.searchParams.set("scope", getRequiredScopes());
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeCloseCodeForTokens(code: string) {
  const payload = await requestJson<CloseOAuthTokenResponse>({
    url: "https://api.close.com/oauth2/token/",
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: getRequiredClientId(),
      client_secret: getRequiredClientSecret(),
      grant_type: "authorization_code",
      code,
    }).toString(),
    errorPrefix: "Close token exchange failed",
  });

  if (!payload.access_token) {
    throw new Error("Close did not return an access token.");
  }

  return payload;
}

export async function refreshCloseAccessToken(refreshToken: string) {
  const payload = await requestJson<CloseOAuthTokenResponse>({
    url: "https://api.close.com/oauth2/token/",
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: getRequiredClientId(),
      client_secret: getRequiredClientSecret(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    errorPrefix: "Close token refresh failed",
  });

  if (!payload.access_token) {
    throw new Error("Close did not return a refreshed access token.");
  }

  return payload;
}

export function getCloseTokenMetadata(token: CloseOAuthTokenResponse) {
  return {
    tokenType: token.token_type || "Bearer",
    refreshToken: token.refresh_token || null,
    expiresIn: typeof token.expires_in === "number" ? token.expires_in : null,
    scopes: getScopeList(token.scope || env.closeScopes),
    organizationId: typeof token.organization_id === "string" ? token.organization_id : null,
    userId: typeof token.user_id === "string" ? token.user_id : null,
  };
}

export async function getCloseAccountInfo(accessToken: string) {
  const payload = await requestJson<CloseMeResponse>({
    url: "https://api.close.com/api/v1/me/?_fields=id,first_name,last_name,email,organizations,memberships",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    errorPrefix: "Close account lookup failed",
  });

  const organization = Array.isArray(payload.organizations) ? payload.organizations[0] || null : null;

  return {
    userId: typeof payload.id === "string" ? payload.id : null,
    firstName: typeof payload.first_name === "string" ? payload.first_name : null,
    lastName: typeof payload.last_name === "string" ? payload.last_name : null,
    email: typeof payload.email === "string" ? payload.email : null,
    organizationId:
      (organization && typeof organization.id === "string" ? organization.id : null) ||
      (Array.isArray(payload.memberships) && typeof payload.memberships[0]?.organization_id === "string"
        ? payload.memberships[0].organization_id
        : null),
    organizationName: organization && typeof organization.name === "string" ? organization.name : null,
  };
}

export async function createCloseTestLead({
  accessToken,
}: {
  accessToken: string;
}) {
  const payload = await requestJson<CloseLeadCreateResponse>({
    url: "https://api.close.com/api/v1/lead/",
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "SideKick Studioss Test",
      description: "Created by SideKick Studioss to verify the CRM integration.",
      contacts: [
        {
          name: "SideKick Test Lead",
          emails: [
            {
              email: "test+sidekick@sidekickstudioss.com",
              type: "office",
            },
          ],
          phones: [
            {
              phone: "555-010-2026",
              type: "office",
            },
          ],
        },
      ],
    }),
    errorPrefix: "Close lead creation failed",
  });

  return {
    leadId: typeof payload.id === "string" ? payload.id : null,
    contactId: Array.isArray(payload.contact_ids) && typeof payload.contact_ids[0] === "string"
      ? payload.contact_ids[0]
      : null,
  };
}
