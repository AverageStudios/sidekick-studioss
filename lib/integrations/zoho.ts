import { env, isZohoConfigured } from "@/lib/env";

export type ZohoOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  api_domain?: string;
  scope?: string;
};

type ZohoOrgDetailsResponse = {
  org?: Array<Record<string, unknown>>;
};

type ZohoCreateLeadResponse = {
  data?: Array<{
    code?: string;
    details?: {
      id?: string;
    };
    status?: string;
    message?: string;
  }>;
};

export type ZohoProviderError = Error & {
  status?: number;
  category?: string | null;
  code?: string | null;
  provider?: "zoho";
  step?: string;
  safeCategory?: string | null;
  apiDomainHost?: string | null;
  detailApiName?: string | null;
};

function createZohoProviderError(
  message: string,
  fields: Partial<
    Pick<ZohoProviderError, "status" | "category" | "code" | "step" | "safeCategory" | "apiDomainHost" | "detailApiName">
  >,
) {
  return Object.assign(new Error(message), {
    provider: "zoho" as const,
    ...fields,
  }) as ZohoProviderError;
}

function getApiDomainHost(value: string | null | undefined) {
  try {
    return new URL(getApiDomain(value)).host;
  } catch {
    return null;
  }
}

function classifyZohoError({
  status,
  code,
  category,
  step,
}: {
  status?: number | null;
  code?: string | null;
  category?: string | null;
  step?: string | null;
}) {
  const normalizedCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  const normalizedCategory = typeof category === "string" ? category.trim().toUpperCase() : "";
  const normalizedStep = typeof step === "string" ? step.trim().toLowerCase() : "";

  if (normalizedStep === "token_refresh" && (status === 400 || status === 401)) {
    return "REFRESH_FAILED";
  }

  if (status === 401) return "AUTH_FAILED";
  if (normalizedCode === "OAUTH_SCOPE_MISMATCH" || normalizedCode === "INVALID_OAUTHSCOPE") {
    return "INVALID_SCOPE";
  }
  if (normalizedCode === "AUTHORIZATION_FAILED" || normalizedCategory === "NO_PERMISSION" || status === 403) {
    return "PERMISSION_DENIED";
  }
  if (normalizedCode === "INVALID_URL_PATTERN") {
    return "INVALID_DOMAIN";
  }
  if (normalizedCode === "REQUIRED_FIELD_MISSING") {
    return "REQUIRED_FIELD_MISSING";
  }
  if (normalizedCode === "INVALID_MODULE" || normalizedCode === "MODULE_NOT_SUPPORTED") {
    return "MODULE_NOT_AVAILABLE";
  }
  if (normalizedCode === "INVALID_DATA" || normalizedCategory === "ERROR") {
    return "VALIDATION_FAILED";
  }

  return "UNKNOWN_PROVIDER_ERROR";
}

function getRequiredClientId() {
  if (!isZohoConfigured() || !env.zohoClientId) {
    throw new Error("Zoho OAuth env vars are missing.");
  }
  return env.zohoClientId;
}

function getRequiredClientSecret() {
  if (!isZohoConfigured() || !env.zohoClientSecret) {
    throw new Error("Zoho OAuth env vars are missing.");
  }
  return env.zohoClientSecret;
}

function getRequiredRedirectUri() {
  if (!isZohoConfigured() || !env.zohoRedirectUri) {
    throw new Error("Zoho OAuth env vars are missing.");
  }
  return env.zohoRedirectUri;
}

function getRequiredAccountsUrl() {
  if (!isZohoConfigured() || !env.zohoAccountsUrl) {
    throw new Error("Zoho OAuth env vars are missing.");
  }
  return env.zohoAccountsUrl.replace(/\/+$/, "");
}

function getRequiredScopes() {
  if (!isZohoConfigured() || !env.zohoScopes) {
    throw new Error("Zoho OAuth env vars are missing.");
  }
  return normalizeScopeParam(env.zohoScopes);
}

function normalizeScopeParam(value: string) {
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean))).join(",");
}

function getApiDomain(value: string | null | undefined) {
  const domain = typeof value === "string" ? value.trim() : "";
  return (domain || "https://www.zohoapis.com").replace(/\/+$/, "");
}

