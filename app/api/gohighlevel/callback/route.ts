import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { parseGhlOAuthState } from "@/lib/ghl-oauth-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { connectWorkspaceGoHighLevelOAuthProvider } from "@/lib/crm-integration";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";

function buildIntegrationsUrl() {
  return new URL("/integrations", env.appUrl);
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete("ghl_oauth_state");
  response.cookies.delete("ghl_oauth_next");
  response.cookies.delete("ghl_oauth_workspace");
}

export async function GET(request: NextRequest) {
  const integrationsUrl = buildIntegrationsUrl();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get("ghl_oauth_state")?.value;
  const nextCookie = request.cookies.get("ghl_oauth_next")?.value;
  const workspaceCookie = request.cookies.get("ghl_oauth_workspace")?.value;
  const statePayload = parseGhlOAuthState(state || stateCookie);
  const safeNext =
    statePayload?.next ||
    (nextCookie?.startsWith("/") ? nextCookie : "/integrations");

  if (!code || !statePayload || (state && stateCookie && state !== stateCookie)) {
    integrationsUrl.searchParams.set(
      "error",
      "GoHighLevel connection was canceled or expired. Please try again.",
    );
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }

  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", env.appUrl);
    loginUrl.searchParams.set("error", "Sign in before connecting GoHighLevel.");
    const response = NextResponse.redirect(loginUrl);
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
    await connectWorkspaceGoHighLevelOAuthProvider({
      admin,
      workspaceId,
      userId: user.id,
      code,
    });

    const redirectUrl = new URL(safeNext, env.appUrl);
    redirectUrl.searchParams.set("saved", "GoHighLevel connected");
    const response = NextResponse.redirect(redirectUrl);
    clearOauthCookies(response);
    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "GoHighLevel connection failed. Please try again.";
    integrationsUrl.searchParams.set("error", message);
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }
}
