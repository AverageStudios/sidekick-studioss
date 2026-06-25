import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logRouteError } from "@/lib/api-security";
import { createCrmOAuthState } from "@/lib/crm-oauth-state";
import { env } from "@/lib/env";
import { buildHubSpotAuthorizationUrl } from "@/lib/integrations/hubspot";
import { checkRateLimit, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";
import { getSafeRelativePath } from "@/lib/safe-redirect";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";

function getAppOrigin(request: NextRequest) {
  return request.nextUrl.origin || env.appUrl;
}

function buildIntegrationsUrl(request: NextRequest) {
  return new URL("/workspace/settings?section=integrations", getAppOrigin(request));
}

const CRM_OAUTH_RATE_LIMIT_MESSAGE =
  "You've tried connecting this CRM too many times in a short period. Please wait a few minutes and try again.";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", getAppOrigin(request));
    loginUrl.searchParams.set("error", "Sign in before connecting HubSpot.");
    return NextResponse.redirect(loginUrl);
  }

  const ip = getIpFromRequest(request);

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (error) {
    const integrationsUrl = buildIntegrationsUrl(request);
    integrationsUrl.searchParams.set("error", error instanceof Error ? error.message : "Workspace could not be loaded.");
    return NextResponse.redirect(integrationsUrl);
  }

  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    const integrationsUrl = buildIntegrationsUrl(request);
    integrationsUrl.searchParams.set("error", "No active workspace found.");
    return NextResponse.redirect(integrationsUrl);
  }

  const next = request.nextUrl.searchParams.get("next");
  const safeNext = getSafeRelativePath(next, "/workspace/settings?section=integrations");
  const provider = "hubspot";
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
    const integrationsUrl = buildIntegrationsUrl(request);
    integrationsUrl.searchParams.set("error", CRM_OAUTH_RATE_LIMIT_MESSAGE);
    return NextResponse.redirect(integrationsUrl);
  }
  try {
    const oauthUrl = buildHubSpotAuthorizationUrl(state);
    const response = NextResponse.redirect(oauthUrl);
    response.cookies.set("crm_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set("crm_oauth_next", safeNext, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set("crm_oauth_workspace", workspaceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set("crm_oauth_provider", "hubspot", {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    logRouteError("hubspot connect", error);
    const integrationsUrl = buildIntegrationsUrl(request);
    integrationsUrl.searchParams.set("error", "Could not start HubSpot connection.");
    return NextResponse.redirect(integrationsUrl);
  }
}
