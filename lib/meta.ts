import { env } from "@/lib/env";

const defaultMetaScopes = [
  "ads_management",
  "ads_read",
  "business_management",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_ads",
  "pages_manage_metadata",
  "leads_retrieval",
] as const;

export type MetaAdAccount = {
  id: string;
  account_id?: string;
  name?: string;
  account_status?: number;
  disable_reason?: number;
  currency?: string;
  business_name?: string;
  funding_source_details?: Record<string, unknown>;
};

export type MetaPage = {
  id: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  } | null;
};

export type MetaPixel = {
  id: string;
  name?: string;
  is_unavailable?: boolean;
};

export type MetaLeadForm = {
  id: string;
  name?: string;
  status?: string;
  locale?: string;
  created_time?: string;
};

export type MetaTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type MetaApiErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function readMetaEnv(name: string) {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function getMetaGraphApiVersion() {
  const parsed = readMetaEnv("META_GRAPH_API_VERSION") || env.metaGraphApiVersion || "v25.0";
  return parsed.startsWith("v") ? parsed : `v${parsed}`;
}

export function getMetaEnvStatus() {
  const required = ["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"];
  const missingKeys = required.filter((key) => !readMetaEnv(key));
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function isMetaConfigured() {
  return getMetaEnvStatus().configured;
}

export function getMetaScopes() {
  const raw = readMetaEnv("META_SCOPES");
  if (!raw) {
    return [...defaultMetaScopes];
  }
  const parsed = raw
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
  return parsed.length ? parsed : [...defaultMetaScopes];
}

function buildMetaGraphUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `https://graph.facebook.com/${getMetaGraphApiVersion()}/${cleanPath}`;
}

function getMetaOauthDialogUrl() {
  return `https://www.facebook.com/${getMetaGraphApiVersion()}/dialog/oauth`;
}

export function getMetaOAuthUrl(state: string) {
  const appId = readMetaEnv("META_APP_ID") || env.metaAppId;
  const redirectUri = readMetaEnv("META_REDIRECT_URI") || env.metaRedirectUri || `${env.appUrl}/api/meta/callback`;
  if (!appId || !redirectUri) return null;

  const url = new URL(getMetaOauthDialogUrl());
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", getMetaScopes().join(","));
  return url.toString();
}

async function fetchMetaJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as MetaApiErrorPayload | null;
  if (!response.ok) {
    const errorPayload = payload?.error;
    const message =
      (errorPayload?.message ? String(errorPayload.message) : "") ||
      `Meta request failed (${response.status}).`;
    const error = new Error(message);
    Object.assign(error, {
      metaCode: errorPayload?.code,
      metaSubcode: errorPayload?.error_subcode,
      metaType: errorPayload?.type,
      metaTraceId: errorPayload?.fbtrace_id,
      status: response.status,
    });
    throw error;
  }
  return payload as T;
}

export async function exchangeMetaCodeForToken(code: string): Promise<MetaTokenResponse> {
  const appId = readMetaEnv("META_APP_ID") || env.metaAppId;
  const appSecret = readMetaEnv("META_APP_SECRET") || env.metaAppSecret;
  const redirectUri = readMetaEnv("META_REDIRECT_URI") || env.metaRedirectUri || `${env.appUrl}/api/meta/callback`;

  if (!appId || !appSecret || !redirectUri) {
    throw new Error("Meta env vars are missing.");
  }

  const url = new URL(buildMetaGraphUrl("oauth/access_token"));
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  return fetchMetaJson<MetaTokenResponse>(url.toString());
}

export async function exchangeMetaTokenForLongLivedToken(accessToken: string): Promise<MetaTokenResponse> {
  const appId = readMetaEnv("META_APP_ID") || env.metaAppId;
  const appSecret = readMetaEnv("META_APP_SECRET") || env.metaAppSecret;
  if (!appId || !appSecret) {
    throw new Error("Meta app credentials are missing.");
  }

  const url = new URL(buildMetaGraphUrl("oauth/access_token"));
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", accessToken);
  return fetchMetaJson<MetaTokenResponse>(url.toString());
}

export async function fetchMetaUser(accessToken: string) {
  const url = new URL(buildMetaGraphUrl("me"));
  url.searchParams.set("fields", "id,name");
  url.searchParams.set("access_token", accessToken);
  return fetchMetaJson<{ id: string; name?: string }>(url.toString());
}

export async function fetchMetaTokenDebugInfo(inputToken: string) {
  const appId = readMetaEnv("META_APP_ID") || env.metaAppId;
  const appSecret = readMetaEnv("META_APP_SECRET") || env.metaAppSecret;
  if (!appId || !appSecret) {
    throw new Error("Meta app credentials are missing.");
  }

  const url = new URL(buildMetaGraphUrl("debug_token"));
  url.searchParams.set("input_token", inputToken);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  return fetchMetaJson<{
    data?: {
      app_id?: string;
      type?: string;
      application?: string;
      expires_at?: number;
      is_valid?: boolean;
      scopes?: string[];
      user_id?: string;
    };
  }>(url.toString());
}

