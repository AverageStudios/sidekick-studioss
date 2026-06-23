import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ClientSubaccountRow = {
  workspace_id: string;
  tier: string;
  status: string;
  industry: string | null;
  service_area: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceRow = {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
};

type WorkspaceBrandingRow = {
  workspace_id: string;
  business_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  website_url: string | null;
  phone: string | null;
};

type BusinessProfileRow = {
  workspace_id: string;
  business_name: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
};

type MemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
  updated_at: string;
};

type ClientInviteRow = {
  id: string;
  email: string;
  user_id: string | null;
  workspace_id: string | null;
  role: "owner" | "admin" | "member";
  tier: "done_for_you";
  status: string;
  invite_type: "invite" | "recovery";
  created_at: string;
  accepted_at: string | null;
};

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
};

function isMissingTableError(message?: string | null, tableName?: string) {
  const value = message || "";
  return Boolean(
    tableName &&
      value.includes(tableName) &&
      (value.includes("schema cache") || value.includes("does not exist") || value.includes("relation")),
  );
}

export function isUuid(value: string | null | undefined) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
}

function displayNameFromProfile(profile?: ProfileRow | null, fallbackEmail?: string | null) {
  const explicit = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return profile?.display_name || explicit || fallbackEmail || "Invited user";
}

async function fetchBrandingByWorkspaceIds(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceIds: string[],
) {
  if (!workspaceIds.length) return new Map<string, WorkspaceBrandingRow>();

  const { data, error } = await admin
    .from("workspace_branding")
    .select("workspace_id, business_name, logo_url, primary_color, accent_color, website_url, phone")
    .in("workspace_id", workspaceIds);

  if (error && !isMissingTableError(error.message, "workspace_branding")) {
    throw new Error(error.message);
  }

  return new Map(((data || []) as WorkspaceBrandingRow[]).map((row) => [row.workspace_id, row]));
}

async function fetchBusinessProfilesByWorkspaceIds(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceIds: string[],
) {
  if (!workspaceIds.length) return new Map<string, BusinessProfileRow>();

  const { data, error } = await admin
    .from("business_profiles")
    .select("workspace_id, business_name, website, phone, email, logo_url")
    .in("workspace_id", workspaceIds);

  if (error) throw new Error(error.message);

  return new Map(((data || []) as BusinessProfileRow[]).map((row) => [row.workspace_id, row]));
}

async function fetchInviteRowsByWorkspaceIds(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  workspaceIds: string[],
) {
  if (!workspaceIds.length) return [] as ClientInviteRow[];

  const { data, error } = await admin
    .from("client_invites")
    .select("id, email, user_id, workspace_id, role, tier, status, invite_type, created_at, accepted_at")
    .in("workspace_id", workspaceIds);

  if (error) {
    if (isMissingTableError(error.message, "client_invites")) return [];
    throw new Error(error.message);
  }

  return (data || []) as ClientInviteRow[];
}

export type AdminClientListItem = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  businessName: string;
  logoUrl: string | null;
  tier: string;
  status: string;
  industry: string | null;
  serviceArea: string | null;
  websiteUrl: string | null;
  phone: string | null;
  memberCount: number;
  pendingInviteCount: number;
  createdAt: string;
};

