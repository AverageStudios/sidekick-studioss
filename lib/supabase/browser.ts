"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, isSupabasePublicConfigured } from "@/lib/public-env";

export function createSupabaseBrowserClient() {
  if (!isSupabasePublicConfigured()) {
    return null;
  }

  return createBrowserClient(publicEnv.supabaseUrl!, publicEnv.supabaseAnonKey!);
}
