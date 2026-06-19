import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseCrmOAuthState } from "@/lib/crm-oauth-state";
import {
  connectWorkspaceFreshsalesOAuthProvider,
  connectWorkspaceGoHighLevelOAuthProvider,
  connectWorkspaceHubSpotOAuthProvider,
  connectWorkspaceKeapOAuthProvider,
  connectWorkspaceMondayOAuthProvider,
  connectWorkspaceSalesforceOAuthProvider,
  connectWorkspaceZohoOAuthProvider,
  connectWorkspaceCloseOAuthProvider,
} from "@/lib/crm-integration";
import { env } from "@/lib/env";
import { getFreshsalesOAuthDebugInfo } from "@/lib/integrations/freshsales";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";
import { logRouteError } from "@/lib/api-security";
import { checkRateLimit, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";

function getAppOrigin(request: NextRequest) {
  return request.nextUrl.origin || env.appUrl;
}

function buildIntegrationsUrl(request: NextRequest) {
  return new URL("/workspace/settings?section=integrations", getAppOrigin(request));
}

function getFreshsalesCallbackUrl(request: NextRequest) {
  return new URL("/api/integrations/freshsales/callback", getAppOrigin(request)).toString();
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete("crm_oauth_state");
  response.cookies.delete("crm_oauth_next");
  response.cookies.delete("crm_oauth_workspace");
  response.cookies.delete("crm_oauth_provider");
}

const CRM_OAUTH_RATE_LIMIT_MESSAGE =
  "You've tried connecting this CRM too many times in a short period. Please wait a few minutes and try again.";

export async function GET(request: NextRequest) {
  const integrationsUrl = buildIntegrationsUrl(request);
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    integrationsUrl.searchParams.set(
      "error",
      providerError === "access_denied"
        ? "CRM connection was canceled before it finished."
        : "CRM connection could not be completed.",
    );
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get("crm_oauth_state")?.value;
  const nextCookie = request.cookies.get("crm_oauth_next")?.value;
  const workspaceCookie = request.cookies.get("crm_oauth_workspace")?.value;
  const providerCookie = request.cookies.get("crm_oauth_provider")?.value;
  const statePayload = parseCrmOAuthState(state || stateCookie);
  const stateValid = Boolean(
    statePayload &&
      !(state && stateCookie && state !== stateCookie) &&
      !(providerCookie && statePayload.provider !== providerCookie),
  );
  const safeNext =
    statePayload?.next ||
    (nextCookie?.startsWith("/") ? nextCookie : "/workspace/settings?section=integrations");

  if (statePayload?.provider === "freshsales" || providerCookie === "freshsales") {
    const debug = getFreshsalesOAuthDebugInfo(getFreshsalesCallbackUrl(request));
    console.info(
      "[freshsales-oauth]",
      JSON.stringify({
        provider: "freshsales",
        step: "callback_received",
        workspaceId: statePayload?.workspaceId || workspaceCookie || null,
        authBaseUrlHost: debug.authBaseUrlHost,
        redirectUri: debug.redirectUri,
        scopeString: debug.scopeString,
        scopes: debug.scopes,
        callbackHasCode: Boolean(code),
        callbackStateValid: stateValid,
        providerError: providerError || null,
        requestOrigin: getAppOrigin(request),
      }),
    );
  }

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
    const loginUrl = new URL("/login", getAppOrigin(request));
    loginUrl.searchParams.set("error", "Sign in before connecting a CRM.");
    const response = NextResponse.redirect(loginUrl);
    clearOauthCookies(response);
    return response;
  }

  const ip = getIpFromRequest(request);
  const provider = statePayload.provider;
  const rateLimit = await checkRateLimit({
    key: `api:crm-oauth:callback:${provider}`,
    limit: 60,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({ key: `api:crm-oauth:callback:${provider}`, retryAfterSeconds: rateLimit.retryAfterSeconds, matchedOn: rateLimit.matchedOn, ip, userId: user.id });
    integrationsUrl.searchParams.set("error", CRM_OAUTH_RATE_LIMIT_MESSAGE);
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
      case "hubspot":
        await connectWorkspaceHubSpotOAuthProvider({
          admin,
          workspaceId,
          userId: user.id,
          code,
        });
        break;
      case "zoho":
        await connectWorkspaceZohoOAuthProvider({
          admin,
          workspaceId,
          userId: user.id,
          code,
          accountsServer: request.nextUrl.searchParams.get("accounts-server"),
        });
        break;
      case "freshsales":
        await connectWorkspaceFreshsalesOAuthProvider({
          admin,
          workspaceId,
          userId: user.id,
          code,
          redirectUri: getFreshsalesCallbackUrl(request),
        });
        break;
      case "monday":
        await connectWorkspaceMondayOAuthProvider({
          admin,
          workspaceId,
          userId: user.id,
          code,
          redirectUri: new URL("/api/integrations/monday/callback", getAppOrigin(request)).toString(),
        });
        break;
      case "keap":
        await connectWorkspaceKeapOAuthProvider({
          admin,
          workspaceId,
          userId: user.id,
          code,
          redirectUri: new URL("/api/integrations/keap/callback", getAppOrigin(request)).toString(),
        });
        break;
      case "salesforce":
        await connectWorkspaceSalesforceOAuthProvider({
          admin,
          workspaceId,
          userId: user.id,
          code,
          redirectUri: new URL("/api/integrations/salesforce/callback", getAppOrigin(request)).toString(),
        });
        break;
      case "close":
        await connectWorkspaceCloseOAuthProvider({
          admin,
          workspaceId,
          userId: user.id,
          code,
        });
        break;
      default:
        throw new Error(`${statePayload.provider} callback handling is not implemented yet.`);
    }

    const redirectUrl = new URL(safeNext, getAppOrigin(request));
    redirectUrl.searchParams.set("saved", `${statePayload.provider} connected`);
    const response = NextResponse.redirect(redirectUrl);
    clearOauthCookies(response);
    return response;
  } catch (error) {
    logRouteError("crm callback", error);
    if (statePayload.provider === "freshsales") {
      const diagnosticError = error as Error & {
        status?: number;
        category?: string | null;
        code?: string | null;
        safeCategory?: string | null;
      };
      console.error(
        "[freshsales-oauth]",
        JSON.stringify({
          provider: "freshsales",
          step: "callback_failed",
          workspaceId,
          userId: user.id,
          status: typeof diagnosticError.status === "number" ? diagnosticError.status : null,
          category: typeof diagnosticError.category === "string" ? diagnosticError.category : null,
          code: typeof diagnosticError.code === "string" ? diagnosticError.code : null,
          safeCategory: typeof diagnosticError.safeCategory === "string" ? diagnosticError.safeCategory : null,
          providerConstraintFailure:
            error instanceof Error &&
            (error.message.includes("workspace_provider_connections_provider_check") ||
              error.message.includes("029_freshsales_crm_provider_support.sql")),
        }),
      );
      const message =
        error instanceof Error && error.message.includes("029_freshsales_crm_provider_support.sql")
          ? "Freshsales connection failed because database migration 029 is not applied yet."
          : error instanceof Error &&
              (error.message.includes("redirect") ||
                error.message.includes("invalid_client") ||
                error.message.includes("invalid_grant"))
            ? "Freshsales connection failed. Check your Freshworks OAuth credentials and redirect URL."
            : "Freshsales connection failed. Please try again.";
      integrationsUrl.searchParams.set("error", message);
    } else {
      integrationsUrl.searchParams.set("error", "CRM connection failed. Please try again.");
    }
    const response = NextResponse.redirect(integrationsUrl);
    clearOauthCookies(response);
    return response;
  }
}
