import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

function getAppOrigin(request: NextRequest) {
  return request.nextUrl.origin || env.appUrl;
}

export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/api/integrations/crm/connect", getAppOrigin(request));
  redirectUrl.searchParams.set("provider", "keap");

  const next = request.nextUrl.searchParams.get("next");
  if (next?.startsWith("/")) {
    redirectUrl.searchParams.set("next", next);
  }

  return NextResponse.redirect(redirectUrl);
}
