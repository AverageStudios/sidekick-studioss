import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { parseMetaOAuthState } from "@/lib/meta-oauth-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";
import {
  exchangeMetaCodeForToken,
  exchangeMetaTokenForLongLivedToken,
  fetchMetaTokenDebugInfo,
  fetchMetaUser,
  getMetaScopes,
} from "@/lib/meta";
import {
  syncWorkspaceMetaAssets,
  upsertWorkspaceMetaConnection,
} from "@/lib/meta-integration";

function buildSettingsUrl() {
  const url = new URL("/workspace/settings", env.appUrl);
  url.searchParams.set("section", "integrations");
  return url;
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete("meta_oauth_state");
  response.cookies.delete("meta_oauth_next");
  response.cookies.delete("meta_oauth_workspace");
  response.cookies.delete("meta_oauth_scope_set");
  response.cookies.delete("meta_oauth_requested_scopes");
}

export async function GET(request: NextRequest) {
  const settingsUrl = buildSettingsUrl();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get("meta_oauth_state")?.value;
  const nextCookie = request.cookies.get("meta_oauth_next")?.value;
  const workspaceCookie = request.cookies.get("meta_oauth_workspace")?.value;
  const scopeSetCookie = request.cookies.get("meta_oauth_scope_set")?.value || "default";
  const requestedScopesCookie = request.cookies.get("meta_oauth_requested_scopes")?.value || "";
  const statePayload = parseMetaOAuthState(state);
  const safeNext = statePayload?.next ||
    (nextCookie?.startsWith("/")
      ? nextCookie
      : "/workspace/settings?section=integrations");
  const resolvedScopeSet = statePayload?.scopeSet || (scopeSetCookie === "lead_forms" ? "lead_forms" : "default");
  const requestedScopes = statePayload?.requestedScopes?.length
    ? statePayload.requestedScopes
    : requestedScopesCookie
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean);

  if (!code || !state || !statePayload || (stateCookie && state !== stateCookie)) {
    settingsUrl.searchParams.set(
      "error",
      "Meta connection was canceled or expired. Please try again.",
    );
    const response = NextResponse.redirect(settingsUrl);
    clearOauthCookies(response);
    return response;
  }

  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", env.appUrl);
    loginUrl.searchParams.set("error", "Sign in before connecting Meta.");
    const response = NextResponse.redirect(loginUrl);
    clearOauthCookies(response);
    return response;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    settingsUrl.searchParams.set(
      "error",
      "Supabase server access is not configured.",
    );
    const response = NextResponse.redirect(settingsUrl);
    clearOauthCookies(response);
    return response;
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workspace could not be loaded.";
    settingsUrl.searchParams.set("error", message);
    const response = NextResponse.redirect(settingsUrl);
    clearOauthCookies(response);
    return response;
  }
  const fallbackWorkspaceId = workspaceContext?.activeWorkspace.id || null;
  const workspaceId = statePayload?.workspaceId || workspaceCookie || fallbackWorkspaceId;
  if (!workspaceId) {
    settingsUrl.searchParams.set("error", "No active workspace was found. Ensure database migrations have been applied.");
    const response = NextResponse.redirect(settingsUrl);
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
    settingsUrl.searchParams.set(
      "error",
      "You no longer have access to that workspace.",
    );
    const response = NextResponse.redirect(settingsUrl);
    clearOauthCookies(response);
    return response;
  }

  try {
    const shortToken = await exchangeMetaCodeForToken(code);
    if (!shortToken.access_token) {
      throw new Error("Meta did not return an access token.");
    }

    const longToken = await exchangeMetaTokenForLongLivedToken(
      shortToken.access_token,
    ).catch(() => shortToken);

    const accessToken = longToken.access_token || shortToken.access_token;
    const [metaUser, debugToken] = await Promise.all([
      fetchMetaUser(accessToken),
      fetchMetaTokenDebugInfo(accessToken).catch(() => null),
    ]);

    const tokenScopes =
      debugToken?.data?.scopes ||
      (requestedScopes.length
        ? requestedScopes
        : getMetaScopes({ includeLeadFormManagement: resolvedScopeSet === "lead_forms" }));
    const tokenExpiresAt =
      typeof debugToken?.data?.expires_at === "number" &&
      debugToken.data.expires_at > 0
        ? new Date(debugToken.data.expires_at * 1000).toISOString()
        : typeof longToken.expires_in === "number"
          ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
          : null;

    console.info(
      "[meta callback] granted scopes",
      tokenScopes.join(","),
      "requested scopes=",
      requestedScopes.join(","),
      "scopeSet=",
      resolvedScopeSet,
      "workspace=",
      workspaceId,
      "state cookie present=",
      stateCookie ? "yes" : "no",
    );

    const savedConnection = await upsertWorkspaceMetaConnection({
      admin,
      workspaceId,
      userId: user.id,
      accessToken,
      tokenType: longToken.token_type || shortToken.token_type || null,
      expiresAt: tokenExpiresAt,
      scopes: tokenScopes,
      providerUserId: metaUser.id,
      providerUserName: metaUser.name || null,
      metadataJson: {
        oauth_scope_set: resolvedScopeSet,
        oauth_requested_scopes: requestedScopes,
        oauth_granted_scopes: tokenScopes,
      },
    });
    console.info(
      "[meta callback] saved active connection",
      savedConnection.id,
      "workspace=",
      workspaceId,
      "granted scopes=",
      tokenScopes.join(","),
    );

    let syncWarning: string | null = null;
    try {
      await syncWorkspaceMetaAssets({
        admin,
        workspaceId,
        userId: user.id,
      });
    } catch (syncErr) {
      console.error("[meta callback] Asset sync failed:", syncErr instanceof Error ? syncErr.message : syncErr);
      syncWarning =
        'Meta connected, but assets could not sync automatically. Click "Refresh assets" on this page to load your ad accounts and pages.';
    }

    const redirectUrl = new URL(safeNext, env.appUrl);
    redirectUrl.searchParams.set("saved", "meta-connected");
    const requestedLeadFormScope = requestedScopes.includes("pages_manage_ads");
    const grantedLeadFormScope = tokenScopes.includes("pages_manage_ads");
    const callbackWarnings: string[] = [];
    if (requestedLeadFormScope && !grantedLeadFormScope) {
      callbackWarnings.push(
        "Facebook reconnect completed, but Meta did not grant pages_manage_ads. The active workspace token still cannot manage Page lead forms.",
      );
    }
    if (syncWarning) {
      callbackWarnings.push(syncWarning);
    }
    if (callbackWarnings.length) {
      redirectUrl.searchParams.set("error", callbackWarnings.join(" "));
    }
    const response = NextResponse.redirect(redirectUrl);
    clearOauthCookies(response);
    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Meta connection failed. Please try again.";
    settingsUrl.searchParams.set("error", message);
    const response = NextResponse.redirect(settingsUrl);
    clearOauthCookies(response);
    return response;
  }
}
