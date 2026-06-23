import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClientInviteRow = {
  id: string;
  email: string;
  user_id: string | null;
  workspace_id: string | null;
  tier: "done_for_you";
  status: string;
  invite_type: "invite" | "recovery";
  created_at: string;
  accepted_at: string | null;
};

type WorkspaceRow = {
  id: string;
  name: string;
  created_at: string;
};

type WorkspaceBrandingRow = {
  workspace_id: string;
  business_name: string | null;
};

type AccountPlanRow = {
  user_id: string;
  tier: string;
  status: string;
};

function isMissingClientInvitesTable(message?: string | null) {
  const value = message || "";
  return value.includes("client_invites") && (
    value.includes("schema cache") ||
    value.includes("does not exist") ||
    value.includes("relation")
  );
}

export type AdminClientListItem = {
  id: string;
  email: string;
  userId: string | null;
  workspaceId: string | null;
  workspaceName: string;
  businessName: string;
  tier: string;
  status: string;
  inviteStatus: string;
  inviteType: string;
  createdAt: string;
  acceptedAt: string | null;
};

export async function listAdminClients(): Promise<AdminClientListItem[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  const { data: invites, error } = await admin
    .from("client_invites")
    .select("id, email, user_id, workspace_id, tier, status, invite_type, created_at, accepted_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingClientInvitesTable(error.message)) return [];
    throw new Error(error.message);
  }

  const rows = ((invites || []) as AdminClientInviteRow[]);
  const workspaceIds = Array.from(new Set(rows.map((row) => row.workspace_id).filter((id): id is string => Boolean(id))));
  const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id))));

  const [workspacesResult, brandingResult, plansResult] = await Promise.all([
    workspaceIds.length
      ? admin.from("workspaces").select("id, name, created_at").in("id", workspaceIds)
      : Promise.resolve({ data: [], error: null }),
    workspaceIds.length
      ? admin.from("workspace_branding").select("workspace_id, business_name").in("workspace_id", workspaceIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? admin.from("account_plans").select("user_id, tier, status").in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (workspacesResult.error) throw new Error(workspacesResult.error.message);
  const workspaceMap = new Map(((workspacesResult.data || []) as WorkspaceRow[]).map((workspace) => [workspace.id, workspace]));
  const brandingMap = new Map(
    ((brandingResult.data || []) as WorkspaceBrandingRow[]).map((branding) => [branding.workspace_id, branding]),
  );
  const planMap = new Map(((plansResult.data || []) as AccountPlanRow[]).map((plan) => [plan.user_id, plan]));

  return rows.map((row) => {
    const workspace = row.workspace_id ? workspaceMap.get(row.workspace_id) || null : null;
    const branding = row.workspace_id ? brandingMap.get(row.workspace_id) || null : null;
    const plan = row.user_id ? planMap.get(row.user_id) || null : null;

    return {
      id: row.id,
      email: row.email,
      userId: row.user_id,
      workspaceId: row.workspace_id,
      workspaceName: workspace?.name || "Workspace pending",
      businessName: branding?.business_name || workspace?.name || "Client workspace",
      tier: plan?.tier || row.tier,
      status: plan?.status || "pending",
      inviteStatus: row.status,
      inviteType: row.invite_type,
      createdAt: row.created_at,
      acceptedAt: row.accepted_at,
    };
  });
}
