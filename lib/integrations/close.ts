import { env, isCloseConfigured } from "@/lib/env";

const DEFAULT_CLOSE_SCOPES = "all.full_access offline_access";

export type CloseOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  organization_id?: string;
  user_id?: string;
  error?: string;
  error_description?: string;
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

type CloseContactCreateResponse = {
  id?: string;
  lead_id?: string | null;
};

type CloseErrorPayload = {
  error?: string;
  error_description?: string;
  message?: string;
  field_errors?: Record<string, unknown>;
  errors?: Array<Record<string, unknown>>;
};

export type CloseProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  safeCategory?: string | null;
  errorDescription?: string | null;
  attemptDebug?: CloseTokenExchangeAttemptResult[] | null;
  usedAttemptNumber?: number | null;
  usedAuthStyle?: "form_body" | "basic_auth" | null;
  usedIncludesRedirectUri?: boolean | null;
  basicAuthRetryAttempted?: boolean;
  redirectUriRetryAttempted?: boolean;
  possibleCodeConsumption?: boolean;
};

export type CloseTokenExchangeAttemptResult = {
  attempt: number;
  authStyle: "form_body" | "basic_auth";
  includesRedirectUri: boolean;
  status: number | null;
  error: string | null;
  errorDescription: string | null;
  safeCategory: string | null;
  tokenReturned: boolean;
  refreshTokenReturned: boolean;
};

export type CloseTokenExchangeResult = {
  token: CloseOAuthTokenResponse;
  attempts: CloseTokenExchangeAttemptResult[];
  usedAttempt: CloseTokenExchangeAttemptResult;
  basicAuthRetryAttempted: boolean;
  redirectUriRetryAttempted: boolean;
  possibleCodeConsumption: boolean;
};

function createCloseProviderError(
  message: string,
  fields: Partial<
    Pick<
      CloseProviderError,
      | "status"
      | "category"
      | "code"
      | "safeCategory"
      | "errorDescription"
      | "attemptDebug"
      | "usedAttemptNumber"
      | "usedAuthStyle"
      | "usedIncludesRedirectUri"
      | "basicAuthRetryAttempted"
      | "redirectUriRetryAttempted"
      | "possibleCodeConsumption"
    >
  >,
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

function getConfiguredScopes() {
  return env.closeScopes || DEFAULT_CLOSE_SCOPES;
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

function resolveRedirectUri(override?: string | null) {
  return typeof override === "string" && override.trim().length > 0 ? override.trim() : getRequiredRedirectUri();
}

function getSafeProviderError(prefix: string, status: number, payload: CloseErrorPayload) {
  const candidates = [
    payload.message,
    payload.error_description,
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
  const normalizedDescription =
    typeof payload.error_description === "string" ? payload.error_description.toLowerCase() : "";
  const normalizedMessage = typeof payload.message === "string" ? payload.message.toLowerCase() : "";
  const hasFieldErrors =
    payload.field_errors && typeof payload.field_errors === "object" && Object.keys(payload.field_errors).length > 0;
  const combined = `${normalizedError} ${normalizedDescription} ${normalizedMessage}`.trim();

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
      errorDescription:
        typeof payload.error_description === "string"
          ? payload.error_description
          : typeof payload.message === "string"
            ? payload.message
            : null,
      safeCategory: classifyCloseError(response.status, payload),
    });
  }

  return payload as T;
}

export function buildCloseAuthorizationUrl(state: string, redirectUriOverride?: string | null) {
  const url = new URL("https://app.close.com/oauth2/authorize/");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", resolveRedirectUri(redirectUriOverride));
  url.searchParams.set("state", state);
  return url;
}

function getCloseTokenExchangeDebug(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      status: null,
      code: null,
      safeCategory: null,
      message: "unknown_error",
    };
  }

  const candidate = error as Error & {
    status?: number;
    code?: string | null;
    safeCategory?: string | null;
  };

  return {
    status: typeof candidate.status === "number" ? candidate.status : null,
    code: typeof candidate.code === "string" ? candidate.code : null,
    safeCategory: typeof candidate.safeCategory === "string" ? candidate.safeCategory : null,
    message: error.message,
  };
}

