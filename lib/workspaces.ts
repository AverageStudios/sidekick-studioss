import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { demoUser } from "@/lib/demo-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDemoModeEnabled, isSupabaseServerConfigured } from "@/lib/env";
import { getCurrentUser, getUserAvatarUrl } from "@/lib/auth";
import { BusinessProfile, ProfileRecord, WorkspaceContext, WorkspaceMember, WorkspaceRecord, WorkspaceSummary } from "@/types";

const WORKSPACE_PROFILE_META_PREFIX = "<!--sidekick-workspace-meta:";
const WORKSPACE_PROFILE_META_SUFFIX = "-->";

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function prettifyEmailPrefix(email: string | undefined) {
  if (!email) return "";
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => capitalize(part))
    .join(" ");
}

type UserIdentityLike = {
  id: string;
  email?: string | null;
  user_metadata?: User["user_metadata"];
};

function deriveNameParts(user: Pick<UserIdentityLike, "email" | "user_metadata">, profile?: Partial<ProfileRecord> | null) {
  const rawMeta = (user.user_metadata || {}) as Record<string, unknown>;
  const metadataFirst = typeof rawMeta.first_name === "string" ? rawMeta.first_name.trim() : "";
  const metadataLast = typeof rawMeta.last_name === "string" ? rawMeta.last_name.trim() : "";
  const metadataFull =
    typeof rawMeta.full_name === "string"
      ? rawMeta.full_name.trim()
      : typeof rawMeta.name === "string"
        ? rawMeta.name.trim()
        : "";

  const fallbackFull = prettifyEmailPrefix(user.email || undefined);
  const profileFirst = profile?.first_name?.trim() || "";
  const profileLast = profile?.last_name?.trim() || "";
  const explicitName = [profileFirst || metadataFirst, profileLast || metadataLast].filter(Boolean).join(" ").trim();
  const fullName = explicitName || metadataFull || fallbackFull;
  const firstName = profileFirst || metadataFirst || fullName.split(" ")[0] || "";
  const lastName = profileLast || metadataLast || fullName.split(" ").slice(1).join(" ").trim() || "";

  return {
    firstName: firstName || null,
    lastName: lastName || null,
    displayName: fullName || (user.email ? user.email : "Workspace member"),
  };
}

export function getUserDisplayNameFromProfile(
  profile: Partial<ProfileRecord> | null,
  user: Pick<UserIdentityLike, "email" | "user_metadata">,
) {
  return deriveNameParts(user, profile).displayName;
}

export function getUserInitialsFromProfile(profile: Partial<ProfileRecord> | null, user: Pick<UserIdentityLike, "email" | "user_metadata">) {
  const { firstName, lastName, displayName } = deriveNameParts(user, profile);
  const parts = [firstName, lastName].filter(Boolean) as string[];

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  if (displayName) {
    const words = displayName.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return displayName.slice(0, 1).toUpperCase();
  }

  return "U";
}

function getWorkspaceInitial(name?: string | null) {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "W";
}

function buildWorkspaceName(displayName?: string | null, existingCount = 0) {
  const normalizedDisplayName = normalizeWorkspaceLabel(displayName);
  const base = normalizedDisplayName ? `${normalizedDisplayName} Workspace` : "My Workspace";
  return existingCount > 0 ? `${base} (${existingCount + 1})` : base;
}

function buildWorkspaceFallbackName(userDisplayName?: string | null) {
  const trimmed = (userDisplayName || "").trim();
  if (!trimmed) return "New Workspace";
  return `${trimmed} Workspace`;
}