export async function fetchMetaAdAccounts(accessToken: string) {
  const url = new URL(buildMetaGraphUrl("me/adaccounts"));
  url.searchParams.set(
    "fields",
    "id,account_id,name,account_status,disable_reason,currency,business_name,funding_source_details",
  );
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", accessToken);
  const payload = await fetchMetaJson<{ data?: MetaAdAccount[] }>(url.toString());
  return payload.data || [];
}

export async function fetchMetaPages(accessToken: string) {
  const url = new URL(buildMetaGraphUrl("me/accounts"));
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", accessToken);
  const payload = await fetchMetaJson<{ data?: MetaPage[] }>(url.toString());
  return payload.data || [];
}

export async function fetchMetaPixels(accessToken: string, adAccountId: string) {
  const normalizedId = adAccountId.replace(/^act_/, "");
  const url = new URL(buildMetaGraphUrl(`act_${normalizedId}/adspixels`));
  url.searchParams.set("fields", "id,name,is_unavailable");
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", accessToken);
  const payload = await fetchMetaJson<{ data?: MetaPixel[] }>(url.toString());
  return payload.data || [];
}

export async function fetchMetaLeadForms(accessToken: string, pageId: string) {
  const url = new URL(buildMetaGraphUrl(`${pageId}/leadgen_forms`));
  url.searchParams.set("fields", "id,name,status,locale,created_time");
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", accessToken);
  const payload = await fetchMetaJson<{ data?: MetaLeadForm[] }>(url.toString());
  return payload.data || [];
}

export async function createMetaLeadForm({
  accessToken,
  pageId,
  name,
  privacyPolicyUrl,
  fields,
}: {
  accessToken: string;
  pageId: string;
  name: string;
  privacyPolicyUrl: string;
  fields: Array<"FULL_NAME" | "EMAIL" | "PHONE">;
}) {
  const url = new URL(buildMetaGraphUrl(`${pageId}/leadgen_forms`));
  const questions = fields.map((type) => ({ type }));
  const body = new URLSearchParams();
  body.set("name", name);
  body.set("locale", "en_US");
  body.set("questions", JSON.stringify(questions));
  body.set(
    "privacy_policy",
    JSON.stringify({
      url: privacyPolicyUrl,
      link_text: "Privacy Policy",
    }),
  );
  body.set("access_token", accessToken);

  return fetchMetaJson<{ id?: string }>(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function fetchMetaAdAccountDetails(accessToken: string, adAccountId: string) {
  const normalizedId = adAccountId.replace(/^act_/, "");
  const url = new URL(buildMetaGraphUrl(`act_${normalizedId}`));
  url.searchParams.set(
    "fields",
    "id,account_id,name,account_status,disable_reason,currency,business_name,funding_source_details",
  );
  url.searchParams.set("access_token", accessToken);
  return fetchMetaJson<MetaAdAccount>(url.toString());
}

export async function mapMetaAssets(accessToken: string) {
  return Promise.all([fetchMetaAdAccounts(accessToken), fetchMetaPages(accessToken)]);
}

export async function createMetaCampaign({
  accessToken,
  adAccountId,
  payload,
}: {
  accessToken: string;
  adAccountId: string;
  payload: Record<string, string>;
}) {
  const normalizedId = adAccountId.replace(/^act_/, "");
  const url = new URL(buildMetaGraphUrl(`act_${normalizedId}/campaigns`));
  const body = new URLSearchParams({
    ...payload,
    access_token: accessToken,
  });

  return fetchMetaJson<{ id?: string }>(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function createMetaAdSet({
  accessToken,
  adAccountId,
  payload,
}: {
  accessToken: string;
  adAccountId: string;
  payload: Record<string, string>;
}) {
  const normalizedId = adAccountId.replace(/^act_/, "");
  const url = new URL(buildMetaGraphUrl(`act_${normalizedId}/adsets`));
  const body = new URLSearchParams({
    ...payload,
    access_token: accessToken,
  });

  return fetchMetaJson<{ id?: string }>(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function createMetaAdCreative({
  accessToken,
  adAccountId,
  payload,
}: {
  accessToken: string;
  adAccountId: string;
  payload: Record<string, string>;
}) {
  const normalizedId = adAccountId.replace(/^act_/, "");
  const url = new URL(buildMetaGraphUrl(`act_${normalizedId}/adcreatives`));
  const body = new URLSearchParams({
    ...payload,
    access_token: accessToken,
  });

  return fetchMetaJson<{ id?: string }>(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function createMetaAd({
  accessToken,
  adAccountId,
  payload,
}: {
  accessToken: string;
  adAccountId: string;
  payload: Record<string, string>;
}) {
  const normalizedId = adAccountId.replace(/^act_/, "");
  const url = new URL(buildMetaGraphUrl(`act_${normalizedId}/ads`));
  const body = new URLSearchParams({
    ...payload,
    access_token: accessToken,
  });

  return fetchMetaJson<{ id?: string }>(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function updateMetaObjectStatus({
  accessToken,
  objectId,
  status,
}: {
  accessToken: string;
  objectId: string;
  status: "ACTIVE" | "PAUSED";
}) {
  const url = new URL(buildMetaGraphUrl(objectId));
  const body = new URLSearchParams({
    status,
    access_token: accessToken,
  });
  return fetchMetaJson<{ success?: boolean }>(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}
