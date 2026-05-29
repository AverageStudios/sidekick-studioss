import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { ingestMetaLeadWebhookPayload } from "@/lib/meta-leads";

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
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin access is not available." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
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
