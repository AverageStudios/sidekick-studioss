import { env, isFreshsalesConfigured } from "@/lib/env";

export type FreshsalesOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type FreshsalesContactResponse = {
  contact?: {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
};

type FreshsalesFieldResponse = {
  fields?: Array<Record<string, unknown>>;
};

type FreshsalesErrorEnvelope = {
  errors?: {
    code?: string;
    message?: string;
  };
  error?: string;
  message?: string;
  description?: string;
};

export type FreshsalesProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  provider?: "freshsales";
  step?: string;
  safeCategory?: string | null;
  apiDomainHost?: string | null;
};

type FreshsalesOAuthDebugInfo = {
  authBaseUrlHost: string | null;
  apiBaseUrlHost: string | null;
  redirectUri: string | null;
  scopes: string[];
};

function createFreshsalesProviderError(
  message: string,
  fields: Partial<
    Pick<FreshsalesProviderError, "status" | "category" | "code" | "step" | "safeCategory" | "apiDomainHost">
  >,
) {
  return Object.assign(new Error(message), {
    provider: "freshsales" as const,
    ...fields,
  }) as FreshsalesProviderError;
}

function getRequiredClientId() {
  if (!isFreshsalesConfigured() || !env.freshsalesClientId) {
    throw new Error("Freshsales OAuth env vars are missing.");
  }
  return env.freshsalesClientId;
}

function getRequiredClientSecret() {
  if (!isFreshsalesConfigured() || !env.freshsalesClientSecret) {
    throw new Error("Freshsales OAuth env vars are missing.");
  }
  return env.freshsalesClientSecret;
}

function getRequiredRedirectUri() {
  if (!isFreshsalesConfigured() || !env.freshsalesRedirectUri) {
    throw new Error("Freshsales OAuth env vars are missing.");
  }
  return env.freshsalesRedirectUri;
}

function resolveRedirectUri(override?: string | null) {
  if (typeof override === "string" && override.trim().length > 0) {
    return override.trim();
  }
  return getRequiredRedirectUri();
}

function getRequiredScopes() {
  if (!isFreshsalesConfigured() || !env.freshsalesScopes) {
    throw new Error("Freshsales OAuth env vars are missing.");
  }
  return normalizeScopeParam(env.freshsalesScopes);
}

function getRequiredAuthBaseUrl() {
  if (!isFreshsalesConfigured() || !env.freshsalesAuthBaseUrl) {
    throw new Error("Freshsales OAuth env vars are missing.");
  }
  return normalizeBaseUrl(env.freshsalesAuthBaseUrl);
}

function getRequiredApiBaseUrl() {
  if (!isFreshsalesConfigured() || !env.freshsalesApiBaseUrl) {
    throw new Error("Freshsales OAuth env vars are missing.");
  }
  return normalizeApiBaseUrl(env.freshsalesApiBaseUrl);
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function normalizeApiBaseUrl(value: string) {
  const base = normalizeBaseUrl(value);
  return base.endsWith("/crm/sales/api") ? base : `${base}/crm/sales/api`;
}

function normalizeScopeParam(value: string) {
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean))).join(" ");
}

function getBasicAuthHeader() {
  return `Basic ${Buffer.from(`${getRequiredClientId()}:${getRequiredClientSecret()}`, "utf8").toString("base64")}`;
}

