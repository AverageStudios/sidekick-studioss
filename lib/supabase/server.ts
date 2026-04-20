import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, isSupabasePublicConfigured } from "@/lib/env";

export async function createSupabaseServerClient() {
  if (!isSupabasePublicConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Components, Next exposes a read-only cookie store.
        // Supabase may still attempt to refresh auth cookies there, so we
        // swallow write failures and let mutable contexts (route handlers,
        // server actions) persist cookies when available.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // No-op in read-only render contexts.
        }
      },
    },
  });
}
