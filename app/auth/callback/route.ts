import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authSuccessMessages, formatAuthErrorMessage } from "@/lib/auth-messages";
import { env, isSupabasePublicConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safeNextPath = next?.startsWith("/") ? next : "/dashboard";
  const redirectUrl = new URL(safeNextPath, env.appUrl);

  if (!isSupabasePublicConfigured()) {
    return NextResponse.redirect(new URL("/login", env.appUrl));
  }

  if (!code) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "Confirmation link is missing or expired.");
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

  redirectUrl.pathname = "/dashboard";
  redirectUrl.searchParams.set("success", authSuccessMessages.confirmed);
  return NextResponse.redirect(redirectUrl);
}
