import { env, isSalesforceConfigured } from "@/lib/env";

export type SalesforceOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  instance_url?: string;
  id?: string;
  issued_at?: string;
  signature?: string;
  token_type?: string;
  scope?: string;
};

type SalesforceOrganizationQueryResponse = {
  records?: Array<{
    Id?: string;
    Name?: string;
  }>;
};

type SalesforceIdentityResponse = {
  user_id?: string;
  organization_id?: string;
  username?: string;
  display_name?: string;
  email?: string;
};

type SalesforceLeadResponse = {
  id?: string;
  success?: boolean;
  errors?: string[];
};

type SalesforceErrorPayload =
  | Array<{
      errorCode?: string;
      message?: string;
      fields?: string[];
    }>
  | {
      error?: string;
      error_description?: string;
      message?: string;
      errorCode?: string;
    };

export type SalesforceProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  safeCategory?: string | null;
};

function createSalesforceProviderError(
  message: string,
  fields: Partial<Pick<SalesforceProviderError, "status" | "category" | "code" | "safeCategory">>,
) {
  return Object.assign(new Error(message), fields) as SalesforceProviderError;
}

function getRequiredClientId() {
  if (!isSalesforceConfigured() || !env.salesforceClientId) {
    throw new Error("Salesforce OAuth env vars are missing.");
  }
  return env.salesforceClientId;
}

function getRequiredClientSecret() {
  if (!isSalesforceConfigured() || !env.salesforceClientSecret) {
    throw new Error("Salesforce OAuth env vars are missing.");
  }
  return env.salesforceClientSecret;
}

function getRequiredRedirectUri() {
  if (!isSalesforceConfigured() || !env.salesforceRedirectUri) {
    throw new Error("Salesforce OAuth env vars are missing.");
  }
  return env.salesforceRedirectUri;
}

function getRequiredScopes() {
  if (!isSalesforceConfigured() || !env.salesforceScopes) {
    throw new Error("Salesforce OAuth env vars are missing.");
  }
  return env.salesforceScopes;
}

function getLoginUrl() {
  if (!isSalesforceConfigured() || !env.salesforceLoginUrl) {
    throw new Error("Salesforce OAuth env vars are missing.");
  }
  return env.salesforceLoginUrl.replace(/\/+$/, "");
}

function getApiVersion() {
  return env.salesforceApiVersion || "v61.0";
}

function resolveRedirectUri(override?: string | null) {
  return typeof override === "string" && override.trim().length > 0 ? override.trim() : getRequiredRedirectUri();
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

function getSafeProviderError(prefix: string, status: number, payload: SalesforceErrorPayload) {
  const firstArrayItem = Array.isArray(payload) ? payload[0] : null;
  const candidates = [
    firstArrayItem?.message,
    !Array.isArray(payload) ? payload.message : null,
    !Array.isArray(payload) ? payload.error_description : null,
    !Array.isArray(payload) ? payload.error : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return `${prefix}: ${candidate.trim()}`;
    }
  }

  return `${prefix}: HTTP ${status}`;
}

function classifySalesforceError(status: number, payload: SalesforceErrorPayload) {
  const firstArrayItem = Array.isArray(payload) ? payload[0] : null;
  const errorCode = Array.isArray(payload)
    ? firstArrayItem?.errorCode
    : typeof payload.errorCode === "string"
      ? payload.errorCode
      : typeof payload.error === "string"
        ? payload.error
        : null;
  const normalizedCode = typeof errorCode === "string" ? errorCode.toUpperCase() : "";

  if (status === 401) return "AUTH_FAILED";
  if (status === 403) return "PERMISSION_DENIED";
  if (
    normalizedCode === "REQUIRED_FIELD_MISSING" ||
    normalizedCode === "INVALID_FIELD_FOR_INSERT_UPDATE" ||
    normalizedCode === "INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST"
  ) {
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
          return JSON.parse(raw) as T & SalesforceErrorPayload;
        } catch {
          return {} as T & SalesforceErrorPayload;
        }
      })()
    : ({} as T & SalesforceErrorPayload);

  if (!response.ok) {
    const firstArrayItem = Array.isArray(payload) ? payload[0] : null;
    throw createSalesforceProviderError(getSafeProviderError(errorPrefix, response.status, payload), {
      status: response.status,
      category: "http",
      code: Array.isArray(payload)
        ? typeof firstArrayItem?.errorCode === "string"
          ? firstArrayItem.errorCode
          : null
        : typeof payload.errorCode === "string"
          ? payload.errorCode
          : typeof payload.error === "string"
            ? payload.error
            : null,
      safeCategory: classifySalesforceError(response.status, payload),
    });
  }

  return payload as T;
}

