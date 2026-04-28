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
  appUrl: readEnv("NEXT_PUBLIC_APP_URL") || "https://sidekickstudioss.com",
  demoMode: readEnv("NEXT_PUBLIC_DEMO_MODE") || readEnv("DEMO_MODE"),
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: readEnv("SUPABASE_STORAGE_BUCKET") || "assets",
  resendApiKey: readEnv("RESEND_API_KEY"),
  resendFromEmail: readEnv("RESEND_FROM_EMAIL"),
  metaAppId: readEnv("META_APP_ID"),
  metaAppSecret: readEnv("META_APP_SECRET"),
  metaRedirectUri: readEnv("META_REDIRECT_URI"),
  metaScopes: readEnv("META_SCOPES"),
  metaGraphApiVersion: readEnv("META_GRAPH_API_VERSION") || "v25.0",
  metaTokenEncryptionKey: readEnv("META_TOKEN_ENCRYPTION_KEY"),
} as const;

export function getSupabasePublicEnvStatus() {
  const missingKeys = missing([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]);

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getSupabaseServerEnvStatus() {
  const missingKeys = missing([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);

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
