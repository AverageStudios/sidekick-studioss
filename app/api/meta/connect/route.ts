import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getMetaOAuthUrl, getMetaScopes, isMetaConfigured } from "@/lib/meta";
import { getCurrentUser } from "@/lib/auth";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", env.appUrl);
    loginUrl.searchParams.set("error", "Sign in before connecting Meta.");
    return NextResponse.redirect(loginUrl);
  }

  let workspaceContext;
  try {
    workspaceContext = await ensureWorkspaceContextForUser(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workspace could not be loaded.";
    const settingsUrl = new URL("/workspace/settings", env.appUrl);
    settingsUrl.searchParams.set("section", "integrations");
    settingsUrl.searchParams.set("error", message);
    return NextResponse.redirect(settingsUrl);
  }

  const workspaceId = workspaceContext?.activeWorkspace.id;
  if (!workspaceId) {
    const settingsUrl = new URL("/workspace/settings", env.appUrl);
    settingsUrl.searchParams.set("section", "integrations");
    settingsUrl.searchParams.set("error", "No active workspace found. Ensure database migrations have been applied.");
    return NextResponse.redirect(settingsUrl);
  }

  if (!isMetaConfigured()) {
    const settingsUrl = new URL("/workspace/settings", env.appUrl);
    settingsUrl.searchParams.set("section", "integrations");
    settingsUrl.searchParams.set("error", "Meta env vars are missing.");
    return NextResponse.redirect(settingsUrl);
  }

  const next = request.nextUrl.searchParams.get("next");
  const scopeSet = request.nextUrl.searchParams.get("scopeSet");
  const includeLeadFormManagement = scopeSet === "lead_forms";
  const safeNext = next?.startsWith("/") ? next : "/workspace/settings?section=integrations";
  const state = randomUUID();
  const requestedScopes = getMetaScopes({ includeLeadFormManagement });
  const oauthUrl = getMetaOAuthUrl(state, { includeLeadFormManagement });

  if (!oauthUrl) {
    const settingsUrl = new URL("/workspace/settings", env.appUrl);
    settingsUrl.searchParams.set("section", "integrations");
    settingsUrl.searchParams.set("error", "Could not start Meta connection.");
    return NextResponse.redirect(settingsUrl);
  }

  console.info("[meta connect] OAuth scopes", requestedScopes.join(","), "scopeSet=", scopeSet || "default");

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("meta_oauth_next", safeNext, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("meta_oauth_workspace", workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("meta_oauth_scope_set", scopeSet || "default", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("meta_oauth_requested_scopes", requestedScopes.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
