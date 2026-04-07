import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

export function createSupabaseAdminClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
    auth: {
      persistSession: false,
    },
  });
}

