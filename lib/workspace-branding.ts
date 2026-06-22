import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WorkspaceBrandingRecord } from "@/types";

function normalizeBranding(row: Partial<WorkspaceBrandingRecord> | null | undefined): WorkspaceBrandingRecord | null {
  if (!row?.workspace_id) return null;
  const logoUrl = typeof row.logo_url === "string" ? row.logo_url.trim() : "";

  return {
    workspace_id: row.workspace_id,
    business_name: typeof row.business_name === "string" ? row.business_name : null,
    logo_url: logoUrl.startsWith("/") || /^https?:\/\//i.test(logoUrl) ? logoUrl : null,
    primary_color: typeof row.primary_color === "string" ? row.primary_color : null,
    accent_color: typeof row.accent_color === "string" ? row.accent_color : null,
    website_url: typeof row.website_url === "string" ? row.website_url : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

export const getWorkspaceBranding = cache(async (workspaceId: string) => {
  const admin = createSupabaseAdminClient();
  if (!admin || !workspaceId) {
    return null;
  }

  const { data, error } = await admin
    .from("workspace_branding")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    if (
      error.message.includes("workspace_branding") &&
      (error.message.includes("schema cache") || error.message.includes("does not exist"))
    ) {
      return null;
    }
    throw new Error(`Workspace branding could not be loaded: ${error.message}`);
  }

  return normalizeBranding((data || null) as Partial<WorkspaceBrandingRecord> | null);
});

export async function upsertWorkspaceBranding(input: {
  workspaceId: string;
  businessName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase admin access is not available.");
  }

  const { data, error } = await admin
    .from("workspace_branding")
    .upsert(
      {
        workspace_id: input.workspaceId,
        business_name: input.businessName || null,
        logo_url: input.logoUrl || null,
        primary_color: input.primaryColor || null,
        accent_color: input.accentColor || null,
        website_url: input.websiteUrl || null,
        phone: input.phone || null,
      },
      { onConflict: "workspace_id" },
    )
    .select("*")
    .single();

  if (error) {
    if (
      error.message.includes("workspace_branding") &&
      (error.message.includes("schema cache") || error.message.includes("does not exist"))
    ) {
      return null;
    }
    throw new Error(error.message);
  }

  return normalizeBranding(data as Partial<WorkspaceBrandingRecord>);
}
