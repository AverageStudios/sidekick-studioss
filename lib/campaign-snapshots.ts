import { createHash } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CampaignLaunchState } from "@/types";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}

export function createLaunchStateHash(state: CampaignLaunchState) {
  return createHash("sha256").update(stableStringify(state)).digest("hex");
}

export async function readLatestCampaignLaunchSnapshot({
  admin,
  campaignId,
}: {
  admin: SupabaseAdmin;
  campaignId: string;
}) {
  const { data, error } = await admin
    .from("campaign_launch_snapshots")
    .select("snapshot_json")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.snapshot_json as CampaignLaunchState | null | undefined) || null;
}

export async function persistCampaignLaunchSnapshot({
  admin,
  campaignId,
  workspaceId,
  templateSlug,
  state,
  createdBy,
}: {
  admin: SupabaseAdmin;
  campaignId: string;
  workspaceId: string | null;
  templateSlug: string;
  state: CampaignLaunchState;
  createdBy: string;
}) {
  if (!workspaceId) {
    throw new Error("Campaign workspace is required to persist launch snapshots.");
  }

  const stateHash = createLaunchStateHash(state);
  const payload = {
    campaign_id: campaignId,
    workspace_id: workspaceId,
    template_slug: templateSlug,
    launch_step: state.stepId,
    details_step: null,
    state_hash: stateHash,
    snapshot_json: state,
    created_by: createdBy,
  };

  const { error } = await admin
    .from("campaign_launch_snapshots")
    .upsert(payload, { onConflict: "campaign_id,state_hash" });

  if (error) {
    throw new Error(error.message);
  }
}
