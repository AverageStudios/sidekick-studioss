import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authSuccessMessages, formatAuthErrorMessage } from "@/lib/auth-messages";
import { env, isSupabasePublicConfigured } from "@/lib/env";
import { checkRateLimit, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const errorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const safeNextPath = next?.startsWith("/") ? next : "/dashboard";
  const redirectUrl = new URL(safeNextPath, env.appUrl);
  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "auth:callback",
    limit: 20,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip },
  });

  if (!rateLimit.allowed) {
    logRateLimitHit({ key: "auth:callback", retryAfterSeconds: rateLimit.retryAfterSeconds, matchedOn: rateLimit.matchedOn, ip });
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "Too many attempts right now. Please wait a moment and try again.");
    return NextResponse.redirect(redirectUrl);
  }

  if (!isSupabasePublicConfigured()) {
    return NextResponse.redirect(new URL("/login", env.appUrl));
  }

  if (!code) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "error",
      errorDescription ? formatAuthErrorMessage(errorDescription) : "Confirmation link is missing or expired.",
    );
    if (errorCode) {
      redirectUrl.searchParams.set("errorCode", errorCode);
    }
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "Supabase auth is not configured yet.");
    return NextResponse.redirect(redirectUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", formatAuthErrorMessage(error.message));
    return NextResponse.redirect(redirectUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await ensureWorkspaceContextForUser(user);
    } catch (workspaceError) {
      console.error(
        "[auth/callback] Failed to initialize workspace context:",
        workspaceError instanceof Error ? workspaceError.message : workspaceError,
      );
    }
  }

  if (safeNextPath === "/login") {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("success", authSuccessMessages.confirmed);
  } else {
    redirectUrl.pathname = safeNextPath;
  }

  return NextResponse.redirect(redirectUrl);
}