function normalizeWorkspaceLabel(value?: string | null) {
  return (value || "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function makeUniqueWorkspaceName(baseName: string, existingNames: string[]) {
  const normalizedBase = normalizeWorkspaceLabel(baseName) || "New Workspace";
  const taken = new Set(existingNames.map((name) => name.trim().toLowerCase()).filter(Boolean));
  if (!taken.has(normalizedBase.toLowerCase())) {
    return normalizedBase;
  }

  let counter = 2;
  while (taken.has(`${normalizedBase} (${counter})`.toLowerCase())) {
    counter += 1;
  }

  return `${normalizedBase} (${counter})`;
}

export function getWorkspaceDisplayName(name?: string | null, displayName?: string | null) {
  return isGenericWorkspaceName(name) ? buildWorkspaceName(displayName) : (name || buildWorkspaceName(displayName));
}

function isGenericWorkspaceName(value?: string | null) {
  const normalized = (value || "").trim().toLowerCase();
  return normalized === "" || normalized === "my workspace";
}

function isMissingColumnError(error: { message?: string | null } | null | undefined, tableName: string, columnName: string) {
  const message = error?.message || "";
  return (
    message.includes(`column ${tableName}.${columnName} does not exist`) ||
    message.includes(`Could not find the '${columnName}' column of '${tableName}' in the schema cache`) ||
    (message.includes(tableName) && message.includes(columnName) && message.includes("schema cache"))
  );
}

function splitBusinessProfileDescription(value?: string | null) {
  const description = value || "";
  const start = description.indexOf(WORKSPACE_PROFILE_META_PREFIX);

  if (start === -1) {
    return {
      description: description.trim(),
      metadata: {} as { website?: string; industry?: string; privacy_policy_url?: string },
    };
  }

  const end = description.indexOf(WORKSPACE_PROFILE_META_SUFFIX, start);
  if (end === -1) {
    return {
      description: description.trim(),
      metadata: {} as { website?: string; industry?: string; privacy_policy_url?: string },
    };
  }

  const visibleDescription = `${description.slice(0, start)}${description.slice(end + WORKSPACE_PROFILE_META_SUFFIX.length)}`.trim();
  const rawPayload = description.slice(start + WORKSPACE_PROFILE_META_PREFIX.length, end);

  try {
    const parsed = JSON.parse(rawPayload) as { website?: string; industry?: string; privacy_policy_url?: string };
    return {
      description: visibleDescription,
      metadata: parsed || {},
    };
  } catch {
    return {
      description: visibleDescription,
      metadata: {} as { website?: string; industry?: string; privacy_policy_url?: string },
    };
  }
}

function mergeBusinessProfileDescription(
  description: string | null | undefined,
  metadata: {
    website?: string | null;
    industry?: string | null;
    privacy_policy_url?: string | null;
  },
) {
  const stripped = splitBusinessProfileDescription(description).description;
  const normalizedMetadata = {
    website: normalizeWorkspaceLabel(metadata.website) || "",
    industry: normalizeWorkspaceLabel(metadata.industry) || "",
    privacy_policy_url: normalizeWorkspaceLabel(metadata.privacy_policy_url) || "",
  };
  return `${stripped}${stripped ? "\n\n" : ""}${WORKSPACE_PROFILE_META_PREFIX}${JSON.stringify(normalizedMetadata)}${WORKSPACE_PROFILE_META_SUFFIX}`;
}

function normalizeBusinessProfileRecord(
  record:
    | (Partial<BusinessProfile> & {
        id?: string | null;
        user_id?: string | null;
        workspace_id?: string | null;
        business_name?: string | null;
        location?: string | null;
        phone?: string | null;
        email?: string | null;
        description?: string | null;
        logo_url?: string | null;
        brand_color?: string | null;
        default_cta?: string | null;
      })
    | null
    | undefined,
): BusinessProfile | null {
  if (!record?.workspace_id) return null;

  const parsedDescription = splitBusinessProfileDescription(record.description);

  return {
    id: record.id || `workspace-profile-${record.workspace_id}`,
    user_id: record.user_id || "",
    workspace_id: record.workspace_id,
    business_name: record.business_name || "",
    website: record.website ?? parsedDescription.metadata.website ?? null,
    industry: record.industry ?? parsedDescription.metadata.industry ?? null,
    privacy_policy_url: record.privacy_policy_url ?? parsedDescription.metadata.privacy_policy_url ?? null,
    location: record.location || "",
    phone: record.phone || "",
    email: record.email || "",
    description: parsedDescription.description,
    logo_url: record.logo_url || null,
    brand_color: record.brand_color || null,
    default_cta: record.default_cta || null,
  };
}

async function fetchWorkspaceBusinessProfiles(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceIds: string[],
) {
  if (!workspaceIds.length) return new Map<string, BusinessProfile>();

  const fullResult = await admin
    .from("business_profiles")
    .select("id, user_id, workspace_id, business_name, website, industry, privacy_policy_url, location, phone, email, description, logo_url, brand_color, default_cta")
    .in("workspace_id", workspaceIds);

  const result =
    fullResult.error &&
    (isMissingColumnError(fullResult.error, "business_profiles", "website") ||
      isMissingColumnError(fullResult.error, "business_profiles", "industry") ||
      isMissingColumnError(fullResult.error, "business_profiles", "privacy_policy_url"))
      ? await admin
          .from("business_profiles")
          .select("id, user_id, workspace_id, business_name, location, phone, email, description, logo_url, brand_color, default_cta")
          .in("workspace_id", workspaceIds)
      : fullResult;

  if (result.error) {
    throw new Error(`Database error loading business profiles: ${result.error.message}`);
  }

  return new Map(
    ((result.data || []) as Array<Record<string, unknown>>)
      .map((entry) => normalizeBusinessProfileRecord(entry as Partial<BusinessProfile>))
      .filter(Boolean)
      .map((entry) => [entry!.workspace_id || "", entry!] as const),
  );
}

export async function getWorkspaceBusinessProfileById(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceId: string,
) {
  return (await fetchWorkspaceBusinessProfiles(admin, [workspaceId])).get(workspaceId) || null;
}

async function insertWorkspaceRecord(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: {
    name: string;
    owner_user_id: string;
  },
) {
  const fullResult = await admin
    .from("workspaces")
    .insert({
      name: payload.name,
      owner_user_id: payload.owner_user_id,
    })
    .select("*")
    .single();

  if (fullResult.error) {
    throw new Error(`Could not create workspace: ${fullResult.error.message}. Ensure all database migrations have been applied.`);
  }

  return fullResult.data as WorkspaceRecord | null;
}

export async function updateWorkspaceIdentityRecord(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceId: string,
  payload: {
    name: string;
  },
) {
  const fullResult = await admin
    .from("workspaces")
    .update({ name: payload.name })
    .eq("id", workspaceId);

  if (fullResult.error) {
    throw new Error(`Could not update workspace: ${fullResult.error.message}`);
  }
}

export async function upsertWorkspaceBusinessProfile(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: {
    user_id: string;
    workspace_id: string;
    business_name: string;
    website?: string | null;
    industry?: string | null;
    privacy_policy_url?: string | null;
    location?: string | null;
    phone?: string | null;
    email?: string | null;
    description?: string | null;
    logo_url?: string | null;
    brand_color?: string | null;
    default_cta?: string | null;
  },
) {
  const fullPayload = {
    user_id: payload.user_id,
    workspace_id: payload.workspace_id,
    business_name: payload.business_name,
    location: payload.location || "",
    phone: payload.phone || "",
    email: payload.email || "",
    description: mergeBusinessProfileDescription(payload.description || "", {
      website: payload.website,
      industry: payload.industry,
      privacy_policy_url: payload.privacy_policy_url,
    }),
    logo_url: payload.logo_url || null,
    brand_color: payload.brand_color || "#6D5EF8",
    default_cta: payload.default_cta || "Get My Quote",
  };

  const fullResult = await admin
    .from("business_profiles")
    .upsert(fullPayload, { onConflict: "workspace_id" })
    .select("*")
    .maybeSingle();

  const result =
    fullResult.error &&
    (isMissingColumnError(fullResult.error, "business_profiles", "website") ||
      isMissingColumnError(fullResult.error, "business_profiles", "industry") ||
      isMissingColumnError(fullResult.error, "business_profiles", "privacy_policy_url"))
      ? await admin
          .from("business_profiles")
          .upsert(
            {
              user_id: fullPayload.user_id,
              workspace_id: fullPayload.workspace_id,
              business_name: fullPayload.business_name,
              location: fullPayload.location,
              phone: fullPayload.phone,
              email: fullPayload.email,
              description: fullPayload.description,
              logo_url: fullPayload.logo_url,
              brand_color: fullPayload.brand_color,
              default_cta: fullPayload.default_cta,
            },
            { onConflict: "workspace_id" },
          )
          .select("*")
          .maybeSingle()
      : fullResult;

  if (result.error) {
    throw new Error(`Could not save business profile: ${result.error.message}`);
  }

  return normalizeBusinessProfileRecord((result.data || null) as Partial<BusinessProfile> | null);
}

function buildDemoWorkspaceContext(): WorkspaceContext {
  const now = new Date().toISOString();

  return {
    profile: {
      id: "profile-demo",
      user_id: demoUser.id,
      role: "user",
      first_name: "Demo",
      last_name: "User",
      selected_industry: "auto-detailing",
      starting_template_id: "tpl-full-detail",
      active_workspace_id: "workspace-demo",
      onboarding_completed_at: now,
      created_at: now,
      updated_at: now,
    },
    workspaces: [
      {
        id: "workspace-demo",
        name: "Demo Workspace",
        owner_user_id: demoUser.id,
        created_at: now,
        updated_at: now,
        role: "owner",
      },
    ],
    activeWorkspace: {
      id: "workspace-demo",
      name: "Demo Workspace",
      owner_user_id: demoUser.id,
      created_at: now,
      updated_at: now,
      role: "owner",
    },
    businessProfile: {
      id: "profile-demo",
      user_id: demoUser.id,
      workspace_id: "workspace-demo",
      business_name: "Demo Workspace",
      website: "",
      industry: "",
      privacy_policy_url: "",
      location: "",
      phone: "",
      email: demoUser.email,
      description: "",
      logo_url: null,
      brand_color: "#6D5EF8",
      default_cta: "Get My Quote",
    },
    userDisplayName: "Demo User",
    userEmail: demoUser.email,
    userInitials: "DU",
    workspaceInitial: "D",
  };
}

async function ensureWorkspaceContextResolved(user: UserIdentityLike): Promise<WorkspaceContext | null> {
  if (!isSupabaseServerConfigured()) {
    return isDemoModeEnabled() ? buildDemoWorkspaceContext() : null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data: rawProfile, error: profileSelectError } = await admin.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

  if (profileSelectError) {
    throw new Error(`Database error loading profile: ${profileSelectError.message}`);
  }

  let profile = rawProfile as ProfileRecord | null;

  if (!profile) {
    const inserted = await admin
      .from("profiles")
      .insert({ user_id: user.id, role: "user" })
      .select("*")
      .single();
    if (inserted.error) {
      throw new Error(`Could not create profile: ${inserted.error.message}`);
    }
    profile = inserted.data as ProfileRecord | null;
  }

  if (!profile) return null;

  const derivedNames = deriveNameParts(user, profile);
  if (derivedNames.firstName !== profile.first_name || derivedNames.lastName !== profile.last_name) {
    const updated = await admin
      .from("profiles")
      .update({
        first_name: derivedNames.firstName,
        last_name: derivedNames.lastName,
      })
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updated.data) {
      profile = updated.data as ProfileRecord;
    }
  }

  const membershipsResult = await admin
    .from("workspace_memberships")
    .select("role, workspace:workspaces(id, name, owner_user_id, created_at, updated_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (membershipsResult.error) {
    throw new Error(`Database error loading workspace memberships: ${membershipsResult.error.message}`);
  }

  let workspaces = ((membershipsResult.data || []) as Array<{
    role: WorkspaceSummary["role"];
    workspace: Array<{
      id: string;
      name: string;
      owner_user_id: string;
      created_at: string;
      updated_at: string;
    }> | {
      id: string;
      name: string;
      owner_user_id: string;
      created_at: string;
      updated_at: string;
    } | null;
  }>)
    .map((entry) => {
      const workspace = Array.isArray(entry.workspace) ? entry.workspace[0] : entry.workspace;
      return workspace ? { ...workspace, role: entry.role } : null;
    })
    .filter(Boolean) as WorkspaceSummary[];

  // Repair path: if memberships are out of sync, ensure owner workspaces are still visible
  // and backfill missing owner memberships.
  const ownerWorkspacesResult = await admin
    .from("workspaces")
    .select("id, name, owner_user_id, created_at, updated_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true });

  if (ownerWorkspacesResult.error) {
    throw new Error(`Database error loading owned workspaces: ${ownerWorkspacesResult.error.message}`);
  }

  const ownerWorkspaces = (ownerWorkspacesResult.data || []) as WorkspaceRecord[];
  for (const workspace of ownerWorkspaces) {
    if (!workspaces.some((item) => item.id === workspace.id)) {
      workspaces.push({ ...workspace, role: "owner" });
    }
  }

  if (ownerWorkspaces.length) {
    await Promise.all(
      ownerWorkspaces.map((workspace) =>
        admin.from("workspace_memberships").upsert(
          {
            workspace_id: workspace.id,
            user_id: user.id,
            role: "owner",
          },
          { onConflict: "workspace_id,user_id" },
        ),
      ),
    );
  }

  if (workspaces.length === 1 && workspaces[0]?.owner_user_id === user.id) {
    const preferredWorkspaceName = buildWorkspaceName(derivedNames.displayName);
    const currentWorkspace = workspaces[0];

    if (isGenericWorkspaceName(currentWorkspace.name) && currentWorkspace.name !== preferredWorkspaceName) {
      const workspaceUpdate = await admin
        .from("workspaces")
        .update({ name: preferredWorkspaceName })
        .eq("id", currentWorkspace.id)
        .eq("owner_user_id", user.id)
        .select("*")
        .single();

      if (workspaceUpdate.data) {
        workspaces = [{ ...(workspaceUpdate.data as WorkspaceRecord), role: currentWorkspace.role }];
      }

      await admin
        .from("business_profiles")
        .update({ business_name: preferredWorkspaceName })
        .eq("workspace_id", currentWorkspace.id)
        .in("business_name", ["", "My Workspace"]);
    }
  }

  if (!workspaces.length) {
    const workspaceName = buildWorkspaceName(derivedNames.displayName);
    const workspace = await insertWorkspaceRecord(admin, {
      name: workspaceName,
      owner_user_id: user.id,
    });
    if (!workspace) return null;

    await admin.from("workspace_memberships").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    await upsertWorkspaceBusinessProfile(admin, {
      user_id: user.id,
      workspace_id: workspace.id,
      business_name: workspaceName,
      website: "",
      industry: "",
      privacy_policy_url: "",
      location: "",
      phone: "",
      email: user.email || "",
      description: "",
      brand_color: "#6D5EF8",
      default_cta: "Get My Quote",
    });

    const updatedProfile = await admin
      .from("profiles")
      .update({ active_workspace_id: workspace.id })
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updatedProfile.data) {
      profile = updatedProfile.data as ProfileRecord;
    }

    workspaces = [{ ...workspace, role: "owner", business_name: workspaceName }];
  }

  const resolvedProfile = profile;
  if (!resolvedProfile) return null;

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === resolvedProfile.active_workspace_id) ||
    workspaces[0];

  if (!workspaces.some((workspace) => workspace.id === activeWorkspace.id)) {
    workspaces = [activeWorkspace, ...workspaces];
  }

  if (resolvedProfile.active_workspace_id !== activeWorkspace.id) {
    const updatedProfile = await admin
      .from("profiles")
      .update({ active_workspace_id: activeWorkspace.id })
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updatedProfile.data) {
      profile = updatedProfile.data as ProfileRecord;
    }
  }

  const businessProfileResult = await admin
    .from("business_profiles")
    .select("*")
    .eq("workspace_id", activeWorkspace.id)
    .maybeSingle();

  let businessProfile = normalizeBusinessProfileRecord((businessProfileResult.data || null) as Partial<BusinessProfile> | null);

  const workspaceIds = Array.from(new Set(workspaces.map((workspace) => workspace.id)));
  const workspaceBusinessProfilesById = await fetchWorkspaceBusinessProfiles(admin, workspaceIds);

  if (!businessProfile) {
    businessProfile = await upsertWorkspaceBusinessProfile(admin, {
      user_id: user.id,
      workspace_id: activeWorkspace.id,
      business_name: activeWorkspace.business_name || activeWorkspace.name,
      website: activeWorkspace.website || "",
      industry: activeWorkspace.industry || "",
      privacy_policy_url: "",
      location: "",
      phone: activeWorkspace.business_phone || "",
      email: activeWorkspace.business_email || user.email || "",
      description: "",
      brand_color: "#6D5EF8",
      default_cta: "Get My Quote",
    });
  }

  const resolvedNames = deriveNameParts(user, resolvedProfile);
  const resolvedWorkspaceName = getWorkspaceDisplayName(activeWorkspace.name, resolvedNames.displayName);

  return {
    profile: resolvedProfile,
    workspaces: workspaces.map((workspace) => ({
      ...workspace,
      business_name: workspaceBusinessProfilesById.get(workspace.id)?.business_name || workspace.business_name || workspace.name,
      website: workspaceBusinessProfilesById.get(workspace.id)?.website || workspace.website || null,
      industry: workspaceBusinessProfilesById.get(workspace.id)?.industry || workspace.industry || null,
      logo_url: workspaceBusinessProfilesById.get(workspace.id)?.logo_url || workspace.logo_url || null,
      name:
        workspace.owner_user_id === user.id
          ? getWorkspaceDisplayName(workspace.name, resolvedNames.displayName)
          : workspace.name,
    })),
    activeWorkspace: {
      ...activeWorkspace,
      business_name: businessProfile?.business_name || activeWorkspace.business_name || activeWorkspace.name,
      website: businessProfile?.website || activeWorkspace.website || null,
      industry: businessProfile?.industry || activeWorkspace.industry || null,
      logo_url: businessProfile?.logo_url || activeWorkspace.logo_url || null,
      name: resolvedWorkspaceName,
    },
    businessProfile,
    userDisplayName: resolvedNames.displayName,
    userEmail: user.email || "",
    userInitials: getUserInitialsFromProfile(resolvedProfile, user),
    workspaceInitial: getWorkspaceInitial(resolvedWorkspaceName),
  };
}

