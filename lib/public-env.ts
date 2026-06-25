function readPublicValue(value: string | undefined) {
  if (!value) return undefined;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

const nextPublicAppUrl = readPublicValue(process.env.NEXT_PUBLIC_APP_URL);
const nextPublicDemoMode = readPublicValue(process.env.NEXT_PUBLIC_DEMO_MODE);
const nextPublicSupabaseUrl = readPublicValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const nextPublicSupabaseAnonKey = readPublicValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const publicEnv = {
  appUrl: nextPublicAppUrl || "https://sidekickstudioss.com",
  demoMode: nextPublicDemoMode,
  supabaseUrl: nextPublicSupabaseUrl,
  supabaseAnonKey: nextPublicSupabaseAnonKey,
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

export function isSupabasePublicConfigured() {
  return getSupabasePublicEnvStatus().configured;
}