function getApiHost(url: string | null | undefined) {
  try {
    return new URL(url || getRequiredApiBaseUrl()).host;
  } catch {
    return null;
  }
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

function getHost(value: string | null | undefined) {
  try {
    return value ? new URL(value).host : null;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: FreshsalesErrorEnvelope, fallback: string) {
  return (
    payload.errors?.message ||
    payload.message ||
    payload.description ||
    payload.error ||
    fallback
  );
}

function classifyFreshsalesError({
  status,
  code,
  step,
  message,
}: {
  status?: number | null;
  code?: string | null;
  step?: string | null;
  message?: string | null;
}) {
  const normalizedCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  const normalizedStep = typeof step === "string" ? step.trim().toLowerCase() : "";
  const normalizedMessage = typeof message === "string" ? message.trim().toLowerCase() : "";

  if (normalizedStep === "token_refresh" && (status === 400 || status === 401)) {
    return "REFRESH_FAILED";
  }
  if (status === 401) return "AUTH_FAILED";
  if (status === 403) return "PERMISSION_DENIED";
  if (
    normalizedCode.includes("REQUIRED") ||
    normalizedMessage.includes("required field") ||
    normalizedMessage.includes("mandatory field")
  ) {
    return "REQUIRED_FIELD_MISSING";
  }
  if (normalizedCode.includes("INVALID_SCOPE") || normalizedMessage.includes("scope")) {
    return "INVALID_SCOPE";
  }
  if (normalizedCode.includes("VALIDATION") || normalizedCode.includes("INVALID") || status === 422) {
    return "VALIDATION_FAILED";
  }
  return "UNKNOWN_PROVIDER_ERROR";
}

async function parseFreshsalesResponse<T>(response: Response) {
  const raw = await response.text();
  const payload = raw
    ? (() => {
        try {
          return JSON.parse(raw) as T & FreshsalesErrorEnvelope;
        } catch {
          return {} as T & FreshsalesErrorEnvelope;
        }
      })()
    : ({} as T & FreshsalesErrorEnvelope);

  return payload;
}

async function freshsalesRequest<T>({
  url,
  method = "GET",
  headers,
  body,
  errorPrefix,
  step,
}: {
  url: string;
  method?: "GET" | "POST" | "PUT";
  headers?: HeadersInit;
  body?: string;
  errorPrefix: string;
  step: string;
}) {
  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body } : {}),
    cache: "no-store",
  });

  const payload = await parseFreshsalesResponse<T>(response);
  if (!response.ok) {
    const code = typeof payload.errors?.code === "string" ? payload.errors.code : null;
    const message = getErrorMessage(payload, `${errorPrefix}: ${response.status} ${response.statusText}`);
    throw createFreshsalesProviderError(`${errorPrefix}: ${message}`, {
      status: response.status,
      category: response.status === 403 ? "permission" : response.status === 401 ? "auth" : "request",
      code,
      step,
      safeCategory: classifyFreshsalesError({
        status: response.status,
        code,
        step,
        message,
      }),
      apiDomainHost: getApiHost(url),
    });
  }

  return payload as T;
}

function buildTokenCandidates() {
  const authBase = getRequiredAuthBaseUrl();
  return [`${authBase}/oauth/v2/token`, `${authBase}/org/oauth/v2/token`];
}

