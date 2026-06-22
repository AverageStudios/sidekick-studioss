import { NextResponse } from "next/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getBillingDisplayState, getUserBillingStatus, upsertUserBillingRow } from "@/lib/billing";
import { env, isStripeConfigured, isSupabaseServerConfigured } from "@/lib/env";
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
    key: "api:billing:create-checkout-session",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:billing:create-checkout-session",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });
    return createRateLimitResponse(
      "You’ve tried starting billing too many times in a short period. Please wait a few minutes and try again.",
      rateLimit.retryAfterSeconds,
    );
  }

  if (!isStripeConfigured() || !isSupabaseServerConfigured()) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  const stripe = getStripeServerClient();
  if (!stripe || !env.stripePriceId) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  const billingStatus = await getUserBillingStatus(user.id);
  const billingDisplayState = getBillingDisplayState(billingStatus);
  const shouldOpenPortal =
    billingDisplayState.primaryActionType === "portal" ||
    ["trial_active", "trial_cancels_soon", "active", "cancels_soon", "payment_issue_grace"].includes(billingDisplayState.key);

  if (shouldOpenPortal) {
    if (billingStatus.stripeCustomerId) {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: billingStatus.stripeCustomerId,
          return_url: buildAbsoluteUrl("/settings#account-controls"),
        });
        return NextResponse.json({ url: portalSession.url });
      } catch {
        return NextResponse.json({ url: buildAbsoluteUrl("/settings#account-controls") });
      }
    }

    return NextResponse.json({ url: buildAbsoluteUrl("/dashboard") });
  }

  const profile = await getCurrentProfile();
  const fullName =
    [profile?.first_name, profile?.last_name].filter((value): value is string => Boolean(value && value.trim())).join(" ") ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "") ||
    user.email ||
    "SideKick User";

  try {
    let stripeCustomerId = billingStatus.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: fullName,
        metadata: {
          user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
      await upsertUserBillingRow(user.id, {
        stripe_customer_id: stripeCustomerId,
        subscription_status: billingStatus.row?.subscription_status ?? null,
        stripe_subscription_id: billingStatus.row?.stripe_subscription_id ?? null,
        stripe_price_id: billingStatus.row?.stripe_price_id ?? null,
        trial_ends_at: billingStatus.row?.trial_ends_at ?? null,
        current_period_end: billingStatus.row?.current_period_end ?? null,
        cancel_at_period_end: billingStatus.row?.cancel_at_period_end ?? false,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: env.stripePriceId,
          quantity: 1,
        },
      ],
      payment_method_collection: "always",
      success_url: buildAbsoluteUrl("/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}"),
      cancel_url: buildAbsoluteUrl("/pricing?checkout=cancelled"),
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: user.id,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout could not be started." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.warn("[billing checkout] checkout session creation failed", {
      userId: user.id,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 500 });
  }
}