export async function ensureWorkspaceContextForUser(user: UserIdentityLike) {
  return ensureWorkspaceContextResolved(user);
}

export const ensureWorkspaceContextByUserId = cache(async (userId: string) => {
  if (!isSupabaseServerConfigured()) {
    if (!isDemoModeEnabled()) {
      return null;
    }

    return ensureWorkspaceContextResolved({
      id: demoUser.id,
      email: demoUser.email,
      user_metadata: {},
    } as Pick<User, "id" | "email" | "user_metadata">);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const authUser = await admin.auth.admin.getUserById(userId);
  const user = authUser.data.user;

  if (!user) return null;
  try {
    return await ensureWorkspaceContextResolved(user);
  } catch {
    return null;
  }
});

export const getCurrentWorkspaceContext = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    return await ensureWorkspaceContextResolved(user);
  } catch (err) {
    console.error("[workspace] Failed to resolve context:", err instanceof Error ? err.message : err);
    return null;
  }
});

export const getActiveWorkspaceIdForUser = cache(async (userId: string) => {
  const context = await ensureWorkspaceContextByUserId(userId);
  return context?.activeWorkspace.id || null;
});

export async function userHasWorkspaceAccess(userId: string, workspaceId: string | null | undefined) {
  if (!workspaceId || !isSupabaseServerConfigured()) return false;
  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const { data } = await admin
    .from("workspace_memberships")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data?.id);
}

