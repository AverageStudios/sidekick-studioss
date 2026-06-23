import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env, isSupabaseServerConfigured, isStripeConfigured } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe";
import type { UserBillingRecord, UserBillingSubscriptionStatus } from "@/types";
import {
  getStripeCheckoutUserId,
  getStripeSubscriptionPriceId,
  getStripeSubscriptionUserId,
  unixSecondsToIso,
} from "@/lib/stripe";
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

export type BillingPrimaryActionType = "checkout" | "portal";

export type BillingDisplayStateKey =
  | "not_started"
  | "trial_active"
  | "trial_cancels_soon"
  | "active"
  | "cancels_soon"
  | "payment_issue_grace"
  | "payment_required"
  | "canceled"
  | "incomplete"
  | "checkout_expired"
  | "paused";

export type BillingDisplayState = {
  key: BillingDisplayStateKey;
  label: string;
  description: string;
  accessAllowed: boolean;
  primaryActionLabel: string;
  primaryActionType: BillingPrimaryActionType;
  secondaryActionLabel?: string;
  secondaryActionType?: BillingPrimaryActionType;
  importantDateLabel?: string;
  importantDateValue?: string | null;
  countdownLabel?: string | null;
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

export class CheckoutSessionSyncError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "checkout_sync_failed") {
    super(message);
    this.name = "CheckoutSessionSyncError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class BillingSubscriptionSyncError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "billing_subscription_sync_failed") {
    super(message);
    this.name = "BillingSubscriptionSyncError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const isBillingBypassUser = cache(async (userId: string) => {
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
});

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

function getDateDifferenceInDays(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;

  const diffMs = timestamp - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function formatBillingDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getBillingCountdownLabel(prefix: string, value?: string | null) {
  const days = getDateDifferenceInDays(value);
  if (days === null) return null;
  if (days < 0) return "Access ended";
  if (days === 0) return "Ends today";
  if (days === 1) return `${prefix} in 1 day`;
  return `${prefix} in ${days} days`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureSelfServeAccountPlan(userId: string, subscriptionStatus?: UserBillingSubscriptionStatus | null) {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const { data: existing, error: lookupError } = await admin
    .from("account_plans")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    if (
      lookupError.message.includes("account_plans") &&
      (lookupError.message.includes("schema cache") || lookupError.message.includes("does not exist"))
    ) {
      return;
    }
    console.warn("[billing] account plan lookup failed", {
      userId,
      message: lookupError.message,
    });
    return;
  }

  if (existing?.user_id) return;

  const planStatus =
    subscriptionStatus === "trialing"
      ? "trialing"
      : subscriptionStatus === "canceled"
        ? "canceled"
        : subscriptionStatus === "active"
          ? "active"
          : "active";

  const { error } = await admin.from("account_plans").insert({
    user_id: userId,
    tier: "self_serve",
    status: planStatus,
    source: "stripe",
  });

  if (error && !error.message.includes("duplicate key")) {
    console.warn("[billing] account plan insert failed", {
      userId,
      message: error.message,
    });
  }
}

function isMissingAccountPlansTableError(message: string | null | undefined) {
  if (!message) return false;
  return message.includes("account_plans") && (
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("schema cache")
  );
}

export async function hasActiveDoneForYouAccess(userId: string) {
  if (!userId || !isSupabaseServerConfigured()) return false;

  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const { data, error } = await admin
    .from("account_plans")
    .select("tier, status, source")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingAccountPlansTableError(error.message)) return false;
    console.warn("[billing] account plan access lookup failed", {
      userId,
      message: error.message,
    });
    return false;
  }

  return data?.tier === "done_for_you" && data.status === "active";
}

