import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { assertActiveUserBilling, BillingRequiredError } from "@/lib/billing";
import { ensureCampaignDraft } from "@/lib/campaign-drafts";
import { runMetaLaunchPreflight } from "@/lib/meta-launch";
import { logRouteError, readJsonBody } from "@/lib/api-security";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

const preflightRequestSchema = z.object({
  campaignId: z.string().uuid().optional(),
  templateSlug: z.string().trim().min(1).max(160).optional(),
  state: z.record(z.string(), z.any()).default({}),
  mode: z.enum(["draft", "live"]).default("draft"),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertActiveUserBilling(user.id);
  } catch (error) {
    if (error instanceof BillingRequiredError) {
      return NextResponse.json({ error: "Billing required." }, { status: 402 });
    }
    throw error;
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:meta-preflight",
    limit: 30,
    windowMs: 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:meta-preflight",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });
    return createRateLimitResponse(undefined, rateLimit.retryAfterSeconds);
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = preflightRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preflight payload." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase admin access is not available." },
      { status: 500 },
    );
  }

  try {
    if (!parsed.data.templateSlug) {
      return NextResponse.json(
        { error: "Template is required to sync the latest launch state before preflight." },
        { status: 400 },
      );
    }

    const ensured = await ensureCampaignDraft({
      admin,
      userId: user.id,
      draftId: parsed.data.campaignId,
      templateSlug: parsed.data.templateSlug,
      state: parsed.data.state,
    });
    const campaignId = ensured.draftId;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign draft could not be created automatically." },
        { status: 400 },
      );
    }

    const preflight = await runMetaLaunchPreflight({
      admin,
      campaignId,
      userId: user.id,
      mode: parsed.data.mode,
    });
    return NextResponse.json({
      draftId: campaignId,
      ...preflight,
    });
  } catch (error) {
    logRouteError("meta preflight", error);
    return NextResponse.json({ error: "Preflight could not be completed." }, { status: 400 });
  }
}
