import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env, isSupabaseServerConfigured, isStripeConfigured } from "@/lib/env";
import type { UserBillingRecord, UserBillingSubscriptionStatus } from "@/types";
import { getStripeSubscriptionPriceId, getStripeSubscriptionUserId, unixSecondsToIso } from "@/lib/stripe";
import type Stripe from "stripe";

const ACCESS_ALLOWED_STATUSES = new Set<UserBillingSubscriptionStatus>(["trialing", "active"]);
const BLOCKED_STATUSES = new Set<UserBillingSubscriptionStatus>([
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
]);

export type UserBillingAccessState =
  | "active"
  | "trialing"
  | "past_due_grace"
  | "billing_required";

export type UserBillingStatus = {
  row: UserBillingRecord | null;
  subscriptionStatus: UserBillingSubscriptionStatus | "none";
  accessState: UserBillingAccessState;
  hasAccess: boolean;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  isStripeConfigured: boolean;
};

type BillingStatusRetryOptions = {
  attempts?: number;
  delayMs?: number;
};

export class BillingRequiredError extends Error {
  constructor(message = "Billing required.") {
    super(message);
    this.name = "BillingRequiredError";
  }
}

async function isBillingBypassUser(userId: string) {
  if (!isSupabaseServerConfigured()) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle();
    if (!error) {
      return data?.role === "admin";
    }
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return false;
  }

  const { data, error } = await admin.from("profiles").select("role").eq("user_id", userId).maybeSingle();
  if (error) {
    return false;
  }

  return data?.role === "admin";
}

function isMissingUserBillingTableError(message: string | null | undefined) {
  if (!message) return false;
  return message.includes("user_billing") && (
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("schema cache")
  );
}

function normalizeBillingRow(row: Partial<UserBillingRecord> | null | undefined): UserBillingRecord | null {
  if (!row || typeof row.user_id !== "string") {
    return null;
  }

  return {
    user_id: row.user_id,
    stripe_customer_id: typeof row.stripe_customer_id === "string" ? row.stripe_customer_id : null,
    stripe_subscription_id: typeof row.stripe_subscription_id === "string" ? row.stripe_subscription_id : null,
    stripe_price_id: typeof row.stripe_price_id === "string" ? row.stripe_price_id : null,
    subscription_status:
      typeof row.subscription_status === "string" ? (row.subscription_status as UserBillingSubscriptionStatus) : null,
    trial_ends_at: typeof row.trial_ends_at === "string" ? row.trial_ends_at : null,
    current_period_end: typeof row.current_period_end === "string" ? row.current_period_end : null,
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

function isFutureDate(value: string | null | undefined) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function evaluateUserBillingStatus(row: UserBillingRecord | null): UserBillingStatus {
  const normalized = normalizeBillingRow(row);
  const subscriptionStatus = normalized?.subscription_status || "none";
  const cancelAtPeriodEnd = normalized?.cancel_at_period_end || false;
  const trialEndsAt = normalized?.trial_ends_at || null;
  const currentPeriodEnd = normalized?.current_period_end || null;
  const stripeCustomerId = normalized?.stripe_customer_id || null;
  const stripeSubscriptionId = normalized?.stripe_subscription_id || null;
  const stripePriceId = normalized?.stripe_price_id || null;

  if (normalized && ACCESS_ALLOWED_STATUSES.has(subscriptionStatus)) {
    return {
      row: normalized,
      subscriptionStatus,
      accessState: subscriptionStatus === "trialing" ? "trialing" : "active",
      hasAccess: true,
      cancelAtPeriodEnd,
      trialEndsAt,
      currentPeriodEnd,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      isStripeConfigured: isStripeConfigured(),
    };
  }

  if (subscriptionStatus === "past_due" && isFutureDate(currentPeriodEnd)) {
    return {
      row: normalized,
      subscriptionStatus,
      accessState: "past_due_grace",
      hasAccess: true,
      cancelAtPeriodEnd,
      trialEndsAt,
      currentPeriodEnd,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      isStripeConfigured: isStripeConfigured(),
    };
  }

  if (BLOCKED_STATUSES.has(subscriptionStatus) || subscriptionStatus === "past_due" || subscriptionStatus === "none") {
    return {
      row: normalized,
      subscriptionStatus,
      accessState: "billing_required",
      hasAccess: false,
      cancelAtPeriodEnd,
      trialEndsAt,
      currentPeriodEnd,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      isStripeConfigured: isStripeConfigured(),
    };
  }

  return {
    row: normalized,
    subscriptionStatus,
    accessState: "billing_required",
    hasAccess: false,
    cancelAtPeriodEnd,
    trialEndsAt,
    currentPeriodEnd,
    stripeCustomerId,
    stripeSubscriptionId,
    stripePriceId,
    isStripeConfigured: isStripeConfigured(),
  };
}

async function getBillingQueryResultByUserId(userId: string) {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("user_billing").select("*").eq("user_id", userId).maybeSingle();
    if (!error) {
      return normalizeBillingRow((data as UserBillingRecord | null) || null);
    }
    if (isMissingUserBillingTableError(error.message)) {
      return null;
    }
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.from("user_billing").select("*").eq("user_id", userId).maybeSingle();
  if (error && isMissingUserBillingTableError(error.message)) {
    return null;
  }
  return normalizeBillingRow((data as UserBillingRecord | null) || null);
}

export async function getUserBillingStatus(userId: string) {
  const row = await getBillingQueryResultByUserId(userId);
  return evaluateUserBillingStatus(row);
}

export function hasLiveBillingPeriod(status: Pick<UserBillingStatus, "hasAccess" | "trialEndsAt" | "currentPeriodEnd">) {
  return status.hasAccess || isFutureDate(status.trialEndsAt) || isFutureDate(status.currentPeriodEnd);
}

export async function getUserBillingStatusWithRetry(
  userId: string,
  options: BillingStatusRetryOptions = {},
) {
  if (await isBillingBypassUser(userId)) {
    return {
      ...(await getUserBillingStatus(userId)),
      hasAccess: true,
    };
  }

  const attempts = Math.max(1, options.attempts ?? 4);
  const delayMs = Math.max(0, options.delayMs ?? 1250);

  let status = await getUserBillingStatus(userId);
  if (status.hasAccess || attempts === 1) {
    return status;
  }

  for (let attempt = 2; attempt <= attempts; attempt += 1) {
    await delay(delayMs);
    status = await getUserBillingStatus(userId);
    if (status.hasAccess) {
      return status;
    }
  }

  return status;
}

export function buildBillingRequiredHref(returnTo = "/dashboard") {
  const url = new URL("/billing-required", env.appUrl);
  if (returnTo.startsWith("/")) {
    url.searchParams.set("returnTo", returnTo);
  }
  return `${url.pathname}${url.search}`;
}

export async function requireActiveUserBilling(userId: string, returnTo = "/dashboard") {
  if (await isBillingBypassUser(userId)) {
    return {
      ...(await getUserBillingStatus(userId)),
      hasAccess: true,
    };
  }

  const status = await getUserBillingStatus(userId);
  if (!status.hasAccess) {
    redirect(buildBillingRequiredHref(returnTo));
  }
  return status;
}

export async function assertActiveUserBilling(userId: string) {
  if (await isBillingBypassUser(userId)) {
    return {
      ...(await getUserBillingStatus(userId)),
      hasAccess: true,
    };
  }

  const status = await getUserBillingStatus(userId);
  if (!status.hasAccess) {
    throw new BillingRequiredError();
  }
  return status;
}

export async function getUserBillingRowByStripeCustomerId(stripeCustomerId: string) {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("user_billing")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  if (error && isMissingUserBillingTableError(error.message)) {
    return null;
  }

  return normalizeBillingRow((data as UserBillingRecord | null) || null);
}

export async function upsertUserBillingRow(
  userId: string,
  input: Partial<Omit<UserBillingRecord, "user_id" | "created_at" | "updated_at">>,
) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase admin access is not available.");
  }

  const payload = {
    user_id: userId,
    stripe_customer_id: input.stripe_customer_id ?? null,
    stripe_subscription_id: input.stripe_subscription_id ?? null,
    stripe_price_id: input.stripe_price_id ?? null,
    subscription_status: input.subscription_status ?? null,
    trial_ends_at: input.trial_ends_at ?? null,
    current_period_end: input.current_period_end ?? null,
    cancel_at_period_end: input.cancel_at_period_end ?? false,
  };

  const { data, error } = await admin
    .from("user_billing")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    if (isMissingUserBillingTableError(error.message)) {
      throw new Error("Billing is not available until the latest database migration is applied.");
    }
    throw new Error(error.message);
  }

  return normalizeBillingRow(data as UserBillingRecord) as UserBillingRecord;
}

