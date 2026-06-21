import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  if (!env.stripeSecretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
  }

  return stripeClient;
}

export function unixSecondsToIso(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

export function getStripeSubscriptionPriceId(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0];
  return firstItem?.price?.id || null;
}

export function getStripeSubscriptionUserId(subscription: Stripe.Subscription) {
  const raw = subscription.metadata?.user_id;
  return typeof raw === "string" && raw.trim().length ? raw.trim() : null;
}

export function getStripeCheckoutUserId(session: Stripe.Checkout.Session) {
  const raw = session.metadata?.user_id;
  return typeof raw === "string" && raw.trim().length ? raw.trim() : null;
}
