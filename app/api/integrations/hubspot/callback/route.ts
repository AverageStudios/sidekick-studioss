import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logRouteError } from "@/lib/api-security";
import { parseCrmOAuthState } from "@/lib/crm-oauth-state";
import { connectWorkspaceHubSpotOAuthProvider } from "@/lib/crm-integration";
import { env } from "@/lib/env";
import { checkRateLimit, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";

function getAppOrigin(request: NextRequest) {
  return request.nextUrl.origin || env.appUrl;
}

function buildIntegrationsUrl(request: NextRequest) {
  return new URL("/workspace/settings?section=integrations", getAppOrigin(request));
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete("crm_oauth_state");
  response.cookies.delete("crm_oauth_next");
  response.cookies.delete("crm_oauth_workspace");
  response.cookies.delete("crm_oauth_provider");
}

function failRedirect(request: NextRequest, error: string) {
  const redirectUrl = buildIntegrationsUrl(request);
  redirectUrl.searchParams.set("error", error);
  const response = NextResponse.redirect(redirectUrl);
  clearOauthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    return failRedirect(
      request,
      providerError === "access_denied"
        ? "HubSpot connection was canceled before it finished."
        : "HubSpot connection could not be completed.",
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get("crm_oauth_state")?.value;
  const nextCookie = request.cookies.get("crm_oauth_next")?.value;
  const workspaceCookie = request.cookies.get("crm_oauth_workspace")?.value;
  const providerCookie = request.cookies.get("crm_oauth_provider")?.value;
  const statePayload = parseCrmOAuthState(state || stateCookie);
  const safeNext =
    statePayload?.next ||
    (nextCookie?.startsWith("/") ? nextCookie : "/workspace/settings?section=integrations");

  if (
    !code ||
    !statePayload ||
    statePayload.provider !== "hubspot" ||
    (state && stateCookie && state !== stateCookie) ||
    (providerCookie && providerCookie !== "hubspot")
  ) {
    return failRedirect(request, "HubSpot connection was canceled or expired. Please try again.");
  }

  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", getAppOrigin(request));
    loginUrl.searchParams.set("error", "Sign in before connecting HubSpot.");
    const response = NextResponse.redirect(loginUrl);
    clearOauthCookies(response);
    return response;
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:hubspot-callback",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: "api:hubspot-callback",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });
    return failRedirect(request, "Too many attempts right now. Please wait a moment and try again.");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return failRedirect(request, "Supabase server access is not configured.");
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (error) {
    return failRedirect(request, error instanceof Error ? error.message : "Workspace could not be loaded.");
  }

  const fallbackWorkspaceId = workspaceContext?.activeWorkspace.id || null;
  const workspaceId = statePayload.workspaceId || workspaceCookie || fallbackWorkspaceId;
  if (!workspaceId) {
    return failRedirect(request, "No active workspace found.");
  }

  const { data: membership } = await admin
    .from("workspace_memberships")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.id) {
    return failRedirect(request, "You no longer have access to that workspace.");
  }

  try {
    await connectWorkspaceHubSpotOAuthProvider({
      admin,
      workspaceId,
      userId: user.id,
      code,
    });
    const redirectUrl = new URL(safeNext, getAppOrigin(request));
    redirectUrl.searchParams.set("saved", "hubspot connected");
    const response = NextResponse.redirect(redirectUrl);
    clearOauthCookies(response);
    return response;
  } catch (error) {
    logRouteError("hubspot callback", error);
    return failRedirect(request, "HubSpot connection failed. Please try again.");
  }
}