export async function listAdminClients(): Promise<AdminClientListItem[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const { data: subaccounts, error } = await admin
    .from("client_subaccounts")
    .select("workspace_id, tier, status, industry, service_area, notes, created_by, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (isMissingTableError(error.message, "client_subaccounts")) return [];
    throw new Error(error.message);
  }

  const rows = (subaccounts || []) as ClientSubaccountRow[];
  const workspaceIds = rows.map((row) => row.workspace_id).filter(Boolean);

  const [workspacesResult, brandingMap, businessProfileMap, membersResult, inviteRows] = await Promise.all([
    workspaceIds.length
      ? admin.from("workspaces").select("id, name, owner_user_id, created_at, updated_at").in("id", workspaceIds)
      : Promise.resolve({ data: [], error: null }),
    fetchBrandingByWorkspaceIds(admin, workspaceIds),
    fetchBusinessProfilesByWorkspaceIds(admin, workspaceIds),
    workspaceIds.length
      ? admin.from("workspace_memberships").select("workspace_id").in("workspace_id", workspaceIds)
      : Promise.resolve({ data: [], error: null }),
    fetchInviteRowsByWorkspaceIds(admin, workspaceIds),
  ]);

  if (workspacesResult.error) throw new Error(workspacesResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

  const workspaceMap = new Map(((workspacesResult.data || []) as WorkspaceRow[]).map((workspace) => [workspace.id, workspace]));
  const memberCounts = new Map<string, number>();
  for (const member of (membersResult.data || []) as Array<{ workspace_id: string }>) {
    memberCounts.set(member.workspace_id, (memberCounts.get(member.workspace_id) || 0) + 1);
  }
  const pendingInviteCounts = new Map<string, number>();
  for (const invite of inviteRows) {
    if (invite.workspace_id && ["pending", "sent", "email_skipped", "email_failed"].includes(invite.status)) {
      pendingInviteCounts.set(invite.workspace_id, (pendingInviteCounts.get(invite.workspace_id) || 0) + 1);
    }
  }

  return rows.map((row) => {
    const workspace = workspaceMap.get(row.workspace_id) || null;
    const branding = brandingMap.get(row.workspace_id) || null;
    const businessProfile = businessProfileMap.get(row.workspace_id) || null;

    return {
      id: row.workspace_id,
      workspaceId: row.workspace_id,
      workspaceName: workspace?.name || "Subaccount pending",
      businessName: branding?.business_name || businessProfile?.business_name || workspace?.name || "Client account",
      logoUrl: branding?.logo_url || businessProfile?.logo_url || null,
      tier: row.tier,
      status: row.status,
      industry: row.industry,
      serviceArea: row.service_area,
      websiteUrl: branding?.website_url || businessProfile?.website || null,
      phone: branding?.phone || businessProfile?.phone || null,
      memberCount: memberCounts.get(row.workspace_id) || 0,
      pendingInviteCount: pendingInviteCounts.get(row.workspace_id) || 0,
      createdAt: row.created_at || workspace?.created_at || new Date().toISOString(),
    };
  });
}

export type AdminClientDetail = AdminClientListItem & {
  notes: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  ownerUserId: string | null;
  updatedAt: string | null;
};

export async function getAdminClient(workspaceId: string): Promise<AdminClientDetail | null> {
  const admin = createSupabaseAdminClient();
  if (!admin || !isUuid(workspaceId)) return null;

  const [workspaceResult, subaccountResult, brandingMap, businessProfileMap, membersResult, inviteRows] = await Promise.all([
    admin.from("workspaces").select("id, name, owner_user_id, created_at, updated_at").eq("id", workspaceId).maybeSingle(),
    admin
      .from("client_subaccounts")
      .select("workspace_id, tier, status, industry, service_area, notes, created_by, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    fetchBrandingByWorkspaceIds(admin, [workspaceId]),
    fetchBusinessProfilesByWorkspaceIds(admin, [workspaceId]),
    admin.from("workspace_memberships").select("workspace_id").eq("workspace_id", workspaceId),
    fetchInviteRowsByWorkspaceIds(admin, [workspaceId]),
  ]);

  if (workspaceResult.error) throw new Error(workspaceResult.error.message);
  if (subaccountResult.error && !isMissingTableError(subaccountResult.error.message, "client_subaccounts")) {
    throw new Error(subaccountResult.error.message);
  }
  if (membersResult.error) throw new Error(membersResult.error.message);
  if (!workspaceResult.data) return null;

  const workspace = workspaceResult.data as WorkspaceRow;
  const subaccount = (subaccountResult.data || null) as ClientSubaccountRow | null;
  const branding = brandingMap.get(workspaceId) || null;
  const businessProfile = businessProfileMap.get(workspaceId) || null;

  return {
    id: workspace.id,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    businessName: branding?.business_name || businessProfile?.business_name || workspace.name,
    logoUrl: branding?.logo_url || businessProfile?.logo_url || null,
    tier: subaccount?.tier || "done_for_you",
    status: subaccount?.status || "active",
    industry: subaccount?.industry || null,
    serviceArea: subaccount?.service_area || null,
    websiteUrl: branding?.website_url || businessProfile?.website || null,
    phone: branding?.phone || businessProfile?.phone || null,
    memberCount: ((membersResult.data || []) as Array<{ workspace_id: string }>).length,
    pendingInviteCount: inviteRows.filter((invite) => ["pending", "sent", "email_skipped", "email_failed"].includes(invite.status)).length,
    createdAt: subaccount?.created_at || workspace.created_at,
    notes: subaccount?.notes || null,
    primaryColor: branding?.primary_color || null,
    accentColor: branding?.accent_color || null,
    ownerUserId: workspace.owner_user_id,
    updatedAt: subaccount?.updated_at || workspace.updated_at || null,
  };
}

export type AdminClientUserItem = {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
  status: "active" | "pending" | "sent" | "email_skipped" | "email_failed" | "accepted" | "revoked" | "expired";
  inviteStatus: string | null;
  inviteId: string | null;
  inviteType: string | null;
  createdAt: string;
  acceptedAt: string | null;
};

export async function listAdminClientUsers(workspaceId: string): Promise<AdminClientUserItem[]> {
  const admin = createSupabaseAdminClient();
  if (!admin || !isUuid(workspaceId)) return [];

  const [membersResult, invites] = await Promise.all([
    admin.from("workspace_memberships").select("id, workspace_id, user_id, role, created_at, updated_at").eq("workspace_id", workspaceId),
    fetchInviteRowsByWorkspaceIds(admin, [workspaceId]),
  ]);

  if (membersResult.error) throw new Error(membersResult.error.message);

  const members = (membersResult.data || []) as MemberRow[];
  const userIds = Array.from(new Set(members.map((member) => member.user_id).filter(Boolean)));
  const { data: profiles, error: profilesError } = userIds.length
    ? await admin.from("profiles").select("user_id, first_name, last_name, display_name").in("user_id", userIds)
    : { data: [], error: null };

  if (profilesError) throw new Error(profilesError.message);

  const profileMap = new Map(((profiles || []) as ProfileRow[]).map((profile) => [profile.user_id, profile]));
  const emailMap = new Map<string, string>();
  await Promise.all(
    userIds.map(async (userId) => {
      const { data } = await admin.auth.admin.getUserById(userId);
      if (data.user?.email) {
        emailMap.set(userId, data.user.email);
      }
    }),
  );

  const activeUsers = members.map((member) => {
    const email = emailMap.get(member.user_id) || "";
    const invite = invites.find((entry) => entry.user_id === member.user_id || entry.email.toLowerCase() === email.toLowerCase()) || null;
    return {
      id: member.id,
      userId: member.user_id,
      email: email || "Email unavailable",
      name: displayNameFromProfile(profileMap.get(member.user_id), email),
      role: member.role,
      status: "active" as const,
      inviteStatus: invite?.status || null,
      inviteId: invite?.id || null,
      inviteType: invite?.invite_type || null,
      createdAt: member.created_at,
      acceptedAt: invite?.accepted_at || null,
    };
  });

  const memberUserIds = new Set(members.map((member) => member.user_id));
  const pendingInvites = invites
    .filter((invite) => !invite.user_id || !memberUserIds.has(invite.user_id))
    .map((invite) => ({
      id: invite.id,
      userId: invite.user_id,
      email: invite.email,
      name: invite.email,
      role: invite.role,
      status: invite.status as AdminClientUserItem["status"],
      inviteStatus: invite.status,
      inviteId: invite.id,
      inviteType: invite.invite_type,
      createdAt: invite.created_at,
      acceptedAt: invite.accepted_at,
    }));

  return [...activeUsers, ...pendingInvites].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
