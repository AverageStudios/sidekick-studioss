import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { demoUser } from "@/lib/demo-data";
import { isSupabasePublicConfigured, isSupabaseServerConfigured } from "@/lib/env";
import { ProfileRecord, UserRole } from "@/types";

type UserWithOptionalMetadata = {
  email?: string | null;
  user_metadata?: User["user_metadata"];
};

function deriveProfileNameFields(user: UserWithOptionalMetadata, profile?: Partial<ProfileRecord> | null) {
  const rawMeta = (user.user_metadata || {}) as Record<string, unknown>;
  const metadataFirst = typeof rawMeta.first_name === "string" ? rawMeta.first_name.trim() : "";
  const metadataLast = typeof rawMeta.last_name === "string" ? rawMeta.last_name.trim() : "";
  const profileFirst = profile?.first_name?.trim() || "";
  const profileLast = profile?.last_name?.trim() || "";

  return {
    first_name: profileFirst || metadataFirst || null,
    last_name: profileLast || metadataLast || null,
  };
}

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
      first_name: "Demo",
      last_name: "User",
      selected_industry: "auto-detailing",
      starting_template_id: "tpl-full-detail",
      active_workspace_id: "workspace-demo",
      onboarding_completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies ProfileRecord;
  }

  if (isSupabaseServerConfigured()) {
    const admin = createSupabaseAdminClient();

    if (admin) {
      const { data: rawProfile } = await admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const existingProfile = (rawProfile as ProfileRecord | null) || null;
      const derivedFields = deriveProfileNameFields(user, existingProfile);

      if (
        !existingProfile ||
        existingProfile.first_name !== derivedFields.first_name ||
        existingProfile.last_name !== derivedFields.last_name
      ) {
        const { data: upsertedProfile } = await admin
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              role: existingProfile?.role || "user",
              first_name: derivedFields.first_name,
              last_name: derivedFields.last_name,
            },
            { onConflict: "user_id" },
          )
          .select("*")
          .single();

        return (upsertedProfile as ProfileRecord | null) || existingProfile;
      }

      return existingProfile;
    }
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

export const isCurrentUserOnboarded = cache(async () => {
  const profile = await getCurrentProfile();
  return Boolean(profile?.onboarding_completed_at);
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const role = await getCurrentRole();

  if (role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}
