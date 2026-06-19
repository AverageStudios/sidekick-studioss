import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

function getAppOrigin(request: NextRequest) {
  return request.nextUrl.origin || env.appUrl;
}

export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/api/integrations/crm/callback", getAppOrigin(request));
  request.nextUrl.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });
  return NextResponse.redirect(redirectUrl);
}