export function getCloseOAuthDebugInfo(redirectUriOverride?: string | null) {
  const authUrl = buildCloseAuthorizationUrl("STATE", redirectUriOverride);
  const scopeString = getConfiguredScopes();
  const scopes = getScopeList(scopeString);
  const clientId = getRequiredClientId();
  const clientSecret = getRequiredClientSecret();
  const redirectUri = resolveRedirectUri(redirectUriOverride);

  return {
    provider: "close" as const,
    authHost: authUrl.host,
    authPath: authUrl.pathname,
    redirectUri,
    scopeString,
    scopeCount: scopes.length,
    scopes,
    sendsScopeParam: authUrl.searchParams.has("scope"),
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    clientIdLength: clientId.length,
    clientSecretLength: clientSecret.length,
    redirectUriHasTrailingSlash: redirectUri.endsWith("/"),
    closeAuthUrl: "https://app.close.com/oauth2/authorize/",
    closeTokenUrl: "https://api.close.com/oauth2/token/",
  };
}

async function exchangeCloseCodeForTokensOnce({
  code,
  includeRedirectUri,
  redirectUriOverride,
  authStyle,
}: {
  code: string;
  includeRedirectUri: boolean;
  redirectUriOverride?: string | null;
  authStyle: "form_body" | "basic_auth";
}) {
  const clientId = getRequiredClientId();
  const clientSecret = getRequiredClientSecret();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
  });

  if (authStyle === "form_body") {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }

  if (includeRedirectUri) {
    body.set("redirect_uri", resolveRedirectUri(redirectUriOverride));
  }

  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (authStyle === "basic_auth") {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;
  }

  return requestJson<CloseOAuthTokenResponse>({
    url: "https://api.close.com/oauth2/token/",
    method: "POST",
    headers,
    body: body.toString(),
    errorPrefix: "Close token exchange failed",
  });
}

function shouldStopCloseTokenAttempts({
  attempt,
  error,
}: {
  attempt: CloseTokenExchangeAttemptResult;
  error: CloseProviderError;
}) {
  if (attempt.tokenReturned) return true;

  if (error.code === "invalid_grant") {
    return true;
  }

  return false;
}

