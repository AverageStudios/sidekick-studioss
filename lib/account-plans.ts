import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AccountPlanTier = "self_serve" | "done_for_you";
export type AccountPlanStatus = "requested" | "trialing" | "active" | "canceled" | "inactive";

export type AccountPlan = {
  user_id: string;
  tier: AccountPlanTier;
  status: AccountPlanStatus;
  source: "stripe" | "manual" | "admin";
};

export async function getAccountPlanForUser(userId: string): Promise<AccountPlan | null> {
  const admin = createSupabaseAdminClient();
  if (!admin || !userId) return null;

  const { data, error } = await admin
    .from("account_plans")
    .select("user_id, tier, status, source")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (
      error.message.includes("account_plans") &&
      (error.message.includes("schema cache") || error.message.includes("does not exist"))
    ) {
      return null;
    }
    throw new Error(`Account plan could not be loaded: ${error.message}`);
  }

  if (!data?.user_id) return null;

  return {
    user_id: data.user_id as string,
    tier: data.tier === "done_for_you" ? "done_for_you" : "self_serve",
    status: ["requested", "trialing", "active", "canceled", "inactive"].includes(data.status as string)
      ? (data.status as AccountPlanStatus)
      : "active",
    source: data.source === "manual" || data.source === "admin" ? data.source : "stripe",
  };
}

export function getAccountPlanLabel(plan: AccountPlan | null) {
  return plan?.tier === "done_for_you" ? "Done-For-You" : "Self-Serve";
}

export function getAccountPlanDescription(plan: AccountPlan | null) {
  if (plan?.tier === "done_for_you") {
    return "Your SideKick workspace is managed with setup support.";
  }

  return "Use the platform yourself with the 14-day Self-Serve trial or subscription.";
}