export async function resolveBillingUserIdFromStripe({
  metadataUserId,
  stripeCustomerId,
}: {
  metadataUserId?: string | null;
  stripeCustomerId?: string | null;
}) {
  if (metadataUserId) {
    return metadataUserId;
  }

  if (!stripeCustomerId) {
    return null;
  }

  const existing = await getUserBillingRowByStripeCustomerId(stripeCustomerId);
  return existing?.user_id || null;
}

export async function syncUserBillingFromStripeSubscription({
  userId,
  stripeCustomerId,
  subscription,
}: {
  userId: string;
  stripeCustomerId: string | null;
  subscription: Stripe.Subscription;
}) {
  const currentPeriodEnd =
    (subscription as Stripe.Subscription & { current_period_end?: number | null }).current_period_end ?? null;

  return upsertUserBillingRow(userId, {
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: getStripeSubscriptionPriceId(subscription),
    subscription_status: subscription.status as UserBillingSubscriptionStatus,
    trial_ends_at: unixSecondsToIso(subscription.trial_end),
    current_period_end: unixSecondsToIso(currentPeriodEnd),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
  });
}

export async function syncUserBillingFromCheckoutSession({
  session,
  subscription,
}: {
  session: Stripe.Checkout.Session;
  subscription?: Stripe.Subscription | null;
}) {
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer && "id" in session.customer
        ? session.customer.id
        : null;
  const userId = await resolveBillingUserIdFromStripe({
    metadataUserId: session.metadata?.user_id || null,
    stripeCustomerId,
  });

  if (!userId) {
    return null;
  }

  if (subscription) {
    return syncUserBillingFromStripeSubscription({
      userId,
      stripeCustomerId,
      subscription,
    });
  }

  return upsertUserBillingRow(userId, {
    stripe_customer_id: stripeCustomerId,
  });
}

export function getStripeSubscriptionLookupUserId(subscription: Stripe.Subscription, stripeCustomerId?: string | null) {
  return resolveBillingUserIdFromStripe({
    metadataUserId: getStripeSubscriptionUserId(subscription),
    stripeCustomerId: stripeCustomerId || (typeof subscription.customer === "string" ? subscription.customer : null),
  });
}
