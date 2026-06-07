import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { env, isGhlConfigured } from "@/lib/env";
import { createGhlOAuthState } from "@/lib/ghl-oauth-state";
import { getCurrentUser } from "@/lib/auth";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";

function buildIntegrationsUrl() {
  return new URL("/integrations", env.appUrl);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = new URL("/login", env.appUrl);
    loginUrl.searchParams.set("error", "Sign in before connecting GoHighLevel.");
    return NextResponse.redirect(loginUrl);
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

  if (!isGhlConfigured() || !env.ghlInstallUrl) {
    const integrationsUrl = buildIntegrationsUrl();
    integrationsUrl.searchParams.set("error", "GoHighLevel OAuth env vars are missing.");
    return NextResponse.redirect(integrationsUrl);
  }

  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/integrations";
  const state = createGhlOAuthState({
    nonce: randomUUID(),
    workspaceId,
    next: safeNext,
  });

  const oauthUrl = new URL(env.ghlInstallUrl);
  oauthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set("ghl_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("ghl_oauth_next", safeNext, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("ghl_oauth_workspace", workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
