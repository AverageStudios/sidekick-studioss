import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseServerConfigured } from "@/lib/env";

export function createSupabaseAdminClient() {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
    auth: {
      persistSession: false,
    },
  });
}
