import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { demoUser } from "@/lib/demo-data";
import { isSupabasePublicConfigured } from "@/lib/env";
import { ProfileRecord, UserRole } from "@/types";

export async function getCurrentUser() {
  if (!isSupabasePublicConfigured()) {
    return demoUser;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user || !isSupabasePublicConfigured()) {
    return {
      id: "profile-demo",
      user_id: user?.id || "demo-user",
      role: "user" as UserRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies ProfileRecord;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as ProfileRecord | null) || null;
});

export const getCurrentRole = cache(async (): Promise<UserRole> => {
  const profile = await getCurrentProfile();
  return profile?.role || "user";
});

export const isCurrentUserAdmin = cache(async () => {
  const role = await getCurrentRole();
  return role === "admin";
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}
