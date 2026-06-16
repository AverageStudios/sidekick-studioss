import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCrmOAuthState } from "@/lib/crm-oauth-state";
import { env, isGhlConfigured } from "@/lib/env";
import { buildHubSpotAuthorizationUrl } from "@/lib/integrations/hubspot";
import { buildZohoAuthorizationUrl } from "@/lib/integrations/zoho";
import { CrmProvider } from "@/types";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";
import { logRouteError } from "@/lib/api-security";
import { checkRateLimit, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

function buildIntegrationsUrl() {
  return new URL("/workspace/settings?section=integrations", env.appUrl);
}

const CRM_OAUTH_RATE_LIMIT_MESSAGE =
  "You've tried connecting this CRM too many times in a short period. Please wait a few minutes and try again.";

function resolveProvider(value: string | null): CrmProvider | null {
  switch (value) {
    case "gohighlevel":
    case "hubspot":
    case "pipedrive":
    case "salesforce":
    case "zoho":
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
    case "hubspot":
      return buildHubSpotAuthorizationUrl(state);
    case "zoho":
      return buildZohoAuthorizationUrl(state);
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

  const rateLimit = await checkRateLimit({
    key: `api:crm-oauth:connect:${provider}:${workspaceId}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: `api:crm-oauth:connect:${provider}:${workspaceId}`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });
    const integrationsUrl = buildIntegrationsUrl();
    integrationsUrl.searchParams.set("error", CRM_OAUTH_RATE_LIMIT_MESSAGE);
    return NextResponse.redirect(integrationsUrl);
  }

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
