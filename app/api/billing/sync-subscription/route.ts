import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  BillingSubscriptionSyncError,
  getBillingDisplayState,
  syncBillingSubscriptionForUser,
} from "@/lib/billing";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:billing:sync-subscription",
    limit: 20,
    windowMs: 10 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });

  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:billing:sync-subscription",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });

    return createRateLimitResponse(
      "We’re refreshing your billing right now. Please wait a moment and try again.",
      rateLimit.retryAfterSeconds,
    );
  }

  try {
    const result = await syncBillingSubscriptionForUser(user.id);
    return NextResponse.json({
      ok: true,
      billingStatus: result.billingStatus,
      billingDisplayState: getBillingDisplayState(result.billingStatus),
      stripeCustomerId: result.stripeCustomerId,
      stripeSubscriptionId: result.stripeSubscriptionId,
      stripePriceId: result.stripePriceId,
    });
  } catch (error) {
    if (error instanceof BillingSubscriptionSyncError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }

    console.warn("[billing sync] unexpected subscription refresh failure", {
      userId: user.id,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ error: "Billing status could not be refreshed." }, { status: 500 });
  }
}
