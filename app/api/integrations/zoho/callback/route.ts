import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logRouteError } from "@/lib/api-security";
import { parseCrmOAuthState } from "@/lib/crm-oauth-state";
import { connectWorkspaceZohoOAuthProvider } from "@/lib/crm-integration";
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

const CRM_OAUTH_RATE_LIMIT_MESSAGE =
  "You've tried connecting this CRM too many times in a short period. Please wait a few minutes and try again.";

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    return failRedirect(
      request,
      providerError === "access_denied"
        ? "Zoho CRM connection was canceled before it finished."
        : "Zoho CRM connection could not be completed.",
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
    statePayload.provider !== "zoho" ||
    (state && stateCookie && state !== stateCookie) ||
    (providerCookie && providerCookie !== "zoho")
  ) {
    return failRedirect(request, "Zoho CRM connection was canceled or expired. Please try again.");
  }

  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", getAppOrigin(request));
    loginUrl.searchParams.set("error", "Sign in before connecting Zoho CRM.");
    const response = NextResponse.redirect(loginUrl);
    clearOauthCookies(response);
    return response;
  }

  const ip = getIpFromRequest(request);
  const provider = "zoho";
  const rateLimit = await checkRateLimit({
    key: `api:crm-oauth:callback:${provider}`,
    limit: 60,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({
      key: `api:crm-oauth:callback:${provider}`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      matchedOn: rateLimit.matchedOn,
      ip,
      userId: user.id,
    });
    return failRedirect(request, CRM_OAUTH_RATE_LIMIT_MESSAGE);
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
    await connectWorkspaceZohoOAuthProvider({
      admin,
      workspaceId,
      userId: user.id,
      code,
      accountsServer: request.nextUrl.searchParams.get("accounts-server"),
    });

    const redirectUrl = new URL(safeNext, getAppOrigin(request));
    redirectUrl.searchParams.set("saved", "zoho connected");
    const response = NextResponse.redirect(redirectUrl);
    clearOauthCookies(response);
    return response;
  } catch (error) {
    logRouteError("zoho callback", error);
    return failRedirect(request, "Zoho CRM connection failed. Please try again.");
  }
}
