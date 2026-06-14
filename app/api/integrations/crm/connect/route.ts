import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCrmOAuthState } from "@/lib/crm-oauth-state";
import { env, isGhlConfigured } from "@/lib/env";
import { CrmProvider } from "@/types";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";
import { logRouteError } from "@/lib/api-security";
import { checkRateLimit, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

function buildIntegrationsUrl() {
  return new URL("/workspace/settings?section=integrations", env.appUrl);
}

function resolveProvider(value: string | null): CrmProvider | null {
  switch (value) {
    case "gohighlevel":
    case "hubspot":
    case "pipedrive":
    case "salesforce":
      return value;
    default:
      return null;
  }
}

function getProviderConnectUrl(provider: CrmProvider, state: string) {
  switch (provider) {
    case "gohighlevel": {
      if (!isGhlConfigured() || !env.ghlInstallUrl) {
        throw new Error("GoHighLevel OAuth env vars are missing.");
      }
      const oauthUrl = new URL(env.ghlInstallUrl);
      oauthUrl.searchParams.set("state", state);
      return oauthUrl;
    }
    default:
      throw new Error(`${provider} connect flow is not implemented yet.`);
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", env.appUrl);
    loginUrl.searchParams.set("error", "Sign in before connecting a CRM.");
    return NextResponse.redirect(loginUrl);
  }

  const ip = getIpFromRequest(request);
  const rateLimit = checkRateLimit({
    key: "api:crm-connect",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({ key: "api:crm-connect", retryAfterSeconds: rateLimit.retryAfterSeconds, matchedOn: rateLimit.matchedOn, ip, userId: user.id });
    const integrationsUrl = buildIntegrationsUrl();
    integrationsUrl.searchParams.set("error", "Too many attempts right now. Please wait a moment and try again.");
    return NextResponse.redirect(integrationsUrl);
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workspace could not be loaded.";
    const integrationsUrl = buildIntegrationsUrl();
    integrationsUrl.searchParams.set("error", message);
    return NextResponse.redirect(integrationsUrl);
  }

  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    const integrationsUrl = buildIntegrationsUrl();
    integrationsUrl.searchParams.set("error", "No active workspace found.");
    return NextResponse.redirect(integrationsUrl);
  }

  const provider = resolveProvider(request.nextUrl.searchParams.get("provider"));
  if (!provider) {
    const integrationsUrl = buildIntegrationsUrl();
    integrationsUrl.searchParams.set("error", "Choose a supported CRM provider.");
    return NextResponse.redirect(integrationsUrl);
  }

  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/workspace/settings?section=integrations";
  const state = createCrmOAuthState({
    nonce: randomUUID(),
    provider,
    workspaceId,
    next: safeNext,
  });

  try {
    const oauthUrl = getProviderConnectUrl(provider, state);
    const response = NextResponse.redirect(oauthUrl);
    response.cookies.set("crm_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.appUrl.startsWith("https://"),
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set("crm_oauth_next", safeNext, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.appUrl.startsWith("https://"),
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set("crm_oauth_workspace", workspaceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.appUrl.startsWith("https://"),
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set("crm_oauth_provider", provider, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.appUrl.startsWith("https://"),
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    logRouteError("crm connect", error);
    const integrationsUrl = buildIntegrationsUrl();
    integrationsUrl.searchParams.set("error", "Could not start CRM connection.");
    return NextResponse.redirect(integrationsUrl);
  }
}