export function buildSalesforceAuthorizationUrl(state: string, redirectUriOverride?: string | null) {
  const url = new URL(`${getLoginUrl()}/services/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("redirect_uri", resolveRedirectUri(redirectUriOverride));
  url.searchParams.set("scope", getRequiredScopes());
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeSalesforceCodeForTokens(code: string, redirectUriOverride?: string | null) {
  const payload = await requestJson<SalesforceOAuthTokenResponse>({
    url: `${getLoginUrl()}/services/oauth2/token`,
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: getRequiredClientId(),
      client_secret: getRequiredClientSecret(),
      redirect_uri: resolveRedirectUri(redirectUriOverride),
    }).toString(),
    errorPrefix: "Salesforce token exchange failed",
  });

  if (!payload.access_token) {
    throw new Error("Salesforce did not return an access token.");
  }

  return payload;
}

export async function refreshSalesforceAccessToken(refreshToken: string) {
  const payload = await requestJson<SalesforceOAuthTokenResponse>({
    url: `${getLoginUrl()}/services/oauth2/token`,
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: getRequiredClientId(),
      client_secret: getRequiredClientSecret(),
    }).toString(),
    errorPrefix: "Salesforce token refresh failed",
  });

  if (!payload.access_token) {
    throw new Error("Salesforce did not return a refreshed access token.");
  }

  return payload;
}

export function getSalesforceTokenMetadata(token: SalesforceOAuthTokenResponse) {
  return {
    tokenType: token.token_type || "Bearer",
    refreshToken: token.refresh_token || null,
    scopes: getScopeList(token.scope),
    instanceUrl: token.instance_url || null,
    identityUrl: token.id || null,
    issuedAt: token.issued_at || null,
  };
}

export async function getSalesforceIdentity({
  accessToken,
  identityUrl,
}: {
  accessToken: string;
  identityUrl: string;
}) {
  return requestJson<SalesforceIdentityResponse>({
    url: identityUrl,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    errorPrefix: "Salesforce identity lookup failed",
  });
}

export async function getSalesforceOrganizationInfo({
  accessToken,
  instanceUrl,
  apiVersion,
}: {
  accessToken: string;
  instanceUrl: string;
  apiVersion?: string | null;
}) {
  const response = await requestJson<SalesforceOrganizationQueryResponse>({
    url: `${instanceUrl.replace(/\/+$/, "")}/services/data/${apiVersion || getApiVersion()}/query?q=${encodeURIComponent("SELECT Id, Name FROM Organization LIMIT 1")}`,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    errorPrefix: "Salesforce organization lookup failed",
  });

  const record = Array.isArray(response.records) ? response.records[0] : null;
  return {
    orgId: typeof record?.Id === "string" ? record.Id : null,
    orgName: typeof record?.Name === "string" ? record.Name : null,
  };
}

export async function createSalesforceTestLead({
  accessToken,
  instanceUrl,
  apiVersion,
}: {
  accessToken: string;
  instanceUrl: string;
  apiVersion?: string | null;
}) {
  const payload = await requestJson<SalesforceLeadResponse>({
    url: `${instanceUrl.replace(/\/+$/, "")}/services/data/${apiVersion || getApiVersion()}/sobjects/Lead`,
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      FirstName: "SideKick",
      LastName: "Test Lead",
      Company: "SideKick Studioss Test",
      Email: "test+sidekick@sidekickstudioss.com",
      Phone: "555-010-2026",
      LeadSource: "SideKick CRM Delivery Test",
    }),
    errorPrefix: "Salesforce lead creation failed",
  });

  return {
    leadId: payload.id || null,
    success: payload.success === true,
  };
}
