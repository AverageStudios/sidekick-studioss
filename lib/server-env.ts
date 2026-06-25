import "server-only";

import {
  getSupabasePublicEnvStatus,
  isSupabasePublicConfigured,
  publicEnv,
} from "@/lib/public-env";

export { getSupabasePublicEnvStatus, isSupabasePublicConfigured };

function readEnv(name: string) {
  const value = process.env[name];
  if (!value) return undefined;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function missing(keys: string[]) {
  return keys.filter((key) => !readEnv(key));
}

export const env = {
  ...publicEnv,
  demoMode: publicEnv.demoMode || readEnv("DEMO_MODE"),
  supabaseServiceKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: readEnv("SUPABASE_STORAGE_BUCKET") || "assets",
  resendApiKey: readEnv("RESEND_API_KEY"),
  resendFromEmail: readEnv("RESEND_FROM_EMAIL"),
  doneForYouNotifyEmail: readEnv("DONE_FOR_YOU_NOTIFY_EMAIL") || "contact@sidekickstudioss.net",
  clientInviteFromEmail: readEnv("CLIENT_INVITE_FROM_EMAIL"),
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  stripePriceId: readEnv("STRIPE_PRICE_ID"),
  metaAppId: readEnv("META_APP_ID"),
  metaAppSecret: readEnv("META_APP_SECRET"),
  metaRedirectUri: readEnv("META_REDIRECT_URI"),
  metaScopes: readEnv("META_SCOPES"),
  metaWebhookVerifyToken: readEnv("META_WEBHOOK_VERIFY_TOKEN"),
  metaGraphApiVersion: readEnv("META_GRAPH_API_VERSION") || "v25.0",
  metaTokenEncryptionKey: readEnv("META_TOKEN_ENCRYPTION_KEY"),
  crmTokenEncryptionKey: readEnv("CRM_TOKEN_ENCRYPTION_KEY"),
  crmProviderDebug: readEnv("CRM_PROVIDER_DEBUG"),
  crmOAuthRedirectUri: readEnv("CRM_OAUTH_REDIRECT_URI") || readEnv("GHL_REDIRECT_URI"),
  ghlClientId: readEnv("GHL_CLIENT_ID"),
  ghlClientSecret: readEnv("GHL_CLIENT_SECRET"),
  ghlInstallUrl: readEnv("GHL_INSTALL_URL"),
  pipedriveClientId: readEnv("PIPEDRIVE_CLIENT_ID"),
  pipedriveClientSecret: readEnv("PIPEDRIVE_CLIENT_SECRET"),
  pipedriveRedirectUri: readEnv("PIPEDRIVE_REDIRECT_URI"),
  hubspotClientId: readEnv("HUBSPOT_CLIENT_ID"),
  hubspotClientSecret: readEnv("HUBSPOT_CLIENT_SECRET"),
  hubspotRedirectUri: readEnv("HUBSPOT_REDIRECT_URI"),
  hubspotScopes: readEnv("HUBSPOT_SCOPES"),
  zohoClientId: readEnv("ZOHO_CLIENT_ID"),
  zohoClientSecret: readEnv("ZOHO_CLIENT_SECRET"),
  zohoRedirectUri: readEnv("ZOHO_REDIRECT_URI"),
  zohoAccountsUrl: readEnv("ZOHO_ACCOUNTS_URL") || "https://accounts.zoho.com",
  zohoScopes: readEnv("ZOHO_SCOPES"),
  freshsalesClientId: readEnv("FRESHSALES_CLIENT_ID"),
  freshsalesClientSecret: readEnv("FRESHSALES_CLIENT_SECRET"),
  freshsalesRedirectUri: readEnv("FRESHSALES_REDIRECT_URI"),
  freshsalesScopes: readEnv("FRESHSALES_SCOPES"),
  freshsalesAuthBaseUrl: readEnv("FRESHSALES_AUTH_BASE_URL"),
  freshsalesApiBaseUrl: readEnv("FRESHSALES_API_BASE_URL"),
  mondayClientId: readEnv("MONDAY_CLIENT_ID"),
  mondayClientSecret: readEnv("MONDAY_CLIENT_SECRET"),
  mondayRedirectUri: readEnv("MONDAY_REDIRECT_URI"),
  mondayScopes: readEnv("MONDAY_SCOPES"),
  keapClientId: readEnv("KEAP_CLIENT_ID"),
  keapClientSecret: readEnv("KEAP_CLIENT_SECRET"),
  keapRedirectUri: readEnv("KEAP_REDIRECT_URI"),
  keapScopes: readEnv("KEAP_SCOPES"),
  salesforceClientId: readEnv("SALESFORCE_CLIENT_ID"),
  salesforceClientSecret: readEnv("SALESFORCE_CLIENT_SECRET"),
  salesforceRedirectUri: readEnv("SALESFORCE_REDIRECT_URI"),
  salesforceScopes: readEnv("SALESFORCE_SCOPES") || "api refresh_token",
  salesforceLoginUrl: readEnv("SALESFORCE_LOGIN_URL") || "https://login.salesforce.com",
  salesforceApiVersion: readEnv("SALESFORCE_API_VERSION") || "v61.0",
  closeClientId: readEnv("CLOSE_CLIENT_ID"),
  closeClientSecret: readEnv("CLOSE_CLIENT_SECRET"),
  closeRedirectUri: readEnv("CLOSE_REDIRECT_URI"),
  closeScopes: readEnv("CLOSE_SCOPES") || "all.full_access offline_access",
} as const;

export function getSupabaseServerEnvStatus() {
  const publicStatus = getSupabasePublicEnvStatus();
  const missingKeys = [
    ...publicStatus.missingKeys,
    !readEnv("SUPABASE_SERVICE_ROLE_KEY") ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter((key): key is string => Boolean(key));

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getResendEnvStatus() {
  const missingKeys = missing(["RESEND_API_KEY", "RESEND_FROM_EMAIL"]);

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getStripeEnvStatus() {
  const missingKeys = missing(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID"]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getMetaEnvStatus() {
  const missingKeys = missing(["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getGhlEnvStatus() {
  const missingKeys = missing(["GHL_CLIENT_ID", "GHL_CLIENT_SECRET", "CRM_OAUTH_REDIRECT_URI", "GHL_INSTALL_URL"]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getPipedriveEnvStatus() {
  const missingKeys = missing(["PIPEDRIVE_CLIENT_ID", "PIPEDRIVE_CLIENT_SECRET", "PIPEDRIVE_REDIRECT_URI"]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getHubSpotEnvStatus() {
  const missingKeys = missing(["HUBSPOT_CLIENT_ID", "HUBSPOT_CLIENT_SECRET", "HUBSPOT_REDIRECT_URI", "HUBSPOT_SCOPES"]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getZohoEnvStatus() {
  const missingKeys = missing(["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REDIRECT_URI", "ZOHO_ACCOUNTS_URL", "ZOHO_SCOPES"]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getFreshsalesEnvStatus() {
  const missingKeys = missing([
    "FRESHSALES_CLIENT_ID",
    "FRESHSALES_CLIENT_SECRET",
    "FRESHSALES_REDIRECT_URI",
    "FRESHSALES_SCOPES",
    "FRESHSALES_AUTH_BASE_URL",
    "FRESHSALES_API_BASE_URL",
  ]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getMondayEnvStatus() {
  const missingKeys = missing([
    "MONDAY_CLIENT_ID",
    "MONDAY_CLIENT_SECRET",
    "MONDAY_REDIRECT_URI",
    "MONDAY_SCOPES",
  ]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getKeapEnvStatus() {
  const missingKeys = missing([
    "KEAP_CLIENT_ID",
    "KEAP_CLIENT_SECRET",
    "KEAP_REDIRECT_URI",
    "KEAP_SCOPES",
  ]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getSalesforceEnvStatus() {
  const missingKeys = missing([
    "SALESFORCE_CLIENT_ID",
    "SALESFORCE_CLIENT_SECRET",
    "SALESFORCE_REDIRECT_URI",
  ]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getCloseEnvStatus() {
  const missingKeys = missing([
    "CLOSE_CLIENT_ID",
    "CLOSE_CLIENT_SECRET",
    "CLOSE_REDIRECT_URI",
  ]);
  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function isSupabaseServerConfigured() {
  return getSupabaseServerEnvStatus().configured;
}

export function isSupabaseConfigured() {
  return isSupabaseServerConfigured();
}

export function isDemoModeEnabled() {
  const value = env.demoMode?.toLowerCase();
  return value === "1" || value === "true";
}

export function isResendConfigured() {
  return getResendEnvStatus().configured;
}

export function isStripeConfigured() {
  return getStripeEnvStatus().configured;
}

export function isMetaConfigured() {
  return getMetaEnvStatus().configured;
}

export function isGhlConfigured() {
  return getGhlEnvStatus().configured;
}

export function isPipedriveConfigured() {
  return getPipedriveEnvStatus().configured;
}

export function isHubSpotConfigured() {
  return getHubSpotEnvStatus().configured;
}

export function isZohoConfigured() {
  return getZohoEnvStatus().configured;
}

export function isFreshsalesConfigured() {
  return getFreshsalesEnvStatus().configured;
}

export function isMondayConfigured() {
  return getMondayEnvStatus().configured;
}

export function isKeapConfigured() {
  return getKeapEnvStatus().configured;
}

export function isSalesforceConfigured() {
  return getSalesforceEnvStatus().configured;
}

export function isCloseConfigured() {
  return getCloseEnvStatus().configured;
}

export function isCrmProviderDebugEnabled() {
  const value = env.crmProviderDebug?.toLowerCase();
  return value === "1" || value === "true";
}

export function getSupabaseFallbackMessage() {
  const publicStatus = getSupabasePublicEnvStatus();
  const serverStatus = getSupabaseServerEnvStatus();

  if (serverStatus.configured) {
    return null;
  }

  if (!publicStatus.configured) {
    return isDemoModeEnabled()
      ? "Supabase public env vars are missing, so the app is running in explicit demo mode."
      : "Supabase public env vars are missing, so real sign-in is unavailable until auth is configured.";
  }

  return isDemoModeEnabled()
    ? "Supabase service-role env vars are missing, so explicit demo mode can still render but database writes and storage uploads are disabled."
    : "Supabase service-role env vars are missing, so database writes and storage uploads are disabled until the server key is configured.";
}

export function getResendFallbackMessage() {
  if (isResendConfigured()) {
    return null;
  }

  return "Resend is not configured yet, so confirmation emails are skipped safely.";
}