export async function createWorkspaceForUser(
  user: UserIdentityLike,
  input?: {
    workspaceName?: string | null;
    businessName?: string | null;
    businessEmail?: string | null;
    businessPhone?: string | null;
    website?: string | null;
    industry?: string | null;
    privacyPolicyUrl?: string | null;
  } | null,
) {
  if (!isSupabaseServerConfigured()) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const context = await ensureWorkspaceContextResolved(user);
  if (!context) return null;

  const requestedWorkspaceName = normalizeWorkspaceLabel(input?.workspaceName);
  const businessName = normalizeWorkspaceLabel(input?.businessName);
  const derivedWorkspaceName =
    requestedWorkspaceName ||
    businessName ||
    buildWorkspaceFallbackName(context.userDisplayName || context.profile.first_name);
  const workspaceName = makeUniqueWorkspaceName(
    derivedWorkspaceName,
    context.workspaces.map((workspace) => workspace.name),
  );
  const normalizedBusinessName = businessName || workspaceName;
  const businessEmail = normalizeWorkspaceLabel(input?.businessEmail) || user.email || "";
  const businessPhone = normalizeWorkspaceLabel(input?.businessPhone) || "";
  const website = normalizeWorkspaceLabel(input?.website) || "";
  const industry = normalizeWorkspaceLabel(input?.industry) || "";
  const privacyPolicyUrl = normalizeWorkspaceLabel(input?.privacyPolicyUrl) || "";
  const workspace = await insertWorkspaceRecord(admin, {
    name: workspaceName,
    owner_user_id: user.id,
  });
  if (!workspace) return null;

  await admin.from("workspace_memberships").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  await upsertWorkspaceBusinessProfile(admin, {
    user_id: user.id,
    workspace_id: workspace.id,
    business_name: normalizedBusinessName,
    website,
    industry,
    privacy_policy_url: privacyPolicyUrl,
    location: "",
    phone: businessPhone,
    email: businessEmail,
    description: "",
    brand_color: "#6D5EF8",
    default_cta: "Get My Quote",
  });

  await admin.from("profiles").update({ active_workspace_id: workspace.id }).eq("user_id", user.id);

  return {
    ...workspace,
    business_name: normalizedBusinessName,
    business_email: businessEmail,
    business_phone: businessPhone,
    website,
    industry,
  };
}

