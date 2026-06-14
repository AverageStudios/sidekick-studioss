import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { ingestMetaLeadWebhookPayload } from "@/lib/meta-leads";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  if (!env.metaAppSecret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "Meta app secret is not configured." };
    }

    console.warn("[meta webhook] skipping signature verification outside production because META_APP_SECRET is not configured");
    return { ok: true, reason: "dev-secret-missing" };
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return { ok: false, reason: "Missing Meta webhook signature." };
  }

  const receivedHex = signatureHeader.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) {
    return { ok: false, reason: "Invalid Meta webhook signature format." };
  }

  const expectedHex = createHmac("sha256", env.metaAppSecret).update(rawBody, "utf8").digest("hex");
  const received = Buffer.from(receivedHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: "Invalid Meta webhook signature." };
  }

  return { ok: true, reason: "verified" };
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && challenge && env.metaWebhookVerifyToken && token === env.metaWebhookVerifyToken) {
    console.info("[meta webhook] verification succeeded");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[meta webhook] verification failed", {
    mode,
    hasToken: Boolean(token),
    configured: Boolean(env.metaWebhookVerifyToken),
  });
  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureCheck = verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"));
  if (!signatureCheck.ok) {
    console.warn("[meta webhook] signature verification failed", {
      reason: signatureCheck.reason,
      hasSignature: Boolean(request.headers.get("x-hub-signature-256")),
      hasAppSecret: Boolean(env.metaAppSecret),
    });
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 403 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = checkRateLimit({
    key: "api:meta-webhook",
    limit: 240,
    windowMs: 60 * 1000,
    identifiers: { ip },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({ key: "api:meta-webhook", retryAfterSeconds: rateLimit.retryAfterSeconds, matchedOn: rateLimit.matchedOn, ip });
    return createRateLimitResponse(undefined, rateLimit.retryAfterSeconds);
  }

  const payload = (() => {
    try {
      return JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();
  if (!payload) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin access is not available." }, { status: 500 });
  }

  console.info("[meta webhook] received event", {
    object: payload.object,
    entryCount: Array.isArray(payload.entry) ? payload.entry.length : 0,
  });

  const result = await ingestMetaLeadWebhookPayload({
    admin,
    payload,
  });

  if (result.errors.length) {
    console.error("[meta webhook] lead intake completed with errors", result);
  } else {
    console.info("[meta webhook] lead intake completed", result);
  }

  return NextResponse.json({ ok: true, result });
}