async function requestFreshsalesToken(params: URLSearchParams, step: "token_exchange" | "token_refresh") {
  let lastError: unknown = null;

  for (const url of buildTokenCandidates()) {
    try {
      const payload = await freshsalesRequest<FreshsalesOAuthTokenResponse>({
        url,
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: getBasicAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        errorPrefix: step === "token_exchange" ? "Freshsales token exchange failed" : "Freshsales token refresh failed",
        step,
      });
      if (!payload.access_token) {
        throw new Error("Freshsales did not return an access token.");
      }
      console.info(
        "[freshsales-oauth]",
        JSON.stringify({
          provider: "freshsales",
          step,
          tokenUrlHost: getHost(url),
          status: 200,
          refreshTokenReturned: Boolean(payload.refresh_token),
          scopeCount: getScopeList(payload.scope).length,
        }),
      );
      return payload;
    } catch (error) {
      lastError = error;
      const providerError = error as FreshsalesProviderError;
      console.error(
        "[freshsales-oauth]",
        JSON.stringify({
          provider: "freshsales",
          step,
          tokenUrlHost: getHost(url),
          status: typeof providerError?.status === "number" ? providerError.status : null,
          code: typeof providerError?.code === "string" ? providerError.code : null,
          category: typeof providerError?.category === "string" ? providerError.category : null,
          safeCategory: typeof providerError?.safeCategory === "string" ? providerError.safeCategory : null,
        }),
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Freshsales token request failed.");
}

export function buildFreshsalesAuthorizationUrl(state: string, redirectUriOverride?: string | null) {
  const url = new URL(`${getRequiredAuthBaseUrl()}/org/oauth/v2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("scope", getRequiredScopes());
  url.searchParams.set("redirect_uri", resolveRedirectUri(redirectUriOverride));
  url.searchParams.set("state", state);
  return url;
}

export function getFreshsalesOAuthDebugInfo(redirectUriOverride?: string | null): FreshsalesOAuthDebugInfo {
  const scopes = getScopeList(env.freshsalesScopes);
  return {
    authBaseUrlHost: getHost(env.freshsalesAuthBaseUrl || null),
    apiBaseUrlHost: getHost(env.freshsalesApiBaseUrl || null),
    redirectUri: resolveRedirectUri(redirectUriOverride),
    scopes,
  };
}

export async function exchangeFreshsalesCodeForTokens(code: string, redirectUriOverride?: string | null) {
  return requestFreshsalesToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: resolveRedirectUri(redirectUriOverride),
    }),
    "token_exchange",
  );
}

export async function refreshFreshsalesAccessToken(refreshToken: string, redirectUriOverride?: string | null) {
  return requestFreshsalesToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      redirect_uri: resolveRedirectUri(redirectUriOverride),
    }),
    "token_refresh",
  );
}

export function getFreshsalesTokenMetadata(token: FreshsalesOAuthTokenResponse) {
  return {
    tokenType: token.token_type || "Token",
    refreshToken: token.refresh_token || null,
    expiresIn: typeof token.expires_in === "number" ? token.expires_in : 30 * 60,
    scopes: getScopeList(token.scope),
  };
}

export async function getFreshsalesAccountInfo({
  accessToken,
  apiBaseUrl,
}: {
  accessToken: string;
  apiBaseUrl?: string | null;
}) {
  const baseUrl = apiBaseUrl ? normalizeApiBaseUrl(apiBaseUrl) : getRequiredApiBaseUrl();
  const payload = await freshsalesRequest<FreshsalesFieldResponse>({
    url: `${baseUrl}/settings/contacts/fields`,
    headers: {
      Accept: "application/json",
      Authorization: `Token token=${accessToken}`,
      "Content-Type": "application/json",
    },
    errorPrefix: "Freshsales account lookup failed",
    step: "account_lookup",
  });

  return {
    apiBaseUrl: baseUrl,
    apiHost: getApiHost(baseUrl),
    fieldCount: Array.isArray(payload.fields) ? payload.fields.length : 0,
  };
}

export async function createOrUpdateFreshsalesTestLead({
  accessToken,
  apiBaseUrl,
  contact,
}: {
  accessToken: string;
  apiBaseUrl?: string | null;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}) {
  const baseUrl = apiBaseUrl ? normalizeApiBaseUrl(apiBaseUrl) : getRequiredApiBaseUrl();
  const payload = await freshsalesRequest<FreshsalesContactResponse>({
    url: `${baseUrl}/contacts`,
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Token token=${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contact: {
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        mobile_number: contact.phone,
      },
    }),
    errorPrefix: "Freshsales contact creation failed",
    step: "create_contact",
  });

  return {
    contactId: payload.contact?.id != null ? String(payload.contact.id) : null,
  };
}

export function getFreshsalesErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      status: null,
      category: null,
      code: null,
      step: null,
      safeCategory: "UNKNOWN_PROVIDER_ERROR",
      apiDomainHost: null,
    };
  }

  const providerError = error as FreshsalesProviderError;
  return {
    status: typeof providerError.status === "number" ? providerError.status : null,
    category: typeof providerError.category === "string" ? providerError.category : null,
    code: typeof providerError.code === "string" ? providerError.code : null,
    step: typeof providerError.step === "string" ? providerError.step : null,
    safeCategory:
      typeof providerError.safeCategory === "string" ? providerError.safeCategory : "UNKNOWN_PROVIDER_ERROR",
    apiDomainHost: typeof providerError.apiDomainHost === "string" ? providerError.apiDomainHost : null,
  };
}