export async function getCurrentWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const context = await getCurrentWorkspaceContext();

  if (!context) return [];

  if (!isSupabaseServerConfigured()) {
    return isDemoModeEnabled()
      ? [
          {
            membershipId: "membership-demo",
            userId: demoUser.id,
            role: "owner",
            displayName: context.userDisplayName,
            email: context.userEmail,
            initials: context.userInitials,
            avatarUrl: getUserAvatarUrl(context.profile, demoUser),
            isCurrentUser: true,
          },
        ]
      : [];
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const membershipsResult = await admin
    .from("workspace_memberships")
    .select("id, user_id, role")
    .eq("workspace_id", context.activeWorkspace.id)
    .order("created_at", { ascending: true });

  const memberships = (membershipsResult.data || []) as Array<{
    id: string;
    user_id: string;
    role: WorkspaceMember["role"];
  }>;

  const members = await Promise.all(
    memberships.map(async (membership) => {
      const [profileResult, authUserResult] = await Promise.all([
        admin.from("profiles").select("*").eq("user_id", membership.user_id).maybeSingle(),
        admin.auth.admin.getUserById(membership.user_id),
      ]);

      const profile = (profileResult.data as ProfileRecord | null) || null;
      const authUser = authUserResult.data.user;
      const displayName = authUser
        ? deriveNameParts(authUser, profile).displayName
        : [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || "Workspace member";
      const email = authUser?.email || "";
      const initials = authUser ? getUserInitialsFromProfile(profile, authUser) : displayName.slice(0, 2).toUpperCase();
      const avatarUrl = authUser ? getUserAvatarUrl(profile, authUser) : null;

      return {
        membershipId: membership.id,
        userId: membership.user_id,
        role: membership.role,
        displayName,
        email,
        initials,
        avatarUrl,
        isCurrentUser: membership.user_id === context.profile.user_id,
      } satisfies WorkspaceMember;
    }),
  );

  return members;
}
