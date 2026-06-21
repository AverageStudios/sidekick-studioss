import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStripeServerClient,
} from "@/lib/stripe";
import {
  getStripeSubscriptionLookupUserId,
  resolveBillingUserIdFromStripe,
  syncUserBillingFromCheckoutSession,
  syncUserBillingFromStripeSubscription,
  upsertUserBillingRow,
} from "@/lib/billing";
import { env, isStripeConfigured, isSupabaseServerConfigured } from "@/lib/env";
import type Stripe from "stripe";

function safeWebhookLog(stage: string, detail: string) {
  console.warn(`[stripe webhook] ${stage}: ${detail}`);
}

async function fetchSubscription(stripe: Stripe, subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription && "id" in session.subscription
        ? session.subscription.id
        : null;
  const subscription = subscriptionId ? await fetchSubscription(stripe, subscriptionId) : null;
  await syncUserBillingFromCheckoutSession({ session, subscription });
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer && "id" in subscription.customer
        ? subscription.customer.id
        : null;
  const userId = await getStripeSubscriptionLookupUserId(subscription, stripeCustomerId);

  if (!userId) {
    safeWebhookLog("subscription_lookup_skipped", "No billing user match was found.");
    return;
  }

  await syncUserBillingFromStripeSubscription({
    userId,
    stripeCustomerId,
    subscription,
  });
}

async function handleInvoiceSubscriptionSync(stripe: Stripe, invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof (invoice as Stripe.Invoice & { subscription?: string | null }).subscription === "string"
      ? (invoice as Stripe.Invoice & { subscription?: string | null }).subscription || null
      : null;
  const stripeCustomerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer && "id" in invoice.customer
        ? invoice.customer.id
        : null;

  if (subscriptionId) {
    const subscription = await fetchSubscription(stripe, subscriptionId);
    await handleSubscriptionUpsert(subscription);
    return;
  }

  const userId = await resolveBillingUserIdFromStripe({
    stripeCustomerId,
  });
  if (!userId) {
    safeWebhookLog("invoice_lookup_skipped", "No billing user match was found.");
    return;
  }

  await upsertUserBillingRow(userId, {
    stripe_customer_id: stripeCustomerId,
  });
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !isSupabaseServerConfigured()) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const stripe = getStripeServerClient();
  const admin = createSupabaseAdminClient();
  if (!stripe || !admin || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.trial_will_end":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        await handleInvoiceSubscriptionSync(stripe, event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (error) {
    safeWebhookLog(
      "handler_failed",
      error instanceof Error ? error.message : "Unknown Stripe webhook failure.",
    );
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
