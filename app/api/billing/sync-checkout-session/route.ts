import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutSessionSyncError, getBillingDisplayState, syncCheckoutSessionBillingForUser } from "@/lib/billing";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:billing:sync-checkout-session",
    limit: 12,
    windowMs: 5 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });

  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:billing:sync-checkout-session",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });

    return createRateLimitResponse(
      "We’re syncing your billing right now. Please wait a moment and try again.",
      rateLimit.retryAfterSeconds,
    );
  }

  const payload = (await request.json().catch(() => null)) as { session_id?: string } | null;
  const sessionId = typeof payload?.session_id === "string" ? payload.session_id : "";

  try {
    const result = await syncCheckoutSessionBillingForUser({
      userId: user.id,
      sessionId,
    });

    return NextResponse.json({
      ok: true,
      billingStatus: result.billingStatus,
      billingDisplayState: getBillingDisplayState(result.billingStatus),
      stripeCustomerId: result.stripeCustomerId,
      stripeSubscriptionId: result.stripeSubscriptionId,
      stripePriceId: result.stripePriceId,
    });
  } catch (error) {
    if (error instanceof CheckoutSessionSyncError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }

    console.warn("[billing sync] unexpected sync failure", {
      userId: user.id,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ error: "Billing sync could not be completed." }, { status: 500 });
  }
}