function getAccountsUrl(value: string | null | undefined) {
  const base = typeof value === "string" ? value.trim() : "";
  return (base || getRequiredAccountsUrl()).replace(/\/+$/, "");
}

function extractZohoResponseError(payload: Record<string, unknown> & { data?: unknown[] }) {
  const firstDataError = Array.isArray(payload.data)
    ? ((payload.data?.[0] as Record<string, unknown> | undefined) ?? null)
    : null;
  const detailRecord =
    firstDataError?.details && typeof firstDataError.details === "object"
      ? (firstDataError.details as Record<string, unknown>)
      : null;

  return {
    firstDataError,
    code:
      typeof payload.code === "string"
        ? payload.code
        : typeof firstDataError?.code === "string"
          ? firstDataError.code
          : null,
    category:
      typeof payload.error === "string"
        ? payload.error
        : typeof firstDataError?.status === "string"
          ? firstDataError.status
          : null,
    message:
      typeof payload.message === "string"
        ? payload.message
        : typeof firstDataError?.message === "string"
          ? firstDataError.message
          : null,
    detailApiName: typeof detailRecord?.api_name === "string" ? detailRecord.api_name : null,
  };
}

async function zohoRequest<T>({
  url,
  method = "GET",
  headers,
  body,
  errorPrefix,
  step,
}: {
  url: string;
  method?: "GET" | "POST";
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
    const extracted = extractZohoResponseError(payload as Record<string, unknown> & { data?: unknown[] });
    throw createZohoProviderError(`${errorPrefix}: ${response.status} ${response.statusText}`, {
      status: response.status,
      category: extracted.category,
      code: extracted.code,
      step,
      safeCategory: classifyZohoError({
        status: response.status,
        code: extracted.code,
        category: extracted.category,
        step,
      }),
      detailApiName: extracted.detailApiName,
    });
  }

  return payload as T;
}

function buildTokenEndpoint(accountsUrl?: string | null) {
  return `${getAccountsUrl(accountsUrl)}/oauth/v2/token`;
}

export function buildZohoAuthorizationUrl(state: string) {
  const url = new URL(`${getRequiredAccountsUrl()}/oauth/v2/auth`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("scope", getRequiredScopes());
  url.searchParams.set("redirect_uri", getRequiredRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url;
}

export async function exchangeZohoCodeForTokens({
  code,
  accountsUrl,
}: {
  code: string;
  accountsUrl?: string | null;
}) {
  const payload = await zohoRequest<ZohoOAuthTokenResponse>({
    url: buildTokenEndpoint(accountsUrl),
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
    errorPrefix: "Zoho token exchange failed",
    step: "token_exchange",
  });

  if (!payload.access_token) {
    throw new Error("Zoho did not return an access token.");
  }

  return payload;
}

export async function refreshZohoAccessToken({
  refreshToken,
  accountsUrl,
}: {
  refreshToken: string;
  accountsUrl?: string | null;
}) {
  const payload = await zohoRequest<ZohoOAuthTokenResponse>({
    url: buildTokenEndpoint(accountsUrl),
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
    errorPrefix: "Zoho token refresh failed",
    step: "token_refresh",
  });

  if (!payload.access_token) {
    throw new Error("Zoho did not return a refreshed access token.");
  }

  return payload;
}

export function getZohoTokenMetadata(token: ZohoOAuthTokenResponse) {
  const scopes =
    typeof token.scope === "string"
      ? Array.from(new Set(token.scope.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)))
      : [];

  return {
    tokenType: token.token_type || "Bearer",
    refreshToken: token.refresh_token || null,
    expiresIn: typeof token.expires_in === "number" ? token.expires_in : null,
    scopes,
    apiDomain: typeof token.api_domain === "string" ? token.api_domain : null,
  };
}

export function getZohoErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      status: null,
      category: null,
      code: null,
      step: null,
      safeCategory: "UNKNOWN_PROVIDER_ERROR",
      apiDomainHost: null,
      detailApiName: null,
    };
  }

  const providerError = error as ZohoProviderError;
  return {
    status: typeof providerError.status === "number" ? providerError.status : null,
    category: typeof providerError.category === "string" ? providerError.category : null,
    code: typeof providerError.code === "string" ? providerError.code : null,
    step: typeof providerError.step === "string" ? providerError.step : null,
    safeCategory:
      typeof providerError.safeCategory === "string" && providerError.safeCategory.trim()
        ? providerError.safeCategory
        : classifyZohoError({
            status: typeof providerError.status === "number" ? providerError.status : null,
            code: typeof providerError.code === "string" ? providerError.code : null,
            category: typeof providerError.category === "string" ? providerError.category : null,
            step: typeof providerError.step === "string" ? providerError.step : null,
          }),
    apiDomainHost: typeof providerError.apiDomainHost === "string" ? providerError.apiDomainHost : null,
    detailApiName: typeof providerError.detailApiName === "string" ? providerError.detailApiName : null,
  };
}