export function getBillingDisplayState(
  input: UserBillingStatus | UserBillingRecord | null | undefined,
): BillingDisplayState {
  const status =
    input && "subscriptionStatus" in input
      ? input
      : evaluateUserBillingStatus(normalizeBillingRow(input as UserBillingRecord | null | undefined));
  const subscriptionStatus = status.subscriptionStatus;
  const hasSubscription = Boolean(status.stripeSubscriptionId);
  const cancelAtPeriodEnd = status.cancelAtPeriodEnd;

  if (!hasSubscription && subscriptionStatus === "none") {
    return {
      key: "not_started",
      label: "Not started",
      accessAllowed: false,
      primaryActionLabel: "Start 14-day free trial",
      primaryActionType: "checkout",
      description: "Start your 14-day free trial to unlock SideKick across unlimited workspaces.",
    };
  }

  if (subscriptionStatus === "trialing" && cancelAtPeriodEnd && !isFutureDate(status.trialEndsAt)) {
    return {
      key: "canceled",
      label: "Canceled",
      accessAllowed: false,
      primaryActionLabel: "Restart subscription",
      primaryActionType: "checkout",
      description: "Your SideKick access has ended. Restart your subscription to continue using campaigns, leads, and integrations.",
      importantDateLabel: "Access ended",
      importantDateValue: status.trialEndsAt,
      countdownLabel: "Access ended",
    };
  }

  if (subscriptionStatus === "trialing" && cancelAtPeriodEnd) {
    return {
      key: "trial_cancels_soon",
      label: "Trial canceled",
      accessAllowed: status.hasAccess,
      primaryActionLabel: "Manage billing",
      primaryActionType: "portal",
      importantDateLabel: "Access ends",
      importantDateValue: status.trialEndsAt,
      countdownLabel: getBillingCountdownLabel("Access ends", status.trialEndsAt),
      description: "Your trial has been canceled. You can keep using SideKick until the trial ends, and you will not be charged.",
    };
  }

  if (subscriptionStatus === "trialing") {
    return {
      key: "trial_active",
      label: "Trial active",
      accessAllowed: true,
      primaryActionLabel: "Manage billing",
      primaryActionType: "portal",
      importantDateLabel: "Trial ends",
      importantDateValue: status.trialEndsAt,
      countdownLabel: getBillingCountdownLabel("Trial ends", status.trialEndsAt),
      description: "You will not be charged until your trial ends. You can cancel anytime before billing.",
    };
  }

  if (subscriptionStatus === "active" && cancelAtPeriodEnd && !isFutureDate(status.currentPeriodEnd)) {
    return {
      key: "canceled",
      label: "Canceled",
      accessAllowed: false,
      primaryActionLabel: "Restart subscription",
      primaryActionType: "checkout",
      description: "Your SideKick access has ended. Restart your subscription to continue using campaigns, leads, and integrations.",
      importantDateLabel: "Access ended",
      importantDateValue: status.currentPeriodEnd,
      countdownLabel: "Access ended",
    };
  }

  if (subscriptionStatus === "active" && cancelAtPeriodEnd) {
    return {
      key: "cancels_soon",
      label: "Cancels soon",
      accessAllowed: status.hasAccess,
      primaryActionLabel: "Manage billing",
      primaryActionType: "portal",
      importantDateLabel: "Access ends",
      importantDateValue: status.currentPeriodEnd,
      countdownLabel: getBillingCountdownLabel("Access ends", status.currentPeriodEnd),
      description: "Your subscription has been canceled. You can keep using SideKick until the end of your current billing period.",
    };
  }

  if (subscriptionStatus === "active") {
    return {
      key: "active",
      label: "Active",
      accessAllowed: true,
      primaryActionLabel: "Manage billing",
      primaryActionType: "portal",
      importantDateLabel: "Next billing date",
      importantDateValue: status.currentPeriodEnd,
      countdownLabel: getBillingCountdownLabel("Renews", status.currentPeriodEnd),
      description: "Your SideKick Core subscription is active.",
    };
  }

  if (subscriptionStatus === "past_due" && isFutureDate(status.currentPeriodEnd)) {
    return {
      key: "payment_issue_grace",
      label: "Payment issue",
      accessAllowed: true,
      primaryActionLabel: "Update payment method",
      primaryActionType: "portal",
      importantDateLabel: "Access continues until",
      importantDateValue: status.currentPeriodEnd,
      countdownLabel: getBillingCountdownLabel("Access continues", status.currentPeriodEnd),
      description: "We could not process your latest payment. Update your billing details to avoid losing access.",
    };
  }

  if (subscriptionStatus === "canceled") {
    return {
      key: "canceled",
      label: "Canceled",
      accessAllowed: false,
      primaryActionLabel: "Restart subscription",
      primaryActionType: "checkout",
      description: "Your SideKick access has ended. Restart your subscription to continue using campaigns, leads, and integrations.",
      importantDateLabel: status.currentPeriodEnd || status.trialEndsAt ? "Access ended" : undefined,
      importantDateValue: status.currentPeriodEnd || status.trialEndsAt || null,
      countdownLabel: status.currentPeriodEnd || status.trialEndsAt ? "Access ended" : null,
    };
  }

  if (subscriptionStatus === "incomplete") {
    return {
      key: "incomplete",
      label: "Checkout incomplete",
      accessAllowed: false,
      primaryActionLabel: "Finish checkout",
      primaryActionType: "checkout",
      description: "Your subscription setup was not completed. Finish checkout to start using SideKick.",
    };
  }

  if (subscriptionStatus === "incomplete_expired") {
    return {
      key: "checkout_expired",
      label: "Checkout expired",
      accessAllowed: false,
      primaryActionLabel: "Start 14-day free trial",
      primaryActionType: "checkout",
      description: "Your checkout session expired. Start a new trial whenever you are ready.",
    };
  }

  if (subscriptionStatus === "unpaid" || subscriptionStatus === "past_due") {
    return {
      key: "payment_required",
      label: "Payment required",
      accessAllowed: false,
      primaryActionLabel: "Update payment method",
      primaryActionType: "portal",
      description:
        subscriptionStatus === "unpaid"
          ? "Your payment could not be processed. Update your billing details to continue using SideKick."
          : "Your payment could not be processed. Update your billing details to continue using SideKick.",
    };
  }

  if (subscriptionStatus === "paused") {
    return {
      key: "paused",
      label: "Paused",
      accessAllowed: false,
      primaryActionLabel: "Manage billing",
      primaryActionType: "portal",
      description: "Your subscription is paused. Manage billing to reactivate access.",
    };
  }

  return {
    key: "not_started",
    label: "Not started",
    accessAllowed: false,
    primaryActionLabel: "Start 14-day free trial",
    primaryActionType: "checkout",
    description: "Start your 14-day free trial to unlock SideKick across unlimited workspaces.",
  };
}

