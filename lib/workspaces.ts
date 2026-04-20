import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { demoUser } from "@/lib/demo-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { BusinessProfile, ProfileRecord, WorkspaceContext, WorkspaceMember, WorkspaceRecord, WorkspaceSummary } from "@/types";

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

function buildWorkspaceName(firstName?: string | null, existingCount = 0) {
  const base = firstName ? `${firstName}'s Workspace` : "My Workspace";
  return existingCount > 0 ? `${base} ${existingCount + 1}` : base;
}

export function getWorkspaceDisplayName(name?: string | null, firstName?: string | null) {
  return isGenericWorkspaceName(name) ? buildWorkspaceName(firstName) : (name || buildWorkspaceName(firstName));
}

function isGenericWorkspaceName(value?: string | null) {
  const normalized = (value || "").trim().toLowerCase();
  return normalized === "" || normalized === "my workspace";
}

async function ensureWorkspaceContextResolved(user: UserIdentityLike): Promise<WorkspaceContext | null> {
  if (!isSupabaseServerConfigured()) {
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
        onboarding_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      workspaces: [
        {
          id: "workspace-demo",
          name: "Demo Workspace",
          owner_user_id: demoUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: "owner",
        },
      ],
      activeWorkspace: {
        id: "workspace-demo",
        name: "Demo Workspace",
        owner_user_id: demoUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: "owner",
      },
      businessProfile: {
        id: "profile-demo",
        user_id: demoUser.id,
        workspace_id: "workspace-demo",
        business_name: "Demo Workspace",
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
    const preferredWorkspaceName = buildWorkspaceName(profile.first_name);
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
    const workspaceName = buildWorkspaceName(profile.first_name);
    const createdWorkspace = await admin
      .from("workspaces")
      .insert({
        name: workspaceName,
        owner_user_id: user.id,
      })
      .select("*")
      .single();

    if (createdWorkspace.error) {
      throw new Error(`Could not create workspace: ${createdWorkspace.error.message}. Ensure all database migrations have been applied.`);
    }

    const workspace = createdWorkspace.data as Omit<WorkspaceSummary, "role"> | null;
    if (!workspace) return null;

    await admin.from("workspace_memberships").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    await admin.from("business_profiles").upsert(
      {
        user_id: user.id,
        workspace_id: workspace.id,
        business_name: workspaceName,
        location: "",
        phone: "",
        email: user.email || "",
        description: "",
        brand_color: "#6D5EF8",
        default_cta: "Get My Quote",
      },
      { onConflict: "workspace_id" },
    );

    const updatedProfile = await admin
      .from("profiles")
      .update({ active_workspace_id: workspace.id })
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updatedProfile.data) {
      profile = updatedProfile.data as ProfileRecord;
    }

    workspaces = [{ ...workspace, role: "owner" }];
  }

  const resolvedProfile = profile;
  if (!resolvedProfile) return null;

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === resolvedProfile.active_workspace_id) ||
    workspaces[0];

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

  let businessProfile = (businessProfileResult.data as BusinessProfile | null) || null;

  if (!businessProfile) {
    const insertedBusinessProfile = await admin
      .from("business_profiles")
      .upsert(
        {
          user_id: user.id,
          workspace_id: activeWorkspace.id,
          business_name: activeWorkspace.name,
          location: "",
          phone: "",
          email: user.email || "",
          description: "",
          brand_color: "#6D5EF8",
          default_cta: "Get My Quote",
        },
        { onConflict: "workspace_id" },
      )
      .select("*")
      .single();

    businessProfile = (insertedBusinessProfile.data as BusinessProfile | null) || null;
  }

  const resolvedNames = deriveNameParts(user, resolvedProfile);
  const resolvedWorkspaceName = getWorkspaceDisplayName(activeWorkspace.name, resolvedProfile.first_name);

  return {
    profile: resolvedProfile,
    workspaces: workspaces.map((workspace) =>
      workspace.id === activeWorkspace.id
        ? { ...workspace, name: resolvedWorkspaceName }
        : workspace,
    ),
    activeWorkspace: {
      ...activeWorkspace,
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

export async function ensureWorkspaceContextByUserId(userId: string) {
  if (!isSupabaseServerConfigured()) {
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
}

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

export async function getActiveWorkspaceIdForUser(userId: string) {
  const context = await ensureWorkspaceContextByUserId(userId);
  return context?.activeWorkspace.id || null;
}

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
  requestedName?: string | null,
) {
  if (!isSupabaseServerConfigured()) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const context = await ensureWorkspaceContextResolved(user);
  if (!context) return null;

  const workspaceName = requestedName?.trim() || buildWorkspaceName(context.profile.first_name, context.workspaces.length);
  const createdWorkspace = await admin
    .from("workspaces")
    .insert({
      name: workspaceName,
      owner_user_id: user.id,
    })
    .select("*")
    .single();

  const workspace = createdWorkspace.data as WorkspaceSummary | null;
  if (!workspace) return null;

  await admin.from("workspace_memberships").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  await admin.from("business_profiles").upsert(
    {
      user_id: user.id,
      workspace_id: workspace.id,
      business_name: workspaceName,
      location: "",
      phone: "",
      email: user.email || "",
      description: "",
      brand_color: "#6D5EF8",
      default_cta: "Get My Quote",
    },
    { onConflict: "workspace_id" },
  );

  await admin.from("profiles").update({ active_workspace_id: workspace.id }).eq("user_id", user.id);

  return workspace;
}

export async function getCurrentWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const context = await getCurrentWorkspaceContext();

  if (!context) return [];

  if (!isSupabaseServerConfigured()) {
    return [
      {
        membershipId: "membership-demo",
        userId: demoUser.id,
        role: "owner",
        displayName: context.userDisplayName,
        email: context.userEmail,
        initials: context.userInitials,
        isCurrentUser: true,
      },
    ];
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

      return {
        membershipId: membership.id,
        userId: membership.user_id,
        role: membership.role,
        displayName,
        email,
        initials,
        isCurrentUser: membership.user_id === context.profile.user_id,
      } satisfies WorkspaceMember;
    }),
  );

  return members;
}