export async function exchangeCloseCodeForTokens(
  code: string,
  redirectUriOverride?: string | null,
): Promise<CloseTokenExchangeResult> {
  const attempts: Array<Pick<CloseTokenExchangeAttemptResult, "attempt" | "authStyle" | "includesRedirectUri">> = [
    { attempt: 1, authStyle: "form_body", includesRedirectUri: false },
    { attempt: 2, authStyle: "form_body", includesRedirectUri: true },
    { attempt: 3, authStyle: "basic_auth", includesRedirectUri: false },
    { attempt: 4, authStyle: "basic_auth", includesRedirectUri: true },
  ];

  const results: CloseTokenExchangeAttemptResult[] = [];
  let sawInvalidGrant = false;

  for (const attempt of attempts) {
    if (sawInvalidGrant) {
      break;
    }

    try {
      const token = await exchangeCloseCodeForTokensOnce({
        code,
        includeRedirectUri: attempt.includesRedirectUri,
        redirectUriOverride,
        authStyle: attempt.authStyle,
      });

      const result: CloseTokenExchangeAttemptResult = {
        ...attempt,
        status: 200,
        error: null,
        errorDescription: null,
        safeCategory: null,
        tokenReturned: Boolean(token.access_token),
        refreshTokenReturned: Boolean(token.refresh_token),
      };
      results.push(result);

      if (!token.access_token) {
        throw createCloseProviderError("Close did not return an access token.", {
          status: 200,
          category: "response",
          code: "missing_access_token",
          safeCategory: "UNKNOWN_PROVIDER_ERROR",
          attemptDebug: results,
          usedAttemptNumber: attempt.attempt,
          usedAuthStyle: attempt.authStyle,
          usedIncludesRedirectUri: attempt.includesRedirectUri,
        });
      }

      console.info(
        "[close-oauth]",
        JSON.stringify({
          provider: "close",
          stage: "token_exchange_attempt",
          attempt: result.attempt,
          authStyle: result.authStyle,
          includesRedirectUri: result.includesRedirectUri,
          status: result.status,
          error: result.error,
          errorDescription: result.errorDescription,
          tokenReturned: result.tokenReturned,
          refreshTokenReturned: result.refreshTokenReturned,
        }),
      );

      return {
        token,
        attempts: results,
        usedAttempt: result,
        basicAuthRetryAttempted: results.some((entry) => entry.authStyle === "basic_auth"),
        redirectUriRetryAttempted: results.some((entry) => entry.includesRedirectUri),
        possibleCodeConsumption: results.some((entry) => entry.error === "invalid_grant"),
      };
    } catch (error) {
      const diagnostic = getCloseTokenExchangeDebug(error);
      const providerError = error as CloseProviderError;
      const result: CloseTokenExchangeAttemptResult = {
        ...attempt,
        status: diagnostic.status,
        error: diagnostic.code,
        errorDescription: providerError.errorDescription || diagnostic.message || null,
        safeCategory: diagnostic.safeCategory,
        tokenReturned: false,
        refreshTokenReturned: false,
      };
      results.push(result);

      console.error(
        "[close-oauth]",
        JSON.stringify({
          provider: "close",
          stage: "token_exchange_attempt",
          attempt: result.attempt,
          authStyle: result.authStyle,
          includesRedirectUri: result.includesRedirectUri,
          status: result.status,
          error: result.error,
          errorDescription: result.errorDescription,
          tokenReturned: result.tokenReturned,
          refreshTokenReturned: result.refreshTokenReturned,
        }),
      );

      if (providerError.code === "invalid_grant") {
        sawInvalidGrant = true;
      }

      if (shouldStopCloseTokenAttempts({ attempt: result, error: providerError })) {
        throw createCloseProviderError(providerError.message, {
          status: providerError.status,
          category: providerError.category,
          code: providerError.code,
          errorDescription: providerError.errorDescription || diagnostic.message || null,
          safeCategory: providerError.safeCategory,
          attemptDebug: results,
          usedAttemptNumber: result.attempt,
          usedAuthStyle: result.authStyle,
          usedIncludesRedirectUri: result.includesRedirectUri,
          basicAuthRetryAttempted: results.some((entry) => entry.authStyle === "basic_auth"),
          redirectUriRetryAttempted: results.some((entry) => entry.includesRedirectUri),
          possibleCodeConsumption: providerError.code === "invalid_grant",
        });
      }
    }
  }

  const last = results[results.length - 1] || null;
  throw createCloseProviderError("Close token exchange failed.", {
    status: typeof last?.status === "number" ? last.status : undefined,
    category: "http",
    code: last?.error ?? null,
    errorDescription: last?.errorDescription ?? null,
    safeCategory: last?.safeCategory ?? null,
    attemptDebug: results,
    usedAttemptNumber: last?.attempt ?? null,
    usedAuthStyle: last?.authStyle ?? null,
    usedIncludesRedirectUri: last?.includesRedirectUri ?? null,
    basicAuthRetryAttempted: results.some((entry) => entry.authStyle === "basic_auth"),
    redirectUriRetryAttempted: results.some((entry) => entry.includesRedirectUri),
    possibleCodeConsumption: sawInvalidGrant,
  });
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
    scopes: getScopeList(token.scope || getConfiguredScopes()),
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
  const leadPayload = await requestJson<CloseLeadCreateResponse>({
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
    }),
    errorPrefix: "Close lead creation failed",
  });

  const leadId = typeof leadPayload.id === "string" ? leadPayload.id : null;

  const contactPayload = await requestJson<CloseContactCreateResponse>({
    url: "https://api.close.com/api/v1/contact/",
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(leadId ? { lead_id: leadId } : {}),
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
    }),
    errorPrefix: "Close contact creation failed",
  });

  return {
    leadId: leadId || (typeof contactPayload.lead_id === "string" ? contactPayload.lead_id : null),
    contactId: typeof contactPayload.id === "string" ? contactPayload.id : null,
  };
}
