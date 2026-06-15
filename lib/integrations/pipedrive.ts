import { env, isPipedriveConfigured } from "@/lib/env";

type PipedriveTokenResponse = {
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  api_domain?: string;
};

type PipedriveCurrentUserResponse = {
  success?: boolean;
  data?: {
    id?: number | string;
    name?: string;
    email?: string;
    company_id?: number | string;
    company_name?: string;
    company_domain?: string;
    default_currency?: string;
    locale?: string;
    lang?: string;
    timezone_name?: string;
  };
};

type PipedriveCreateResponse = {
  success?: boolean;
  data?: {
    id?: number | string;
  };
};

type PipedrivePersonInput = {
  name: string;
  email: string;
  phone: string;
};

type PipedriveDealInput = {
  title: string;
  personId: string;
  note?: string | null;
};

type PipedriveLeadInput = {
  title: string;
  personId: string;
};

function getRequiredClientId() {
  if (!isPipedriveConfigured() || !env.pipedriveClientId) {
    throw new Error("Pipedrive OAuth env vars are missing.");
  }
  return env.pipedriveClientId;
}

function getRequiredClientSecret() {
  if (!isPipedriveConfigured() || !env.pipedriveClientSecret) {
    throw new Error("Pipedrive OAuth env vars are missing.");
  }
  return env.pipedriveClientSecret;
}

function getRequiredRedirectUri() {
  if (!isPipedriveConfigured() || !env.pipedriveRedirectUri) {
    throw new Error("Pipedrive OAuth env vars are missing.");
  }
  return env.pipedriveRedirectUri;
}

function getBasicAuthHeader() {
  return `Basic ${Buffer.from(`${getRequiredClientId()}:${getRequiredClientSecret()}`, "utf8").toString("base64")}`;
}

function getApiDomain(apiDomain: string | null | undefined) {
  const value = typeof apiDomain === "string" ? apiDomain.trim() : "";
  if (!value) {
    throw new Error("Pipedrive did not return an API domain.");
  }
  return value.replace(/\/+$/, "");
}

function getSafeProviderError(prefix: string, status: number, payload: unknown) {
  const errorRecord = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const candidates = [
    errorRecord.error,
    errorRecord.error_description,
    errorRecord.message,
    errorRecord.errorCode,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return `${prefix}: ${candidate.trim()}`;
    }
  }

  return `${prefix}: HTTP ${status}`;
}

function getScopeList(value: unknown) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(value.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean)));
}

async function requestJson<T>({
  url,
  accessToken,
  method = "GET",
  body,
  errorPrefix,
}: {
  url: string;
  accessToken: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  errorPrefix: string;
}) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(getSafeProviderError(errorPrefix, response.status, payload));
  }

  return payload;
}

export function buildAuthorizationUrl(state: string) {
  const url = new URL("https://oauth.pipedrive.com/oauth/authorize");
  url.searchParams.set("client_id", getRequiredClientId());
  url.searchParams.set("redirect_uri", getRequiredRedirectUri());
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRequiredRedirectUri(),
    }).toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as PipedriveTokenResponse & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(getSafeProviderError("Pipedrive token exchange failed", response.status, payload));
  }

  if (!payload.access_token) {
    throw new Error("Pipedrive did not return an access token.");
  }

  return payload;
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
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
  });

  const payload = (await response.json().catch(() => ({}))) as PipedriveTokenResponse & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(getSafeProviderError("Pipedrive token refresh failed", response.status, payload));
  }

  if (!payload.access_token) {
    throw new Error("Pipedrive did not return a refreshed access token.");
  }

  return payload;
}

