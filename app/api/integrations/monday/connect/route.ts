import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSafeRelativePath } from "@/lib/safe-redirect";

function getAppOrigin(request: NextRequest) {
  return request.nextUrl.origin || env.appUrl;
}

export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/api/integrations/crm/connect", getAppOrigin(request));
  redirectUrl.searchParams.set("provider", "monday");

  const next = request.nextUrl.searchParams.get("next");
  const safeNext = getSafeRelativePath(next, "");
  if (safeNext) {
    redirectUrl.searchParams.set("next", safeNext);
  }

  return NextResponse.redirect(redirectUrl);
}
