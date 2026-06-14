import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseCrmOAuthState } from "@/lib/crm-oauth-state";
import { connectWorkspaceGoHighLevelOAuthProvider } from "@/lib/crm-integration";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";
import { logRouteError } from "@/lib/api-security";
import { checkRateLimit, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

function buildIntegrationsUrl() {
  return new URL("/workspace/settings?section=integrations", env.appUrl);
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete("crm_oauth_state");
  response.cookies.delete("crm_oauth_next");
  response.cookies.delete("crm_oauth_workspace");
  response.cookies.delete("crm_oauth_provider");
}

export async function GET(request: NextRequest) {
  const integrationsUrl = buildIntegrationsUrl();
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
    (state && stateCookie && state !== stateCookie) ||
    (providerCookie && statePayload.provider !== providerCookie)
  ) {
    integrationsUrl.searchParams.set(
      "error",
      "CRM connection was canceled or expired. Please try again.",
    );
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }

  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", env.appUrl);
    loginUrl.searchParams.set("error", "Sign in before connecting a CRM.");
    const response = NextResponse.redirect(loginUrl);
    clearOauthCookies(response);
    return response;
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:crm-callback",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({ key: "api:crm-callback", retryAfterSeconds: rateLimit.retryAfterSeconds, matchedOn: rateLimit.matchedOn, ip, userId: user.id });
    integrationsUrl.searchParams.set("error", "Too many attempts right now. Please wait a moment and try again.");
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    integrationsUrl.searchParams.set("error", "Supabase server access is not configured.");
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workspace could not be loaded.";
    integrationsUrl.searchParams.set("error", message);
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }

  const fallbackWorkspaceId = workspaceContext?.activeWorkspace.id || null;
  const workspaceId = statePayload.workspaceId || workspaceCookie || fallbackWorkspaceId;
  if (!workspaceId) {
    integrationsUrl.searchParams.set("error", "No active workspace found.");
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }

  const { data: membership } = await admin
    .from("workspace_memberships")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.id) {
    integrationsUrl.searchParams.set("error", "You no longer have access to that workspace.");
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }

  try {
    switch (statePayload.provider) {
      case "gohighlevel":
        await connectWorkspaceGoHighLevelOAuthProvider({
          admin,
          workspaceId,
          userId: user.id,
          code,
        });
        break;
      default:
        throw new Error(`${statePayload.provider} callback handling is not implemented yet.`);
    }

    const redirectUrl = new URL(safeNext, env.appUrl);
    redirectUrl.searchParams.set("saved", `${statePayload.provider} connected`);
    const response = NextResponse.redirect(redirectUrl);
    clearOauthCookies(response);
    return response;
  } catch (error) {
    logRouteError("crm callback", error);
    integrationsUrl.searchParams.set("error", "CRM connection failed. Please try again.");
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }
}
