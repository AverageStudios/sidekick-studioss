function readEnv(name: string) {
  const value = process.env[name];
  if (!value) return undefined;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function missing(keys: string[]) {
  return keys.filter((key) => !readEnv(key));
}

function readValue(value: string | undefined) {
  if (!value) return undefined;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

const nextPublicAppUrl = readValue(process.env.NEXT_PUBLIC_APP_URL);
const nextPublicDemoMode = readValue(process.env.NEXT_PUBLIC_DEMO_MODE);
const nextPublicSupabaseUrl = readValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const nextPublicSupabaseAnonKey = readValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const env = {
  appUrl: nextPublicAppUrl || "https://sidekickstudioss.com",
  demoMode: nextPublicDemoMode || readEnv("DEMO_MODE"),
  supabaseUrl: nextPublicSupabaseUrl,
  supabaseAnonKey: nextPublicSupabaseAnonKey,
  supabaseServiceKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: readEnv("SUPABASE_STORAGE_BUCKET") || "assets",
  resendApiKey: readEnv("RESEND_API_KEY"),
  resendFromEmail: readEnv("RESEND_FROM_EMAIL"),
  metaAppId: readEnv("META_APP_ID"),
  metaAppSecret: readEnv("META_APP_SECRET"),
  metaRedirectUri: readEnv("META_REDIRECT_URI"),
  metaScopes: readEnv("META_SCOPES"),
  metaWebhookVerifyToken: readEnv("META_WEBHOOK_VERIFY_TOKEN"),
  metaGraphApiVersion: readEnv("META_GRAPH_API_VERSION") || "v25.0",
  metaTokenEncryptionKey: readEnv("META_TOKEN_ENCRYPTION_KEY"),
  crmTokenEncryptionKey: readEnv("CRM_TOKEN_ENCRYPTION_KEY"),
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
} as const;

export function getSupabasePublicEnvStatus() {
  const missingKeys = [
    !nextPublicSupabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !nextPublicSupabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter((key): key is string => Boolean(key));

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getSupabaseServerEnvStatus() {
  const missingKeys = [
    !nextPublicSupabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !nextPublicSupabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
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

export function isSupabasePublicConfigured() {
  return getSupabasePublicEnvStatus().configured;
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