export async function getZohoOrgInfo({
  accessToken,
  apiDomain,
}: {
  accessToken: string;
  apiDomain?: string | null;
}) {
  const payload = await zohoRequest<ZohoOrgDetailsResponse>({
    url: `${getApiDomain(apiDomain)}/crm/v8/org`,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      Accept: "application/json",
    },
    errorPrefix: "Zoho account lookup failed",
    step: "org_lookup",
  });

  const firstOrg = Array.isArray(payload.org) ? payload.org[0] : null;
  if (!firstOrg || typeof firstOrg !== "object") {
    throw new Error("Zoho did not return organization details.");
  }

  return firstOrg;
}

export async function createZohoLead({
  accessToken,
  apiDomain,
  lead,
}: {
  accessToken: string;
  apiDomain?: string | null;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    leadSource: string;
    company: string;
  };
}) {
  const apiDomainHost = getApiDomainHost(apiDomain);
  const payload = await zohoRequest<ZohoCreateLeadResponse>({
    url: `${getApiDomain(apiDomain)}/crm/v8/Leads`,
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [
        {
          First_Name: lead.firstName,
          Last_Name: lead.lastName,
          Email: lead.email,
          Phone: lead.phone,
          Lead_Source: lead.leadSource,
          Company: lead.company,
        },
      ],
      trigger: [],
    }),
    errorPrefix: "Zoho lead creation failed",
    step: "create_lead",
  });

  const firstResult = Array.isArray(payload.data) ? payload.data[0] : null;
  const leadId =
    firstResult?.details && typeof firstResult.details.id === "string"
      ? firstResult.details.id
      : null;

  if (firstResult?.status !== "success" || !leadId) {
    const detailRecord =
      firstResult?.details && typeof firstResult.details === "object"
        ? (firstResult.details as Record<string, unknown>)
        : null;
    throw createZohoProviderError(
      typeof firstResult?.message === "string" && firstResult.message.trim()
        ? `Zoho lead creation failed: ${firstResult.message.trim()}`
        : "Zoho lead creation failed.",
      {
      status: 400,
      category: typeof firstResult?.status === "string" ? firstResult.status : null,
      code: typeof firstResult?.code === "string" ? firstResult.code : null,
      step: "create_lead",
      safeCategory: classifyZohoError({
        status: 400,
        code: typeof firstResult?.code === "string" ? firstResult.code : null,
        category: typeof firstResult?.status === "string" ? firstResult.status : null,
        step: "create_lead",
      }),
      apiDomainHost,
      detailApiName: typeof detailRecord?.api_name === "string" ? detailRecord.api_name : null,
    });
  }

  return {
    leadId,
  };
}

export async function sendZohoTestLead({
  accessToken,
  apiDomain,
}: {
  accessToken: string;
  apiDomain?: string | null;
}) {
  const result = await createZohoLead({
    accessToken,
    apiDomain,
    lead: {
      firstName: "SideKick",
      lastName: "Test Lead",
      email: "test+sidekick@sidekickstudioss.com",
      phone: "555-010-2026",
      leadSource: "SideKick CRM Delivery Test",
      company: "SideKick Studioss Test",
    },
  });

  return {
    success: true as const,
    provider: "zoho" as const,
    providerName: "Zoho CRM",
    message: "Test lead sent to Zoho CRM.",
    messageKey: "crm_test_delivery_zoho_success",
    createdObjectType: "lead" as const,
    providerRecordIds: {
      leadId: result.leadId,
    },
    safeMessage: "Test lead sent to Zoho CRM.",
  };
}
