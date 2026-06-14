import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  fetchMetaAdAccountDetails,
  fetchMetaAdAccountInsights,
  MetaAdAccountInsightsRow,
  MetaInsightActionMetric,
} from "@/lib/meta";
import { getWorkspaceMetaAccessToken } from "@/lib/meta-integration";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspaceIdForUser } from "@/lib/workspaces";
import { logRouteError } from "@/lib/api-security";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

const requestSchema = z.object({
  adAccountId: z.string().trim().min(1).max(80).regex(/^act_\d+$|^\d+$/),
  adType: z.enum(["lead_form", "landing_page", "call_now", "messenger_leads", "messenger_engagement"]),
});

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

const LEAD_ACTION_TYPES = [
  "lead",
  "lead_grouped",
  "leadgen_grouped",
  "omni_lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
];

const MESSENGER_ACTION_TYPES = [
  "onsite_conversion.messaging_conversation_started_7d",
  "messaging_conversation_started_7d",
  "onsite_conversion.total_messaging_connection",
];

const CALL_ACTION_TYPES = [
  "onsite_conversion.call",
  "call",
];

const CLICK_ACTION_TYPES = [
  "link_click",
  "landing_page_view",
  "outbound_click",
];

function parseMetricNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getCurrencyDivisor(currency?: string | null) {
  return currency && ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 1 : 100;
}

function parseMetaMinorUnitAmount(value: unknown, currency?: string | null) {
  const numeric = parseMetricNumber(value);
  if (numeric === null) return null;
  return numeric / getCurrencyDivisor(currency);
}

function pickActionMetric(
  rows: MetaInsightActionMetric[] | undefined,
  preferredTypes: string[],
) {
  if (!Array.isArray(rows) || !rows.length) return null;
  for (const type of preferredTypes) {
    const match = rows.find((row) => row.action_type === type);
    const value = parseMetricNumber(match?.value);
    if (value !== null && value > 0) {
      return { type, value };
    }
  }
  return null;
}

function deriveBudgetEstimate({
  adType,
  insights,
}: {
  adType: z.infer<typeof requestSchema>["adType"];
  insights: MetaAdAccountInsightsRow | null;
}) {
  if (!insights) {
    return {
      metricLabel: null,
      averageUnitCost: null,
      lowPerDay: null,
      highPerDay: null,
      source: "meta_unavailable" as const,
      note: "Meta has no readable recent delivery history for this ad account yet.",
    };
  }

  const spend = parseMetricNumber(insights.spend);
  const clicks = parseMetricNumber(insights.clicks);
  const cpc = parseMetricNumber(insights.cpc);

  if (adType === "lead_form") {
    const leadCost = pickActionMetric(insights.cost_per_action_type, LEAD_ACTION_TYPES)?.value ?? null;
    const leadCount = pickActionMetric(insights.actions, LEAD_ACTION_TYPES)?.value ?? null;
    const derivedLeadCost =
      leadCost && leadCost > 0
        ? leadCost
        : spend && leadCount && leadCount > 0
          ? spend / leadCount
          : null;

    return {
      metricLabel: derivedLeadCost ? "leads/day" : null,
      averageUnitCost: derivedLeadCost,
      lowPerDay: null,
      highPerDay: null,
      source: derivedLeadCost ? ("meta_lead_history" as const) : ("meta_unavailable" as const),
      note: derivedLeadCost
        ? "Based on the last 30 days of Meta lead-form delivery on this ad account."
        : "Meta has recent spend history, but not enough lead-result history to estimate leads/day yet.",
    };
  }

  const preferredActionTypes =
    adType === "messenger_leads" || adType === "messenger_engagement"
      ? MESSENGER_ACTION_TYPES
      : adType === "call_now"
        ? CALL_ACTION_TYPES
        : CLICK_ACTION_TYPES;

  const actionCost = pickActionMetric(insights.cost_per_action_type, preferredActionTypes)?.value ?? null;
  const clickLikeCost =
    actionCost && actionCost > 0
      ? actionCost
      : cpc && cpc > 0
        ? cpc
        : spend && clicks && clicks > 0
          ? spend / clicks
          : null;

  const label =
    adType === "landing_page"
      ? "visits/day"
      : adType === "call_now"
        ? "call actions/day"
        : "message actions/day";

  return {
    metricLabel: clickLikeCost ? label : null,
    averageUnitCost: clickLikeCost,
    lowPerDay: null,
    highPerDay: null,
    source: clickLikeCost ? ("meta_click_history" as const) : ("meta_unavailable" as const),
    note: clickLikeCost
      ? "Based on the last 30 days of Meta delivery history on this ad account."
      : "Meta has not returned enough recent delivery history to estimate results/day yet.",
  };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:meta-budget-guidance",
    limit: 30,
    windowMs: 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:meta-budget-guidance",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });
    return createRateLimitResponse(undefined, rateLimit.retryAfterSeconds);
  }

  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({
    adAccountId: url.searchParams.get("adAccountId"),
    adType: url.searchParams.get("adType"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid budget guidance request." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin access is not available." }, { status: 500 });
  }

  const workspaceId = await getActiveWorkspaceIdForUser(user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 400 });
  }

  const tokenContext = await getWorkspaceMetaAccessToken({ admin, workspaceId });
  if (!tokenContext) {
    return NextResponse.json({ error: "Connect Meta before loading budget guidance." }, { status: 400 });
  }

  try {
    const [adAccount, insights] = await Promise.all([
      fetchMetaAdAccountDetails(tokenContext.accessToken, parsed.data.adAccountId),
      fetchMetaAdAccountInsights(tokenContext.accessToken, parsed.data.adAccountId).catch(() => null),
    ]);

    const currency = adAccount.currency || "USD";
    const spendCap = parseMetaMinorUnitAmount(adAccount.spend_cap, currency);
    const amountSpent = parseMetaMinorUnitAmount(adAccount.amount_spent, currency);
    const remainingSpendCap =
      spendCap !== null
        ? Math.max(0, spendCap - (amountSpent || 0))
        : null;

    const fallbackMax = 50000;
    const maxDailyBudget =
      remainingSpendCap && remainingSpendCap > 0
        ? Math.max(50, Math.min(fallbackMax, Math.round(remainingSpendCap)))
        : fallbackMax;

    const estimate = deriveBudgetEstimate({
      adType: parsed.data.adType,
      insights,
    });

    return NextResponse.json({
      currency,
      maxDailyBudget,
      spendCap,
      remainingSpendCap,
      note:
        remainingSpendCap !== null
          ? "Meta account spend limit detected and used as the daily-budget ceiling shown in the wizard."
          : "Meta does not expose a universal daily-budget max here, so the wizard uses a high practical ceiling and your ad account spending limit remains the real guardrail.",
      estimate,
    });
  } catch (error) {
    logRouteError("meta budget guidance", error);
    return NextResponse.json({ error: "Budget guidance could not be loaded." }, { status: 400 });
  }
}
