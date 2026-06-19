import { env, isKeapConfigured } from "@/lib/env";

export type KeapOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type KeapContactCreateResponse = {
  id?: string | number;
  contact?: {
    id?: string | number;
  };
  message?: string;
  cause?: string;
  error?: string;
  error_description?: string;
};

type KeapContactsListResponse = {
  contacts?: Array<Record<string, unknown>>;
};

export type KeapProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  safeCategory?: string | null;
};

function createKeapProviderError(
  message: string,
  fields: Partial<Pick<KeapProviderError, "status" | "category" | "code" | "safeCategory">>,
) {
  return Object.assign(new Error(message), fields) as KeapProviderError;
}

function getRequiredClientId() {
  if (!isKeapConfigured() || !env.keapClientId) {
    throw new Error("Keap OAuth env vars are missing.");
  }
  return env.keapClientId;
}

function getRequiredClientSecret() {
  if (!isKeapConfigured() || !env.keapClientSecret) {
    throw new Error("Keap OAuth env vars are missing.");
  }
  return env.keapClientSecret;
}

function getRequiredRedirectUri() {
  if (!isKeapConfigured() || !env.keapRedirectUri) {
    throw new Error("Keap OAuth env vars are missing.");
  }
  return env.keapRedirectUri;
}

function getRequiredScopes() {
  if (!isKeapConfigured() || !env.keapScopes) {
    throw new Error("Keap OAuth env vars are missing.");
  }
  return env.keapScopes;
}

function resolveRedirectUri(override?: string | null) {
  return typeof override === "string" && override.trim().length > 0 ? override.trim() : getRequiredRedirectUri();
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

function getAccountHostFromScope(scope: string | null | undefined) {
  if (typeof scope !== "string") return null;
  const [, hostPart] = scope.split("|");
  return typeof hostPart === "string" && hostPart.trim() ? hostPart.trim() : null;
}

function getBasicAuthHeader() {
  return `Basic ${Buffer.from(`${getRequiredClientId()}:${getRequiredClientSecret()}`, "utf8").toString("base64")}`;
}

function getSafeProviderError(prefix: string, status: number, payload: Record<string, unknown>) {
  const candidates = [
    payload.message,
    payload.cause,
    payload.error,
    payload.error_description,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return `${prefix}: ${candidate.trim()}`;
    }
  }

  return `${prefix}: HTTP ${status}`;
}

function classifyKeapError(status: number, payload: Record<string, unknown>) {
  const message = typeof payload.message === "string" ? payload.message.toLowerCase() : "";
  const cause = typeof payload.cause === "string" ? payload.cause.toLowerCase() : "";
  const error = typeof payload.error === "string" ? payload.error.toLowerCase() : "";
  const combined = `${message} ${cause} ${error}`.trim();

  if (status === 401) return "AUTH_FAILED";
  if (status === 403) return "INVALID_SCOPE";
  if (status === 400 || combined.includes("required") || combined.includes("invalid")) {
    return "VALIDATION_FAILED";
  }
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

  const payload = (await response.json().catch(() => ({}))) as T & Record<string, unknown>;
  if (!response.ok) {
    throw createKeapProviderError(
      getSafeProviderError(errorPrefix, response.status, payload),
      {
        status: response.status,
        category: "http",
        code:
          typeof payload.error === "string"
            ? payload.error
            : typeof payload.cause === "string"
              ? payload.cause
              : null,
        safeCategory: classifyKeapError(response.status, payload),
      },
    );
  }

  return payload as T;
}

export function buildKeapAuthorizationUrl(state: string, redirectUriOverride?: string | null) {
  const url = new URL("https://signin.infusionsoft.com/app/oauth/authorize");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("redirect_uri", resolveRedirectUri(redirectUriOverride));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", getRequiredScopes());
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeKeapCodeForTokens(code: string, redirectUriOverride?: string | null) {
  const payload = await requestJson<KeapOAuthTokenResponse>({
    url: "https://api.infusionsoft.com/token",
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getRequiredClientId(),
      client_secret: getRequiredClientSecret(),
      code,
      redirect_uri: resolveRedirectUri(redirectUriOverride),
    }).toString(),
    errorPrefix: "Keap token exchange failed",
  });

  if (!payload.access_token) {
    throw new Error("Keap did not return an access token.");
  }

  return payload;
}

export async function refreshKeapAccessToken(refreshToken: string) {
  const payload = await requestJson<KeapOAuthTokenResponse>({
    url: "https://api.infusionsoft.com/token",
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
    errorPrefix: "Keap token refresh failed",
  });

  if (!payload.access_token) {
    throw new Error("Keap did not return a refreshed access token.");
  }

  return payload;
}

export function getKeapTokenMetadata(token: KeapOAuthTokenResponse) {
  return {
    tokenType: token.token_type || "bearer",
    refreshToken: token.refresh_token || null,
    expiresIn: typeof token.expires_in === "number" ? token.expires_in : null,
    scopes: getScopeList(token.scope),
    accountHost: getAccountHostFromScope(token.scope),
  };
}

export async function getKeapAccountInfo(accessToken: string, scope?: string | null) {
  await requestJson<KeapContactsListResponse>({
    url: "https://api.infusionsoft.com/crm/rest/v1/contacts?limit=1",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    errorPrefix: "Keap account lookup failed",
  });

  return {
    accountHost: getAccountHostFromScope(scope),
  };
}

export async function createOrUpdateKeapTestContact({
  accessToken,
}: {
  accessToken: string;
}) {
  const payload = await requestJson<KeapContactCreateResponse>({
    url: "https://api.infusionsoft.com/crm/rest/v1/contacts",
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      given_name: "SideKick",
      family_name: "Test Lead",
      email_addresses: [
        {
          email: "test+sidekick@sidekickstudioss.com",
          field: "EMAIL1",
        },
      ],
      phone_numbers: [
        {
          number: "555-010-2026",
          field: "PHONE1",
        },
      ],
    }),
    errorPrefix: "Keap contact create failed",
  });

  return {
    contactId:
      payload.id != null
        ? String(payload.id)
        : payload.contact?.id != null
          ? String(payload.contact.id)
          : null,
  };
}
