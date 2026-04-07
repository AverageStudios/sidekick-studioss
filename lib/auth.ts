import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { demoUser } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return demoUser;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

