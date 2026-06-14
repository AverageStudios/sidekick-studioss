import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { ensureCampaignDraft } from "@/lib/campaign-drafts";
import { logRouteError, readJsonBody } from "@/lib/api-security";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

const draftRequestSchema = z.object({
  draftId: z.string().uuid().optional(),
  templateSlug: z.string().trim().min(1).max(160),
  state: z.record(z.string(), z.any()).default({}),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:campaign-drafts",
    limit: 30,
    windowMs: 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:campaign-drafts",
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

  const parsedBody = draftRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid campaign draft payload." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin access is not available." }, { status: 500 });
  }

  try {
    const ensured = await ensureCampaignDraft({
      admin,
      userId: user.id,
      draftId: parsedBody.data.draftId,
      templateSlug: parsedBody.data.templateSlug,
      state: parsedBody.data.state,
    });

    return NextResponse.json({ draftId: ensured.draftId, saved: true });
  } catch (error) {
    logRouteError("campaign drafts", error);
    return NextResponse.json(
      { error: "Campaign draft could not be saved." },
      { status: 500 },
    );
  }
}