export function canCreateCheckoutForBillingStatus(status: UserBillingStatus) {
  const displayState = getBillingDisplayState(status);
  return ["not_started", "canceled", "incomplete", "checkout_expired", "payment_required"].includes(displayState.key);
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
  if ((await isBillingBypassUser(userId)) || (await hasActiveDoneForYouAccess(userId))) {
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
  if ((await isBillingBypassUser(userId)) || (await hasActiveDoneForYouAccess(userId))) {
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
  if ((await isBillingBypassUser(userId)) || (await hasActiveDoneForYouAccess(userId))) {
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

  if (input.subscription_status) {
    await ensureSelfServeAccountPlan(userId, input.subscription_status);
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

export async function syncCheckoutSessionBillingForUser({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}) {
  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    throw new CheckoutSessionSyncError("Checkout session id is required.", 400, "missing_session_id");
  }

  const stripe = getStripeServerClient();
  if (!stripe || !isStripeConfigured()) {
    throw new CheckoutSessionSyncError("Billing is not configured yet.", 503, "stripe_not_configured");
  }

  console.info("[billing sync] checkout session received", {
    sessionId: normalizedSessionId,
    userId,
  });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(normalizedSessionId, {
      expand: ["subscription"],
    });
  } catch (error) {
    console.warn("[billing sync] checkout session lookup failed", {
      sessionId: normalizedSessionId,
      userId,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    throw new CheckoutSessionSyncError("Checkout session could not be found.", 400, "invalid_session_id");
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer && "id" in session.customer
        ? session.customer.id
        : null;

  const existingStatus = await getUserBillingStatus(userId);
  let subscription: Stripe.Subscription | null = null;

  if (session.subscription) {
    subscription =
      typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : (session.subscription as Stripe.Subscription);
  }

  const sessionUserId = getStripeCheckoutUserId(session);
  const subscriptionUserId = subscription ? getStripeSubscriptionUserId(subscription) : null;
  const customerMatches =
    Boolean(stripeCustomerId) &&
    Boolean(existingStatus.stripeCustomerId) &&
    stripeCustomerId === existingStatus.stripeCustomerId;

  const matchedUserId = sessionUserId || subscriptionUserId || (customerMatches ? userId : null);
  if (matchedUserId !== userId) {
    console.warn("[billing sync] checkout session user mismatch", {
      sessionId: normalizedSessionId,
      userId,
      matchedUserId,
      stripeCustomerId,
    });
    throw new CheckoutSessionSyncError("This checkout session does not belong to the current user.", 403, "session_user_mismatch");
  }

  if (!subscription) {
    throw new CheckoutSessionSyncError("Checkout session is missing a subscription.", 400, "missing_subscription");
  }

  const updatedRow = await syncUserBillingFromStripeSubscription({
    userId,
    stripeCustomerId,
    subscription,
  });
  const updatedStatus = evaluateUserBillingStatus(updatedRow);

  console.info("[billing sync] billing updated", {
    sessionId: normalizedSessionId,
    userId,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: updatedStatus.subscriptionStatus,
  });

  return {
    billingStatus: updatedStatus,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: getStripeSubscriptionPriceId(subscription),
  };
}

async function getLatestStripeSubscriptionForUser(status: UserBillingStatus) {
  const stripe = getStripeServerClient();
  if (!stripe || !isStripeConfigured()) {
    throw new BillingSubscriptionSyncError("Billing is not configured yet.", 503, "stripe_not_configured");
  }

  if (status.stripeSubscriptionId) {
    return stripe.subscriptions.retrieve(status.stripeSubscriptionId);
  }

  if (!status.stripeCustomerId) {
    throw new BillingSubscriptionSyncError("No Stripe billing record was found for this account.", 400, "missing_customer");
  }

  const result = await stripe.subscriptions.list({
    customer: status.stripeCustomerId,
    status: "all",
    limit: 10,
  });

  const preferred =
    result.data.find((subscription) => ["trialing", "active", "past_due", "unpaid", "paused"].includes(subscription.status)) ||
    result.data[0] ||
    null;

  if (!preferred) {
    throw new BillingSubscriptionSyncError("No Stripe subscription was found for this account.", 404, "missing_subscription");
  }

  return preferred;
}

export async function syncBillingSubscriptionForUser(userId: string) {
  const status = await getUserBillingStatus(userId);
  if (!status.stripeCustomerId && !status.stripeSubscriptionId) {
    throw new BillingSubscriptionSyncError("No Stripe billing record was found for this account.", 400, "missing_billing_record");
  }

  const subscription = await getLatestStripeSubscriptionForUser(status);
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer && "id" in subscription.customer
        ? subscription.customer.id
        : status.stripeCustomerId;

  console.info("[billing sync] subscription refresh received", {
    userId,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
  });

  const updatedRow = await syncUserBillingFromStripeSubscription({
    userId,
    stripeCustomerId,
    subscription,
  });
  const updatedStatus = evaluateUserBillingStatus(updatedRow);

  console.info("[billing sync] subscription refresh updated", {
    userId,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: updatedStatus.subscriptionStatus,
    cancelAtPeriodEnd: updatedStatus.cancelAtPeriodEnd,
  });

  return {
    billingStatus: updatedStatus,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: getStripeSubscriptionPriceId(subscription),
  };
}
