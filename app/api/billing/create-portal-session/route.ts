import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserBillingStatus } from "@/lib/billing";
import { env, isStripeConfigured } from "@/lib/env";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";
import { getStripeServerClient } from "@/lib/stripe";

function buildAbsoluteUrl(path: string) {
  return new URL(path, env.appUrl).toString();
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:billing:create-portal-session",
    limit: 20,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:billing:create-portal-session",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });
    return createRateLimitResponse(
      "You’ve tried opening billing too many times in a short period. Please wait a few minutes and try again.",
      rateLimit.retryAfterSeconds,
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  const stripe = getStripeServerClient();
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  const billingStatus = await getUserBillingStatus(user.id);
  if (!billingStatus.stripeCustomerId) {
    return NextResponse.json({ error: "Billing portal is not available yet for this account." }, { status: 400 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: billingStatus.stripeCustomerId,
      return_url: buildAbsoluteUrl("/settings?billing=updated#account-controls"),
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Billing portal could not be opened." }, { status: 500 });
  }
}