export async function getCurrentUser({
  accessToken,
  apiDomain,
}: {
  accessToken: string;
  apiDomain: string;
}) {
  const response = await fetch(`${getApiDomain(apiDomain)}/api/v1/users/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as PipedriveCurrentUserResponse & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(getSafeProviderError("Pipedrive account lookup failed", response.status, payload));
  }

  if (!payload.success || !payload.data) {
    throw new Error("Pipedrive did not return account details.");
  }

  return {
    userId: payload.data.id != null ? String(payload.data.id) : null,
    userName: typeof payload.data.name === "string" ? payload.data.name : null,
    email: typeof payload.data.email === "string" ? payload.data.email : null,
    companyId: payload.data.company_id != null ? String(payload.data.company_id) : null,
    companyName: typeof payload.data.company_name === "string" ? payload.data.company_name : null,
    companyDomain: typeof payload.data.company_domain === "string" ? payload.data.company_domain : null,
    defaultCurrency: typeof payload.data.default_currency === "string" ? payload.data.default_currency : null,
    locale: typeof payload.data.locale === "string" ? payload.data.locale : null,
    language: typeof payload.data.lang === "string" ? payload.data.lang : null,
    timezoneName: typeof payload.data.timezone_name === "string" ? payload.data.timezone_name : null,
  };
}

export function getTokenMetadata(token: PipedriveTokenResponse) {
  return {
    tokenType: token.token_type || "Bearer",
    refreshToken: token.refresh_token || null,
    expiresIn: typeof token.expires_in === "number" ? token.expires_in : null,
    scopes: getScopeList(token.scope),
    apiDomain: typeof token.api_domain === "string" ? token.api_domain : null,
  };
}

export async function createPerson({
  accessToken,
  apiDomain,
  person,
}: {
  accessToken: string;
  apiDomain: string;
  person: PipedrivePersonInput;
}) {
  const payload = await requestJson<PipedriveCreateResponse>({
    url: `${getApiDomain(apiDomain)}/api/v1/persons`,
    accessToken,
    method: "POST",
    body: {
      name: person.name,
      email: [{ value: person.email, primary: true }],
      phone: [{ value: person.phone, primary: true }],
    },
    errorPrefix: "Pipedrive person creation failed",
  });

  const personId = payload.data?.id != null ? String(payload.data.id) : null;
  if (!payload.success || !personId) {
    throw new Error("Pipedrive person creation failed.");
  }

  return { personId };
}

export async function createDeal({
  accessToken,
  apiDomain,
  deal,
}: {
  accessToken: string;
  apiDomain: string;
  deal: PipedriveDealInput;
}) {
  const payload = await requestJson<PipedriveCreateResponse>({
    url: `${getApiDomain(apiDomain)}/api/v1/deals`,
    accessToken,
    method: "POST",
    body: {
      title: deal.title,
      person_id: Number(deal.personId),
    },
    errorPrefix: "Pipedrive deal creation failed",
  });

  const dealId = payload.data?.id != null ? String(payload.data.id) : null;
  if (!payload.success || !dealId) {
    throw new Error("Pipedrive deal creation failed.");
  }

  if (deal.note) {
    await requestJson<PipedriveCreateResponse>({
      url: `${getApiDomain(apiDomain)}/api/v1/notes`,
      accessToken,
      method: "POST",
      body: {
        content: deal.note,
        deal_id: Number(dealId),
      },
      errorPrefix: "Pipedrive note creation failed",
    });
  }

  return { dealId };
}

export async function createLead({
  accessToken,
  apiDomain,
  lead,
}: {
  accessToken: string;
  apiDomain: string;
  lead: PipedriveLeadInput;
}) {
  const payload = await requestJson<PipedriveCreateResponse>({
    url: `${getApiDomain(apiDomain)}/api/v1/leads`,
    accessToken,
    method: "POST",
    body: {
      title: lead.title,
      person_id: Number(lead.personId),
      origin_id: "sidekick-crm-test",
    },
    errorPrefix: "Pipedrive lead creation failed",
  });

  const leadId = payload.data?.id != null ? String(payload.data.id) : null;
  if (!payload.success || !leadId) {
    throw new Error("Pipedrive lead creation failed.");
  }

  return { leadId };
}

export async function sendTestLead({
  accessToken,
  apiDomain,
}: {
  accessToken: string;
  apiDomain: string;
}) {
  const person = await createPerson({
    accessToken,
    apiDomain,
    person: {
      name: "SideKick Test Lead",
      email: "test+sidekick@sidekickstudioss.com",
      phone: "555-010-2026",
    },
  });

  const lead = await createLead({
    accessToken,
    apiDomain,
    lead: {
      title: "SideKick Test Lead - CRM Delivery Test",
      personId: person.personId,
    },
  });

  return {
    success: true as const,
    personId: person.personId,
    leadId: lead.leadId,
    safeMessage: "Test lead sent to Pipedrive Leads Inbox.",
  };
}
