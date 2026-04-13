"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabasePublicConfigured } from "@/lib/env";

export function createSupabaseBrowserClient() {
  if (!isSupabasePublicConfigured()) {
    return null;
  }

  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}
